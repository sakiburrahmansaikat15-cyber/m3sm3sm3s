"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cx, taka } from "@/lib/format";
import { sound } from "@/lib/sound";
import { useCart } from "@/store/cart";
import { BenefitGlyph, DotChevron } from "@/components/ui/Icons";
import { lines, useProducts, useSettings } from "@/components/providers/SiteData";
import { stage } from "./stage-state";

/** Subscribe a component to stage.emit() */
function useStage<T>(pick: () => T) {
  const [v, setV] = useState(pick);
  useEffect(() => {
    const f = () => setV(pick);
    stage.listeners.add(f);
    return () => {
      stage.listeners.delete(f);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

function useActive() {
  const n = Math.max(1, useProducts().length);
  return useStage(() => ((stage.active % n) + n) % n);
}

const SECTION = "relative z-[2] min-h-[120svh]";

const Stack = ({ text }: { text: string }) => (
  <>
    {lines(text).map((w, i) => (
      <span key={i} className="block">
        {w}
      </span>
    ))}
  </>
);

/* ------------------------------------------------------------------ */
/* Carousel                                                            */
/* ------------------------------------------------------------------ */
export function CarouselSection() {
  const products = useProducts();
  const { carousel, brand } = useSettings();
  const N = products.length;
  const active = useActive();
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const p = products[active];

  const go = (d: number) => {
    stage.ringTarget += d;
    stage.active += d;
    sound?.click(d > 0 ? 1.1 : 0.9);
    stage.emit();
  };
  const goTo = (i: number) => go(((i - active + N + Math.floor(N / 2)) % N) - Math.floor(N / 2));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (window.scrollY > window.innerHeight * 0.6) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!p) return <section data-pose="carousel" data-section="carousel" className="relative z-[2] h-svh" />;

  return (
    <section
      id="collection"
      data-pose="carousel"
      data-section="carousel"
      className="relative z-[2] h-svh touch-pan-y select-none"
      onPointerDown={(e) => (drag.current = { x: e.clientX, moved: false })}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.moved || N < 2) return;
        if (Math.abs(e.clientX - d.x) > 60) {
          d.moved = true;
          go(e.clientX < d.x ? 1 : -1);
        }
      }}
      onPointerUp={() => (drag.current = null)}
    >
      <h1 className="sr-only">{brand.tagline}</h1>

      {carousel.showArrows && N > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous design" className="absolute left-[8%] top-1/2 z-10 grid h-14 w-14 -translate-y-1/2 place-items-center text-white/90 transition hover:scale-125 md:left-[38%]">
            <DotChevron dir="left" className="h-5 w-7" />
          </button>
          <button onClick={() => go(1)} aria-label="Next design" className="absolute right-[8%] top-1/2 z-10 grid h-14 w-14 -translate-y-1/2 place-items-center text-white/90 transition hover:scale-125 md:right-[38%]">
            <DotChevron dir="right" className="h-5 w-7" />
          </button>
        </>
      )}

      <div className="absolute bottom-[18%] left-4 hidden flex-col gap-4 text-white/70 md:left-16 md:flex" aria-hidden>
        {[0, 1, 2].map((i) => <DotChevron key={i} className="h-2.5 w-4" />)}
      </div>
      <div className="absolute bottom-[18%] right-4 hidden flex-col gap-4 text-white/70 md:right-16 md:flex" aria-hidden>
        {[0, 1, 2].map((i) => <DotChevron key={i} className="h-2.5 w-4" />)}
      </div>

      <div className="absolute inset-x-0 bottom-[3.2rem] flex flex-col items-center md:bottom-12">
        <Link href={`/product/${p.slug}`} key={p.slug} className="swap-in display mb-5 text-center text-[11vw] leading-[0.9] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)] md:text-[3.6vw]">
          <Stack text={p.name.replace(/ /g, "\n")} />
        </Link>

        {carousel.showSlider && N > 1 && (
          <div className="relative h-8 w-[70vw] max-w-[560px]">
            <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full" style={{ background: `linear-gradient(90deg, ${products.map((x) => x.bg).join(",")})` }} />
            {products.map((x, i) => (
              <button
                key={x.slug}
                onClick={() => goTo(i)}
                aria-label={x.name}
                className="absolute top-0 h-8 -translate-x-1/2"
                style={{ left: `${(i / (N - 1)) * 100}%`, width: `${100 / N}%` }}
              />
            ))}
            <span
              className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/30 transition-[left,background] duration-700 ease-out-expo"
              style={{ left: `${(active / (N - 1)) * 100}%`, background: p.bg, boxShadow: `0 0 18px ${p.bg}` }}
            />
          </div>
        )}
        {carousel.hint && <p className="mt-3 text-xs uppercase tracking-wide text-white/60">{carousel.hint}</p>}
      </div>

      {N > 1 && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 opacity-70"
          style={{
            background: `radial-gradient(50% 100% at 35% 100%, ${products[(active - 1 + N) % N].bg}66, transparent), radial-gradient(50% 100% at 65% 100%, ${products[(active + 1) % N].bg}66, transparent)`,
          }}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Right-hand benefit nav (fixed)                                      */
/* ------------------------------------------------------------------ */
export function IconNav() {
  const { benefits } = useSettings();
  const products = useProducts();
  const benefit = useStage(() => stage.benefit);
  const active = useActive();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) {
        const o = stage.pose.icons;
        ref.current.style.opacity = String(o);
        ref.current.style.pointerEvents = o > 0.5 ? "auto" : "none";
        ref.current.style.transform = `translate(${(1 - o) * 40}px, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  const color = products[active]?.bg ?? "#ffffff";
  if (!benefits.items.length) return null;

  return (
    <div ref={ref} className="fixed right-4 top-1/2 z-30 hidden flex-col items-center gap-3 opacity-0 md:right-24 md:flex">
      {benefits.items.map((b, i) => (
        <div key={i} className="flex flex-col items-center gap-3">
          <a
            href={`#benefit-${i}`}
            aria-label={lines(b.title).join(" ")}
            className={cx(
              "grid h-14 w-14 place-items-center rounded-full border backdrop-blur transition-all duration-500",
              i === benefit ? "border-white/70 text-white" : "border-white/20 text-white/60 hover:text-white",
            )}
            style={i === benefit ? { background: `radial-gradient(circle, ${color}cc, ${color}33)`, boxShadow: `0 0 24px ${color}88` } : { background: "rgba(255,255,255,0.05)" }}
          >
            <BenefitGlyph name={b.icon} url={b.iconUrl} className="h-6 w-6" />
          </a>
          {i < benefits.items.length - 1 && <span className="h-6 w-px bg-white/15" />}
        </div>
      ))}
    </div>
  );
}

function Bracket({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("relative px-4 py-3", className)}>
      <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-white/70" />
      <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-white/70" />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Profile (selected design)                                           */
/* ------------------------------------------------------------------ */
export function ProfileSection() {
  const products = useProducts();
  const { profile } = useSettings();
  const active = useActive();
  const p = products[active];
  const add = useCart((s) => s.add);
  if (!p) return null;
  const quickSize = p.sizes.find((s) => s === "M" && !p.soldOut.includes(s)) ?? p.sizes.find((s) => !p.soldOut.includes(s));
  return (
    <section data-pose="profile" data-section="profile" data-reveal className={cx(SECTION, "flex items-center")}>
      <div className="relative z-10 w-full px-6 md:w-[38%] md:pl-[10%]">
        <h2 className="rv display text-center text-5xl md:text-[3.6vw]">
          <Stack text={p.name.replace(/ /g, "\n")} />
        </h2>
        <Bracket className="rv mt-6 text-center text-base leading-relaxed text-white/90 md:text-lg">
          {profile.useTagline && p.tagline} {p.description}
        </Bracket>
        <div className="rv mt-6 flex flex-wrap justify-center gap-2">
          {profile.primaryCta && (
            <Link href={`/product/${p.slug}`} className="btn-glow rounded-md px-5 py-3 text-xs font-medium uppercase">
              {profile.primaryCta} · {taka(p.price)}
            </Link>
          )}
          {profile.secondaryCta && quickSize && (
            <button onClick={() => add(p.slug, quickSize)} className="rounded-md border border-white/40 px-5 py-3 text-xs font-medium uppercase transition hover:bg-white hover:text-black">
              {profile.secondaryCta}
            </button>
          )}
        </div>
      </div>
      <p className="display pointer-events-none absolute bottom-[12%] left-1/2 hidden -translate-x-1/2 text-center text-[3.4vw] leading-[0.9] drop-shadow-[0_6px_30px_rgba(0,0,0,0.5)] md:block">
        <Stack text={p.name.replace(/ /g, "\n")} />
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Benefits                                                            */
/* ------------------------------------------------------------------ */
export function BenefitSections() {
  const products = useProducts();
  const { benefits } = useSettings();
  const active = useActive();
  const color = products[active]?.bg ?? "#ffffff";
  return (
    <div id="benefits">
      {benefits.items.map((b, i) => (
        <section key={i} id={`benefit-${i}`} data-pose={`benefit${i}`} data-section="benefits" data-benefit={i} data-reveal className={cx(SECTION, "flex items-center")}>
          <div className="relative z-10 w-full px-6 md:w-[40%] md:pl-[10%]">
            {b.no && (
              <div className="rv flex items-center gap-1.5">
                <span className="grid h-6 w-6 place-items-center text-xs text-black" style={{ background: color }}>
                  ✕
                </span>
                <span className="bg-white px-2.5 py-0.5 text-sm uppercase text-black line-through decoration-black/80">{b.no}</span>
              </div>
            )}
            <h2 className="rv display mt-5 text-5xl md:text-[3.6vw]">
              <Stack text={b.title} />
            </h2>
            <p className="rv mt-4 max-w-md text-base leading-relaxed text-white/90 md:text-lg">{b.text}</p>
            {b.stat && (
              <p className="rv mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/60">
                <BenefitGlyph name={b.icon} url={b.iconUrl} className="h-4 w-4" /> {b.stat}
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Argument (slogan behind the tee)                                    */
/* ------------------------------------------------------------------ */
export function ArgumentSection() {
  const products = useProducts();
  const { argument } = useSettings();
  const n = Math.max(1, products.length);
  const idx = useStage(() => stage.cycleIndex % n);
  const p = products[idx];
  return (
    <section data-pose="argument" data-section="argument" className={SECTION}>
      {argument.showLabel && p && (
        <div className="absolute inset-x-0 bottom-[12vh] flex justify-center">
          <Link href={`/product/${p.slug}`} className="rounded-full bg-black/30 px-5 py-2 font-mono text-xs uppercase tracking-widest backdrop-blur hover:bg-black/60">
            {p.name} · {p.combo}
          </Link>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Full range                                                          */
/* ------------------------------------------------------------------ */
export function RangeSection() {
  const { range } = useSettings();
  const n = useProducts().length;
  return (
    <section data-pose="range" data-section="range" data-reveal className={SECTION}>
      <div className="absolute bottom-[14vh] left-6 md:left-[10%]">
        {range.kicker && (
          <p className="rv font-mono text-xs uppercase tracking-widest text-white/60">
            {range.kicker} · {String(n).padStart(2, "0")} designs
          </p>
        )}
        {range.ctaLabel && (
          <Link href={range.ctaHref || "/shop"} className="rv btn-glow mt-4 inline-flex rounded-md px-6 py-3 text-xs font-medium uppercase">
            {range.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

export { default as FAQSection } from "./FAQ";

/* ------------------------------------------------------------------ */
/* Last (tee alone)                                                    */
/* ------------------------------------------------------------------ */
export function LastSection() {
  return <section data-pose="last" data-section="last" className={SECTION} aria-hidden />;
}

/* ------------------------------------------------------------------ */
/* Join the crew + footer bar                                          */
/* ------------------------------------------------------------------ */
export function JoinSection() {
  const site = useSettings();
  const { join } = site;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setStatus("err");
    setStatus("busy");
    const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    if (!res?.ok) return setStatus("err");
    setStatus("ok");
    setEmail("");
    sound?.click(1.3);
  };
  const [left, right] = [site.socials[1] ?? site.socials[0], site.socials[0]];
  return (
    <section id="join" data-pose="join" data-section="join" data-reveal className={cx(SECTION, "flex min-h-svh flex-col items-center justify-between px-6 pb-8 pt-[22vh] md:min-h-[110svh]")}>
      <div className="w-full max-w-xl text-center">
        <h2 className="rv display text-5xl md:text-6xl">
          <Stack text={join.heading} />
        </h2>
        <p className="rv mt-4 text-base text-white/90 md:text-lg">{join.text}</p>
        <form onSubmit={submit} className="rv mt-8 space-y-6">
          <label htmlFor="join-email" className="sr-only">
            Email address
          </label>
          <input
            id="join-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus("idle");
            }}
            placeholder={join.placeholder}
            className="h-16 w-full rounded-md border border-white/25 bg-black/40 px-4 text-sm text-white outline-none backdrop-blur placeholder:text-white/50 focus:border-white/70"
          />
          <button disabled={status === "busy"} className="btn-glow h-14 w-full rounded-md text-sm font-medium uppercase disabled:opacity-60">
            {join.button}
          </button>
        </form>
        <p className="rv mt-5 min-h-5 text-sm" aria-live="polite">
          {status === "ok" ? join.success : status === "err" ? "That email doesn't look right." : join.note}
        </p>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-10">
        <p className="text-xs uppercase text-white/80">
          © {new Date().getFullYear()} {site.brand.copyright}
        </p>
        <div className="flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-lg bg-white/10 px-4 py-3 text-[11px] uppercase backdrop-blur-md md:px-5">
          {left ? (
            <a href={left.href} target="_blank" rel="noreferrer" className="rounded border border-white px-6 py-1 text-sm hover:bg-white hover:text-black">
              {left.label}
            </a>
          ) : (
            <span />
          )}
          <div className="order-last flex w-full justify-center gap-6 md:order-none md:w-auto md:gap-10">
            {site.legal.map((l) => (
              <a key={l.label} href={l.href} className="hover:text-white/60">
                {l.label}
              </a>
            ))}
          </div>
          {right && right !== left ? (
            <a href={right.href} target="_blank" rel="noreferrer" className="rounded border border-white px-3 py-1 text-sm hover:bg-white hover:text-black">
              {right.label}
            </a>
          ) : (
            <span />
          )}
        </div>
      </div>
    </section>
  );
}
