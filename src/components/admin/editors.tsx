"use client";

import { useState } from "react";
import type { Link, Pose, PoseKey, SectionId, SiteSettings } from "@/lib/types";
import { BENEFIT_ICONS, POSE_KEYS, SECTION_IDS } from "@/lib/types";
import { defaultPoses } from "@/lib/defaults";
import { GroupEditor } from "./GroupEditor";
import {
  Card,
  ColorField,
  Grid,
  ListEditor,
  MediaField,
  NumberField,
  RangeField,
  SelectField,
  StringList,
  TextArea,
  TextField,
  Toggle,
} from "./fields";
import { cx } from "@/lib/format";

type S = SiteSettings;
const upd = <T extends object>(v: T, patch: Partial<T>) => ({ ...v, ...patch });
const NL = "Use a new line (Enter) to break the heading into lines.";

/* ------------------------------------------------------------------ */
/* Site settings                                                       */
/* ------------------------------------------------------------------ */
export function BrandEditor({ initial }: { initial: S["brand"] }) {
  return (
    <GroupEditor group="brand" initial={initial}>
      {(v, set) => (
        <Card title="Brand" desc="Name, logo and contact details shown across the site.">
          <Grid>
            <TextField label="Brand name" value={v.name} onChange={(name) => set(upd(v, { name }))} />
            <TextField label="Sub line (under the logo)" value={v.subline} onChange={(subline) => set(upd(v, { subline }))} />
          </Grid>
          <Grid>
            <MediaField label="Logo (optional — replaces the text logo)" kind="image" value={v.logoUrl} onChange={(logoUrl) => set(upd(v, { logoUrl }))} />
            <MediaField label="Favicon" kind="image" value={v.faviconUrl} onChange={(faviconUrl) => set(upd(v, { faviconUrl }))} />
          </Grid>
          <TextField label="Tagline" value={v.tagline} onChange={(tagline) => set(upd(v, { tagline }))} />
          <TextArea label="Short description (footer)" value={v.description} onChange={(description) => set(upd(v, { description }))} />
          <Grid cols={3}>
            <TextField label="Email" value={v.email} onChange={(email) => set(upd(v, { email }))} />
            <TextField label="Phone" value={v.phone} onChange={(phone) => set(upd(v, { phone }))} />
            <TextField label="City" value={v.city} onChange={(city) => set(upd(v, { city }))} />
          </Grid>
          <TextField label="Copyright line" help="The year is added automatically." value={v.copyright} onChange={(copyright) => set(upd(v, { copyright }))} />
        </Card>
      )}
    </GroupEditor>
  );
}

export function SeoEditor({ initial }: { initial: S["seo"] }) {
  return (
    <GroupEditor group="seo" initial={initial}>
      {(v, set) => (
        <Card title="SEO & sharing" desc="What Google and social apps show for your site.">
          <TextField label="Page title" value={v.title} onChange={(title) => set(upd(v, { title }))} />
          <TextArea label="Meta description" value={v.description} onChange={(description) => set(upd(v, { description }))} />
          <MediaField label="Share image (1200×630)" kind="image" value={v.ogImageUrl} onChange={(ogImageUrl) => set(upd(v, { ogImageUrl }))} />
        </Card>
      )}
    </GroupEditor>
  );
}

export function ThemeEditor({ initial }: { initial: S["theme"] }) {
  return (
    <GroupEditor group="theme" initial={initial}>
      {(v, set) => (
        <Card title="Theme & 3D" desc="Global look, loader, sound and the default 3D model.">
          <Grid>
            <ColorField label="Page background" value={v.background} onChange={(background) => set(upd(v, { background }))} />
            <ColorField label="Accent colour" value={v.accent} onChange={(accent) => set(upd(v, { accent }))} />
          </Grid>
          <MediaField
            label="Default 3D model (.glb)"
            help="Used for every product that has no model of its own. Leave empty to use the built-in soft tee."
            kind="model"
            value={v.defaultModelUrl}
            onChange={(defaultModelUrl) => set(upd(v, { defaultModelUrl }))}
          />
          <NumberField label="Tees in the carousel ring" help="Products repeat to fill the ring (6–24)." min={6} max={24} value={v.ringCount} onChange={(n) => set(upd(v, { ringCount: n ?? 12 }))} />
          <Grid>
            <Toggle label="Intro loader" value={v.loader} onChange={(loader) => set(upd(v, { loader }))} />
            <Toggle label="Sound toggle in the header" value={v.sound} onChange={(sound) => set(upd(v, { sound }))} />
          </Grid>
        </Card>
      )}
    </GroupEditor>
  );
}

function LinkList({ label, items, onChange }: { label: string; items: Link[]; onChange: (v: Link[]) => void }) {
  return (
    <ListEditor
      label={label}
      items={items}
      onChange={onChange}
      make={() => ({ label: "New link", href: "/" })}
      title={(l) => `${l.label} → ${l.href}`}
      render={(l, set) => (
        <Grid>
          <TextField label="Label" value={l.label} onChange={(label) => set({ ...l, label })} />
          <TextField label="Link" help="/shop, /#faq or https://…" value={l.href} onChange={(href) => set({ ...l, href })} />
        </Grid>
      )}
    />
  );
}

export function LinksEditor({ group, initial, title, desc }: { group: "nav" | "socials" | "legal"; initial: Link[]; title: string; desc: string }) {
  return (
    <GroupEditor group={group} initial={initial}>
      {(v, set) => (
        <Card title={title} desc={desc}>
          <LinkList label="Links" items={v} onChange={set} />
        </Card>
      )}
    </GroupEditor>
  );
}

export function ShippingEditor({ initial }: { initial: S["shipping"] }) {
  return (
    <GroupEditor group="shipping" initial={initial} preview="/checkout">
      {(v, set) => (
        <Card title="Delivery" desc="Fees in Taka. Orders above the free-delivery amount ship free.">
          <Grid cols={3}>
            <TextField label="Zone 1 name" value={v.insideLabel} onChange={(insideLabel) => set(upd(v, { insideLabel }))} />
            <NumberField label="Zone 1 fee (৳)" value={v.insideDhaka} onChange={(n) => set(upd(v, { insideDhaka: n ?? 0 }))} />
            <TextField label="Zone 1 time" value={v.insideEta} onChange={(insideEta) => set(upd(v, { insideEta }))} />
            <TextField label="Zone 2 name" value={v.outsideLabel} onChange={(outsideLabel) => set(upd(v, { outsideLabel }))} />
            <NumberField label="Zone 2 fee (৳)" value={v.outsideDhaka} onChange={(n) => set(upd(v, { outsideDhaka: n ?? 0 }))} />
            <TextField label="Zone 2 time" value={v.outsideEta} onChange={(outsideEta) => set(upd(v, { outsideEta }))} />
          </Grid>
          <NumberField label="Free delivery over (৳)" value={v.freeOver} onChange={(n) => set(upd(v, { freeOver: n ?? 0 }))} />
        </Card>
      )}
    </GroupEditor>
  );
}

export function PaymentsEditor({ initial }: { initial: S["payments"] }) {
  return (
    <GroupEditor group="payments" initial={initial} preview="/checkout">
      {(v, set) => (
        <Card title="Payment methods" desc="Turn methods on/off and rename them. The id is stored with each order.">
          <ListEditor
            label="Methods"
            items={v}
            onChange={set}
            make={() => ({ id: `pay${v.length + 1}`, label: "New method", note: "", enabled: true })}
            title={(p) => `${p.enabled ? "●" : "○"} ${p.label}`}
            render={(p, s) => (
              <>
                <Grid cols={3}>
                  <TextField label="Id" value={p.id} onChange={(id) => s({ ...p, id: id.replace(/[^a-z0-9_-]/gi, "").toLowerCase() })} />
                  <TextField label="Label" value={p.label} onChange={(label) => s({ ...p, label })} />
                  <TextField label="Note" value={p.note} onChange={(note) => s({ ...p, note })} />
                </Grid>
                <Toggle label="Enabled" value={p.enabled} onChange={(enabled) => s({ ...p, enabled })} />
              </>
            )}
          />
        </Card>
      )}
    </GroupEditor>
  );
}

export function ShopEditor({ initial }: { initial: S["shop"] }) {
  return (
    <GroupEditor group="shop" initial={initial} preview="/shop">
      {(v, set) => (
        <Card title="Shop page" desc="Heading and the scrolling words strip.">
          <Grid>
            <TextField label="Title" value={v.title} onChange={(title) => set(upd(v, { title }))} />
            <TextField label="Kicker" value={v.kicker} onChange={(kicker) => set(upd(v, { kicker }))} />
          </Grid>
          <StringList label="Marquee words" items={v.marquee} onChange={(marquee) => set(upd(v, { marquee }))} />
        </Card>
      )}
    </GroupEditor>
  );
}

/* ------------------------------------------------------------------ */
/* Homepage sections                                                   */
/* ------------------------------------------------------------------ */
const SECTION_LABEL: Record<SectionId, string> = {
  carousel: "3D carousel (hero)",
  profile: "Selected design close-up",
  benefits: "Benefits (one screen each)",
  argument: "Slogan + colour field",
  range: "Full range line-up",
  faq: "FAQ",
  last: "Single tee",
  join: "Newsletter + footer",
};

export function SectionsEditor({ initial }: { initial: S["sections"] }) {
  // make sure every section exists once
  const full = [...initial, ...SECTION_IDS.filter((id) => !initial.some((s) => s.id === id)).map((id) => ({ id, enabled: false, bgImageUrl: "" }))];
  return (
    <GroupEditor group="sections" initial={full}>
      {(v, set) => (
        <Card title="Homepage layout" desc="Reorder, hide or add a background image to any section. The 3D tee follows the order automatically.">
          <div className="space-y-2">
            {v.map((s, i) => (
              <div key={s.id} className={cx("rounded-lg border border-white/10 p-3", !s.enabled && "opacity-50")}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-white/40">{String(i + 1).padStart(2, "0")}</span>
                  <p className="flex-1 text-sm font-medium">{SECTION_LABEL[s.id]}</p>
                  <button type="button" className="px-1 text-white/50 hover:text-white" onClick={() => i > 0 && set(v.map((x, j) => (j === i - 1 ? v[i] : j === i ? v[i - 1] : x)))}>
                    ↑
                  </button>
                  <button type="button" className="px-1 text-white/50 hover:text-white" onClick={() => i < v.length - 1 && set(v.map((x, j) => (j === i + 1 ? v[i] : j === i ? v[i + 1] : x)))}>
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => set(v.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x)))}
                    className={cx("rounded-md px-2.5 py-1 text-xs font-semibold", s.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60")}
                  >
                    {s.enabled ? "Visible" : "Hidden"}
                  </button>
                </div>
                <div className="mt-3">
                  <MediaField label="Background image (optional)" kind="image" value={s.bgImageUrl} onChange={(bgImageUrl) => set(v.map((x, j) => (j === i ? { ...x, bgImageUrl } : x)))} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </GroupEditor>
  );
}

export function CarouselEditor({ initial }: { initial: S["carousel"] }) {
  return (
    <GroupEditor group="carousel" initial={initial}>
      {(v, set) => (
        <Card title="3D carousel" desc="The first screen: products on a ring with podiums.">
          <TextField label="Hint text" value={v.hint} onChange={(hint) => set(upd(v, { hint }))} />
          <Grid cols={3}>
            <Toggle label="Arrows" value={v.showArrows} onChange={(showArrows) => set(upd(v, { showArrows }))} />
            <Toggle label="Colour slider" value={v.showSlider} onChange={(showSlider) => set(upd(v, { showSlider }))} />
            <Toggle label="Podiums" value={v.showPodiums} onChange={(showPodiums) => set(upd(v, { showPodiums }))} />
          </Grid>
        </Card>
      )}
    </GroupEditor>
  );
}

export function ProfileEditor({ initial }: { initial: S["profile"] }) {
  return (
    <GroupEditor group="profile" initial={initial}>
      {(v, set) => (
        <Card title="Selected design close-up" desc="Uses the product's name, tagline, description, colour and background image.">
          <Grid>
            <TextField label="Main button" help="Leave empty to hide" value={v.primaryCta} onChange={(primaryCta) => set(upd(v, { primaryCta }))} />
            <TextField label="Quick-add button" help="Leave empty to hide" value={v.secondaryCta} onChange={(secondaryCta) => set(upd(v, { secondaryCta }))} />
          </Grid>
          <Grid>
            <Toggle label="Show tagline before description" value={v.useTagline} onChange={(useTagline) => set(upd(v, { useTagline }))} />
            <Toggle label="Spaced background letters" value={v.showLetters} onChange={(showLetters) => set(upd(v, { showLetters }))} />
          </Grid>
        </Card>
      )}
    </GroupEditor>
  );
}

export function BenefitsEditor({ initial }: { initial: S["benefits"] }) {
  return (
    <GroupEditor group="benefits" initial={initial} preview="/#benefits">
      {(v, set) => (
        <Card title="Benefits" desc="Each item gets its own screen while the tee shows its back.">
          <ListEditor
            label="Items"
            items={v.items}
            max={12}
            onChange={(items) => set({ items })}
            make={() => ({ icon: "weight" as const, iconUrl: "", no: "The cheap way", title: "Our\nway", text: "", stat: "" })}
            title={(b) => b.title.replace(/\n/g, " ")}
            render={(b, s) => (
              <>
                <Grid>
                  <TextField label="Crossed-out tag" value={b.no} onChange={(no) => s({ ...b, no })} />
                  <TextField label="Small stat" value={b.stat} onChange={(stat) => s({ ...b, stat })} />
                </Grid>
                <TextArea label="Title" help={NL} rows={2} value={b.title} onChange={(title) => s({ ...b, title })} />
                <TextArea label="Text" value={b.text} onChange={(text) => s({ ...b, text })} />
                <Grid>
                  <SelectField label="Built-in icon" value={b.icon} onChange={(icon) => s({ ...b, icon: icon as typeof b.icon })} options={BENEFIT_ICONS.map((x) => ({ value: x, label: x }))} />
                  <MediaField label="Custom icon (SVG)" kind="svg" value={b.iconUrl} onChange={(iconUrl) => s({ ...b, iconUrl })} />
                </Grid>
              </>
            )}
          />
        </Card>
      )}
    </GroupEditor>
  );
}

export function ArgumentEditor({ initial }: { initial: S["argument"] }) {
  return (
    <GroupEditor group="argument" initial={initial}>
      {(v, set) => (
        <Card title="Slogan section" desc="Giant words behind the tee while the designs cycle.">
          <TextArea label="Slogan" help={NL} rows={2} value={v.text} onChange={(text) => set(upd(v, { text }))} />
          <Grid>
            <SelectField
              label="Background"
              value={v.mode}
              onChange={(mode) => set(upd(v, { mode: mode as typeof v.mode }))}
              options={[
                { value: "products", label: "Product colours (changes with each design)" },
                { value: "color", label: "One colour" },
                { value: "image", label: "Image" },
              ]}
            />
            <NumberField label="Design switch every (ms)" min={600} step={100} value={v.intervalMs} onChange={(n) => set(upd(v, { intervalMs: n ?? 2200 }))} />
          </Grid>
          {v.mode === "color" && <ColorField label="Colour" value={v.color} onChange={(color) => set(upd(v, { color }))} />}
          {v.mode === "image" && <MediaField label="Image" kind="image" value={v.imageUrl} onChange={(imageUrl) => set(upd(v, { imageUrl }))} />}
          <Toggle label="Show product name pill" value={v.showLabel} onChange={(showLabel) => set(upd(v, { showLabel }))} />
        </Card>
      )}
    </GroupEditor>
  );
}

export function RangeEditor({ initial }: { initial: S["range"] }) {
  return (
    <GroupEditor group="range" initial={initial}>
      {(v, set) => (
        <Card title="Full range" desc="All products line up diagonally.">
          <TextField label="Kicker" value={v.kicker} onChange={(kicker) => set(upd(v, { kicker }))} />
          <Grid>
            <TextField label="Button label" help="Empty = hidden" value={v.ctaLabel} onChange={(ctaLabel) => set(upd(v, { ctaLabel }))} />
            <TextField label="Button link" value={v.ctaHref} onChange={(ctaHref) => set(upd(v, { ctaHref }))} />
          </Grid>
        </Card>
      )}
    </GroupEditor>
  );
}

export function FaqEditor({ initial }: { initial: S["faq"] }) {
  return (
    <GroupEditor group="faq" initial={initial} preview="/#faq">
      {(v, set) => (
        <Card title="FAQ">
          <TextArea label="Heading" help={NL} rows={2} value={v.heading} onChange={(heading) => set(upd(v, { heading }))} />
          <ListEditor
            label="Questions"
            items={v.items}
            onChange={(items) => set(upd(v, { items }))}
            make={() => ({ q: "New question?", a: "" })}
            title={(f) => f.q}
            render={(f, s) => (
              <>
                <TextField label="Question" value={f.q} onChange={(q) => s({ ...f, q })} />
                <TextArea label="Answer" rows={4} value={f.a} onChange={(a) => s({ ...f, a })} />
              </>
            )}
          />
        </Card>
      )}
    </GroupEditor>
  );
}

export function JoinEditor({ initial }: { initial: S["join"] }) {
  return (
    <GroupEditor group="join" initial={initial} preview="/#join">
      {(v, set) => (
        <Card title="Newsletter" desc="Emails are saved under Subscribers.">
          <TextArea label="Heading" help={NL} rows={2} value={v.heading} onChange={(heading) => set(upd(v, { heading }))} />
          <TextArea label="Text" value={v.text} onChange={(text) => set(upd(v, { text }))} />
          <Grid>
            <TextField label="Input placeholder" value={v.placeholder} onChange={(placeholder) => set(upd(v, { placeholder }))} />
            <TextField label="Button" value={v.button} onChange={(button) => set(upd(v, { button }))} />
          </Grid>
          <Grid>
            <TextField label="Small note" value={v.note} onChange={(note) => set(upd(v, { note }))} />
            <TextField label="Success message" value={v.success} onChange={(success) => set(upd(v, { success }))} />
          </Grid>
        </Card>
      )}
    </GroupEditor>
  );
}

/* ------------------------------------------------------------------ */
/* 3D poses                                                            */
/* ------------------------------------------------------------------ */
const POSE_FIELDS: { key: keyof Pose; label: string; min: number; max: number; step: number; group: string }[] = [
  { key: "hero", label: "Hero tee visible", min: 0, max: 1, step: 0.05, group: "Hero tee" },
  { key: "hx", label: "Move left / right", min: -6, max: 6, step: 0.05, group: "Hero tee" },
  { key: "hy", label: "Move down / up", min: -6, max: 6, step: 0.05, group: "Hero tee" },
  { key: "hz", label: "Move back / closer", min: -6, max: 8, step: 0.05, group: "Hero tee" },
  { key: "hrx", label: "Tilt forward (rad)", min: -3.2, max: 3.2, step: 0.01, group: "Hero tee" },
  { key: "hry", label: "Turn (rad · π = back)", min: -13, max: 13, step: 0.01, group: "Hero tee" },
  { key: "hrz", label: "Lean (rad)", min: -3.2, max: 3.2, step: 0.01, group: "Hero tee" },
  { key: "hs", label: "Size", min: 0, max: 3, step: 0.01, group: "Hero tee" },
  { key: "ring", label: "Ring visible", min: 0, max: 1, step: 0.05, group: "Ring / range" },
  { key: "wave", label: "Arc → diagonal line", min: 0, max: 1, step: 0.05, group: "Ring / range" },
  { key: "ringLift", label: "Lift away", min: 0, max: 1, step: 0.05, group: "Ring / range" },
  { key: "podium", label: "Podiums", min: 0, max: 1, step: 0.05, group: "Ring / range" },
  { key: "neutral", label: "Grey floor light", min: 0, max: 1, step: 0.05, group: "Background layers" },
  { key: "glow", label: "Product colour glow", min: 0, max: 1, step: 0.05, group: "Background layers" },
  { key: "vivid", label: "Slogan colour field", min: 0, max: 1, step: 0.05, group: "Background layers" },
  { key: "argText", label: "Giant slogan", min: 0, max: 1, step: 0.05, group: "Background layers" },
  { key: "letters", label: "Spaced letters", min: 0, max: 1, step: 0.05, group: "Background layers" },
  { key: "icons", label: "Benefit icon nav", min: 0, max: 1, step: 0.05, group: "Background layers" },
];

const POSE_LABEL: Record<PoseKey, string> = {
  carousel: "Carousel",
  profile: "Close-up",
  benefit0: "Benefit 1 (and 5, 9…)",
  benefit1: "Benefit 2",
  benefit2: "Benefit 3",
  benefit3: "Benefit 4",
  argument: "Slogan",
  range: "Full range",
  faq: "FAQ",
  last: "Single tee",
  join: "Newsletter",
};

export function PosesEditor({ initial }: { initial: S["poses"] }) {
  const [key, setKey] = useState<PoseKey>("profile");
  return (
    <GroupEditor group="poses" initial={initial}>
      {(v, set) => {
        const current: Pose = { ...defaultPoses[key], ...(v[key] ?? {}) };
        const change = (f: keyof Pose, n: number) => set({ ...v, [key]: { ...(v[key] ?? {}), [f]: n } });
        const groups = Array.from(new Set(POSE_FIELDS.map((f) => f.group)));
        return (
          <Card
            title="3D camera poses"
            desc="Where the tee sits and which background layers show in each section. Scroll the live site to see the result after saving."
            actions={
              v[key] && (
                <button type="button" onClick={() => { const next = { ...v }; delete next[key]; set(next); }} className="rounded-md border border-white/15 px-2.5 py-1 text-xs">
                  Reset this pose
                </button>
              )
            }
          >
            <div className="flex flex-wrap gap-1.5">
              {POSE_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKey(k)}
                  className={cx("rounded-md border px-2.5 py-1 text-xs", k === key ? "border-white bg-white text-black" : "border-white/15 text-white/70", v[k] && k !== key && "border-amber-400/60")}
                >
                  {POSE_LABEL[k]}
                </button>
              ))}
            </div>
            {groups.map((g) => (
              <div key={g}>
                <p className="mb-2 mt-2 text-xs font-semibold text-white/50">{g}</p>
                <Grid>
                  {POSE_FIELDS.filter((f) => f.group === g).map((f) => (
                    <RangeField key={f.key} label={f.label} min={f.min} max={f.max} step={f.step} value={current[f.key]} fallback={defaultPoses[key][f.key]} onChange={(n) => change(f.key, n)} />
                  ))}
                </Grid>
              </div>
            ))}
          </Card>
        );
      }}
    </GroupEditor>
  );
}
