import "server-only";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db, hasDatabase, schema } from "./db";
import { defaultProducts, defaultSettings } from "@/lib/defaults";
import { ALL_SIZES, MOTIFS, type Motif, type Product, type SiteData, type SiteSettings, type Size } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
type AnyObj = Record<string, unknown>;
const isObj = (v: unknown): v is AnyObj => typeof v === "object" && v !== null && !Array.isArray(v);

/** Deep-merge `over` onto `base`; arrays and primitives replace. */
export function deepMerge<T>(base: T, over: unknown): T {
  if (!isObj(base) || !isObj(over)) return (over === undefined ? base : (over as T)) ?? base;
  const out: AnyObj = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) continue;
    out[k] = isObj(v) && isObj((base as AnyObj)[k]) ? deepMerge((base as AnyObj)[k], v) : v;
  }
  return out as T;
}

const asArr = <T>(v: unknown, fallback: T[]): T[] => {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p as T[];
    } catch {}
  }
  return fallback;
};

type ProductRow = typeof schema.products.$inferSelect;
type ProductInsert = typeof schema.products.$inferInsert;

export function rowToProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    combo: r.combo,
    tagline: r.tagline,
    description: r.description,
    price: r.price,
    compareAt: r.compareAt ?? null,
    category: r.category,
    fit: r.fit,
    gsm: r.gsm,
    sizes: asArr<Size>(r.sizes, ALL_SIZES),
    soldOut: asArr<Size>(r.soldOut, []),
    badge: r.badge,
    bg: r.bg,
    tee: r.tee,
    ink: r.ink,
    ink2: r.ink2,
    fg: r.fg,
    print: {
      title: r.printTitle,
      sub: r.printSub,
      motif: (MOTIFS.includes(r.printMotif as Motif) ? r.printMotif : "none") as Motif,
    },
    printUrl: r.printUrl,
    backPrintUrl: r.backPrintUrl,
    modelUrl: r.modelUrl,
    modelScale: r.modelScale / 100,
    modelRotY: r.modelRotY,
    bgImageUrl: r.bgImageUrl,
    gallery: asArr<string>(r.gallery, []),
    published: Boolean(r.published),
    sortOrder: r.sortOrder,
  };
}

export function productToRow(p: Omit<Product, "id">): ProductInsert {
  return {
    slug: p.slug,
    name: p.name,
    combo: p.combo,
    tagline: p.tagline,
    description: p.description,
    price: Math.round(p.price),
    compareAt: p.compareAt ? Math.round(p.compareAt) : null,
    category: p.category,
    fit: p.fit,
    gsm: Math.round(p.gsm),
    sizes: p.sizes,
    soldOut: p.soldOut,
    badge: p.badge,
    bg: p.bg,
    tee: p.tee,
    ink: p.ink,
    ink2: p.ink2,
    fg: p.fg,
    printTitle: p.print.title,
    printSub: p.print.sub,
    printMotif: p.print.motif,
    printUrl: p.printUrl,
    backPrintUrl: p.backPrintUrl,
    modelUrl: p.modelUrl,
    modelScale: Math.round((p.modelScale || 1) * 100),
    modelRotY: Math.round(p.modelRotY || 0),
    bgImageUrl: p.bgImageUrl,
    gallery: p.gallery,
    published: p.published,
    sortOrder: Math.round(p.sortOrder),
  };
}

/* ------------------------------------------------------------------ */
/* settings                                                            */
/* ------------------------------------------------------------------ */
export async function loadSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(schema.settings);
  let out = defaultSettings;
  for (const r of rows) {
    const key = r.key as keyof SiteSettings;
    if (!(key in defaultSettings)) continue;
    let val: unknown = r.value;
    if (typeof val === "string") {
      try {
        val = JSON.parse(val);
      } catch {}
    }
    out = { ...out, [key]: deepMerge(defaultSettings[key], val) };
  }
  return out;
}

export async function saveSettingsGroup<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
  await db
    .insert(schema.settings)
    .values({ key, value, updatedAt: new Date() })
    .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
}

/* ------------------------------------------------------------------ */
/* products                                                            */
/* ------------------------------------------------------------------ */
export async function loadProducts(opts: { all?: boolean } = {}): Promise<Product[]> {
  const q = db.select().from(schema.products).orderBy(asc(schema.products.sortOrder), asc(schema.products.id));
  const rows = opts.all ? await q : await q.where(eq(schema.products.published, true));
  return rows.map(rowToProduct);
}

/* ------------------------------------------------------------------ */
/* public site data (one DB round-trip per request)                    */
/* ------------------------------------------------------------------ */
export const getSiteData = cache(async (): Promise<SiteData & { dbError?: string }> => {
  if (!hasDatabase()) {
    return { settings: defaultSettings, products: defaultProducts, dbError: "DATABASE_URL not set — showing demo content" };
  }
  try {
    const [settings, products] = await Promise.all([loadSettings(), loadProducts()]);
    return { settings, products };
  } catch (e) {
    console.error("[M3S] database error, using demo content:", (e as Error).message);
    return { settings: defaultSettings, products: defaultProducts, dbError: (e as Error).message };
  }
});

export async function getProductBySlug(slug: string) {
  const { products } = await getSiteData();
  return products.find((p) => p.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ */
/* seeding                                                             */
/* ------------------------------------------------------------------ */
export async function seedDefaults() {
  const existing = await db.select({ id: schema.products.id }).from(schema.products).limit(1);
  if (existing.length === 0) {
    for (const p of defaultProducts) {
      const { id: _id, ...rest } = p;
      await db.insert(schema.products).values(productToRow(rest));
    }
  }
  const rows = await db.select({ key: schema.settings.key }).from(schema.settings);
  const have = new Set(rows.map((r) => r.key));
  for (const key of Object.keys(defaultSettings) as (keyof SiteSettings)[]) {
    if (!have.has(key)) await saveSettingsGroup(key, defaultSettings[key]);
  }
}
