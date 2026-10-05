"use client";

import Link from "next/link";
import type { Product } from "@/lib/products";
import { taka } from "@/lib/format";
import { useCart } from "@/store/cart";
import TeeFlat from "./TeeFlat";

export default function ProductCard({ product: p, index }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add);

  return (
    <article className="pc group relative">
      <div className="relative overflow-hidden rounded-2xl">
      <Link
        href={`/product/${p.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl"
        style={{ background: p.bg, color: p.fg }}
      >
        {/* big outline name */}
        <span className="display outline-text pointer-events-none absolute -left-2 top-4 whitespace-nowrap text-[7rem] opacity-30 transition-transform duration-700 ease-out-expo group-hover:-translate-x-10">
          {p.name}
        </span>

        {/* front / back flip on hover */}
        <div className="absolute inset-[8%] [perspective:1200px]">
          <div className="relative h-full w-full transition-transform duration-700 ease-out-expo [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
            <div className="absolute inset-0 [backface-visibility:hidden]">
              <TeeFlat product={p} />
            </div>
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <TeeFlat product={p} back />
            </div>
          </div>
        </div>

        <div className="absolute left-5 top-5 flex gap-2">
          {typeof index === "number" && (
            <span className="rounded-full bg-paper/90 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          {p.badge && <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-paper">{p.badge}</span>}
        </div>

      </Link>
        {/* quick add sizes */}
        <div className="absolute inset-x-4 bottom-4 translate-y-[130%] rounded-2xl bg-paper/95 p-3 text-ink backdrop-blur transition-transform duration-500 ease-out-expo group-hover:translate-y-0 max-md:translate-y-0">
          <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-white/50">Quick add</p>
          <div className="flex justify-center gap-1.5">
            {p.sizes.map((s) => {
              const out = p.soldOut?.includes(s);
              return (
                <button
                  key={s}
                  disabled={out}
                  onClick={() => add(p.slug, s)}
                  className="h-9 min-w-9 rounded-full border border-white/15 px-2 text-xs font-bold transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:line-through disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4 px-1">
        <div>
          <h3 className="display text-3xl">
            <Link href={`/product/${p.slug}`}>{p.name}</Link>
          </h3>
          <p className="text-xs uppercase tracking-widest text-white/50">{p.combo}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{taka(p.price)}</p>
          {p.compareAt && <p className="text-xs text-white/40 line-through">{taka(p.compareAt)}</p>}
        </div>
      </div>
    </article>
  );
}
