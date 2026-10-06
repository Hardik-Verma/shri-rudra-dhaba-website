import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, Star, Users, UtensilsCrossed, Leaf } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/data";
import { DHABA, ABOUT_FAQS, FEATURES, MAPS_REVIEWS_URL, MAPS_URL } from "@/lib/dhaba";

const TITLE = "About Us – Shri Rudra Dhaba, NH-734 near Bijnor";
const DESC =
  "About Shri Rudra Murthal Walo Ka Dhaba on NH-734 near Bijnor: Murthal-style food, family seating and dine-in ordering.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: AboutPage,
});

function AboutPage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pt-16 sm:pt-20">
        <section className="border-b border-border bg-secondary">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              About us
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">
              {settings.about_heading || "A highway stop made for a proper pause"}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              {settings.about_text || DHABA.tagline}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 font-semibold">
                <Star className="size-4 fill-primary text-primary" /> {DHABA.rating} on Google ·{" "}
                {DHABA.reviewCount} reviews
              </span>
              <span className="rounded-full bg-background px-3 py-1.5 text-muted-foreground">
                Since {DHABA.since} · NH-734
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <h2 className="text-3xl">Murthal-style food, served hot beside the highway</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              {settings.about_text} We serve travellers, families and daily commuters on{" "}
              {DHABA.street} — parathas with white butter, tandoor breads, dals, rice plates, chai
              and lassi.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <UtensilsCrossed className="size-6 text-primary" />
                <p className="mt-3 font-semibold">Dine-in focused</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sit at a table and order from the live menu.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <Leaf className="size-6 text-veg" />
                <p className="mt-3 font-semibold">Veg &amp; non-veg</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every dish is clearly marked veg or non-veg.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <Users className="size-6 text-primary" />
                <p className="mt-3 font-semibold">Families &amp; groups</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Room for families, drivers and yatra groups.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <Clock className="size-6 text-primary" />
                <p className="mt-3 font-semibold">{DHABA.hoursLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">{DHABA.hoursNote}</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {settings.about_image_url ? (
              <img
                src={settings.about_image_url}
                alt="Inside Shri Rudra Dhaba"
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="grid aspect-[4/3] w-full place-items-center bg-secondary">
                <div className="text-center">
                  <UtensilsCrossed className="mx-auto size-12 text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Dining photos can be added from the Owner Panel.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" />
              <span className="truncate">{DHABA.address}</span>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl">Why travellers stop here</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-border bg-background p-5">
                  <p className="font-semibold">{f.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/menu">
                  See the menu <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={MAPS_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
                  <Star /> Read Google reviews
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                  <MapPin /> Get directions
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl">Our food, our way</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {ABOUT_FAQS.map((f) => (
              <div key={f.q} className="rounded-xl border border-border bg-card p-5">
                <p className="font-semibold">{f.q}</p>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
