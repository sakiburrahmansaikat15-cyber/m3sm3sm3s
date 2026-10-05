import { NextResponse } from "next/server";
import { adminOrNull } from "@/server/auth";
import { saveUpload } from "@/server/uploads";
import { db, schema } from "@/server/db";

export const dynamic = "force-dynamic";

/** POST multipart/form-data { file } → { url, kind, ... } */
export async function POST(req: Request) {
  if (!(await adminOrNull())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
    const saved = await saveUpload(file);
    const [res] = await db.insert(schema.media).values(saved);
    return NextResponse.json({ id: Number(res.insertId), ...saved });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
