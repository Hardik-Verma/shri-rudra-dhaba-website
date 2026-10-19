/**
 * On-device OCR for image-based (scanned / designed) menu PDFs.
 *
 * Pipeline per page:
 *  1. Render at ~300 DPI (capped) with pdf.js.
 *  2. Preprocess: grayscale → contrast stretch → adaptive threshold, which
 *     isolates dark text from colourful gradient backgrounds (shared pure
 *     functions in ocr-image.ts, also used by the Node debug harness).
 *  3. Read with tesseract.js. If the cleaned pass finds too few price lines,
 *     the page is retried from the softer grayscale-only render.
 *
 * Two tesseract workers run in parallel to halve wall-clock time. Everything
 * stays on this device — no upload, no API key, no AI service.
 */

import {
  adaptiveThreshold,
  contrastStretch,
  countPriceLines,
  toGrayscale,
  type RgbaImage,
} from "./ocr-image";

export type OcrProgress = (page: number, total: number, status: string) => void;

const MAX_PAGE_PX = 3000;
const WORKERS = 2;
const MIN_PRICE_LINES = 3;

// ---------------------------------------------------------------------------
// Image helpers (browser canvas wrappers around the pure pipeline)
// ---------------------------------------------------------------------------

function prepareForOcr(canvas: HTMLCanvasElement, mode: "threshold" | "grayscale"): ImageData {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare this page for text recognition.");
  const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = toGrayscale(raw);
  const cleaned =
    mode === "grayscale" ? contrastStretch(gray) : adaptiveThreshold(contrastStretch(gray));
  return new ImageData(new Uint8ClampedArray(cleaned.data), cleaned.width, cleaned.height);
}

function putImageDataOnto(canvas: HTMLCanvasElement, img: RgbaImage): void {
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare this page for text recognition.");
  ctx.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
}

// ---------------------------------------------------------------------------
// PDF page rendering
// ---------------------------------------------------------------------------

async function renderPageToCanvas(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof loadDoc>>["getPage"]>>,
): Promise<HTMLCanvasElement> {
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(4.2, MAX_PAGE_PX / Math.max(base.width, base.height));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not render this PDF page.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas;
}

async function loadDoc(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}

// ---------------------------------------------------------------------------
// OCR workers
// ---------------------------------------------------------------------------

async function createOcrWorker() {
  const { PSM, createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1);
  // Sparse mode: designed two-column menus otherwise get merged into one
  // combined line per row, pairing item names with the wrong prices.
  await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
  return worker;
}

type OcrWorker = Awaited<ReturnType<typeof createOcrWorker>>;

async function readPage(
  worker: OcrWorker,
  page: Awaited<ReturnType<Awaited<ReturnType<typeof loadDoc>>["getPage"]>>,
): Promise<{ text: string; triedBoth: boolean }> {
  const rendered = await renderPageToCanvas(page);

  const work = document.createElement("canvas");
  work.width = rendered.width;
  work.height = rendered.height;
  putImageDataOnto(work, prepareForOcr(rendered, "threshold"));
  const first = await worker.recognize(work);
  const firstText = first.data.text ?? "";

  let text = firstText;
  let triedBoth = false;
  if (countPriceLines(firstText) < MIN_PRICE_LINES) {
    // Soft fallback: some prints read better from plain high-contrast grayscale.
    triedBoth = true;
    putImageDataOnto(work, prepareForOcr(rendered, "grayscale"));
    const second = await worker.recognize(work);
    const secondText = second.data.text ?? "";
    if (countPriceLines(secondText) >= countPriceLines(firstText)) text = secondText;
  }

  rendered.width = 0;
  rendered.height = 0;
  work.width = 0;
  work.height = 0;
  page.cleanup();
  return { text, triedBoth };
}

function textToLines(text: string): string[] {
  // Keep blank lines: the parser uses them to tell section headers apart
  // from wrapped item names.
  return text
    .split("\n")
    .map((l: string) => l.replace(/\s+/g, " ").trim())
    .slice(0, 500);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function ocrPdfPages(file: File, onProgress?: OcrProgress): Promise<string[][]> {
  const doc = await loadDoc(file);
  const total = doc.numPages;
  const linesByPage: string[][] = new Array(total);
  let nextIndex = 0;
  let donePages = 0;

  const report = (page: number, status: string) => onProgress?.(page, total, status);

  const runWorker = async () => {
    const worker = await createOcrWorker();
    try {
      for (;;) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= total) break;
        const pageNumber = index + 1;
        report(pageNumber, "reading text");
        const page = await doc.getPage(pageNumber);
        try {
          const { text } = await readPage(worker, page);
          linesByPage[index] = textToLines(text);
        } catch {
          linesByPage[index] = [];
        }
        donePages += 1;
        report(donePages, `page ${donePages} of ${total} done`);
      }
    } finally {
      await worker.terminate().catch(() => undefined);
    }
  };

  report(1, "starting recognition engine");
  const pool = Array.from({ length: Math.min(WORKERS, total) }, () => runWorker());
  await Promise.all(pool);

  return linesByPage.map((lines) => lines ?? []);
}
