"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db";
import {
  adminCount,
  changePassword,
  checkLogin,
  createAdmin,
  endSession,
  requireAdmin,
  startSession,
} from "@/server/auth";
import { loadProducts, productToRow, saveSettingsGroup, seedDefaults } from "@/server/content";
import { defaultSettings } from "@/lib/defaults";
import { ALL_SIZES, MOTIFS, ORDER_STATUSES, type Product, type SiteSettings } from "@/lib/types";

export type ActionResult = { ok: true; message?: string; id?: number } | { ok: false; error: string };

const refresh = () => revalidatePath("/", "layout");

/* ------------------------------------------------------------------ */
/* auth                                                                */
/* ------------------------------------------------------------------ */
export async function loginAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  try {
    const admin = await checkLogin(email, password);
    if (!admin) return { ok: false, error: "Wrong email or password" };
    await startSession(admin);
  } catch (e) {
    return { ok: false, error: `Database error: ${(e as Error).message}` };
  }
  redirect("/admin");
}

const setupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** First run only: create the first admin and seed demo content. */
export async function setupAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    if ((await adminCount()) > 0) return { ok: false, error: "Setup already done — please sign in" };
    const parsed = setupSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const admin = await createAdmin(parsed.data.email, parsed.data.password, parsed.data.name);
    if (form.get("seed") === "on") await seedDefaults();
    await startSession(admin);
  } catch (e) {
    return { ok: false, error: `Database error: ${(e as Error).message}. Did you import database/schema.sql?` };
  }
  refresh();
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

export async function changePasswordAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 8) return { ok: false, error: "New password must be at least 8 characters" };
  const ok = await changePassword(Number(me.sub), current, next);
  return ok ? { ok: true, message: "Password updated" } : { ok: false, error: "Current password is wrong" };
}

export async function addAdminAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = setupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    await createAdmin(parsed.data.email, parsed.data.password, parsed.data.name);
  } catch {
    return { ok: false, error: "That email already has an account" };
  }
  revalidatePath("/admin/account");
  return { ok: true, message: `Admin ${parsed.data.email} added` };
}

export async function deleteAdminAction(id: number): Promise<ActionResult> {
  const me = await requireAdmin();
  if (Number(me.sub) === id) return { ok: false, error: "You can't delete yourself" };
  await db.delete(schema.admins).where(eq(schema.admins.id, id));
  revalidatePath("/admin/account");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* settings                                                            */
/* ------------------------------------------------------------------ */
export async function saveSettingsAction<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]): Promise<ActionResult> {
  await requireAdmin();
  if (!(key in defaultSettings)) return { ok: false, error: "Unknown settings group" };
  try {
    await saveSettingsGroup(key, value);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  refresh();
  return { ok: true, message: "Saved" };
}

export async function resetSettingsAction(key: keyof SiteSettings): Promise<ActionResult> {
  await requireAdmin();
  await saveSettingsGroup(key, defaultSettings[key]);
  refresh();
  return { ok: true, message: "Reset to defaults" };
}

export async function seedDemoAction(): Promise<ActionResult> {
  await requireAdmin();
  await seedDefaults();
  refresh();
  return { ok: true, message: "Demo content added where missing" };
}

/* ------------------------------------------------------------------ */
/* products                                                            */
/* ------------------------------------------------------------------ */
const hex = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i, "Use a hex colour like #ff5a8a");
const url = z.string().max(500).refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Invalid URL");
const size = z.enum(ALL_SIZES as [string, ...string[]]);

const productSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and dashes only"),
  name: z.string().trim().min(1, "Name is required").max(160),
  combo: z.string().max(160),
  tagline: z.string().max(255),
  description: z.string().max(5000),
  price: z.number().int().min(0),
  compareAt: z.number().int().min(0).nullable(),
  category: z.string().trim().max(60),
  fit: z.string().max(120),
  gsm: z.number().int().min(0).max(1000),
  sizes: z.array(size).min(1, "Pick at least one size"),
  soldOut: z.array(size),
  badge: z.string().max(60),
  bg: hex,
  tee: hex,
  ink: hex,
  ink2: hex,
  fg: hex,
  print: z.object({ title: z.string().max(60), sub: z.string().max(60), motif: z.enum(MOTIFS as [string, ...string[]]) }),
  printUrl: url,
  backPrintUrl: url,
  modelUrl: url,
  modelScale: z.number().min(0.05).max(20),
  modelRotY: z.number().min(-360).max(360),
  bgImageUrl: url,
  gallery: z.array(url).max(20),
  published: z.boolean(),
  sortOrder: z.number().int(),
});

export async function saveProductAction(id: number | null, data: Omit<Product, "id">): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const row = productToRow(parsed.data as Omit<Product, "id">);
  try {
    if (id) {
      await db.update(schema.products).set({ ...row, updatedAt: new Date() }).where(eq(schema.products.id, id));
    } else {
      const [res] = await db.insert(schema.products).values(row);
      id = Number(res.insertId);
    }
  } catch (e) {
    const msg = (e as Error).message;
    return { ok: false, error: /Duplicate/i.test(msg) ? "That slug is already used by another product" : msg };
  }
  refresh();
  return { ok: true, id, message: "Product saved" };
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(schema.products).where(eq(schema.products.id, id));
  refresh();
  return { ok: true };
}

export async function toggleProductAction(id: number, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.update(schema.products).set({ published }).where(eq(schema.products.id, id));
  refresh();
  return { ok: true };
}

export async function duplicateProductAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const all = await loadProducts({ all: true });
  const p = all.find((x) => x.id === id);
  if (!p) return { ok: false, error: "Not found" };
  let slug = `${p.slug}-copy`;
  for (let i = 2; all.some((x) => x.slug === slug); i++) slug = `${p.slug}-copy-${i}`;
  const { id: _omit, ...rest } = p;
  const [res] = await db
    .insert(schema.products)
    .values(productToRow({ ...rest, slug, name: `${p.name} (copy)`, published: false, sortOrder: all.length }));
  refresh();
  return { ok: true, id: Number(res.insertId) };
}

export async function reorderProductsAction(ids: number[]): Promise<ActionResult> {
  await requireAdmin();
  const rows = await db.select({ id: schema.products.id }).from(schema.products).where(inArray(schema.products.id, ids)).orderBy(asc(schema.products.id));
  if (rows.length !== ids.length) return { ok: false, error: "Product list changed — reload the page" };
  await db.transaction(async (tx) => {
    for (const [i, id] of ids.entries()) await tx.update(schema.products).set({ sortOrder: i }).where(eq(schema.products.id, id));
  });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* orders & subscribers                                                */
/* ------------------------------------------------------------------ */
export async function setOrderStatusAction(id: number, status: string): Promise<ActionResult> {
  await requireAdmin();
  if (!ORDER_STATUSES.includes(status as never)) return { ok: false, error: "Invalid status" };
  await db.update(schema.orders).set({ status }).where(eq(schema.orders.id, id));
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function deleteOrderAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(schema.orders).where(eq(schema.orders.id, id));
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function deleteSubscriberAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(schema.subscribers).where(eq(schema.subscribers.id, id));
  revalidatePath("/admin/subscribers");
  return { ok: true };
}
