import { NextResponse } from "next/server";
import { db, hasDatabase, schema } from "@/server/db";
import { subscribeInput } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const parsed = subscribeInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  if (!hasDatabase()) return NextResponse.json({ ok: true, demo: true });
  await db.insert(schema.subscribers).values({ email: parsed.data.email }).onDuplicateKeyUpdate({ set: { email: parsed.data.email } });
  return NextResponse.json({ ok: true });
}
