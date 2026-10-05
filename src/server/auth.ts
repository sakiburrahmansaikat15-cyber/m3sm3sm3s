import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

export async function getAdmin() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Use at the top of every admin server action / page. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** For route handlers: returns null when not signed in. */
export async function adminOrNull() {
  return getAdmin();
}

export async function adminCount() {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(schema.admins);
  return Number(row?.n ?? 0);
}

export async function startSession(admin: { id: number; email: string; name: string }) {
  const token = await signSession({ sub: String(admin.id), email: admin.email, name: admin.name });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function checkLogin(email: string, password: string) {
  const [row] = await db.select().from(schema.admins).where(eq(schema.admins.email, email.toLowerCase().trim())).limit(1);
  if (!row) {
    await bcrypt.compare(password, "$2b$12$VvlBFvtonyJ5posw1hVs7ekPcsX9IXyCHLXo9bDxXzaYlt/Is4lTK"); // equalise timing
    return null;
  }
  return (await bcrypt.compare(password, row.passwordHash)) ? row : null;
}

export async function createAdmin(email: string, password: string, name: string) {
  const hash = await bcrypt.hash(password, 12);
  const [res] = await db.insert(schema.admins).values({ email: email.toLowerCase().trim(), passwordHash: hash, name });
  return { id: Number(res.insertId), email: email.toLowerCase().trim(), name };
}

export async function changePassword(id: number, current: string, next: string) {
  const [row] = await db.select().from(schema.admins).where(eq(schema.admins.id, id)).limit(1);
  if (!row || !(await bcrypt.compare(current, row.passwordHash))) return false;
  await db.update(schema.admins).set({ passwordHash: await bcrypt.hash(next, 12) }).where(eq(schema.admins.id, id));
  return true;
}
