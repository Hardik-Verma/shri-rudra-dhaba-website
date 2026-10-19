/**
 * OCR fallback for image-based (scanned / designed) menu PDFs.
 *
 * When a PDF has no usable text layer, each page is rendered to a canvas
 * with pdf.js and read with tesseract.js. Everything runs on this device —
 * no upload, no API key, no AI service. The OCR lines feed the same
 * rule-based parser as text-layer menus.
 */

export type OcrProgress = (page: number, total: number, status: string) => void;

const MAX_PAGE_PX = 2400;

export async function ocrPdfPages(file: File, onProgress?: OcrProgress): Promise<string[][]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const total = doc.numPages;
  const pages: string[][] = [];

  const { createWorker } = await import("tesseract.js");
  let currentPage = 1;
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string }) => {
      const s = m.status;
      let label = "Preparing recognition";
      if (s.includes("language") || s.includes("traineddata")) {
        label = "downloading recognition language (one-time ~15 MB)";
      } else if (s.includes("core")) {
        label = "loading recognition engine";
      } else if (s.includes("recognizing")) {
        label = "reading text";
      }
      onProgress?.(currentPage, total, label);
    },
  });

  try {
    for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
      currentPage = pageNumber;
      onProgress?.(pageNumber, total, "rendering page");
      const page = await doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2.2, MAX_PAGE_PX / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not render this PDF page for text recognition.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;

      onProgress?.(pageNumber, total, "reading text");
      const { data } = await worker.recognize(canvas);
      // Keep blank lines: the parser uses them to tell section headers apart
      // from wrapped item names.
      pages.push(
        (data.text ?? "")
          .split("\n")
          .map((l: string) => l.replace(/\s+/g, " ").trim())
          .slice(0, 500),
      );

      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
    }
  } finally {
    await worker.terminate().catch(() => undefined);
  }

  return pages;
}
