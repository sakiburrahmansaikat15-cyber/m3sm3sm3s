"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { Product, Size } from "@/lib/types";
import { useProducts, useSettings } from "@/components/providers/SiteData";
import { cx, taka } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useRouter } from "next/navigation";
import TeeViewer from "@/components/three/TeeViewer";
import TeeFlat from "./TeeFlat";

const sizeGuide: Record<Size, [number, number]> = {
  S: [38, 27],
  M: [40, 28],
  L: [42, 29],
  XL: [44, 30],
  XXL: [46, 31],
};

type View = "front" | "back" | "flat";

export default function ProductView({ product: p }: { product: Product }) {
  const slug = p.slug;
  const site = useSettings();
  const products = useProducts();
    const [view, setView] = useState<View>("front");
  const [size, setSize] = useState<Size | null>(null);
  const [qty, setQty] = useState(1);
  const [warn, setWarn] = useState(false);
  const [openTab, setOpenTab] = useState<string | null>("Details");
  const add = useCart((s) => s.add);
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const idx = Math.max(0, products.findIndex((x) => x.slug === p.slug));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".pv-in", { y: 40, opacity: 0, stagger: 0.06, duration: 0.9, ease: "expo.out", delay: 0.1 });
      gsap.from(".pv-name", { yPercent: 100, duration: 1, ease: "expo.out" });
    }, root);
    return () => ctx.revert();
  }, [slug]);

  const addToBag = (buyNow = false) => {
    if (!size) {
      setWarn(true);
      return;
    }
    add(p.slug, size, qty);
    if (buyNow) {
      useCart.getState().setOpen(false);
      router.push("/checkout");
    }
  };

  const tabs = [
    {
      t: "Details",
      body: (
        <ul className="space-y-1">
          <li>• {p.gsm} GSM 100% combed cotton, pre-shrunk</li>
          <li>• {p.fit}</li>
          <li>• Reinforced 1×1 rib neck, double-needle hems</li>
          <li>• {site.brand.name} · Drop {String(idx + 1).padStart(2, "0")}</li>
        </ul>
      ),
    },
    {
      t: "Size guide",
      body: (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-white/50">
              <th className="py-2">Size</th>
              <th>Chest (in)</th>
              <th>Length (in)</th>
            </tr>
          </thead>
          <tbody>
            {p.sizes.map((s) => (
              <tr key={s} className="border-b border-white/5">
                <td className="py-2 font-bold">{s}</td>
                <td>{sizeGuide[s][0]}</td>
                <td>{sizeGuide[s][1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      t: "Delivery & returns",
      body: (
        <p>
          {site.shipping.insideLabel} {taka(site.shipping.insideDhaka)} ({site.shipping.insideEta}) · {site.shipping.outsideLabel}{" "}
          {taka(site.shipping.outsideDhaka)} ({site.shipping.outsideEta}). Free delivery over {taka(site.shipping.freeOver)}.{" "}
          {site.payments.filter((x) => x.enabled).map((x) => x.label).join(" · ")}.
        </p>
      ),
    },
    { t: "Care", body: <p>Wash inside-out, cold water. Do not bleach. Hang dry. Iron on reverse, never on the print.</p> },
  ];

  return (
    <section ref={root} className="bg-black px-4 pt-28 md:px-16 md:pt-32">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* ---------- visual ---------- */}
        <div className="lg:col-span-7">
          <div
            className="relative h-[72svh] overflow-hidden rounded-2xl border border-white/10 lg:sticky lg:top-28 lg:h-[calc(100svh-8rem)]"
            style={{ background: `radial-gradient(90% 75% at 50% 85%, ${p.bg} 0%, color-mix(in oklab, ${p.bg} 40%, black) 35%, #000 85%)` }}
          >
            {p.bgImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.bgImageUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70" />
            )}
            <p className="display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-center text-[16vw] text-white/10 lg:text-[8vw]">
              {p.name}
            </p>
            <div className="absolute inset-0">
              {view !== "flat" ? (
                <TeeViewer product={p} side={view} />
              ) : (
                <div className="h-full w-full p-10">
                  <TeeFlat product={p} />
                </div>
              )}
            </div>

            <div className="absolute left-4 top-4 flex gap-2">
              {p.badge && <span className="rounded-full bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-paper">{p.badge}</span>}
              <span className="rounded-full bg-paper/90 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
                Drop {String(idx + 1).padStart(2, "0")}
              </span>
            </div>

            {view !== "flat" && (
              <p className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">
                ← Drag to rotate →
              </p>
            )}

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-paper/90 p-1 text-ink backdrop-blur">
              {(["front", "back", "flat"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cx("whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors", view === v ? "bg-ink text-paper" : "hover:bg-white/10")}
                >
                  {v === "flat" ? "2D" : `3D ${v}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- info ---------- */}
        <div className="px-1 pb-10 lg:col-span-5 lg:py-6 lg:pr-4">
          <nav className="pv-in mb-6 text-xs uppercase tracking-widest text-white/50">
            <Link href="/" className="hover:text-ink">Home</Link> / <Link href="/shop" className="hover:text-ink">Shop</Link> / <span className="text-ink">{p.name}</span>
          </nav>

          <div className="overflow-hidden">
            <h1 className="pv-name display text-5xl md:text-6xl">{p.name}</h1>
          </div>
          <p className="pv-in mt-2 text-sm font-semibold uppercase tracking-widest text-white/60">{p.combo}</p>

          <div className="pv-in mt-6 flex items-baseline gap-3">
            <span className="display text-4xl">{taka(p.price)}</span>
            {p.compareAt && (
              <>
                <span className="text-lg text-white/40 line-through">{taka(p.compareAt)}</span>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold">−{Math.round((1 - p.price / p.compareAt) * 100)}%</span>
              </>
            )}
          </div>

          <p className="pv-in mt-6 text-xl font-semibold">{p.tagline}</p>
          <p className="pv-in mt-2 text-white/70">{p.description}</p>

          {/* sizes */}
          <div className="pv-in mt-8">
            <div className="mb-3 flex items-center justify-between">
              <p className={cx("text-xs font-bold uppercase tracking-widest", warn && !size && "text-red-400")}>
                {warn && !size ? "Please pick a size" : `Size${size ? ` · ${size}` : ""}`}
              </p>
              <button onClick={() => setOpenTab("Size guide")} className="text-xs uppercase tracking-widest underline underline-offset-4">
                Size guide
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {p.sizes.map((s) => {
                const out = p.soldOut?.includes(s);
                return (
                  <button
                    key={s}
                    disabled={out}
                    onClick={() => {
                      setSize(s);
                      setWarn(false);
                    }}
                    className={cx(
                      "h-14 rounded-2xl border-2 text-sm font-bold transition-all",
                      size === s ? "border-ink bg-ink text-paper" : "border-white/15 hover:border-ink",
                      out && "cursor-not-allowed line-through opacity-30 hover:border-white/15",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* qty + actions */}
          <div className="pv-in mt-4 flex gap-2">
            <div className="flex h-14 items-center rounded-full border-2 border-white/15">
              <button className="h-full w-12 text-xl" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                −
              </button>
              <span className="w-6 text-center font-bold">{qty}</span>
              <button className="h-full w-12 text-xl" onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Increase quantity">
                +
              </button>
            </div>
            <button onClick={() => addToBag()} className="btn btn-ink h-14 flex-1">
              Add to bag · {taka(p.price * qty)}
            </button>
          </div>
          <button onClick={() => addToBag(true)} className="pv-in btn mt-2 h-14 w-full" style={{ background: p.bg, color: p.fg }}>
            Buy it now
          </button>

          <ul className="pv-in mt-6 grid grid-cols-3 gap-2 text-center text-[11px] font-bold uppercase tracking-wider">
            {[`${p.gsm} GSM`, "Cash on delivery", "7-day exchange"].map((b) => (
              <li key={b} className="rounded-2xl bg-white/[0.06] px-2 py-3">
                {b}
              </li>
            ))}
          </ul>

          {/* accordions */}
          <div className="pv-in mt-8 border-t border-white/15">
            {tabs.map(({ t, body }) => {
              const isOpen = openTab === t;
              return (
                <div key={t} className="border-b border-white/15">
                  <button onClick={() => setOpenTab(isOpen ? null : t)} className="flex w-full items-center justify-between py-4 text-left text-sm font-bold uppercase tracking-widest" aria-expanded={isOpen}>
                    {t}
                    <span className={cx("text-xl transition-transform duration-300", isOpen ? "rotate-45" : "")}>+</span>
                  </button>
                  <div className={cx("grid text-sm text-white/70 transition-all duration-500", isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">{body}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {p.gallery.length > 0 && (
            <div className="pv-in mt-8 grid grid-cols-2 gap-2">
              {p.gallery.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={p.name} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
              ))}
            </div>
          )}

          {/* other colourways */}
          <div className="pv-in mt-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest">Other drops</p>
            <div className="flex flex-wrap gap-2">
              {products.map((o) => (
                <Link
                  key={o.slug}
                  href={`/product/${o.slug}`}
                  title={o.name}
                  className={cx("h-16 w-16 rounded-2xl p-1.5 transition-transform hover:-translate-y-1", o.slug === p.slug && "ring-2 ring-ink ring-offset-2 ring-offset-black")}
                  style={{ background: o.bg }}
                >
                  <TeeFlat product={o} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
