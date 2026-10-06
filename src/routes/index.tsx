import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, Navigation, Phone, Star, UtensilsCrossed } from "lucide-react";
import heroImg from "@/assets/hero-dhaba.jpg";
import { Hero3D, Reveal3D } from "@/components/Scroll3D";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { galleryQuery, menuQuery, settingsQuery } from "@/lib/data";
import {
  DHABA,
  FEATURES,
  MAPS_EMBED,
  MAPS_REVIEWS_URL,
  MAPS_URL,
  categoryMeta,
  describeItem,
  digitsOnly,
  isOpenNow,
  rupee,
} from "@/lib/dhaba";
import { useEffect, useState } from "react";

const TITLE = "Shri Rudra Dhaba – Highway Restaurant near Bijnor, NH-734";
const DESC =
  "Visit Shri Rudra Murthal Walo Ka Dhaba on NH-734 near Bijnor. Dine-in daily from 6 AM to 11 PM. Browse the live menu and order from your table.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "geo.region", content: "IN-UP" },
      { name: "geo.placename", content: "Bijnor" },
      { name: "geo.position", content: `${DHABA.lat};${DHABA.lng}` },
      { name: "ICBM", content: `${DHABA.lat}, ${DHABA.lng}` },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(menuQuery),
      context.queryClient.ensureQueryData(galleryQuery),
    ]),
  component: HomePage,
});

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{children}</p>
  );
}

function HomePage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { data: menu } = useSuspenseQuery(menuQuery);
  const { data: gallery } = useSuspenseQuery(galleryQuery);
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => setOpen(isOpenNow()), []);
  const phone = digitsOnly(settings.phone);
  const liveItems = menu.filter((m) => m.available);
  const preview = liveItems.slice(0, 6);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero3D image={settings.banner_image_url || heroImg} video={settings.banner_video_url}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            Since {DHABA.since} · NH-734 · Bijnor
          </p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-white">
            {settings.banner_eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight text-white sm:text-5xl">
            {settings.banner_heading}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
            {settings.banner_text}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            {open !== null && (
              <span
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-medium text-white ${
                  open ? "bg-green-700" : "bg-stone-700"
                }`}
              >
                <span className="size-1.5 rounded-full bg-white" />
                {open ? "Open now" : "Closed now"}
              </span>
            )}
            <a
              href={MAPS_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 font-medium text-white"
            >
              <Star className="size-4 fill-white text-white" />
              {DHABA.rating} on Google · {DHABA.reviewCount} reviews
            </a>
          </div>
          <div className="mt-7 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1 bg-white text-stone-900 hover:bg-white/90">
              <Link to="/menu">
                <UtensilsCrossed />
                View menu &amp; order
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="flex-1 border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                <Navigation />
                {settings.banner_primary_button}
              </a>
            </Button>
          </div>
        </Hero3D>

        <section className="border-b border-border">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-y-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              [`${DHABA.rating}`, `Google rating · ${DHABA.reviewCount} reviews`],
              [`Since ${DHABA.since}`, "Highway halt on NH-734"],
              ["7 days", "6 AM – 11 PM, every day"],
              [
                `${liveItems.length > 0 ? liveItems.length : "Live"} dishes`,
                "Menu managed by the dhaba team",
              ],
            ].map(([value, label], i) => (
              <Reveal3D key={label}>
                <p className="text-3xl font-bold">{value}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
              </Reveal3D>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28 lg:px-8">
          <Reveal3D>
            <Eyebrow>Our place</Eyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl">{settings.about_heading}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{settings.about_text}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="outline" size="lg">
                <Link to="/about">
                  About us <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/gallery" className="link-underline">
                  View gallery
                </Link>
              </Button>
            </div>
          </Reveal3D>
          <Reveal3D>
            <div className="overflow-hidden rounded-xl border border-border">
              {settings.about_image_url ? (
                <img
                  src={settings.about_image_url}
                  alt="Shri Rudra Dhaba dining area"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : gallery[0] ? (
                <img
                  src={gallery[0].image_url}
                  alt={gallery[0].alt_text}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <img
                  src={settings.banner_image_url || heroImg}
                  alt="Shri Rudra Dhaba"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/10] w-full object-cover"
                />
              )}
            </div>
          </Reveal3D>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <Reveal3D>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Eyebrow>Popular right now</Eyebrow>
                  <h2 className="mt-3 text-3xl sm:text-4xl">From the live menu</h2>
                </div>
                <Link to="/menu" className="link-underline text-sm font-semibold text-primary">
                  Full menu &amp; order
                </Link>
              </div>
            </Reveal3D>
            {preview.length === 0 ? (
              <p className="mt-8 text-muted-foreground">
                Menu is being updated — please ask our staff for today&apos;s dishes.
              </p>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {preview.map((item, i) => {
                  const meta = categoryMeta(item.category);
                  return (
                    <Reveal3D key={item.id}>
                      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
                        <div
                          className="relative h-44 overflow-hidden"
                          style={{ background: meta.gradient }}
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="grid size-full place-items-center">
                              <span className="text-5xl">{meta.emoji}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-6">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {item.category}
                          </p>
                          <h3 className="mt-1.5 text-lg">{item.name}</h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {describeItem(item.category, item.description)}
                          </p>
                          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                            <p className="text-lg font-bold">{rupee(item.price)}</p>
                            <Link
                              to="/menu"
                              className="link-underline text-sm font-semibold text-primary"
                            >
                              Order
                            </Link>
                          </div>
                        </div>
                      </article>
                    </Reveal3D>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <Reveal3D>
            <Eyebrow>Why stop here</Eyebrow>
            <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">A proper dhaba break on NH-734</h2>
          </Reveal3D>
          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal3D key={f.title}>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                  0{i + 1}
                </p>
                <p className="mt-2 font-semibold">{f.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </Reveal3D>
            ))}
          </div>
          <Reveal3D>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/menu">
                  Explore the menu <ArrowRight />
                </Link>
              </Button>
              {phone && (
                <Button asChild variant="outline" size="lg">
                  <a href={`tel:+91${phone.slice(-10)}`}>
                    <Phone />
                    {settings.banner_secondary_button}
                  </a>
                </Button>
              )}
            </div>
          </Reveal3D>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <Reveal3D>
              <Eyebrow>Dine-in ordering</Eyebrow>
              <h2 className="mt-3 text-3xl sm:text-4xl">From your seat to the kitchen</h2>
            </Reveal3D>
            <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Take a seat at any table",
                "Choose dishes from the live menu",
                "Add your table number and cooking note",
                "Send the order to the kitchen on WhatsApp",
              ].map((text, index) => (
                <Reveal3D key={text}>
                  <p className="border-t-2 border-primary pt-4 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 font-medium leading-relaxed">{text}</p>
                </Reveal3D>
              ))}
            </div>
            <Reveal3D>
              <Button asChild size="lg" className="mt-10">
                <Link to="/menu">
                  <UtensilsCrossed />
                  Open menu &amp; order
                </Link>
              </Button>
            </Reveal3D>
          </div>
        </section>

        {gallery.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <Reveal3D>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-3xl sm:text-4xl">Glimpses</h2>
                <Link to="/gallery" className="link-underline text-sm font-semibold text-primary">
                  All photos
                </Link>
              </div>
            </Reveal3D>
            <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
              {gallery.slice(0, 4).map((g, i) => (
                <Reveal3D key={g.id}>
                  <img
                    src={g.image_url}
                    alt={g.alt_text}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full rounded-xl border border-border object-cover"
                  />
                </Reveal3D>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <Reveal3D>
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                title="Map to Shri Rudra Dhaba"
                src={MAPS_EMBED}
                className="h-[380px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal3D>
          <Reveal3D>
            <Eyebrow>Visit us</Eyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl">Find us on NH-734</h2>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed">
              <p className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                {DHABA.address}
              </p>
              <p className="flex gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  {DHABA.hoursLabel}
                  <br />
                  <span className="text-muted-foreground">{DHABA.hoursNote}</span>
                </span>
              </p>
              {phone && (
                <p className="flex gap-3">
                  <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
                  <a className="link-underline font-medium" href={`tel:+91${phone.slice(-10)}`}>
                    +91 {phone.slice(-10)}
                  </a>
                </p>
              )}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="flex-1">
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                  <Navigation />
                  Get directions
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link to="/visit">Hours, map &amp; FAQs</Link>
              </Button>
            </div>
          </Reveal3D>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <Reveal3D>
              <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
                <div>
                  <h2 className="max-w-xl text-3xl sm:text-4xl">
                    Order from your table in under a minute
                  </h2>
                  <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
                    Live menu, table number, WhatsApp to the kitchen —{" "}
                    {DHABA.hoursLabel.toLowerCase()}.
                  </p>
                </div>
                <div className="mt-7 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
                  <Button asChild size="lg">
                    <Link to="/menu">
                      <UtensilsCrossed />
                      Open menu &amp; order
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/visit">Plan your visit</Link>
                  </Button>
                </div>
              </div>
            </Reveal3D>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
