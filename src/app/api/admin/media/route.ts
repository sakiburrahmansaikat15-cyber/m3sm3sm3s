import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { adminOrNull } from "@/server/auth";
import { db, schema } from "@/server/db";
import { deleteUploadByUrl } from "@/server/uploads";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await adminOrNull())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const kind = new URL(req.url).searchParams.get("kind");
  const q = db.select().from(schema.media).orderBy(desc(schema.media.id)).limit(300);
  const rows = kind ? await q.where(eq(schema.media.kind, kind)) : await q;
  return NextResponse.json(rows);
}

export async function DELETE(req: Request) {
  if (!(await adminOrNull())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  const [row] = await db.select().from(schema.media).where(eq(schema.media.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteUploadByUrl(row.url);
  await db.delete(schema.media).where(eq(schema.media.id, id));
  return NextResponse.json({ ok: true });
}
