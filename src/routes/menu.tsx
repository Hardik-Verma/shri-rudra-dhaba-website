import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Minus, Plus, Search, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CartDrawer } from "@/components/CartDrawer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { menuQuery, settingsQuery, type MenuItem } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { DEFAULT_CATEGORIES, SITE_URL, categoryMeta, describeItem, rupee } from "@/lib/dhaba";

const TITLE = "Menu & Prices – Shri Rudra Dhaba, Bijnor | Order Dine-In on NH-734";
const DESC =
  "See the live Shri Rudra Dhaba menu with prices — parathas, tandoor mains, Chinese, South Indian, chai & lassi near Bijnor & Najibabad. Order from your table on WhatsApp.";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: `${SITE_URL}/menu` },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/menu` }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(menuQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]),
  component: MenuPage,
});

function MenuPage() {
  const { data: menu } = useSuspenseQuery(menuQuery);
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the selected category visible in the sideways scroll bar.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const items = useMemo(() => menu.filter((item) => item.available), [menu]);

  const categories = useMemo(() => {
    const present = Array.from(new Set(items.map((item) => item.category)));
    return present.sort((a, b) => {
      const ai = DEFAULT_CATEGORIES.indexOf(a);
      const bi = DEFAULT_CATEGORIES.indexOf(b);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      return a.localeCompare(b);
    });
  }, [items]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (active !== "All" && item.category !== active) return false;
      if (vegOnly && !item.is_veg) return false;
      if (q && !`${item.name} ${item.category} ${item.description ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [items, active, query, vegOnly]);

  const countFor = (cat: string) =>
    cat === "All" ? items.length : items.filter((i) => i.category === cat).length;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pb-28 pt-16 sm:pt-20">
        <section className="border-b border-border bg-secondary">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Dine-in only · Table ordering
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0">
                <h1 className="text-4xl sm:text-5xl">Menu &amp; Order</h1>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  {items.length > 0
                    ? `${items.length} dishes live now. Choose your dishes, add your table number, and send the order to the kitchen.`
                    : "Choose your dishes, add your table number, and send the order to the kitchen."}
                </p>
              </div>
              <p className="max-w-md border-l-2 border-primary pl-4 text-sm text-muted-foreground">
                Prices and availability are managed by the dhaba team.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search dishes… e.g. paneer, paratha"
                  aria-label="Search dishes"
                  className="h-11 bg-background pl-9 text-base"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={vegOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVegOnly((v) => !v)}
                  aria-pressed={vegOnly}
                >
                  <span className="grid size-3.5 place-items-center rounded-sm border-2 border-veg">
                    <span className="size-1.5 rounded-full bg-veg" />
                  </span>
                  Veg only
                </Button>
                {(query || vegOnly || active !== "All") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setVegOnly(false);
                      setActive("All");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur sm:top-[72px]">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-1 px-4 py-3 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="hidden shrink-0 sm:inline-flex"
              aria-label="Scroll categories left"
              onClick={() => barRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <nav
              ref={barRef}
              className="no-scrollbar flex w-full gap-2 overflow-x-auto scroll-smooth px-1 py-0.5 [mask-image:linear-gradient(to_right,black_94%,transparent)]"
              aria-label="Menu categories"
            >
              {["All", ...categories].map((category) => (
                <Button
                  key={category}
                  ref={active === category ? activeRef : undefined}
                  variant={active === category ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  aria-pressed={active === category}
                  onClick={() => setActive(category)}
                >
                  {category} · {countFor(category)}
                </Button>
              ))}
            </nav>
            <Button
              variant="ghost"
              size="icon"
              className="hidden shrink-0 sm:inline-flex"
              aria-label="Scroll categories right"
              onClick={() => barRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <div className="border border-dashed border-border bg-card px-6 py-16 text-center">
              <UtensilsCrossed className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 text-2xl">Menu is being updated</h2>
              <p className="mt-2 text-muted-foreground">
                Please ask our staff for today&apos;s menu.
              </p>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="border border-dashed border-border bg-card px-6 py-16 text-center">
              <UtensilsCrossed className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 text-2xl">No dishes match your search</h2>
              <p className="mt-2 text-muted-foreground">
                Try a different search, or browse another category.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setQuery("");
                  setVegOnly(false);
                  setActive("All");
                }}
              >
                Show full menu
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground" role="status">
                Showing {visibleItems.length} of {items.length} dishes
                {active !== "All" ? ` in ${active}` : ""}
              </p>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {visibleItems.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
      <CartDrawer whatsapp={settings.whatsapp} />
    </div>
  );
}

function MenuCard({ item }: { item: MenuItem }) {
  const cart = useCart();
  const quantity = cart.qtyOf(item.id);
  const meta = categoryMeta(item.category);
  const description = describeItem(item.category, item.description);

  return (
    <article className="flex min-h-80 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative h-44 overflow-hidden" style={{ background: meta.gradient }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center" aria-hidden="true">
            <span className="text-5xl">{meta.emoji}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {item.category}
        </span>
        {!item.image_url && (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white/90">
            Photo coming soon
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-2">
          <span
            aria-label={item.is_veg ? "Veg" : "Non-veg"}
            title={item.is_veg ? "Veg" : "Non-veg"}
            className={`mt-1 grid size-4 shrink-0 place-items-center rounded-sm border-2 ${item.is_veg ? "border-veg" : "border-nonveg"}`}
          >
            <span className={`size-1.5 rounded-full ${item.is_veg ? "bg-veg" : "bg-nonveg"}`} />
          </span>
          <h2 className="text-xl leading-snug">{item.name}</h2>
        </div>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-5">
          <p className="text-xl font-bold text-primary">{rupee(item.price)}</p>
          {quantity === 0 ? (
            <Button
              variant="outline"
              className="min-w-20 border-primary/60 font-bold text-primary"
              aria-label={`Add ${item.name} to order`}
              onClick={() => cart.add(item)}
            >
              ADD
            </Button>
          ) : (
            <div className="grid h-10 grid-cols-[40px_32px_40px] items-center overflow-hidden rounded-full bg-primary text-primary-foreground">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none text-primary-foreground hover:bg-primary-foreground/10"
                aria-label={`Remove one ${item.name}`}
                onClick={() => cart.dec(item.id)}
              >
                <Minus className="size-4" />
              </Button>
              <span className="text-center font-bold" aria-live="polite">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none text-primary-foreground hover:bg-primary-foreground/10"
                aria-label={`Add one ${item.name}`}
                onClick={() => cart.add(item)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
