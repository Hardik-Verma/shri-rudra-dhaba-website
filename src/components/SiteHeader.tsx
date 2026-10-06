import { Link } from "@tanstack/react-router";
import { MapPin, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MAPS_URL } from "@/lib/dhaba";

const NAV = [
  { to: "/", label: "Home", exact: true },
  { to: "/menu", label: "Menu & Order", exact: false },
  { to: "/about", label: "About", exact: false },
  { to: "/gallery", label: "Gallery", exact: false },
  { to: "/visit", label: "Visit", exact: false },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-lg text-primary-foreground">
            रु
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[17px] font-bold">Shri Rudra Dhaba</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Since 2025 · NH-734
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5">
          <nav className="hidden items-center gap-5 md:flex" aria-label="Main navigation">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                activeProps={{ className: "link-active text-foreground" }}
                className="link-underline py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Button asChild variant="outline" size="sm">
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                <MapPin /> Directions
              </a>
            </Button>
          </nav>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-border bg-background px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: item.exact }}
              activeProps={{ className: "text-foreground" }}
              className="block rounded-md px-2 py-2.5 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild className="mt-2 w-full">
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              <MapPin /> Get directions
            </a>
          </Button>
        </nav>
      )}
    </header>
  );
}
