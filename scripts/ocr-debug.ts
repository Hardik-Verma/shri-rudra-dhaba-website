/**
 * Node debug harness: runs the real menu-PDF pipeline on a local file and
 * dumps every intermediate so accuracy can be inspected and tuned.
 *
 *   node --experimental-strip-types scripts/ocr-debug.ts "C:\path\menu.pdf"
 *
 * Outputs scripts/ocr-debug-out/page-NN-{text,ocr}.txt plus parsed items.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error - Node canvas bindings have no types for global patching
import { createCanvas, DOMMatrix, ImageData as NodeImageData } from "@napi-rs/canvas";
import {
  adaptiveThreshold,
  contrastStretch,
  countPriceLines,
  toGrayscale,
} from "../src/lib/ocr-image.ts";
import { parseMenuLines } from "../src/lib/menu-parse.ts";

// pdf.js expects browser globals for optional APIs.
(globalThis as Record<string, unknown>).DOMMatrix ??= DOMMatrix;
(globalThis as Record<string, unknown>).ImageData ??= NodeImageData;

const pdfPath = process.argv[2] ?? "C:\\Users\\hardi\\Downloads\\Shri RUDRA DHABA.pdf";
const outDir = join(process.cwd(), "scripts", "ocr-debug-out");
mkdirSync(outDir, { recursive: true });

const MAX_PAGE_PX = 3000;
const PSM_SWEEP_PAGE = 2;

class NapiCanvasFactory {
  create(width: number, height: number) {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    const canvas = createCanvas(w, h);
    const context = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
    return { canvas, context };
  }
  reset(canvasObj: { canvas: { width: number; height: number } }, width: number, height: number) {
    canvasObj.canvas.width = Math.max(1, Math.floor(width));
    canvasObj.canvas.height = Math.max(1, Math.floor(height));
  }
  destroy(canvasObj: { canvas: { width: number; height: number } }) {
    canvasObj.canvas.width = 0;
    canvasObj.canvas.height = 0;
  }
}

type PdfPage = {
  getViewport(opts: { scale: number }): { width: number; height: number };
  getTextContent(): Promise<{ items: unknown[] }>;
  render(params: Record<string, unknown>): { promise: Promise<void> };
  cleanup(): void;
};

async function main() {
  console.log(`Loading ${pdfPath} …`);
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({
    data,
    CanvasFactory: NapiCanvasFactory,
  }).promise;
  console.log(`Pages: ${doc.numPages}`);

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1);
  await worker.setParameters({ tessedit_pageseg_mode: "11" });

  const pagesLines: string[][] = [];
  let textLayerChars = 0;

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page: PdfPage = await doc.getPage(pageNumber);

    // --- text layer (same clustering as src/lib/menu-parse.ts) ---
    const content = await page.getTextContent();
    const words: Array<{ x: number; y: number; str: string }> = [];
    for (const raw of content.items) {
      if (!("str" in (raw as object))) continue;
      const str = String((raw as { str: string }).str)
        .replace(/\s+/g, " ")
        .trim();
      if (!str) continue;
      const t = (raw as { transform?: number[] }).transform;
      words.push({ x: t?.[4] ?? 0, y: t?.[5] ?? 0, str });
    }
    words.sort((a, b) => b.y - a.y);
    const rows: Array<{ y: number; words: Array<{ x: number; str: string }> }> = [];
    for (const w of words) {
      const row = rows.find((r) => Math.abs(r.y - w.y) <= 3);
      if (row) row.words.push({ x: w.x, str: w.str });
      else rows.push({ y: w.y, words: [{ x: w.x, str: w.str }] });
    }
    const textLines: string[] = [];
    for (const row of rows) {
      row.words.sort((a, b) => a.x - b.x);
      let segment: string[] = [];
      let prevX: number | null = null;
      const flush = () => {
        const text = segment.join(" ").replace(/\s+/g, " ").trim();
        if (text) textLines.push(text);
        segment = [];
      };
      for (const w of row.words) {
        if (prevX !== null && w.x - prevX > 100) flush();
        segment.push(w.str);
        prevX = w.x + w.str.length * 5;
      }
      flush();
    }
    textLayerChars += textLines.join(" ").length;
    writeFileSync(
      join(outDir, `page-${String(pageNumber).padStart(2, "0")}-text.txt`),
      textLines.join("\n"),
    );

    // --- render + preprocess + OCR ---
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(4.2, MAX_PAGE_PX / Math.max(base.width, base.height));
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({
      canvas,
      canvasContext: ctx,
      viewport,
      CanvasFactory: NapiCanvasFactory,
    }).promise;

    const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const gray = toGrayscale(
      raw as unknown as { data: Uint8ClampedArray; width: number; height: number },
    );
    const stretched = contrastStretch(gray);
    const thresholded = adaptiveThreshold(stretched);

    const put = (img: { data: Uint8ClampedArray; width: number; height: number }) => {
      canvas.width = img.width;
      canvas.height = img.height;
      const c2 = canvas.getContext("2d");
      const id = c2.createImageData(img.width, img.height);
      id.data.set(img.data);
      c2.putImageData(id, 0, 0);
    };

    process.stdout.write(`page ${pageNumber}/${doc.numPages}: threshold OCR … `);
    put(thresholded);
    const t0 = Date.now();
    let rec = await worker.recognize(canvas.toBuffer("image/png"));
    let ocrText = rec.data.text ?? "";
    let used = "threshold";
    if (countPriceLines(ocrText) < 3) {
      process.stdout.write(`(${countPriceLines(ocrText)} price lines) → grayscale OCR … `);
      put(stretched);
      rec = await worker.recognize(canvas.toBuffer("image/png"));
      if (countPriceLines(rec.data.text ?? "") >= countPriceLines(ocrText)) {
        ocrText = rec.data.text ?? "";
        used = "grayscale";
      }
    }
    console.log(
      `${countPriceLines(ocrText)} price lines, ${((Date.now() - t0) / 1000).toFixed(1)}s [${used}]`,
    );
    writeFileSync(join(outDir, `page-${String(pageNumber).padStart(2, "0")}-ocr.txt`), ocrText);

    const ocrLines = ocrText.split("\n").map((l) => l.replace(/\s+/g, " ").trim());
    pagesLines.push(ocrLines);
    page.cleanup();

    // --- PSM sweep on one representative page ---
    if (pageNumber === PSM_SWEEP_PAGE) {
      console.log(`  PSM sweep on page ${pageNumber}:`);
      put(thresholded);
      for (const psm of ["3", "4", "6", "11"]) {
        await worker.setParameters({ tessedit_pageseg_mode: psm });
        const r = await worker.recognize(canvas.toBuffer("image/png"));
        const txt = r.data.text ?? "";
        writeFileSync(
          join(outDir, `page-${String(pageNumber).padStart(2, "0")}-psm${psm}.txt`),
          txt,
        );
        console.log(`    psm ${psm}: ${countPriceLines(txt)} price lines`);
      }
      await worker.setParameters({ tessedit_pageseg_mode: "11" });
    }
  }

  await worker.terminate();

  const items = parseMenuLines(pagesLines, { itemsOnly: true });
  const textItems = parseMenuLines(
    textLayerChars > 80
      ? // reuse text lines by re-reading dumps
        Array.from({ length: doc.numPages }, (_v, i) =>
          readFileSync(
            join(outDir, `page-${String(i + 1).padStart(2, "0")}-text.txt`),
            "utf8",
          ).split("\n"),
        )
      : [],
  );

  console.log(`\nText layer chars: ${textLayerChars} → parsed ${textItems.length} items`);
  console.log(`OCR parse → ${items.length} items`);
  writeFileSync(
    join(outDir, "items-ocr.txt"),
    items
      .map((i) => `${i.category} | ${i.name} | ₹${i.price} | ${i.is_veg ? "veg" : "nonveg"}`)
      .join("\n"),
  );
  writeFileSync(
    join(outDir, "items-textlayer.txt"),
    textItems.map((i) => `${i.category} | ${i.name} | ₹${i.price}`).join("\n"),
  );
  console.log(`Wrote ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
