"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useSettings } from "@/components/providers/SiteData";

/** Black intro loader: metallic vertical wordmark + spaced percentage. */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const { brand, theme } = useSettings();
  const [done, setDone] = useState(!theme.loader);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("m3s-loaded") === "1";
    } catch {}
    if (!theme.loader || seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
      return;
    }
    window.__lenis?.stop();
    window.scrollTo(0, 0);
    const counter = { v: 0 };
    const render = () => {
      if (num.current) num.current.textContent = String(Math.round(counter.v)).split("").join(" ");
    };
    let finish: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      // phase 1: count to ~88% while assets build
      gsap.fromTo(".ld-mark", { opacity: 0, scale: 0.92, filter: "blur(10px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.1, ease: "power3.out" });
      gsap.to(counter, { v: 88, duration: 2.2, ease: "power1.out", delay: 0.2, onUpdate: render });
      // phase 2: once the 3D stage has rendered, finish
      finish = gsap
        .timeline({
          paused: true,
          onComplete: () => {
            try {
              sessionStorage.setItem("m3s-loaded", "1");
            } catch {}
            window.__lenis?.start();
            setDone(true);
          },
        })
        .to(counter, { v: 100, duration: 0.6, ease: "power2.out", onUpdate: render })
        .to(".ld-mark", { opacity: 0, scale: 1.08, filter: "blur(12px)", duration: 0.6, ease: "power2.in" }, "+=0.15")
        .to(".ld-num", { opacity: 0, duration: 0.3 }, "<")
        .to(root.current, { opacity: 0, duration: 0.7, ease: "power2.out" });
    }, root);
    const minTime = performance.now() + 2600;
    const go = () => setTimeout(() => finish?.play(), Math.max(0, minTime - performance.now()));
    const w = window as unknown as { __m3sStageReady?: boolean };
    if (w.__m3sStageReady) go();
    else window.addEventListener("m3s:stage-ready", go, { once: true });
    const fallback = setTimeout(go, 9000);
    return () => {
      window.removeEventListener("m3s:stage-ready", go);
      clearTimeout(fallback);
      ctx.revert();
      window.__lenis?.start();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[100] grid place-items-center bg-black text-white">
      <div className="ld-mark flex flex-col items-center">
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logoUrl} alt={brand.name} className="h-[30vh] w-auto" />
        ) : (
          <>
            <span className="metal-text display block rotate-180 text-[22vh] leading-none [writing-mode:vertical-rl]">{brand.name}</span>
            {brand.subline && <span className="metal-text display mt-2 text-[3.4vh] tracking-[0.2em]">{brand.subline}</span>}
          </>
        )}
      </div>
      <p className="ld-num absolute bottom-[5vh] font-mono text-sm tracking-widest">
        <span ref={num}>0</span> %
      </p>
    </div>
  );
}
