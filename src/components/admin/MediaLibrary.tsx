"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";
import { Preview, uploadFile } from "./fields";

type Row = { id: number; url: string; filename: string; kind: string; mime: string; size: number; createdAt: string };
const KINDS = [
  { id: "", label: "All" },
  { id: "model", label: "3D models" },
  { id: "svg", label: "SVG prints" },
  { id: "image", label: "Images" },
];
const fmt = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);

export default function MediaLibrary() {
  const [rows, setRows] = useState<Row[]>([]);
  const [kind, setKind] = useState("");
  const [busy, setBusy] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/media${kind ? `?kind=${kind}` : ""}`)
      .then((r) => r.json())
      .then(setRows);
  }, [kind]);
  useEffect(load, [load]);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    setBusy(list.length);
    setErrors([]);
    for (const f of list) {
      const r = await uploadFile(f);
      if ("error" in r) setErrors((e) => [...e, `${f.name}: ${r.error}`]);
      setBusy((b) => b - 1);
    }
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this file? Anything still using it will show nothing.")) return;
    await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className="cursor-pointer rounded-2xl border-2 border-dashed border-white/15 p-8 text-center hover:border-white/40"
      >
        <p className="font-semibold">{busy ? `Uploading ${busy} file(s)…` : "Drop files here or click to upload"}</p>
        <p className="mt-1 text-sm text-white/50">.glb · .svg · .png · .jpg · .webp · .avif</p>
        <input ref={input} type="file" multiple accept=".glb,.svg,.png,.jpg,.jpeg,.webp,.avif,.ico" className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
      </div>
      {errors.map((e) => (
        <p key={e} className="mt-2 rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {e}
        </p>
      ))}

      <div className="mt-6 flex gap-1.5">
        {KINDS.map((k) => (
          <button key={k.id} onClick={() => setKind(k.id)} className={cx("rounded-md px-3 py-1.5 text-sm", kind === k.id ? "bg-white text-black" : "text-white/60 hover:bg-white/5")}>
            {k.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {rows.map((m) => (
          <div key={m.id} className="group rounded-xl border border-white/10 p-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(m.url);
                setCopied(m.id);
                setTimeout(() => setCopied(null), 1200);
              }}
              className="block w-full"
              title="Copy URL"
            >
              <Preview kind={m.kind} url={m.url} className="h-28 w-full" />
            </button>
            <p className="mt-2 truncate text-xs" title={m.filename}>
              {m.filename}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-white/40">
              <span>{copied === m.id ? "URL copied" : `${m.kind} · ${fmt(m.size)}`}</span>
              <button onClick={() => remove(m.id)} className="text-red-300/70 hover:text-red-300">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {rows.length === 0 && <p className="mt-6 text-sm text-white/50">No files yet.</p>}
    </div>
  );
}
