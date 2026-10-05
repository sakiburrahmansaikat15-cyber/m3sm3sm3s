"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { taka, cx } from "@/lib/format";
import TeeFlat from "@/components/product/TeeFlat";
import { deleteProductAction, duplicateProductAction, reorderProductsAction, toggleProductAction } from "@/app/admin/actions";

export default function ProductTable({ products }: { products: Product[] }) {
  const [list, setList] = useState(products);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [err, setErr] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) setErr(r.error ?? "Failed");
      router.refresh();
    });

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
    run(() => reorderProductsAction(next.map((p) => p.id)));
  };

  if (!list.length)
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/60">
        No products yet. <Link href="/admin/products/new" className="underline">Add the first one</Link>.
      </div>
    );

  return (
    <div className={cx("overflow-hidden rounded-2xl border border-white/10", pending && "opacity-70")}>
      {err && <p className="bg-red-500/15 px-4 py-2 text-sm text-red-300">{err}</p>}
      {list.map((p, i) => (
        <div key={p.id} className="flex items-center gap-4 border-b border-white/5 px-4 py-3 last:border-0">
          <div className="flex flex-col text-white/40">
            <button onClick={() => move(i, -1)} className="hover:text-white" aria-label="Move up">▲</button>
            <button onClick={() => move(i, 1)} className="hover:text-white" aria-label="Move down">▼</button>
          </div>
          <Link href={`/admin/products/${p.id}`} className="h-16 w-16 shrink-0 rounded-xl p-1" style={{ background: p.bg }}>
            <TeeFlat product={p} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">
              {p.name}
            </Link>
            <p className="truncate text-xs text-white/50">
              /{p.slug} · {p.category} · {p.modelUrl ? "GLB model" : p.printUrl ? "uploaded print" : `motif: ${p.print.motif}`}
            </p>
          </div>
          <p className="hidden w-24 text-right tabular-nums sm:block">{taka(p.price)}</p>
          <button
            onClick={() => {
              setList(list.map((x) => (x.id === p.id ? { ...x, published: !x.published } : x)));
              run(() => toggleProductAction(p.id, !p.published));
            }}
            className={cx("rounded-md px-2.5 py-1 text-xs font-semibold", p.published ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/50")}
          >
            {p.published ? "Live" : "Hidden"}
          </button>
          <div className="flex gap-1 text-xs">
            <Link href={`/admin/products/${p.id}`} className="rounded-md border border-white/15 px-2.5 py-1">Edit</Link>
            <button onClick={() => run(() => duplicateProductAction(p.id))} className="hidden rounded-md border border-white/15 px-2.5 py-1 sm:block">Copy</button>
            <button
              onClick={() => {
                if (!confirm(`Delete "${p.name}"?`)) return;
                setList(list.filter((x) => x.id !== p.id));
                run(() => deleteProductAction(p.id));
              }}
              className="rounded-md border border-red-400/30 px-2.5 py-1 text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
