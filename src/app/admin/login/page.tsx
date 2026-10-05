import { redirect } from "next/navigation";
import { adminCount, getAdmin } from "@/server/auth";
import { hasDatabase } from "@/server/db";
import LoginForm from "./LoginForm";

export const metadata = { title: "Admin" };

export default async function LoginPage() {
  if (await getAdmin().catch(() => null)) redirect("/admin");
  let mode: "login" | "setup" | "nodb" = "login";
  let error = "";
  if (!hasDatabase()) mode = "nodb";
  else {
    try {
      mode = (await adminCount()) === 0 ? "setup" : "login";
    } catch (e) {
      mode = "nodb";
      error = (e as Error).message;
    }
  }
  return (
    <main className="grid min-h-svh place-items-center bg-neutral-950 px-4 text-white">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.4em] text-white/50">Admin panel</p>
        {mode === "nodb" ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm">
            <p className="font-semibold text-red-300">Database not connected</p>
            <p className="mt-2 text-white/70">
              Set <code className="rounded bg-black/40 px-1">DATABASE_URL</code> and <code className="rounded bg-black/40 px-1">AUTH_SECRET</code> in your environment,
              then import <code className="rounded bg-black/40 px-1">database/schema.sql</code> in phpMyAdmin (see DEPLOY-CPANEL.md).
            </p>
            {error && <p className="mt-3 break-words font-mono text-xs text-red-300/80">{error}</p>}
          </div>
        ) : (
          <LoginForm mode={mode} />
        )}
      </div>
    </main>
  );
}
