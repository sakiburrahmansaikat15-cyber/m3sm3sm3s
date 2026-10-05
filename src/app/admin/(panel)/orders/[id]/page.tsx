import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { taka } from "@/lib/format";
import PageHeader from "@/components/admin/PageHeader";
import OrderActions from "@/components/admin/OrderActions";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, Number(id))).limit(1);
  if (!order) notFound();
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  const rows: [string, string][] = [
    ["Name", order.name],
    ["Phone", order.phone],
    ["Email", order.email || "—"],
    ["Address", order.address],
    ["City", order.city || "—"],
    ["Zone", order.zone],
    ["Payment", order.payment.toUpperCase()],
    ["Placed", new Date(order.createdAt).toLocaleString("en-GB")],
    ["Note", order.note || "—"],
  ];
  return (
    <>
      <PageHeader title={`Order ${order.code}`}>
        <Link href="/admin/orders" className="rounded-lg border border-white/15 px-3 py-2 text-sm">
          ← All orders
        </Link>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-2 py-3">Size</th>
                <th className="px-2 py-3">Qty</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    {i.name} <span className="text-xs text-white/40">/{i.slug}</span>
                  </td>
                  <td className="px-2 py-3">{i.size}</td>
                  <td className="px-2 py-3">
                    {i.qty} × {taka(i.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{taka(i.qty * i.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="text-sm">
              <tr><td colSpan={3} className="px-4 pt-3 text-right text-white/60">Subtotal</td><td className="px-4 pt-3 text-right tabular-nums">{taka(order.subtotal)}</td></tr>
              <tr><td colSpan={3} className="px-4 text-right text-white/60">Delivery</td><td className="px-4 text-right tabular-nums">{taka(order.shipping)}</td></tr>
              <tr><td colSpan={3} className="px-4 pb-4 text-right font-semibold">Total</td><td className="px-4 pb-4 text-right text-lg font-bold tabular-nums">{taka(order.total)}</td></tr>
            </tfoot>
          </table>
        </section>
        <aside className="space-y-4">
          <OrderActions id={order.id} status={order.status} phone={order.phone} />
          <dl className="space-y-2 rounded-2xl border border-white/10 p-5 text-sm">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-white/40">{k}</dt>
                <dd className="whitespace-pre-line">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </>
  );
}
