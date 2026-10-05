"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product, Size } from "@/lib/types";
import { ALL_SIZES, MOTIFS } from "@/lib/types";
import { saveProductAction, deleteProductAction } from "@/app/admin/actions";
import TeeFlat from "@/components/product/TeeFlat";
import TeeViewer from "@/components/three/TeeViewer";
import { cx } from "@/lib/format";
import { Card, Chips, ColorField, Grid, MediaField, NumberField, SelectField, StringList, TextArea, TextField, Toggle } from "./fields";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");


export default function ProductForm({ id, initial }: { id: number | null; initial: Omit<Product, "id"> }) {
  const [p, setP] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [view, setView] = useState<"flat" | "3d">("flat");
  const [pending, start] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const router = useRouter();
  const dirty = JSON.stringify(p) !== saved;
  const set = (patch: Partial<Omit<Product, "id">>) => {
    setP((cur) => ({ ...cur, ...patch }));
    setMsg(null);
  };
  const preview = { ...p, id: id ?? 0 } as Product;

  const save = () =>
    start(async () => {
      const r = await saveProductAction(id, p);
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setSaved(JSON.stringify(p));
      setMsg({ ok: true, text: "Saved — live on the site" });
      if (!id && r.id) router.replace(`/admin/products/${r.id}`);
      else router.refresh();
    });

  const remove = () =>
    start(async () => {
      if (!id || !confirm(`Delete "${p.name}"? This can't be undone.`)) return;
      await deleteProductAction(id);
      router.push("/admin/products");
    });

  return (
    <div className="grid gap-6 pb-24 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card title="Basics">
          <Grid>
            <TextField
              label="Name"
              value={p.name}
              onChange={(name) => set({ name, ...(slugTouched ? {} : { slug: slugify(name) }) })}
            />
            <TextField
              label="URL slug"
              help={`/product/${p.slug || "…"}`}
              value={p.slug}
              onChange={(slug) => {
                setSlugTouched(true);
                set({ slug: slugify(slug) });
              }}
            />
          </Grid>
          <Grid>
            <TextField label="Colourway / sub name" value={p.combo} onChange={(combo) => set({ combo })} />
            <TextField label="Badge" help="e.g. New, Bestseller (empty = none)" value={p.badge} onChange={(badge) => set({ badge })} />
          </Grid>
          <TextField label="Tagline" value={p.tagline} onChange={(tagline) => set({ tagline })} />
          <TextArea label="Description" rows={4} value={p.description} onChange={(description) => set({ description })} />
          <Grid cols={4}>
            <NumberField label="Price (৳)" value={p.price} onChange={(n) => set({ price: n ?? 0 })} />
            <NumberField label="Old price (৳)" help="Shows a sale badge" value={p.compareAt} onChange={(compareAt) => set({ compareAt })} />
            <TextField label="Category" help="Creates shop filters" value={p.category} onChange={(category) => set({ category })} />
            <NumberField label="GSM" value={p.gsm} onChange={(n) => set({ gsm: n ?? 0 })} />
          </Grid>
          <TextField label="Fit" value={p.fit} onChange={(fit) => set({ fit })} />
          <Grid>
            <Chips label="Sizes offered" options={ALL_SIZES} value={p.sizes} onChange={(v) => set({ sizes: v as Size[], soldOut: p.soldOut.filter((s) => v.includes(s)) })} />
            <Chips label="Sold out sizes" options={p.sizes} value={p.soldOut} onChange={(v) => set({ soldOut: v as Size[] })} />
          </Grid>
        </Card>

        <Card title="Colours" desc="Background = the section/card colour. Fabric = the tee. Ink = print colours.">
          <Grid cols={3}>
            <ColorField label="Background" value={p.bg} onChange={(bg) => set({ bg })} />
            <ColorField label="Text on background" value={p.fg} onChange={(fg) => set({ fg })} />
            <ColorField label="Fabric" value={p.tee} onChange={(tee) => set({ tee })} />
            <ColorField label="Ink 1" value={p.ink} onChange={(ink) => set({ ink })} />
            <ColorField label="Ink 2" value={p.ink2} onChange={(ink2) => set({ ink2 })} />
          </Grid>
          <MediaField label="Background image (optional)" help="Shown behind the tee on the product page and homepage close-up." kind="image" value={p.bgImageUrl} onChange={(bgImageUrl) => set({ bgImageUrl })} />
        </Card>

        <Card title="Print artwork" desc="Upload your own SVG/PNG, or use a built-in graphic with your text.">
          <Grid>
            <MediaField label="Front print (SVG / PNG)" help="Transparent background, square works best." kind="svg" value={p.printUrl} onChange={(printUrl) => set({ printUrl })} />
            <MediaField label="Back print (SVG / PNG)" help="Empty = automatic spec label" kind="svg" value={p.backPrintUrl} onChange={(backPrintUrl) => set({ backPrintUrl })} />
          </Grid>
          {!p.printUrl && (
            <Grid cols={3}>
              <SelectField label="Built-in graphic" value={p.print.motif} onChange={(motif) => set({ print: { ...p.print, motif: motif as Product["print"]["motif"] } })} options={MOTIFS.map((m) => ({ value: m, label: m }))} />
              <TextField label="Print title" value={p.print.title} onChange={(title) => set({ print: { ...p.print, title } })} />
              <TextField label="Print sub" value={p.print.sub} onChange={(sub) => set({ print: { ...p.print, sub } })} />
            </Grid>
          )}
        </Card>

        <Card title="3D model" desc="Optional .glb (Draco/Meshopt compressed is fine). Without one the built-in soft tee is used with your print.">
          <MediaField label="Model (.glb)" kind="model" value={p.modelUrl} onChange={(modelUrl) => set({ modelUrl })} />
          {p.modelUrl && (
            <Grid>
              <NumberField label="Scale" step={0.05} value={p.modelScale} onChange={(n) => set({ modelScale: n ?? 1 })} />
              <NumberField label="Rotate Y (°)" step={5} value={p.modelRotY} onChange={(n) => set({ modelRotY: n ?? 0 })} />
            </Grid>
          )}
        </Card>

        <Card title="Gallery" desc="Extra photos on the product page.">
          <StringList label="Images" kind="image" items={p.gallery} onChange={(gallery) => set({ gallery })} />
        </Card>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:h-fit">
        <Card title="Visibility">
          <Toggle label="Published" help="Hidden products don't appear anywhere on the site." value={p.published} onChange={(published) => set({ published })} />
          <NumberField label="Sort order" help="Lower = earlier" value={p.sortOrder} onChange={(n) => set({ sortOrder: n ?? 0 })} />
        </Card>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="flex border-b border-white/10 text-xs">
            {(["flat", "3d"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={cx("flex-1 py-2", view === v ? "bg-white text-black" : "text-white/60")}>
                {v === "flat" ? "2D preview" : "3D preview"}
              </button>
            ))}
          </div>
          <div className="relative aspect-square" style={{ background: `radial-gradient(circle at 50% 70%, ${p.bg}, #000 85%)` }}>
            {p.bgImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.bgImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            )}
            {view === "flat" ? (
              <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4">
                <TeeFlat product={preview} />
                <TeeFlat product={preview} back />
              </div>
            ) : (
              <div className="absolute inset-0">
                <TeeViewer key={`${p.modelUrl}|${p.printUrl}|${p.backPrintUrl}|${p.tee}|${p.ink}|${p.print.motif}|${p.print.title}|${p.modelScale}|${p.modelRotY}`} product={preview} side="front" />
              </div>
            )}
          </div>
        </div>
        {id && (
          <div className="flex gap-2 text-xs">
            <Link href={`/product/${p.slug}`} target="_blank" className="flex-1 rounded-md border border-white/15 py-2 text-center">
              View on site ↗
            </Link>
            <button type="button" onClick={remove} className="flex-1 rounded-md border border-red-400/30 py-2 text-red-300">
              Delete
            </button>
          </div>
        )}
      </aside>

      <div
        className={cx(
          "fixed bottom-4 left-1/2 z-40 flex w-[min(640px,calc(100%-2rem))] -translate-x-1/2 items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 shadow-2xl backdrop-blur transition md:left-[calc(50%+120px)]",
          dirty || msg || !id ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <p className={cx("flex-1 text-sm", msg ? (msg.ok ? "text-emerald-400" : "text-red-400") : "text-white/70")}>
          {msg ? msg.text : id ? "You have unsaved changes" : "New product"}
        </p>
        <button type="button" onClick={save} disabled={pending || (!dirty && !!id)} className="rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-black disabled:opacity-40">
          {pending ? "Saving…" : id ? "Save" : "Create product"}
        </button>
      </div>
    </div>
  );
}
