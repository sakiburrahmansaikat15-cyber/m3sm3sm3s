import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { taka } from "@/lib/format";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";

export const metadata = { title: "Dashboard" };

async function stats() {
  const [[p], [o], [s], recent] = await Promise.all([
    db.select({ n: sql<number>`count(*)`, live: sql<number>`sum(${schema.products.published})` }).from(schema.products),
    db
      .select({
        n: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(case when ${schema.orders.status} <> 'cancelled' then ${schema.orders.total} else 0 end),0)`,
        pending: sql<number>`coalesce(sum(${schema.orders.status} = 'pending'),0)`,
      })
      .from(schema.orders),
    db.select({ n: sql<number>`count(*)` }).from(schema.subscribers),
    db.select().from(schema.orders).orderBy(desc(schema.orders.id)).limit(8),
  ]);
  return { p, o, s, recent };
}

export default async function Dashboard() {
  const { p, o, s, recent } = await stats();
  const tiles = [
    { label: "Products live", value: `${Number(p.live ?? 0)} / ${Number(p.n)}`, href: "/admin/products" },
    { label: "Orders", value: String(Number(o.n)), href: "/admin/orders" },
    { label: "Pending orders", value: String(Number(o.pending)), href: "/admin/orders?status=pending" },
    { label: "Revenue (not cancelled)", value: taka(Number(o.revenue)), href: "/admin/orders" },
    { label: "Subscribers", value: String(Number(s.n)), href: "/admin/subscribers" },
  ];
  return (
    <>
      <PageHeader title="Dashboard" desc="Everything on the website is editable from here." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/30">
            <p className="text-xs text-white/50">{t.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{t.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <h2 className="font-semibold">Latest orders</h2>
            <Link href="/admin/orders" className="text-xs text-white/50 hover:text-white">
              All orders →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-8 text-sm text-white/50">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${r.id}`} className="font-mono text-xs hover:underline">
                        {r.code}
                      </Link>
                    </td>
                    <td className="px-2 py-3">{r.name}</td>
                    <td className="px-2 py-3 tabular-nums">{taka(r.total)}</td>
                    <td className="px-5 py-3 text-right">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="mb-2 font-semibold">Quick actions</h2>
          {[
            ["/admin/products/new", "Add a product"],
            ["/admin/homepage", "Edit homepage sections"],
            ["/admin/homepage?tab=poses", "Adjust 3D poses"],
            ["/admin/settings", "Brand, theme & delivery"],
            ["/admin/media", "Upload GLB / SVG / images"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="block rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/30">
              {label} →
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
