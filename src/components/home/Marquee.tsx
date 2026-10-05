"use client";

import { cx } from "@/lib/format";
import { useProducts, useSettings } from "@/components/providers/SiteData";

export default function Marquee({ reverse = false, className }: { reverse?: boolean; className?: string }) {
  const words = useSettings().shop.marquee;
  const products = useProducts();
  if (!words.length) return null;
  const row = [...words, ...words];
  return (
    <div className={cx("overflow-hidden whitespace-nowrap py-4", className)} aria-hidden>
      <div className={cx("marquee-track inline-flex", reverse && "reverse")}>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {row.map((w, i) => (
              <span key={i} className="display flex items-center text-3xl md:text-5xl">
                <span className="px-6">{w}</span>
                <span className="inline-block h-3 w-3 rounded-full md:h-4 md:w-4" style={{ background: products.length ? products[i % products.length].bg : "#fff" }} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
