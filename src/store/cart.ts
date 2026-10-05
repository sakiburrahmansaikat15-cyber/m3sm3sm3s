"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, Size } from "@/lib/types";

export type CartLine = { slug: string; size: Size; qty: number };

type CartState = {
  lines: CartLine[];
  open: boolean;
  add: (slug: string, size: Size, qty?: number) => void;
  setQty: (slug: string, size: Size, qty: number) => void;
  remove: (slug: string, size: Size) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (slug, size, qty = 1) =>
        set((s) => {
          const i = s.lines.findIndex((l) => l.slug === slug && l.size === size);
          const lines = [...s.lines];
          if (i >= 0) lines[i] = { ...lines[i], qty: Math.min(10, lines[i].qty + qty) };
          else lines.push({ slug, size, qty });
          return { lines, open: true };
        }),
      setQty: (slug, size, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.slug === slug && l.size === size ? { ...l, qty: Math.max(0, Math.min(10, qty)) } : l))
            .filter((l) => l.qty > 0),
        })),
      remove: (slug, size) => set((s) => ({ lines: s.lines.filter((l) => !(l.slug === slug && l.size === size)) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    { name: "m3s-cart", partialize: (s) => ({ lines: s.lines }) },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);

/** Only lines whose product still exists are counted. */
export const cartSubtotal = (lines: CartLine[], map: Map<string, Product>) =>
  lines.reduce((n, l) => n + (map.get(l.slug)?.price ?? 0) * l.qty, 0);
