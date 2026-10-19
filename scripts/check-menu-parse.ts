/**
 * One-off verification of menu-parse against the designed-menu line format
 * (two-column dhaba menu: banner headers, ON MRP rows, wrapped names,
 * 289/299 dual prices). Run: node --experimental-strip-types scripts/check-menu-parse.ts
 */
import { parseMenuLines } from "../src/lib/menu-parse.ts";

const pageCover = [
  "RUDRA DHABA",
  "THE TASTE FROM MURTHAL",
  "FOODS MENU",
  "THE MOST DELICIOUS FOOD ON HIGHWAY",
  "PURE VEG.",
];

const page2 = [
  "",
  "RUDRA DHABA",
  "The Taste From Murthal",
  "",
  "PARATHA",
  "PUDINA PARATHA 69",
  "ALOO PARATHA 99",
  "GOBHI PARATHA 99",
  "ONION PARATHA 99",
  "PANEER PYAZ PARATHA 109",
  "MOOLI PARATHA(SEASONAL) 109",
  "PANEER PARATHA 119",
  "ALOO PYAZ PARATHA 99",
  "MIX PARATHA 119",
  "",
  "RELAX TIME",
  "TEA 29",
  "BLACK TEA 29",
  "HOT COFFEE 49",
  "COLD COFFEE 99",
  "COLD DRINK ON MRP",
  "MINERAL WATER ON MRP",
  "GREEN TEA 59",
  "LEMON TEA 49",
  "BLACK COFFEE 39",
  "",
  "SNACKS",
  "POHA 149",
  "ALOO PURI 149",
  "CHOLE BHATURE 179",
  "VADA PAV SPECIAL 119",
  "PANEER PAKODA 249",
  "MIX PAKODA 199",
  "",
  "SOUTH INDIAN",
  "PLAIN DOSA 139",
  "MASALA DOSA 169",
  "ONION DOSA 169",
  "PANEER DOSA 199",
  "PAPER MASALA DOSA 179",
  "BUTTER MASALA DOSA 169",
];

const page3 = [
  "",
  "AMERICANO",
  "BUTTER TOAST 89",
  "VEG SANDWICH 119",
  "CHEESE SANDWICH 149",
  "GRILL SANDWICH 139",
  "CHEESE GRILLED 159",
  "SANDWICH",
  "VEG BURGER 79",
  "CHEESE BURGER 119",
  "",
  "CHINESE",
  "VEG. NOODLES 219",
  "CHILLI GARLIC NOODLES 219",
  "HAKKA NOODLES 229",
  "VEG. FRIED RICE 219",
  "SCHEZWAN FRIED RICE 219",
  "FRENCH FRIES BASKET 199",
  "HONEY CHILLI POTATO 239",
  "CHILLI PANEER DRY/GRAVY 289/299",
  "",
  "TANDOOR",
  "PANEER TIKKA 289",
  "ACHARI PANEER TIKKA 289",
  "AFGHANI PANEER TIKKA 299",
  "AFGHANI CHAAP 219",
  "MALAI SOYA CHAAP 239",
  "PUNJABI SOYA CHAAP 269",
  "ACHARI SOYA CHAAP 219",
  "",
  "ZAYKA",
  "VEG. HOT & SOUR SOUP 89",
  "VEG. TOMATO SOUP 89",
  "VEG. MANCHOW SOUP 99",
  "",
  "PAPAD",
  "PLAIN PAPAD (2 PIECE) 39",
  "MASALA PAPAD (2 PIECE) 59",
];

const items = parseMenuLines([pageCover, page2, page3]);

let failures = 0;
function expect(name: string, price: number | null, category?: string) {
  const hit = items.find(
    (i) => i.name.toLowerCase() === name.toLowerCase() && (price === null || i.price === price),
  );
  if (!hit) {
    failures += 1;
    console.error(`MISSING: ${name}${price !== null ? ` ${price}` : ""}`);
    return;
  }
  if (category && hit.category !== category) {
    failures += 1;
    console.error(`WRONG CATEGORY: ${name} → ${hit.category} (want ${category})`);
  }
}

expect("Pudina Paratha", 69, "Parathas");
expect("Mooli Paratha (Seasonal)", 109, "Parathas");
expect("Tea", 29, "Chai & Lassi");
expect("Cold Coffee", 99, "Chai & Lassi");
expect("Cheese Grilled Sandwich", 159);
expect("Chilli Paneer (Dry)", 289, "Chinese");
expect("Chilli Paneer (Gravy)", 299, "Chinese");
expect("Veg. Noodles", 219, "Chinese");
expect("Paneer Tikka", 289, "Tandoor Main Course");
expect("Plain Papad (2 Piece)", 39, "Papad");
expect("Masala Dosa", 169, "South Indian");
expect("Chole Bhature", 179, "Snacks");
expect("Veg. Hot & Sour Soup", 89, "Zayka");

if (items.length < 45) {
  failures += 1;
  console.error(`Too few items: ${items.length} (expected >= 45)`);
}
if (items.some((i) => /mrp/i.test(`${i.name} ${i.description ?? ""}`))) {
  failures += 1;
  console.error("ON MRP rows leaked into items");
}
if (items.some((i) => /[A-Z]{3,}/.test(i.name) && !/\([A-Z]+\)/.test(i.name))) {
  failures += 1;
  console.error("Some names are still ALL CAPS:");
  items.filter((i) => /[A-Z]{3,}/.test(i.name)).forEach((i) => console.error(`  ${i.name}`));
}
if (items.some((i) => i.name === "Sandwich" || i.name === "Cheese Grilled")) {
  failures += 1;
  console.error("Wrapped sandwich name was not merged");
}

console.log(`Parsed ${items.length} items.`);
if (failures === 0) {
  console.log("All checks passed.");
} else {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
