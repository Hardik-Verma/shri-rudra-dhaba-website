/**
 * Pure image preprocessing for menu OCR. Works on any {data,width,height}
 * buffer (browser ImageData or Node RGBA buffers) — no DOM APIs, so the
 * exact same code runs in the browser pipeline and the Node debug harness.
 */

export type RgbaImage = { data: Uint8ClampedArray; width: number; height: number };

export function toGrayscale(src: RgbaImage): RgbaImage {
  const out: RgbaImage = {
    data: new Uint8ClampedArray(src.data.length),
    width: src.width,
    height: src.height,
  };
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
export function contrastStretch(img: RgbaImage): RgbaImage {
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
  const out: RgbaImage = {
    data: new Uint8ClampedArray(d.length),
    width: img.width,
    height: img.height,
  };
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
export function adaptiveThreshold(img: RgbaImage): RgbaImage {
  const { width: w, height: h } = img;
  const d = img.data;
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
  const out: RgbaImage = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
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

export function countPriceLines(text: string): number {
  let n = 0;
  for (const line of text.split("\n")) {
    if (/\b\d{2,4}\b/.test(line)) n += 1;
  }
  return n;
}
