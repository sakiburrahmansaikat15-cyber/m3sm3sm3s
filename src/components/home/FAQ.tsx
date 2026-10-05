"use client";

import { useState } from "react";
import { cx } from "@/lib/format";
import { DotChevron } from "@/components/ui/Icons";
import { lines, useSettings } from "@/components/providers/SiteData";

export default function FAQ() {
  const { faq } = useSettings();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" data-pose="faq" data-section="faq" data-reveal className="relative z-[2] min-h-[120svh] px-6 pb-24 pt-32 md:px-[10%] md:pt-36">
      <h2 className="rv display text-[10vw] leading-[0.88] md:text-[9vw]">
        {lines(faq.heading).map((l, i) => (
          <span key={i} className="block">
            {l}
          </span>
        ))}
      </h2>
      <ul className="mx-auto mt-12 max-w-3xl border-t border-white/15 md:ml-[30%]">
        {faq.items.map((f, i) => {
          const isOpen = open === i;
          return (
            <li key={i} className="rv border-b border-white/15">
              <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-start justify-between gap-6 py-6 text-left">
                <span className="text-lg md:text-2xl">{f.q}</span>
                <DotChevron className="mt-2 h-3 w-5 shrink-0 transition-transform duration-500" dir={isOpen ? "up" : "down"} />
              </button>
              <div className={cx("grid transition-all duration-500 ease-out-expo", isOpen ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]")}>
                <p className="overflow-hidden whitespace-pre-line text-base text-white/70 md:text-lg">{f.a}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
