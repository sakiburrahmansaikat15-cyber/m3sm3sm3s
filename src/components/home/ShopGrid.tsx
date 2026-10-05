"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "@/lib/products";
import ProductCard from "@/components/product/ProductCard";

gsap.registerPlugin(ScrollTrigger);

export default function ShopGrid({
  items,
  title = "Pick your drop",
  kicker = "The collection",
  showAll = true,
}: {
  items: Product[];
  title?: string;
  kicker?: string;
  showAll?: boolean;
}) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".pc").forEach((el, i) => {
        gsap.from(el, {
          y: 100,
          opacity: 0,
          rotate: i % 2 ? 2 : -2,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [items]);

  return (
    <section id="shop" ref={root} className="bg-paper px-4 pb-24 md:px-16 md:pb-36">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-t border-white/10 pt-10">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-white/50">{kicker}</p>
          <h2 className="display text-[10vw] md:text-[4.5vw]">{title}</h2>
        </div>
        {showAll && (
          <Link href="/shop" className="btn btn-line">
            View all tees →
          </Link>
        )}
      </div>
      <div className="grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <ProductCard key={p.slug} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
