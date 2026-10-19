/**
 * On-device OCR for image-based (scanned / designed) menu PDFs.
 *
 * Pipeline per page:
 *  1. Render at ~300 DPI (capped) with pdf.js.
 *  2. Preprocess: grayscale → contrast stretch → adaptive threshold, which
 *     isolates dark text from colourful gradient backgrounds.
 *  3. Read with tesseract.js. If the cleaned pass finds too few price lines,
 *     the page is retried from the softer grayscale-only render.
 *
 * Two tesseract workers run in parallel to halve wall-clock time. Everything
 * stays on this device — no upload, no API key, no AI service.
 */

export type OcrProgress = (page: number, total: number, status: string) => void;

const MAX_PAGE_PX = 3000;
const WORKERS = 2;
const MIN_PRICE_LINES = 3;

// ---------------------------------------------------------------------------
// Image preprocessing
// ---------------------------------------------------------------------------

function toGrayscale(src: ImageData): ImageData {
  const out = new ImageData(src.width, src.height);
  const s = src.data;
  const d = out.data;
  for (let i = 0; i < s.length; i += 4) {
    // Luma weighted for text contrast.
    const r = s[i] ?? 0;
    const g = s[i + 1] ?? 0;
    const b = s[i + 2] ?? 0;
    const y = (r * 299 + g * 587 + b * 114) / 1000;
    d[i] = y;
    d[i + 1] = y;
    d[i + 2] = y;
    d[i + 3] = 255;
  }
  return out;
}

/** Stretch the 2%–98% luminance range to 0–255 so faded prints reach full contrast. */
function contrastStretch(img: ImageData): ImageData {
  const hist = new Uint32Array(256);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] ?? 0;
    hist[v] = (hist[v] ?? 0) + 1;
  }
  const total = img.width * img.height;
  let loSum = 0;
  let hiSum = 0;
  let lo = 0;
  let hi = 255;
  for (let v = 0; v < 256; v += 1) {
    loSum += hist[v] ?? 0;
    if (loSum >= total * 0.02) {
      lo = v;
      break;
    }
  }
  for (let v = 255; v >= 0; v -= 1) {
    hiSum += hist[v] ?? 0;
    if (hiSum >= total * 0.02) {
      hi = v;
      break;
    }
  }
  if (hi - lo < 40) return img;
  const range = hi - lo;
  const lut = new Uint8Array(256);
  for (let v = 0; v < 256; v += 1) {
    lut[v] = Math.max(0, Math.min(255, Math.round(((v - lo) * 255) / range)));
  }
  const out = new ImageData(img.width, img.height);
  const o = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const y = lut[d[i] ?? 0] ?? 0;
    o[i] = y;
    o[i + 1] = y;
    o[i + 2] = y;
    o[i + 3] = 255;
  }
  return out;
}

/**
 * Local-mean (adaptive) threshold via an integral image. A pixel becomes
 * text (0) when it is notably darker than its neighbourhood mean, which
 * survives gradient backgrounds far better than a single global cutoff.
 */
function adaptiveThreshold(img: ImageData): ImageData {
  const { width: w, height: h } = img;
  const d = img.data;
  // Integral image of luminance.
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < w; x += 1) {
      rowSum += d[(y * w + x) * 4] ?? 0;
      integral[(y + 1) * (w + 1) + (x + 1)] = (integral[y * (w + 1) + (x + 1)] ?? 0) + rowSum;
    }
  }
  const radius = Math.max(12, Math.min(40, Math.round(Math.min(w, h) / 30)));
  const area = (2 * radius + 1) * (2 * radius + 1);
  const bias = 14; // pixels darker than (mean - bias) are text
  const out = new ImageData(w, h);
  const o = out.data;
  for (let y = 0; y < h; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(h - 1, y + radius);
    for (let x = 0; x < w; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w - 1, x + radius);
      const sum =
        (integral[(y1 + 1) * (w + 1) + (x1 + 1)] ?? 0) -
        (integral[y0 * (w + 1) + (x1 + 1)] ?? 0) -
        (integral[(y1 + 1) * (w + 1) + x0] ?? 0) +
        (integral[y0 * (w + 1) + x0] ?? 0);
      const mean = sum / area;
      const v = d[(y * w + x) * 4] ?? 0;
      const white = v > mean - bias ? 255 : 0;
      const i = (y * w + x) * 4;
      o[i] = white;
      o[i + 1] = white;
      o[i + 2] = white;
      o[i + 3] = 255;
    }
  }
  return out;
}

function prepareForOcr(canvas: HTMLCanvasElement, mode: "threshold" | "grayscale"): ImageData {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare this page for text recognition.");
  const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = toGrayscale(raw);
  if (mode === "grayscale") return contrastStretch(gray);
  return adaptiveThreshold(contrastStretch(gray));
}

function putImageDataOnto(canvas: HTMLCanvasElement, img: ImageData): void {
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare this page for text recognition.");
  ctx.putImageData(img, 0, 0);
}

function countPriceLines(text: string): number {
  let n = 0;
  for (const line of text.split("\n")) {
    if (/\b\d{2,4}\b/.test(line)) n += 1;
  }
  return n;
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
  const { createWorker } = await import("tesseract.js");
  return createWorker("eng", 1);
}

type OcrWorker = Awaited<ReturnType<typeof createOcrWorker>>;

async function readPage(
  worker: OcrWorker,
  page: Awaited<ReturnType<Awaited<ReturnType<typeof loadDoc>>["getPage"]>>,
): Promise<{ text: string; triedBoth: boolean }> {
  const rendered = await renderPageToCanvas(page);

  const work = document.createElement("canvas");
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
