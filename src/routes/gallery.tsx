import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { galleryQuery } from "@/lib/data";
import { SITE_URL } from "@/lib/dhaba";

const TITLE = "Food Photos – Shri Rudra Dhaba, NH-734 Bijnor";
const DESC =
  "Photos of parathas, tandoor dishes and the highway halt at Shri Rudra Dhaba on NH-734 near Bijnor & Najibabad.";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: `${SITE_URL}/gallery` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/gallery` }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(galleryQuery),
  component: GalleryPage,
});

function GalleryPage() {
  const { data: gallery } = useSuspenseQuery(galleryQuery);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pt-16 sm:pt-20">
        <section className="border-b border-border bg-secondary">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Gallery</p>
            <h1 className="mt-3 text-4xl sm:text-5xl">Food &amp; the halt</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {gallery.length > 0
                ? `${gallery.length} photos from the dhaba — managed by the owner.`
                : "Fresh photos are on the way. The owner can add them anytime from the Admin Panel."}
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          {gallery.length === 0 ? (
            <div className="border border-dashed border-border bg-card px-6 py-16 text-center">
              <Camera className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 text-2xl">Gallery is being updated</h2>
              <p className="mt-2 text-muted-foreground">
                Please check the menu or visit us — photos will appear here soon.
              </p>
              <Button asChild className="mt-6">
                <Link to="/menu">
                  Browse the menu <ArrowRight />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
              {gallery.map((g) => (
                <figure
                  key={g.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <img
                    src={g.image_url}
                    alt={g.alt_text || "Shri Rudra Dhaba photo"}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  {g.caption && (
                    <figcaption className="truncate px-3 py-2 text-sm text-muted-foreground">
                      {g.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
