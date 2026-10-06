// Verified public listing details (Google Maps listing: 4.6 rating, 99 reviews).
export const DHABA = {
  name: "Shri Rudra Murthal Walo Ka Dhaba",
  shortName: "Shri Rudra Dhaba",
  tagline: "Murthal-style food on NH-734, near Bijnor",
  address: "NH-734, Begampur Shadi (Akbarabad), Bijnor, Uttar Pradesh 246764",
  street: "NH-734, Begampur Shadi (Akbarabad)",
  locality: "Bijnor",
  region: "Uttar Pradesh",
  postalCode: "246764",
  plusCode: "F8FW+VV9",
  lat: 29.474225,
  lng: 78.347538,
  opens: "06:00",
  closes: "23:00",
  hoursLabel: "Open all 7 days · 6:00 AM – 11:00 PM",
  hoursNote:
    "Timings may change on festivals, weather or special days — please call ahead if unsure.",
  rating: "4.6",
  reviewCount: "99",
  since: "2025",
};

// Canonical public URL of the site. If your Render URL differs, change it here
// (sitemap, canonical tags and structured data all build on this).
export const SITE_URL = "https://shri-rudra-dhaba.onrender.com";

export const MAPS_URL = `https://www.google.com/maps/dir/?api=1&destination=${DHABA.lat},${DHABA.lng}`;
export const MAPS_EMBED = `https://www.google.com/maps?q=${DHABA.lat},${DHABA.lng}&z=15&output=embed`;
export const MAPS_REVIEWS_URL = `https://www.google.com/maps/search/?api=1&query=${DHABA.lat},${DHABA.lng}`;

// Towns and the highway corridor this dhaba serves (NH-734 runs Bijnor ↔ Najibabad).
export const AREAS_SERVED = ["Bijnor", "Najibabad", "Akbarabad", "NH-734 corridor"];

export const DEFAULT_CATEGORIES = [
  "Parathas",
  "Tandoor Main Course",
  "Breads",
  "Rice & Biryani",
  "Chinese",
  "South Indian",
  "Snacks",
  "Chai & Lassi",
  "Desserts",
  "Beverages",
];

/** Professional fallback content per category so no card ever looks empty. */
export const CATEGORY_META: Record<string, { blurb: string; gradient: string; emoji: string }> = {
  Parathas: {
    blurb: "Stuffed, tandoor-finished and served with white butter, curd and pickle.",
    gradient: "linear-gradient(135deg,#e7e0d2,#c9bda6)",
    emoji: "🫓",
  },
  "Tandoor Main Course": {
    blurb: "Slow-cooked dals, paneer and seasonal sabzi from the highway tandoor.",
    gradient: "linear-gradient(135deg,#ddd3c0,#b3a586)",
    emoji: "🍛",
  },
  Breads: {
    blurb: "Fresh tandoori roti, naan and laccha paratha, baked to order.",
    gradient: "linear-gradient(135deg,#e7e0d2,#c9bda6)",
    emoji: "🫓",
  },
  "Rice & Biryani": {
    blurb: "Steamed rice, jeera rice and veg biryani served hot with raita.",
    gradient: "linear-gradient(135deg,#d9d4c7,#aca793)",
    emoji: "🍚",
  },
  Chinese: {
    blurb: "Dhaba-style chowmein, manchurian and chilli paneer with smoky wok flavour.",
    gradient: "linear-gradient(135deg,#ddd3c0,#b3a586)",
    emoji: "🍜",
  },
  "South Indian": {
    blurb: "Crisp dosa, idli and uttapam with sambhar and coconut chutney.",
    gradient: "linear-gradient(135deg,#e2dccf,#b9b29e)",
    emoji: "🥞",
  },
  Snacks: {
    blurb: "Quick roadside plates — pakode, fries and chaat-style starters.",
    gradient: "linear-gradient(135deg,#ddd3c0,#b3a586)",
    emoji: "🍟",
  },
  "Chai & Lassi": {
    blurb: "Kadak chai, sweet lassi and cold drinks for the road.",
    gradient: "linear-gradient(135deg,#d9d4c7,#aca793)",
    emoji: "☕",
  },
  Desserts: {
    blurb: "Simple sweet endings — ask the counter for what is fresh today.",
    gradient: "linear-gradient(135deg,#e2dccf,#b9b29e)",
    emoji: "🍨",
  },
  Beverages: {
    blurb: "Chai, coffee, lassi and bottled cold drinks, served chilled.",
    gradient: "linear-gradient(135deg,#d9d4c7,#aca793)",
    emoji: "🥤",
  },
  // Alias for menus imported before the rename — same content, no kulhad wording.
  "Kulhad Chai & Lassi": {
    blurb: "Kadak chai, sweet lassi and cold drinks for the road.",
    gradient: "linear-gradient(135deg,#d9d4c7,#aca793)",
    emoji: "☕",
  },
};

export function categoryMeta(category: string) {
  return (
    CATEGORY_META[category] ?? {
      blurb: "Fresh from our highway kitchen, served hot for dine-in.",
      gradient: "linear-gradient(135deg,#e2dccf,#b9b29e)",
      emoji: "🍽️",
    }
  );
}

/** Never show "null" or "Description not provided" on a public card. */
export function describeItem(category: string, description: string | null | undefined) {
  const clean = (description ?? "").trim();
  if (clean.length > 0) return clean;
  return categoryMeta(category).blurb;
}

export const FEATURES = [
  { title: "Highway location", text: "Right on NH-734 near Bijnor — easy to find, easy to park." },
  {
    title: "Fresh tandoor",
    text: "Murthal-style parathas, naan and breads baked through the day.",
  },
  { title: "Family seating", text: "Tables with room for families and groups." },
  {
    title: "Quick dine-in ordering",
    text: "Browse the live menu and send your order to the kitchen on WhatsApp.",
  },
];

/** About page: our food and story (no overlap with visit info). */
export const ABOUT_FAQS = [
  {
    q: "What kind of food do you serve?",
    a: "Murthal-style highway food — stuffed parathas with white butter, tandoor breads, dals, paneer, rice plates, plus chai and lassi. Every dish is marked veg or non-veg on the live menu.",
  },
  {
    q: "How does dine-in ordering work?",
    a: "Take any table, open the Menu page, add dishes, enter your table number and send the order straight to the kitchen on WhatsApp. Pay at the counter.",
  },
  {
    q: "Is the menu on this site up to date?",
    a: "Yes — prices and availability are managed by the dhaba team, so what you see on the Menu page is what's cooking today.",
  },
  {
    q: "Do you serve families and groups?",
    a: "Yes — there is seating for families, drivers and yatra groups, right on NH-734 near Bijnor.",
  },
];

/** Visit page: practical trip planning (no overlap with about info). */
export const VISIT_FAQS = [
  {
    q: "What is the exact address?",
    a: "NH-734, Begampur Shadi (Akbarabad), Bijnor, Uttar Pradesh 246764 (plus code F8FW+VV9). Tap Get directions for the exact Google Maps pin.",
  },
  {
    q: "What are the opening hours?",
    a: "Open all 7 days, 6:00 AM – 11:00 PM. Timings may change on festivals or special days — call ahead if unsure.",
  },
  {
    q: "Where do I park?",
    a: "It's a highway halt on NH-734 with roadside parking right outside — easy for cars and buses to pull in and out.",
  },
  {
    q: "How do I pay?",
    a: "Dine-in only — order from your table on WhatsApp and pay at the counter.",
  },
  {
    q: "Searching for the best restaurant near me on NH-734?",
    a: "If you're travelling on NH-734 between Bijnor and Najibabad, Shri Rudra Dhaba is a highly rated stop (4.6 on Google) for parathas, tandoor dishes, chai and lassi — open daily 6 AM–11 PM.",
  },
];

export function digitsOnly(s: string | null | undefined) {
  return (s ?? "").replace(/\D/g, "");
}

export function waNumber(s: string | null | undefined) {
  const d = digitsOnly(s);
  if (d.length === 10) return "91" + d;
  return d;
}

export function isOpenNow(date = new Date()) {
  // IST = UTC+5:30
  const ist = new Date(date.getTime() + (5.5 * 60 + date.getTimezoneOffset()) * 60000);
  const h = ist.getHours();
  return h >= 6 && h < 23;
}

export const rupee = (n: number) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
