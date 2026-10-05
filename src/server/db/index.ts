import "server-only";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";

/**
 * One connection pool per server process (survives hot reloads in dev).
 * Configure with DATABASE_URL=mysql://user:pass@host:3306/dbname
 */
type DB = MySql2Database<typeof schema>;
const g = globalThis as unknown as { __m3sPool?: mysql.Pool; __m3sDb?: DB };

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function pool() {
  if (!g.__m3sPool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    g.__m3sPool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: Number(process.env.DATABASE_POOL ?? 5),
      waitForConnections: true,
      charset: "utf8mb4",
    });
  }
  return g.__m3sPool;
}

/** Lazily created so builds without DATABASE_URL still succeed. */
export const db = new Proxy({} as DB, {
  get(_t, prop) {
    if (!g.__m3sDb) g.__m3sDb = drizzle(pool(), { schema, mode: "default" }) as unknown as DB;
    const real = g.__m3sDb;
    return Reflect.get(real, prop, real);
  },
});

export { schema };
