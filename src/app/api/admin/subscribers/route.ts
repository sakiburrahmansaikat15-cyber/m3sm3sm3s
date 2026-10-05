import { desc } from "drizzle-orm";
import { adminOrNull } from "@/server/auth";
import { db, schema } from "@/server/db";

export const dynamic = "force-dynamic";

/** CSV export of newsletter subscribers */
export async function GET() {
  if (!(await adminOrNull())) return new Response("Unauthorized", { status: 401 });
  const rows = await db.select().from(schema.subscribers).orderBy(desc(schema.subscribers.id));
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = ["email,joined", ...rows.map((r) => `${esc(r.email)},${new Date(r.createdAt).toISOString()}`)].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
