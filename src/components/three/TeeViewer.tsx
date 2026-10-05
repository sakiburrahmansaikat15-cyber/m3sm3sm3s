"use client";

import { useEffect, useRef } from "react";
import type { Product } from "@/lib/types";
import { useSettings } from "@/components/providers/SiteData";
import { loadArtFonts } from "@/lib/tee-art";
import { cx } from "@/lib/format";
import type { TeeScene } from "./tee-scene";

/** Drag-to-rotate 3D tee for the product page. three.js loads lazily. */
export default function TeeViewer({ product, side, className }: { product: Product; side: "front" | "back"; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<TeeScene | null>(null);
  const settings = useSettings();
  const defaultModel = settings.theme.defaultModelUrl;
  const brand = settings.brand.name;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ TeeScene }, fonts] = await Promise.all([import("./tee-scene"), loadArtFonts(brand)]);
      if (cancelled || !host.current) return;
      try {
        scene.current = new TeeScene(host.current, product, fonts, defaultModel);
      } catch (e) {
        console.warn("[M3S] WebGL unavailable", e);
      }
    })();
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [product, defaultModel, brand]);

  useEffect(() => {
    scene.current?.showSide(side);
  }, [side]);

  return <div ref={host} className={cx("h-full w-full", className)} />;
}
