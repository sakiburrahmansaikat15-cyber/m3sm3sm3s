import { desc } from "drizzle-orm";
import { db, schema } from "@/server/db";
import PageHeader from "@/components/admin/PageHeader";
import SubscriberRow from "@/components/admin/SubscriberRow";

export const metadata = { title: "Subscribers" };

export default async function SubscribersPage() {
  const rows = await db.select().from(schema.subscribers).orderBy(desc(schema.subscribers.id)).limit(5000);
  return (
    <>
      <PageHeader title="Subscribers" desc={`${rows.length} people joined from the homepage newsletter form.`}>
        <a href="/api/admin/subscribers" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">
          Download CSV
        </a>
      </PageHeader>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        {rows.map((r) => (
          <SubscriberRow key={r.id} id={r.id} email={r.email} date={new Date(r.createdAt).toLocaleString("en-GB")} />
        ))}
        {rows.length === 0 && <p className="px-4 py-8 text-sm text-white/50">No subscribers yet.</p>}
      </div>
    </>
  );
}
