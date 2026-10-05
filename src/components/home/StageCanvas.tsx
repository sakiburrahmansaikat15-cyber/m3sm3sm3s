"use client";

import { useEffect, useRef } from "react";
import { loadArtFonts } from "@/lib/tee-art";
import { useProducts, useSettings } from "@/components/providers/SiteData";
import type { Stage } from "@/components/three/stage";

/** Fixed full-screen WebGL layer. three.js is loaded lazily. */
export default function StageCanvas() {
  const host = useRef<HTMLDivElement>(null);
  const products = useProducts();
  const { theme, brand, carousel } = useSettings();

  useEffect(() => {
    let s: Stage | null = null;
    let cancelled = false;
    (async () => {
      const [{ Stage }, fonts] = await Promise.all([import("@/components/three/stage"), loadArtFonts(brand.name)]);
      if (cancelled || !host.current) return;
      try {
        s = new Stage(host.current, products, fonts, {
          ringCount: theme.ringCount,
          defaultModelUrl: theme.defaultModelUrl,
          showPodiums: carousel.showPodiums,
        });
      } catch (e) {
        console.warn("[M3S] WebGL unavailable", e);
        window.dispatchEvent(new Event("m3s:stage-ready"));
      }
    })();
    return () => {
      cancelled = true;
      s?.dispose();
    };
  }, [products, theme.ringCount, theme.defaultModelUrl, carousel.showPodiums, brand.name]);

  return <div ref={host} className="pointer-events-none fixed inset-0 z-[1]" aria-hidden />;
}
