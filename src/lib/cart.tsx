import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MenuItem } from "./data";

export type CartLine = { id: string; name: string; price: number; qty: number };

type Ctx = {
  lines: CartLine[];
  add: (i: MenuItem) => void;
  dec: (id: string) => void;
  clear: () => void;
  qtyOf: (id: string) => number;
  count: number;
  total: number;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "rudra-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLines(
            parsed
              .filter(
                (l) =>
                  l &&
                  typeof l.id === "string" &&
                  typeof l.name === "string" &&
                  Number.isFinite(l.price) &&
                  Number.isFinite(l.qty),
              )
              .slice(0, 50)
              .map((l) => ({
                id: l.id,
                name: String(l.name).slice(0, 120),
                price: Math.max(0, Number(l.price)),
                qty: Math.min(20, Math.max(1, Math.floor(Number(l.qty)))),
              })),
          );
        }
      }
    } catch {
      // Corrupt cart data — start fresh.
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      // Storage full or unavailable — cart just won't persist.
    }
  }, [lines, hydrated]);

  const value = useMemo<Ctx>(() => {
    return {
      lines,
      add: (i) =>
        setLines((ls) => {
          const f = ls.find((l) => l.id === i.id);
          if (f) return ls.map((l) => (l.id === i.id ? { ...l, qty: Math.min(20, l.qty + 1) } : l));
          return [...ls.slice(0, 49), { id: i.id, name: i.name, price: i.price, qty: 1 }];
        }),
      dec: (id) =>
        setLines((ls) =>
          ls.flatMap((l) => (l.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l])),
        ),
      clear: () => setLines([]),
      qtyOf: (id) => lines.find((l) => l.id === id)?.qty ?? 0,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total: lines.reduce((s, l) => s + l.qty * l.price, 0),
    };
  }, [lines]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
