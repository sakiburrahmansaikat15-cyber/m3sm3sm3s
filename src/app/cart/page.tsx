"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProductMap, useSettings } from "@/components/providers/SiteData";
import { taka } from "@/lib/format";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import TeeFlat from "@/components/product/TeeFlat";

export default function CartPage() {
  const { lines, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  const site = useSettings();
  const map = useProductMap();
  useEffect(() => setMounted(true), []);

  const subtotal = cartSubtotal(lines, map);
  const free = subtotal >= site.shipping.freeOver;

  return (
    <section className="min-h-svh bg-paper px-4 pb-24 pt-36 md:px-16 md:pt-44">
      <h1 className="display text-[12vw] md:text-[6vw]">
        Your bag <span className="outline-text-ink">({mounted ? cartCount(lines) : 0})</span>
      </h1>

      {mounted && lines.length === 0 && (
        <div className="mt-10 rounded-2xl bg-white/[0.06] p-10 text-center">
          <p className="display text-6xl text-white/20">Nothing here yet</p>
          <Link href="/shop" className="btn btn-ink mt-6">
            Shop the drop →
          </Link>
        </div>
      )}

      {mounted && lines.length > 0 && (
        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <ul className="space-y-3 lg:col-span-8">
            {lines.map((l) => {
              const p = map.get(l.slug);
              if (!p) return null;
              return (
                <li key={l.slug + l.size} className="flex flex-col gap-4 rounded-2xl bg-white/[0.06] p-4 sm:flex-row sm:items-center">
                  <Link href={`/product/${p.slug}`} className="aspect-square w-full shrink-0 rounded-3xl p-3 sm:w-40" style={{ background: p.bg }}>
                    <TeeFlat product={p} />
                  </Link>
                  <div className="flex-1">
                    <p className="display text-4xl">{p.name}</p>
                    <p className="text-xs uppercase tracking-widest text-white/50">
                      {p.combo} · Size {l.size} · {taka(p.price)} each
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex h-11 items-center rounded-full border border-white/15">
                        <button className="h-full w-10" onClick={() => setQty(l.slug, l.size, l.qty - 1)} aria-label="Decrease">−</button>
                        <span className="w-6 text-center font-bold">{l.qty}</span>
                        <button className="h-full w-10" onClick={() => setQty(l.slug, l.size, l.qty + 1)} aria-label="Increase">+</button>
                      </div>
                      <button onClick={() => remove(l.slug, l.size)} className="text-xs uppercase tracking-widest text-white/50 hover:text-ink">
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="display text-4xl">{taka(p.price * l.qty)}</p>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.05] p-6 lg:sticky lg:top-28 lg:col-span-4 md:p-8">
            <p className="display text-4xl">Summary</p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="font-bold">{taka(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd className="font-bold">{free ? "Free" : `from ${taka(site.shipping.insideDhaka)}`}</dd>
              </div>
            </dl>
            {!free && (
              <p className="mt-4 rounded-2xl bg-white/10 p-3 text-xs">
                Add {taka(site.shipping.freeOver - subtotal)} more for free delivery.
              </p>
            )}
            <div className="mt-6 flex justify-between border-t border-white/15 pt-6">
              <span className="text-sm uppercase tracking-widest">Total</span>
              <span className="display text-5xl">{taka(subtotal)}</span>
            </div>
            <Link href="/checkout" className="btn btn-ink mt-6 w-full">
              Checkout →
            </Link>
            <Link href="/shop" className="mt-3 block text-center text-xs uppercase tracking-widest text-white/60 hover:text-white">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
