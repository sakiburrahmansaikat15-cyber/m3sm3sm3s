import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { ORDER_STATUSES } from "@/lib/types";
import { taka, cx } from "@/lib/format";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const q = db.select().from(schema.orders).orderBy(desc(schema.orders.id)).limit(500);
  const rows = status ? await q.where(eq(schema.orders.status, status)) : await q;
  return (
    <>
      <PageHeader title="Orders" desc="Newest first. Click an order to see items and change its status." />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["", ...ORDER_STATUSES].map((s) => (
          <Link key={s} href={s ? `/admin/orders?status=${s}` : "/admin/orders"} className={cx("rounded-md px-3 py-1.5 text-sm capitalize", (status ?? "") === s ? "bg-white text-black" : "text-white/60 hover:bg-white/5")}>
            {s || "All"}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-2 py-3">Customer</th>
              <th className="px-2 py-3">Phone</th>
              <th className="px-2 py-3">Payment</th>
              <th className="px-2 py-3">Total</th>
              <th className="px-2 py-3">Date</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${r.id}`} className="font-mono text-xs underline-offset-2 hover:underline">
                    {r.code}
                  </Link>
                </td>
                <td className="px-2 py-3">{r.name}</td>
                <td className="px-2 py-3 font-mono text-xs">{r.phone}</td>
                <td className="px-2 py-3 uppercase">{r.payment}</td>
                <td className="px-2 py-3 tabular-nums">{taka(r.total)}</td>
                <td className="px-2 py-3 text-xs text-white/60">{new Date(r.createdAt).toLocaleString("en-GB")}</td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-8 text-sm text-white/50">No orders.</p>}
      </div>
    </>
  );
}
