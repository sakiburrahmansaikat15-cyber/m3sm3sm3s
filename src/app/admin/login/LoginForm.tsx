"use client";

import { useActionState } from "react";
import { loginAction, setupAction } from "../actions";
import { inputCls } from "@/components/admin/fields";

export default function LoginForm({ mode }: { mode: "login" | "setup" }) {
  const [state, action, pending] = useActionState(mode === "setup" ? setupAction : loginAction, null);
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <h1 className="text-xl font-semibold">{mode === "setup" ? "Create the first admin" : "Sign in"}</h1>
        {mode === "setup" && <p className="mt-1 text-sm text-white/50">This screen only appears once, while no admin exists.</p>}
      </div>
      {mode === "setup" && <input name="name" placeholder="Your name" className={inputCls} required />}
      <input name="email" type="email" placeholder="Email" autoComplete="username" className={inputCls} required />
      <input name="password" type="password" placeholder="Password" autoComplete={mode === "setup" ? "new-password" : "current-password"} className={inputCls} required minLength={mode === "setup" ? 8 : 1} />
      {mode === "setup" && (
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="seed" defaultChecked className="accent-white" /> Load demo products &amp; content
        </label>
      )}
      {state && !state.ok && <p className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black disabled:opacity-60">
        {pending ? "Please wait…" : mode === "setup" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
