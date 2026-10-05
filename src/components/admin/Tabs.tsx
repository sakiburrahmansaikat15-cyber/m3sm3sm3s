"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cx } from "@/lib/format";

export default function Tabs({ tabs, base }: { tabs: { id: string; label: string }[]; base: string }) {
  const current = useSearchParams().get("tab") ?? tabs[0].id;
  return (
    <div className="mb-6 flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`${base}?tab=${t.id}`}
          scroll={false}
          className={cx("rounded-md px-3 py-1.5 text-sm", current === t.id ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white")}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
