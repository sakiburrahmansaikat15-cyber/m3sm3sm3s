"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */
export const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-white/50 focus:bg-white/[0.07] placeholder:text-white/30";

export function Label({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-white/40">{help}</span>}
    </label>
  );
}

export function TextField({ label, help, value, onChange, placeholder, type = "text" }: { label: string; help?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <Label label={label} help={help}>
      <input type={type} className={inputCls} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Label>
  );
}

export function TextArea({ label, help, value, onChange, rows = 3 }: { label: string; help?: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <Label label={label} help={help}>
      <textarea className={cx(inputCls, "resize-y")} rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </Label>
  );
}

export function NumberField({ label, help, value, onChange, step = 1, min, max }: { label: string; help?: string; value: number | null; onChange: (v: number | null) => void; step?: number; min?: number; max?: number }) {
  return (
    <Label label={label} help={help}>
      <input
        type="number"
        className={inputCls}
        value={value ?? ""}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </Label>
  );
}

export function RangeField({ label, value, onChange, min, max, step, fallback }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; fallback?: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/60">
        <span>{label}</span>
        <span className="flex items-center gap-2 font-mono normal-case text-white/80">
          <input type="number" step={step} value={Number(value.toFixed(3))} onChange={(e) => onChange(Number(e.target.value))} className="w-20 rounded bg-white/5 px-1.5 py-0.5 text-right" />
          {fallback !== undefined && fallback !== value && (
            <button type="button" onClick={() => onChange(fallback)} className="text-white/40 hover:text-white" title="Reset">
              ↺
            </button>
          )}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-white" />
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Label label={label}>
      <span className="flex items-center gap-2">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent" />
        <input className={cx(inputCls, "font-mono")} value={value} onChange={(e) => onChange(e.target.value)} />
      </span>
    </Label>
  );
}

export function Toggle({ label, help, value, onChange }: { label: string; help?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div>
        <p className="text-sm">{label}</p>
        {help && <p className="text-xs text-white/40">{help}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cx("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition", value ? "bg-emerald-500" : "bg-white/15")}
      >
        <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", value ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}

export function SelectField({ label, help, value, onChange, options }: { label: string; help?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <Label label={label} help={help}>
      <select className={cx(inputCls, "bg-black")} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Label>
  );
}

export function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <Label label={label}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
              className={cx("rounded-md border px-3 py-1.5 text-xs font-semibold", on ? "border-white bg-white text-black" : "border-white/15 text-white/70 hover:border-white/40")}
            >
              {o}
            </button>
          );
        })}
      </div>
    </Label>
  );
}

/* ------------------------------------------------------------------ */
/* uploads                                                             */
/* ------------------------------------------------------------------ */
export type MediaKind = "model" | "svg" | "image";
const ACCEPT: Record<MediaKind, string> = {
  model: ".glb",
  svg: ".svg,.png,.webp",
  image: ".png,.jpg,.jpeg,.webp,.avif,.svg",
};

type MediaRow = { id: number; url: string; filename: string; kind: string; size: number };

export async function uploadFile(file: File): Promise<{ url: string } | { error: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({ error: `Upload failed (${res.status})` }));
  return res.ok ? data : { error: data.error ?? "Upload failed" };
}

export function MediaField({ label, help, kind, value, onChange }: { label: string; help?: string; kind: MediaKind; value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [picker, setPicker] = useState(false);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr("");
    const r = await uploadFile(f);
    setBusy(false);
    if ("error" in r) setErr(r.error);
    else onChange(r.url);
    if (input.current) input.current.value = "";
  };

  return (
    <Label label={label} help={help}>
      <div
        className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files[0]);
        }}
      >
        <div className="flex items-center gap-3">
          <Preview kind={kind} url={value} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-white/70">{value || "No file"}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => input.current?.click()} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-black">
                {busy ? "Uploading…" : "Upload"}
              </button>
              <button type="button" onClick={() => setPicker(true)} className="rounded-md border border-white/15 px-2.5 py-1 text-xs">
                Library
              </button>
              {value && (
                <button type="button" onClick={() => onChange("")} className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-red-300">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <input ref={input} type="file" accept={ACCEPT[kind]} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
      </div>
      {picker && (
        <MediaPicker
          kind={kind}
          onClose={() => setPicker(false)}
          onPick={(u) => {
            onChange(u);
            setPicker(false);
          }}
        />
      )}
    </Label>
  );
}

export function Preview({ kind, url, className }: { kind: MediaKind | string; url: string; className?: string }) {
  const box = cx("grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-[repeating-conic-gradient(#222_0_25%,#333_0_50%)] bg-[length:12px_12px]", className);
  if (!url) return <div className={box} />;
  if (kind === "model" || url.endsWith(".glb"))
    return (
      <div className={cx(box, "bg-none bg-white/10 text-[10px] font-bold")}>
        GLB
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={cx(box, "object-contain")} />;
}

export function MediaPicker({ kind, onPick, onClose }: { kind?: MediaKind; onPick: (url: string) => void; onClose: () => void }) {
  const [rows, setRows] = useState<MediaRow[] | null>(null);
  useEffect(() => {
    fetch(`/api/admin/media${kind ? `?kind=${kind === "image" ? "" : kind}` : ""}`)
      .then((r) => r.json())
      .then((d: MediaRow[]) => setRows(kind === "image" ? d.filter((x) => x.kind !== "model") : d));
  }, [kind]);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-2xl border border-white/10 bg-neutral-950 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold">Media library</p>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>
        {!rows && <p className="text-sm text-white/50">Loading…</p>}
        {rows?.length === 0 && <p className="text-sm text-white/50">Nothing uploaded yet.</p>}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {rows?.map((m) => (
            <button key={m.id} type="button" onClick={() => onPick(m.url)} className="group text-left">
              <Preview kind={m.kind} url={m.url} className="h-24 w-full group-hover:ring-2 group-hover:ring-white" />
              <p className="mt-1 truncate text-[10px] text-white/60">{m.filename}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* lists                                                               */
/* ------------------------------------------------------------------ */
export function ListEditor<T>({
  label,
  items,
  onChange,
  make,
  render,
  title,
  max = 50,
}: {
  label: string;
  items: T[];
  onChange: (v: T[]) => void;
  make: () => T;
  render: (item: T, set: (v: T) => void, i: number) => React.ReactNode;
  title?: (item: T, i: number) => string;
  max?: number;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => setOpen(open === i ? null : i)}>
                <span className="mr-2 font-mono text-xs text-white/40">{String(i + 1).padStart(2, "0")}</span>
                {title ? title(item, i) : `Item ${i + 1}`}
              </button>
              <button type="button" onClick={() => move(i, -1)} className="px-1 text-white/50 hover:text-white" aria-label="Move up">
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} className="px-1 text-white/50 hover:text-white" aria-label="Move down">
                ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(items.filter((_, j) => j !== i));
                  setOpen(null);
                }}
                className="px-1 text-red-300/70 hover:text-red-300"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
            {open === i && <div className="space-y-3 border-t border-white/10 p-3">{render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}</div>}
          </div>
        ))}
      </div>
      {items.length < max && (
        <button
          type="button"
          onClick={() => {
            onChange([...items, make()]);
            setOpen(items.length);
          }}
          className="mt-2 rounded-md border border-white/15 px-3 py-1.5 text-xs hover:border-white/40"
        >
          + Add
        </button>
      )}
    </div>
  );
}

export function StringList({ label, help, items, onChange, kind }: { label: string; help?: string; items: string[]; onChange: (v: string[]) => void; kind?: MediaKind }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            {kind ? (
              <div className="flex-1">
                <MediaField label={`#${i + 1}`} kind={kind} value={v} onChange={(nv) => onChange(items.map((x, j) => (j === i ? nv : x)))} />
              </div>
            ) : (
              <input className={inputCls} value={v} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            )}
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="px-2 text-red-300/70 hover:text-red-300">
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...items, ""])} className="mt-2 rounded-md border border-white/15 px-3 py-1.5 text-xs hover:border-white/40">
        + Add
      </button>
      {help && <p className="mt-1 text-xs text-white/40">{help}</p>}
    </div>
  );
}

export function Card({ title, desc, children, actions }: { title: string; desc?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {desc && <p className="mt-0.5 text-sm text-white/50">{desc}</p>}
        </div>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  return <div className={cx("grid gap-4", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-3", cols === 4 && "sm:grid-cols-2 lg:grid-cols-4")}>{children}</div>;
}
