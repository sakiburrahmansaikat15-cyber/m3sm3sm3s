"use client";

import { useEffect, useRef } from "react";
import type { Product } from "@/lib/types";
import { drawFlatTee, loadArtFonts, loadArtImages } from "@/lib/tee-art";
import { cx } from "@/lib/format";
import { useSettings } from "@/components/providers/SiteData";

/** Crisp 2D render of a tee (front or back) — uses uploaded prints when set. */
export default function TeeFlat({ product, back = false, className }: { product: Product; back?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const brand = useSettings().brand.name;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let alive = true;
    const draw = async () => {
      const [fonts, imgs] = await Promise.all([loadArtFonts(brand), loadArtImages(product)]);
      if (!alive) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = c.getBoundingClientRect();
      c.width = Math.max(1, Math.round(r.width * dpr));
      c.height = Math.max(1, Math.round(r.height * dpr));
      drawFlatTee(c.getContext("2d")!, product, c.width, c.height, fonts, back, imgs);
    };
    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(c);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [product, back, brand]);

  return <canvas ref={ref} role="img" aria-label={`${product.name} tee ${back ? "back" : "front"}`} className={cx("block h-full w-full", className)} />;
}
