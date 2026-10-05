"use client";

import type { BenefitIcon } from "@/lib/types";
import { useSettings } from "@/components/providers/SiteData";

/** Original line icons for the benefit nav (24×24, stroke = currentColor) */
export function BenefitGlyph({ name, url, className }: { name: BenefitIcon; url?: string; className?: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={className} style={{ objectFit: "contain" }} />;
  }
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {name === "weight" && (
        <g {...common}>
          <path d="M9 7a3 3 0 1 1 6 0" />
          <path d="M6.5 9h11l1.8 10.2a1.5 1.5 0 0 1-1.5 1.8H6.2a1.5 1.5 0 0 1-1.5-1.8z" />
          <path d="M10 14.5h4M12 12.5v4" />
        </g>
      )}
      {name === "ink" && (
        <g {...common}>
          <path d="M12 3.5c3 4 5.5 7 5.5 10.2a5.5 5.5 0 0 1-11 0C6.5 10.5 9 7.5 12 3.5z" />
          <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
        </g>
      )}
      {name === "layers" && (
        <g {...common}>
          <path d="M12 4 3.5 8.5 12 13l8.5-4.5z" />
          <path d="m3.5 12.5 8.5 4.5 8.5-4.5" />
          <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
        </g>
      )}
      {name === "ruler" && (
        <g {...common}>
          <rect x="2.8" y="8.5" width="18.4" height="7" rx="1.2" transform="rotate(-35 12 12)" />
          <path d="m8.1 10.4 1.3 1.8M10.6 8.6l.8 1.1M13 6.9l1.3 1.8M15.5 5.1l.8 1.1" />
        </g>
      )}
    </svg>
  );
}

/** Dotted chevron used for arrows / accordions */
export function DotChevron({ dir = "down", className }: { dir?: "down" | "left" | "right" | "up"; className?: string }) {
  const rot = { down: 0, left: 90, up: 180, right: -90 }[dir];
  return (
    <svg viewBox="0 0 20 12" className={className} style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
      {[
        [2, 2],
        [6, 5],
        [10, 8.5],
        [14, 5],
        [18, 2],
        [10, 2.5],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 2 ? 1.5 : 1.1} fill="currentColor" opacity={i === 5 ? 0.35 : 1} />
      ))}
    </svg>
  );
}

export function DotsGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden>
      {[
        [2, 2],
        [10, 2],
        [2, 10],
        [10, 10],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.4} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Wordmark — uploaded logo if set, otherwise brand name + subline */
export function Logo({ className }: { className?: string }) {
  const { brand } = useSettings();
  if (brand.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={brand.logoUrl} alt={brand.name} className={`h-[2.4em] w-auto ${className ?? ""}`} />;
  }
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className ?? ""}`}>
      <span className="display text-[1.9em] tracking-[-0.04em]">{brand.name}</span>
      {brand.subline && <span className="mt-[0.12em] pl-[0.55em] font-mono text-[0.42em] tracking-[0.55em]">{brand.subline}</span>}
    </span>
  );
}
