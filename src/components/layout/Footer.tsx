"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Icons";
import { useProducts, useSettings } from "@/components/providers/SiteData";

/** Footer for inner pages (the homepage has its own footer bar in JoinSection). */
export default function Footer() {
  const site = useSettings();
  const products = useProducts();
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/admin")) return null;
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black text-white">
      <div className="grid gap-10 px-4 pb-8 pt-16 md:grid-cols-12 md:px-16">
        <div className="md:col-span-5">
          <Logo className="text-2xl" />
          <p className="mt-6 max-w-sm text-sm text-white/60">{site.brand.description}</p>
        </div>
        <div className="md:col-span-3">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-white/40">Collection</p>
          <ul className="space-y-2 text-sm">
            {products.map((p) => (
              <li key={p.slug}>
                <Link href={`/product/${p.slug}`} className="inline-flex items-center gap-2 hover:text-white/60">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.bg }} />
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-white/40">Help</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#faq" className="hover:text-white/60">FAQ</Link></li>
            <li><Link href="/shop" className="hover:text-white/60">Shop all</Link></li>
            <li><Link href="/cart" className="hover:text-white/60">Your bag</Link></li>
            <li><a href={`mailto:${site.brand.email}`} className="hover:text-white/60">{site.brand.email}</a></li>
            {site.brand.phone && <li className="text-white/60">{site.brand.phone}</li>}
          </ul>
        </div>
      </div>
      <div className="mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/10 px-4 py-3 text-[11px] uppercase md:mx-16">
        <span>© {new Date().getFullYear()} {site.brand.copyright}</span>
        <div className="flex gap-6">
          {site.legal.map((l) => (
            <a key={l.label} href={l.href} className="hover:text-white/60">{l.label}</a>
          ))}
        </div>
        <div className="flex gap-2">
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="rounded border border-white px-3 py-0.5 hover:bg-white hover:text-black">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
