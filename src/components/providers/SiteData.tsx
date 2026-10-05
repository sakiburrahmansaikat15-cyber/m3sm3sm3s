"use client";

import { createContext, useContext, useMemo } from "react";
import type { Product, SiteData, SiteSettings } from "@/lib/types";

const Ctx = createContext<SiteData | null>(null);

/** Receives settings + products from the server layout (loaded from MySQL). */
export function SiteDataProvider({ value, children }: { value: SiteData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("SiteDataProvider missing");
  return v;
}

export const useSettings = (): SiteSettings => useData().settings;
export const useProducts = (): Product[] => useData().products;

export function useProductMap() {
  const products = useProducts();
  return useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
}

/** "Heavy\ncotton" → ["Heavy", "cotton"] */
export const lines = (s: string) => s.split(/\n|\\n/).filter(Boolean);
