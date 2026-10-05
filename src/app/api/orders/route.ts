import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db, hasDatabase, schema } from "@/server/db";
import { getSiteData } from "@/server/content";
import { orderInput } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** Create an order. Prices & shipping are always recomputed on the server. */
export async function POST(req: Request) {
  if (!hasDatabase()) return NextResponse.json({ error: "Orders are disabled until the database is configured" }, { status: 503 });
  const parsed = orderInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const input = parsed.data;
  const { settings, products } = await getSiteData();

  if (!settings.payments.some((p) => p.enabled && p.id === input.payment)) {
    return NextResponse.json({ error: "Payment method not available" }, { status: 400 });
  }

  const items: { productId: number; slug: string; name: string; size: string; qty: number; unitPrice: number }[] = [];
  for (const l of input.lines) {
    const p = products.find((x) => x.slug === l.slug);
    if (!p) return NextResponse.json({ error: `Product "${l.slug}" is no longer available` }, { status: 400 });
    if (!p.sizes.includes(l.size as never) || p.soldOut.includes(l.size as never)) {
      return NextResponse.json({ error: `${p.name} (${l.size}) is sold out` }, { status: 400 });
    }
    items.push({ productId: p.id, slug: p.slug, name: p.name, size: l.size, qty: l.qty, unitPrice: p.price });
  }

  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
  const s = settings.shipping;
  const shipping = subtotal >= s.freeOver ? 0 : input.zone === "inside" ? s.insideDhaka : s.outsideDhaka;
  const total = subtotal + shipping;
  const code = `M3S-${Date.now().toString(36).toUpperCase().slice(-5)}${crypto.randomBytes(1).toString("hex").toUpperCase()}`;

  await db.transaction(async (tx) => {
    const [res] = await tx.insert(schema.orders).values({
      code,
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city,
      zone: input.zone,
      note: input.note,
      payment: input.payment,
      subtotal,
      shipping,
      total,
    });
    const orderId = Number(res.insertId);
    await tx.insert(schema.orderItems).values(items.map((i) => ({ ...i, orderId })));
  });

  // TODO: redirect to bKash / Nagad / SSLCommerz here when payment !== "cod"
  return NextResponse.json({ code, subtotal, shipping, total }, { status: 201 });
}
