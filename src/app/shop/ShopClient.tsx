"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { cx } from "@/lib/format";
import { useProducts, useSettings } from "@/components/providers/SiteData";
import ShopGrid from "@/components/home/ShopGrid";
import Marquee from "@/components/home/Marquee";

const sorts = {
  featured: (a: Product, b: Product) => a.sortOrder - b.sortOrder,
  "price-asc": (a: Product, b: Product) => a.price - b.price,
  "price-desc": (a: Product, b: Product) => b.price - a.price,
};

export default function ShopClient() {
  const products = useProducts();
  const shop = useSettings().shop;
  const filters = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))], [products]);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<keyof typeof sorts>("featured");

  const items = useMemo(
    () => products.filter((p) => filter === "All" || p.category === filter).sort(sorts[sort]),
    [products, filter, sort],
  );

  return (
    <>
      <section className="bg-paper px-4 pb-10 pt-36 md:px-16 md:pt-44">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-white/50">
          {products.length} drops · {shop.kicker}
        </p>
        <h1 className="display text-[14vw] md:text-[8vw]">
          {shop.title}
        </h1>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cx(
                  "rounded-md border px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors",
                  filter === f ? "border-ink bg-ink text-paper" : "border-white/20 hover:border-ink",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as keyof typeof sorts)}
              className="rounded-md border border-white/20 bg-black px-4 py-2.5 uppercase"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low → high</option>
              <option value="price-desc">Price: high → low</option>
            </select>
          </label>
        </div>
      </section>

      <ShopGrid key={filter + sort} items={items} title={`${filter} tees`} kicker={`${items.length} results`} showAll={false} />

      <div className="bg-ink text-paper">
        <Marquee reverse />
      </div>
    </>
  );
}
