import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin, Navigation, Phone, Star } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/data";
import {
  DHABA,
  VISIT_FAQS,
  MAPS_EMBED,
  MAPS_REVIEWS_URL,
  MAPS_URL,
  SITE_URL,
  digitsOnly,
} from "@/lib/dhaba";

const TITLE = "Location, Hours & Directions – Shri Rudra Dhaba, Bijnor (Near Najibabad)";
const DESC =
  "Find Shri Rudra Murthal Walo Ka Dhaba on NH-734 near Bijnor & Najibabad: address, map, directions, opening hours 6 AM–11 PM daily.";

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: VISIT_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export const Route = createFileRoute("/visit")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "geo.region", content: "IN-UP" },
      { name: "geo.placename", content: "Bijnor" },
      { name: "geo.position", content: `${DHABA.lat};${DHABA.lng}` },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: `${SITE_URL}/visit` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/visit` }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqLd) }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: VisitPage,
});

function VisitPage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const phone = digitsOnly(settings.phone);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pt-16 sm:pt-20">
        <section className="border-b border-border bg-secondary">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Visit</p>
            <h1 className="mt-3 text-4xl sm:text-5xl">Find us on NH-734</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Highway dhaba near Bijnor — stop for breakfast, lunch, dinner or chai.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 font-semibold">
                <Star className="size-4 fill-primary text-primary" /> {DHABA.rating} ·{" "}
                {DHABA.reviewCount} Google reviews
              </span>
              <span className="rounded-full bg-background px-3 py-1.5 text-muted-foreground">
                {DHABA.hoursLabel}
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)] lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <iframe
              title="Map to Shri Rudra Dhaba"
              src={MAPS_EMBED}
              className="h-[360px] w-full lg:h-full lg:min-h-[520px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl">Address &amp; hours</h2>
            <div className="mt-6 space-y-5 text-sm">
              <p className="flex gap-3">
                <MapPin className="size-5 shrink-0 text-primary" />
                <span>
                  {DHABA.address}
                  <br />
                  <span className="text-muted-foreground">Plus code: {DHABA.plusCode}</span>
                </span>
              </p>
              <p className="flex gap-3">
                <Clock className="size-5 shrink-0 text-primary" />
                <span>
                  {DHABA.hoursLabel}
                  <br />
                  <span className="text-muted-foreground">{DHABA.hoursNote}</span>
                </span>
              </p>
              {phone && (
                <p className="flex gap-3">
                  <Phone className="size-5 shrink-0 text-primary" />
                  <a className="underline" href={`tel:+91${phone.slice(-10)}`}>
                    +91 {phone.slice(-10)}
                  </a>
                </p>
              )}
            </div>
            <div className="mt-8 grid gap-3">
              <Button asChild size="lg">
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                  <Navigation /> Get directions
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={MAPS_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
                  <Star /> Reviews on Google Maps
                </a>
              </Button>
              {phone && (
                <Button asChild variant="outline" size="lg">
                  <a href={`tel:+91${phone.slice(-10)}`}>
                    <Phone /> Call the dhaba
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl">Before you visit</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {VISIT_FAQS.map((f) => (
                <div key={f.q} className="rounded-xl border border-border bg-background p-5">
                  <p className="font-semibold">{f.q}</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
