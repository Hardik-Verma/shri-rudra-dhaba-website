import { Link } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { DHABA, MAPS_URL } from "@/lib/dhaba";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8 2xl:py-14">
        <div>
          <p className="text-xl font-bold">{DHABA.name}</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Restaurant on NH-734 near Bijnor &amp; Najibabad · {DHABA.rating} ★ on Google (
            {DHABA.reviewCount} reviews) · {DHABA.hoursLabel}.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Visit</p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex gap-2 text-muted-foreground hover:text-primary"
          >
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {DHABA.address}
          </a>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Hours</p>
          <p className="mt-2 flex gap-2 text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0" />
            <span>
              {DHABA.hoursLabel}
              <br />
              {DHABA.hoursNote}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/">Home</Link>
            <Link to="/menu">Menu</Link>
            <Link to="/about">About</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/visit">Visit</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © 2025–{new Date().getFullYear()} {DHABA.shortName} · Dine-in only · Serving Bijnor,
        Najibabad &amp; the NH-734 corridor
      </div>
    </footer>
  );
}
