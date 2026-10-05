"use client";

import { useEffect, useRef, useState } from "react";
import { useProducts, useSettings, lines } from "@/components/providers/SiteData";
import { stage } from "./stage-state";

/**
 * Fixed layers BEHIND the 3D canvas: grey floor light, product-colour glow,
 * vivid colour field / custom colour / image, per-section background images,
 * spaced name letters and the giant slogan. Opacities come from `stage.pose`
 * every frame (no React re-renders).
 */
export default function Backdrop() {
  const products = useProducts();
  const settings = useSettings();
  const N = Math.max(1, products.length);
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [section, setSection] = useState("carousel");

  useEffect(() => {
    const sync = () => {
      setActive(((stage.active % N) + N) % N);
      setCycle(stage.cycleIndex % N);
      setSection(stage.section);
    };
    stage.listeners.add(sync);
    let raf = 0;
    const tick = () => {
      const el = root.current;
      if (el) {
        const P = stage.pose;
        el.style.setProperty("--l-neutral", String(P.neutral));
        el.style.setProperty("--l-glow", String(P.glow));
        el.style.setProperty("--l-vivid", String(P.vivid));
        el.style.setProperty("--l-letters", String(P.letters));
        el.style.setProperty("--l-arg", String(P.argText));
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      stage.listeners.delete(sync);
      cancelAnimationFrame(raf);
    };
  }, [N]);

  if (!products.length) return <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "var(--site-bg)" }} />;

  const p = products[active] ?? products[0];
  const v = products[cycle] ?? products[0];
  const arg = settings.argument;
  const letters = p.name.toUpperCase().replace(/\s+/g, "").split("");
  const half = Math.ceil(letters.length / 2);
  const sectionBg = settings.sections.find((s) => s.id === section)?.bgImageUrl;
  const productBg = (section === "profile" || section === "benefits") && p.bgImageUrl;

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: "var(--site-bg)" }} aria-hidden>
      {/* neutral grey floor light */}
      <div
        className="absolute inset-0"
        style={{
          opacity: "var(--l-neutral)",
          background:
            "radial-gradient(120% 70% at 18% 88%, rgba(125,125,125,0.95) 0%, rgba(70,70,70,0.75) 28%, rgba(20,20,20,0.6) 55%, transparent 78%), linear-gradient(170deg, transparent 30%, #3a3a3a 100%)",
        }}
      />

      {/* product colour glow rising from the bottom */}
      <div
        className="absolute inset-0 transition-[background] duration-1000"
        style={{
          opacity: "var(--l-glow)",
          background: `radial-gradient(90% 75% at 50% 82%, ${p.bg} 0%, color-mix(in oklab, ${p.bg} 55%, black) 30%, color-mix(in oklab, ${p.bg} 18%, black) 58%, #000 88%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ opacity: "var(--l-glow)", background: `linear-gradient(to top, color-mix(in oklab, ${p.bg} 35%, black), transparent)` }} />
      {productBg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.bgImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover mix-blend-screen" style={{ opacity: "calc(var(--l-glow) * 0.6)" }} />
      )}

      {/* argument background: product colours / custom colour / image */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{ opacity: "var(--l-vivid)", background: arg.mode === "color" ? arg.color : arg.mode === "image" ? "#000" : v.bg }}
      >
        {arg.mode === "image" && arg.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={arg.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <div className="blob absolute -left-[10%] top-[10%] h-[60vmax] w-[60vmax] rounded-full opacity-70 transition-colors duration-700" style={{ background: arg.mode === "color" ? "#fff" : v.ink2 }} />
            <div className="blob absolute -right-[10%] top-[20%] h-[55vmax] w-[55vmax] rounded-full opacity-60 transition-colors duration-700 [animation-delay:-6s]" style={{ background: arg.mode === "color" ? arg.color : v.bg }} />
            <div className="blob absolute bottom-[-20%] left-[30%] h-[50vmax] w-[50vmax] rounded-full bg-white/60 [animation-delay:-3s]" />
          </>
        )}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* admin-uploaded background for the current section */}
      {sectionBg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={sectionBg} src={sectionBg} alt="" className="swap-in absolute inset-0 h-full w-full object-cover opacity-60" />
      )}

      {/* giant slogan behind the tee */}
      <div className="absolute inset-0 grid place-items-center" style={{ opacity: "var(--l-arg)" }}>
        <p className="display text-center text-[17vw] leading-[0.85] text-white/45 mix-blend-soft-light md:text-[14vw]">
          {lines(arg.text).map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </p>
      </div>

      {/* spaced letters grid */}
      {settings.profile.showLetters && (
        <div className="absolute inset-x-[6%] bottom-[20%] top-[22%] hidden flex-col justify-between font-mono text-sm text-white/30 md:flex" style={{ opacity: "var(--l-letters)" }}>
          {[letters.slice(0, half), letters.slice(half)].map((row, r) => (
            <div key={r} className="flex justify-between">
              {row.map((l, i) => (
                <span key={i}>{l}</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
