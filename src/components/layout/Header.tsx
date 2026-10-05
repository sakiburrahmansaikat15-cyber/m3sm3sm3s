"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { useProducts, useSettings } from "@/components/providers/SiteData";
import { cartCount, useCart } from "@/store/cart";
import { cx } from "@/lib/format";
import { sound } from "@/lib/sound";
import { DotsGlyph, Logo } from "@/components/ui/Icons";

/**
 * HUD: glowing scroll-progress line, sound toggle, centred wordmark,
 * MENU + white glowing SHOP/CART button, and a thin corner-bracket frame.
 */
export default function Header() {
  const site = useSettings();
  const products = useProducts();
  const [menu, setMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const count = cartCount(lines);
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => sound?.subscribe(setSoundOn), []);

  // progress line
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (bar.current) bar.current.style.width = `${Math.max(0.02, p) * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  // menu overlay timeline
  useEffect(() => {
    const el = overlay.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      tl.current = gsap
        .timeline({ paused: true })
        .fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2.out" })
        .fromTo(".menu-link", { yPercent: 110, skewX: -8 }, { yPercent: 0, skewX: 0, stagger: 0.06, duration: 0.8, ease: "expo.out" }, "-=0.15")
        .fromTo(".menu-meta", { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.5 }, "-=0.6");
    }, el);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!tl.current) return;
    if (menu) {
      window.__lenis?.stop();
      tl.current.timeScale(1).play();
    } else {
      window.__lenis?.start();
      tl.current.timeScale(1.8).reverse();
    }
  }, [menu]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* corner frame + edge ticks */}
      <div className="hud-frame pointer-events-none fixed inset-0 z-40" aria-hidden>
        <span className="hud-corner left-4 top-[7.2rem] border-l border-t md:left-16" />
        <span className="hud-corner right-4 top-[7.2rem] border-r border-t md:right-16" />
        <span className="hud-corner bottom-4 left-4 border-b border-l md:bottom-11 md:left-16" />
        <span className="hud-corner bottom-4 right-4 border-b border-r md:bottom-11 md:right-16" />
        <div className="absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col gap-20 font-mono text-[10px] text-white/60 md:left-16 md:flex">
          <span>M</span>
          <span>S</span>
          <span>–</span>
        </div>
        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-[16rem] font-mono text-[10px] text-white/40 md:right-16 md:flex">
          <span>–</span>
          <span>–</span>
        </div>
      </div>

      <header className="fixed inset-x-0 top-0 z-50 text-white">
        {/* progress line */}
        <div className="relative mx-4 mt-3 h-px bg-white/15 md:mx-16 md:mt-6">
          <span className="absolute -left-1 -top-[1px] h-[3px] w-[3px] rounded-full bg-white/60" />
          <span className="absolute -right-1 -top-[1px] h-[3px] w-[3px] rounded-full bg-white/60" />
          <div ref={bar} className="progress-glow absolute left-0 top-0 h-px" style={{ width: "2%" }} />
        </div>

        <div className="relative flex items-center justify-between px-4 pt-4 md:px-16 md:pt-5">
          {site.theme.sound ? (
          <button
            onClick={() => sound?.toggle()}
            className="flex items-center gap-3 text-xs font-medium tracking-wide"
            aria-pressed={soundOn}
            aria-label="Toggle sound"
          >
            {soundOn ? "ON" : "OFF"}
            <span className={cx("sound-bars flex h-3 items-center gap-[2px]", soundOn && "is-on")}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="block w-[2px] rounded-full bg-white" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </span>
          </button>
          ) : (
            <span />
          )}

          <Link href="/" aria-label={`${site.brand.name} home`} className="absolute left-1/2 -translate-x-1/2 text-[17px] md:text-[20px]">
            <Logo />
          </Link>

          <div className="flex items-center gap-4 md:gap-8">
            <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} className="flex items-center gap-2.5 text-xs font-medium tracking-wide">
              <DotsGlyph className={cx("h-2.5 w-2.5 transition-transform duration-500", menu && "rotate-45")} />
              <span className="hidden sm:inline">{menu ? "CLOSE" : "MENU"}</span>
            </button>
            <button onClick={() => setOpen(true)} className="btn-glow flex h-10 items-center gap-2 rounded-md px-3 text-xs font-medium md:h-11 md:px-5" aria-label="Open cart">
              <span className="hidden sm:inline">CART</span>
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black px-1.5 text-[10px] text-white">{mounted ? count : 0}</span>
            </button>
          </div>
        </div>
      </header>

      {/* full-screen menu */}
      <div ref={overlay} inert={!menu} className="invisible fixed inset-0 z-[45] bg-black/85 text-white opacity-0 backdrop-blur-xl">
        <div className="flex h-full flex-col justify-between px-4 pb-10 pt-32 md:px-16 md:pt-40">
          <nav className="flex flex-col">
            {site.nav.map((item, i) => (
              <div key={item.href} className="overflow-hidden border-b border-white/10">
                <Link href={item.href} onClick={() => setMenu(false)} className="menu-link group flex items-baseline gap-4 py-2 md:gap-8">
                  <span className="font-mono text-xs text-white/40">0{i + 1}</span>
                  <span className="display inline-block text-[9vw] transition-all duration-500 group-hover:translate-x-3 group-hover:text-white/60 md:text-[5.5vw]">
                    {item.label}
                  </span>
                </Link>
              </div>
            ))}
          </nav>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 text-xs uppercase tracking-widest">
            <div className="menu-meta flex gap-2">
              {products.map((p) => (
                <Link key={p.slug} href={`/product/${p.slug}`} title={p.name} className="h-5 w-5 rounded-full ring-1 ring-white/20 transition-transform hover:scale-125" style={{ background: p.bg }} />
              ))}
            </div>
            <div className="menu-meta flex gap-3">
              {site.socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="rounded border border-white px-4 py-1.5 hover:bg-white hover:text-black">
                  {s.label}
                </a>
              ))}
            </div>
            <a className="menu-meta hover:text-white/60" href={`mailto:${site.brand.email}`}>
              {site.brand.email}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
