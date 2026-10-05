/**
 * MySQL schema (Drizzle ORM). Mirror of /database/schema.sql.
 * Change a table here → run `npm run db:generate` (or edit schema.sql by hand).
 */
import { boolean, datetime, index, int, json, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

const now = () => datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`);

export const admins = mysqlTable("admins", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull().default(""),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  createdAt: now(),
});

/** One row per settings group (brand, theme, carousel, faq …) — value is JSON */
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: json("value").notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    combo: varchar("combo", { length: 160 }).notNull().default(""),
    tagline: varchar("tagline", { length: 255 }).notNull().default(""),
    description: text("description").notNull(),
    price: int("price").notNull().default(0),
    compareAt: int("compare_at"),
    category: varchar("category", { length: 60 }).notNull().default("Graphic"),
    fit: varchar("fit", { length: 120 }).notNull().default(""),
    gsm: int("gsm").notNull().default(220),
    sizes: json("sizes").notNull(),
    soldOut: json("sold_out").notNull(),
    badge: varchar("badge", { length: 60 }).notNull().default(""),
    bg: varchar("bg", { length: 20 }).notNull().default("#ff5a8a"),
    tee: varchar("tee", { length: 20 }).notNull().default("#111111"),
    ink: varchar("ink", { length: 20 }).notNull().default("#ffffff"),
    ink2: varchar("ink2", { length: 20 }).notNull().default("#cccccc"),
    fg: varchar("fg", { length: 20 }).notNull().default("#000000"),
    printTitle: varchar("print_title", { length: 60 }).notNull().default(""),
    printSub: varchar("print_sub", { length: 60 }).notNull().default(""),
    printMotif: varchar("print_motif", { length: 20 }).notNull().default("none"),
    printUrl: varchar("print_url", { length: 500 }).notNull().default(""),
    backPrintUrl: varchar("back_print_url", { length: 500 }).notNull().default(""),
    modelUrl: varchar("model_url", { length: 500 }).notNull().default(""),
    modelScale: int("model_scale_pct").notNull().default(100),
    modelRotY: int("model_rot_y").notNull().default(0),
    bgImageUrl: varchar("bg_image_url", { length: 500 }).notNull().default(""),
    gallery: json("gallery").notNull(),
    published: boolean("published").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: now(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("products_sort_idx").on(t.published, t.sortOrder)],
);

export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  url: varchar("url", { length: 500 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  kind: varchar("kind", { length: 20 }).notNull(), // model | svg | image
  mime: varchar("mime", { length: 100 }).notNull(),
  size: int("size").notNull(),
  createdAt: now(),
});

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 191 }).notNull().default(""),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull().default(""),
    zone: varchar("zone", { length: 20 }).notNull().default("inside"),
    note: text("note"),
    payment: varchar("payment", { length: 20 }).notNull().default("cod"),
    subtotal: int("subtotal").notNull(),
    shipping: int("shipping").notNull(),
    total: int("total").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: now(),
  },
  (t) => [index("orders_created_idx").on(t.createdAt)],
);

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: int("product_id"),
  slug: varchar("slug", { length: 120 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  size: varchar("size", { length: 8 }).notNull(),
  qty: int("qty").notNull(),
  unitPrice: int("unit_price").notNull(),
});

export const subscribers = mysqlTable("subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  createdAt: now(),
});
