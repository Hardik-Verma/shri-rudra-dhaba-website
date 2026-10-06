/**
 * Fully local menu-PDF parsing — no AI service, no API keys, works offline.
 *
 * Two stages:
 *  1. extractPdfLines() — pdf.js text items grouped into visual lines using
 *     their X/Y positions (names left, prices right, columns split apart).
 *  2. parseMenuLines() — rule-based parser tuned for Indian dhaba menus:
 *     trailing prices (₹/Rs/120/-), Half/Full variants, category headers,
 *     description lines, veg detection, and junk filtering.
 */

export type ParsedMenuItem = {
  category: string;
  name: string;
  description: string | null;
  price: number;
  is_veg: boolean;
};

const MIN_PRICE = 5;
const MAX_PRICE = 5000;
const MAX_ITEMS = 600;
const MIN_TEXT_CHARS = 80;

// ---------------------------------------------------------------------------
// Stage 1: position-aware line extraction
// ---------------------------------------------------------------------------

type PlacedWord = { x: number; str: string };

export async function extractPdfLines(file: File): Promise<string[][]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[][] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    const words: Array<PlacedWord & { y: number }> = [];
    for (const raw of content.items) {
      if (!("str" in raw)) continue;
      const str = String(raw.str).replace(/\s+/g, " ").trim();
      if (!str) continue;
      const transform = (raw as { transform?: number[] }).transform;
      words.push({ x: transform?.[4] ?? 0, y: transform?.[5] ?? 0, str });
    }

    // Cluster into visual lines (top to bottom), then split wide columns.
    words.sort((a, b) => b.y - a.y);
    const rows: Array<{ y: number; words: PlacedWord[] }> = [];
    for (const w of words) {
      const row = rows.find((r) => Math.abs(r.y - w.y) <= 3);
      if (row) row.words.push({ x: w.x, str: w.str });
      else rows.push({ y: w.y, words: [{ x: w.x, str: w.str }] });
    }

    const lines: string[] = [];
    for (const row of rows) {
      row.words.sort((a, b) => a.x - b.x);
      // A gap wider than ~100 units means a second column — parse separately
      // so "Paneer 180 | Chowmein 160" never becomes one fake item.
      let segment: string[] = [];
      let prevX: number | null = null;
      const flush = () => {
        const text = segment.join(" ").replace(/\s+/g, " ").trim();
        if (text) lines.push(text);
        segment = [];
      };
      for (const w of row.words) {
        if (prevX !== null && w.x - prevX > 100) flush();
        segment.push(w.str);
        prevX = w.x + w.str.length * 5;
      }
      flush();
    }
    pages.push(lines);
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Stage 2: rule-based menu parsing
// ---------------------------------------------------------------------------

type PriceHit = { value: number; start: number; end: number };

const PRICE_RE = /(₹\s*|Rs\.?\s*|INR\s*)?(\d{1,4}(?:\.\d{1,2})?)(\s*\/-|\s*-)?/g;

function findPrices(line: string): PriceHit[] {
  const hits: PriceHit[] = [];
  PRICE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PRICE_RE.exec(line)) !== null) {
    const value = Number(m[2] ?? "");
    if (!Number.isFinite(value)) continue;
    const hasMarker = Boolean((m[1] ?? "").trim()) || Boolean((m[3] ?? "").trim());
    const trailing = line.slice(m.index + m[0].length).trim();
    // A bare number only counts as a price with a ₹/Rs//- marker or at line end.
    if (value >= MIN_PRICE && value <= MAX_PRICE && (hasMarker || trailing.length === 0)) {
      hits.push({ value, start: m.index, end: m.index + m[0].length });
    }
    if (m[0].length === 0) PRICE_RE.lastIndex += 1;
  }
  return hits;
}

const PRICE_ONLY_RE = /^(₹\s*|Rs\.?\s*)?(\d{1,4}(?:\.\d{1,2})?)(\s*\/-)?$/;

const NON_VEG_RE =
  /\b(chicken|chiken|mutton|fish|egg|anda|keema|kheema|prawn|crab|meat|pork|non[-\s]?veg)\b/i;

const JUNK_RES: RegExp[] = [
  /^[\d\s.,/()\-+₹]*$/i,
  /^page\s*\d+$/i,
  /\b\d{10}\b|\+?91[\s-]?\d{5}[\s-]?\d{5}|\b\d{5}[\s-]\d{5,6}\b/i,
  /call(\s+us)?\s*:?\s*[\d\s+\-()]{7,}/i,
  /gst|fssai|tax|subject to|all rights|thank|visit again/i,
  /timing|open|close|\bhours?\b|morning|evening/i,
  /address|bijnor|akbarabad|begampur|nh[-\s]?\d+|highway/i,
  /wifi|parking|\ba ?\/ ?c\b|family (restaurant|dhaba)|since 20\d\d/i,
  /^(menu|rate list|price list|menu card|pure veg|veg\.?|note:.*)$/i,
];

const CATEGORY_KEYWORDS: Array<[RegExp, string]> = [
  [/parath?a/i, "Parathas"],
  [/tandoor/i, "Tandoor Main Course"],
  [/\b(roti|naan|kulcha|breads?)\b/i, "Breads"],
  [/\b(rice|biryani|biriyani|pulao|fried rice)\b/i, "Rice & Biryani"],
  [/\b(chinese|chow ?mein|noodles?|manchurian|momos?|hakka|fried rice)\b/i, "Chinese"],
  [/\b(dosa|idli|sambhar|sambar|uttapam|vada|south indian)\b/i, "South Indian"],
  [
    /\b(snacks?|starters?|pakora|pakode|fries|chaat|kebab|rolls?|burger|sandwich|pav bhaji|chole bhature|samosa|tikki|cutlet)\b/i,
    "Snacks",
  ],
  [/\b(chai|tea|coffee|lassi|beverages?|shakes?|juice|cold drinks?)\b/i, "Chai & Lassi"],
  [
    /\b(main course|curries|paneer|dal|kofta|shahi|kadhai|mix veg|chana|rajma|egg curry|mushroom|malai|butter masala)\b/i,
    "Tandoor Main Course",
  ],
  [/\b(desserts?|sweets?|ice ?cream|gulab jamun|kheer|halwa|pastry|cake|rasmalai)\b/i, "Desserts"],
  [/\b(combos?|thali|platter|meals?)\b/i, "Combos"],
];

const ALL_CAPS_HEADER_RE = /^[A-Z][A-Z\s&'/-]{2,38}$/;

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((w) => (/^[a-z]/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join("")
    .trim();
}

function detectCategory(line: string): string | null {
  const clean = line.replace(/[:\-–—\s]+$/, "").trim();
  if (clean.length < 3 || clean.length > 42) return null;
  if (ALL_CAPS_HEADER_RE.test(clean)) {
    for (const [re, name] of CATEGORY_KEYWORDS) {
      if (re.test(clean)) return name;
    }
    return toTitleCase(clean);
  }
  // Title-case headers must be short and uniformly capitalised, otherwise a
  // sentence like "Slow cooked overnight on tandoor" would false-positive.
  const words = clean.split(/\s+/);
  const looksLikeHeader =
    words.length >= 1 && words.length <= 3 && words.every((w) => /^([A-Z][a-z]*|&|and)$/.test(w));
  if (!looksLikeHeader) return null;
  for (const [re, name] of CATEGORY_KEYWORDS) {
    if (re.test(clean)) return name;
  }
  if (/:\s*$/.test(line)) return toTitleCase(clean);
  return null;
}

function cleanName(raw: string): string {
  return raw
    .replace(/^[•\-*>#([]*(\d{1,3}[.)\]]?\s*)?/, "")
    .replace(/\.(\s*\.)+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\d+\s*(pcs?|pieces?)\b\s*$/i, "")
    .replace(/[:\-–—.,\s]+$/, "")
    .trim();
}

const VARIANT_WORD_RE = /\b(half|full|quarter|small|large|regular)\b/i;

function splitVariantName(name: string): { base: string; firstLabel: string; secondLabel: string } {
  let firstLabel = " (Half)";
  let secondLabel = " (Full)";
  if (/quarter/i.test(name)) firstLabel = " (Quarter)";
  if (/\bsmall\b/i.test(name)) firstLabel = " (Small)";
  if (/\blarge\b/i.test(name)) secondLabel = " (Large)";
  const base = name
    .replace(/\b(half|full|quarter|small|large|regular)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return { base, firstLabel, secondLabel };
}

function isVeg(name: string, description: string | null): boolean {
  return !NON_VEG_RE.test(`${name} ${description ?? ""}`);
}

export function parseMenuLines(pages: string[][]): ParsedMenuItem[] {
  const items: ParsedMenuItem[] = [];
  const seen = new Set<string>();
  let category = "Mains";
  let lastItem: ParsedMenuItem | null = null;
  let pendingText: string | null = null;

  const attachPending = () => {
    if (pendingText && lastItem && !lastItem.description) {
      lastItem.description = pendingText.slice(0, 160);
    }
    pendingText = null;
  };

  const push = (item: ParsedMenuItem) => {
    if (items.length >= MAX_ITEMS) return;
    const key = `${item.category}|${item.name.toLowerCase()}|${item.price}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
    lastItem = item;
  };

  for (const page of pages) {
    for (let li = 0; li < page.length; li += 1) {
      const rawLine = page[li] ?? "";
      const line = rawLine.replace(/\s+/g, " ").trim();
      if (!line) continue;

      // Restaurant banner lines ("SHRI RUDRA DHABA") carry no prices — never items.
      if (!/\d/.test(line) && /dhaba|restaurant|hotel|cafe|bhojnalaya|eatery/i.test(line)) {
        attachPending();
        continue;
      }

      // Two-line layout ("Masala Dosa" / "190") beats junk filtering, but
      // never treat a year (1900–2100) as a price here.
      const priceOnly = PRICE_ONLY_RE.exec(line);
      if (priceOnly && pendingText && pendingText.length >= 6) {
        const value = Number(priceOnly[2] ?? "");
        const name = cleanName(pendingText);
        pendingText = null;
        if (
          Number.isFinite(value) &&
          value >= 15 &&
          value <= MAX_PRICE &&
          (value < 1900 || value > 2100) &&
          name.length >= 3
        ) {
          push({ category, name, description: null, price: value, is_veg: isVeg(name, null) });
        }
        continue;
      }

      if (JUNK_RES.some((re) => re.test(line))) {
        attachPending();
        continue;
      }

      const prices = findPrices(line);

      if (prices.length >= 2) {
        // Half/Full (or Small/Large) variants on one line.
        attachPending();
        const first = prices[0];
        const second = prices[1];
        if (!first || !second) continue;
        const { base, firstLabel, secondLabel } = splitVariantName(
          cleanName(line.slice(0, first.start)),
        );
        if (base.length < 2) continue;
        const veg = isVeg(base, null);
        push({
          category,
          name: `${base}${firstLabel}`,
          description: null,
          price: first.value,
          is_veg: veg,
        });
        push({
          category,
          name: `${base}${secondLabel}`,
          description: null,
          price: second.value,
          is_veg: veg,
        });
        continue;
      }

      if (prices.length === 1) {
        attachPending();
        const hit = prices[0];
        if (!hit) continue;
        const before = line.slice(0, hit.start);
        // "Kadhai Paneer Half 150 Full 230": mid-line bare number + variant words.
        const mid = /(\d{1,4}(?:\.\d{1,2})?)/.exec(before);
        const midValue = mid ? Number(mid[1] ?? "") : NaN;
        if (
          mid &&
          Number.isFinite(midValue) &&
          midValue >= MIN_PRICE &&
          midValue <= MAX_PRICE &&
          (VARIANT_WORD_RE.test(line) || /\//.test(before))
        ) {
          const { base, firstLabel, secondLabel } = splitVariantName(
            cleanName(before.slice(0, mid.index)),
          );
          if (base.length >= 2) {
            const veg = isVeg(base, null);
            push({
              category,
              name: `${base}${firstLabel}`,
              description: null,
              price: midValue,
              is_veg: veg,
            });
            push({
              category,
              name: `${base}${secondLabel}`,
              description: null,
              price: hit.value,
              is_veg: veg,
            });
            continue;
          }
        }
        const name = cleanName(before);
        if (name.length < 2 || name.length > 80) continue;
        push({ category, name, description: null, price: hit.value, is_veg: isVeg(name, null) });
        continue;
      }

      if (priceOnly) continue; // stray number (page number, etc.)

      const header = detectCategory(line);
      if (header) {
        // …unless the next line is a bare price — then this is a dish name
        // in a two-line layout ("Masala Dosa" / "190"), not a header.
        const next = (page[li + 1] ?? "").replace(/\s+/g, " ").trim();
        const nextPrice = PRICE_ONLY_RE.exec(next);
        const nextValue = Number(nextPrice?.[2] ?? "");
        if (
          nextPrice &&
          line.length >= 4 &&
          Number.isFinite(nextValue) &&
          nextValue >= 15 &&
          nextValue <= MAX_PRICE &&
          (nextValue < 1900 || nextValue > 2100)
        ) {
          if (pendingText) attachPending();
          pendingText = line;
          continue;
        }
        attachPending();
        category = header;
        continue;
      }

      if (/[a-zA-Z]/.test(line) && line.length >= 3 && line.length <= 90) {
        if (pendingText) attachPending(); // first line was a description
        pendingText = line;
      }
    }
  }
  attachPending();
  return items;
}

/** Total readable characters — below the threshold the PDF is likely scanned. */
export function countTextChars(pages: string[][]): number {
  return pages.reduce((sum, lines) => sum + lines.join(" ").length, 0);
}

export { MIN_TEXT_CHARS };
