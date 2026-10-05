// Creates all tables from database/schema.sql (safe to run again).
// Usage:  DATABASE_URL=mysql://user:pass@host/db npm run db:setup
// Demo content + first admin are created from /admin/login on first visit.
import { readFileSync, existsSync } from "node:fs";
import mysql from "mysql2/promise";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (add it to .env)");
  process.exit(1);
}
const sql = readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8");
const conn = await mysql.createConnection({ uri: url, multipleStatements: true });
await conn.query(sql);
const [rows] = await conn.query("SHOW TABLES");
console.log("✓ tables:", rows.map((r) => Object.values(r)[0]).join(", "));
await conn.end();
