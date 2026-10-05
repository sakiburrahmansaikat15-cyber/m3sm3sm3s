"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useProductMap, useSettings } from "@/components/providers/SiteData";
import { cx, taka } from "@/lib/format";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import TeeFlat from "@/components/product/TeeFlat";

export default function CartDrawer() {
  const { lines, open, setOpen, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  const site = useSettings();
  const map = useProductMap();
  const pathname = usePathname();
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) window.__lenis?.stop();
    else window.__lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!mounted || pathname.startsWith("/admin")) return null;
  const subtotal = cartSubtotal(lines, map);
  const toFree = Math.max(0, site.shipping.freeOver - subtotal);
  const pct = Math.min(100, (subtotal / site.shipping.freeOver) * 100);

  return (
    <div className={cx("fixed inset-0 z-[60]", !open && "pointer-events-none")} inert={!open}>
      <div
        onClick={() => setOpen(false)}
        className={cx("absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500", open ? "opacity-100" : "opacity-0")}
      />
      <aside
        data-lenis-prevent
        className={cx(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-700 ease-out-expo md:right-3 md:top-3 md:h-[calc(100%-1.5rem)] md:rounded-3xl",
          open ? "translate-x-0" : "translate-x-[110%]",
        )}
        role="dialog"
        aria-label="Cart"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="display text-4xl">
            Your bag <span className="text-white/30">({cartCount(lines)})</span>
          </h2>
          <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-xl hover:bg-ink hover:text-paper" aria-label="Close cart">
            ×
          </button>
        </div>

        <div className="px-6 pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest">
            {toFree > 0 ? <>Add {taka(toFree)} more for free delivery</> : <>You unlocked free delivery 🎉</>}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="display text-6xl text-white/15">Empty</p>
                <p className="mt-3 text-sm text-white/60">Your bag is waiting for a fresh drop.</p>
                <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-ink mt-6">
                  Shop the drop
                </Link>
              </div>
            </div>
          )}
          <ul className="space-y-3">
            {lines.map((l) => {
              const p = map.get(l.slug);
              if (!p) return null;
              return (
                <li key={l.slug + l.size} className="flex gap-4 rounded-2xl bg-white/[0.06] p-3">
                  <Link href={`/product/${p.slug}`} onClick={() => setOpen(false)} className="h-24 w-24 shrink-0 rounded-xl" style={{ background: p.bg }}>
                    <TeeFlat product={p} />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="display text-2xl">{p.name}</p>
                        <p className="text-xs text-white/50">
                          {p.combo} · Size {l.size}
                        </p>
                      </div>
                      <p className="font-semibold">{taka(p.price * l.qty)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-white/15">
                        <button className="h-8 w-8" onClick={() => setQty(l.slug, l.size, l.qty - 1)} aria-label="Decrease">
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                        <button className="h-8 w-8" onClick={() => setQty(l.slug, l.size, l.qty + 1)} aria-label="Increase">
                          +
                        </button>
                      </div>
                      <button onClick={() => remove(l.slug, l.size)} className="text-xs uppercase tracking-widest text-white/50 underline-offset-4 hover:text-ink hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {lines.length > 0 && (
          <div className="border-t border-white/10 px-6 py-5">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-bold">{taka(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-white/50">Delivery calculated at checkout. Cash on delivery available.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/cart" onClick={() => setOpen(false)} className="btn btn-line">
                View bag
              </Link>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-ink">
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
