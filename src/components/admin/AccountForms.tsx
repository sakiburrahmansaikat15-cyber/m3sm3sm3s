"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addAdminAction, changePasswordAction, deleteAdminAction } from "@/app/admin/actions";
import { Card, inputCls } from "./fields";

export default function AccountForms({ admins, meId }: { admins: { id: number; email: string; name: string }[]; meId: number }) {
  const [pwState, pwAction, pwPending] = useActionState(changePasswordAction, null);
  const [addState, addAction, addPending] = useActionState(addAdminAction, null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const Msg = ({ s }: { s: typeof pwState }) =>
    s ? <p className={`rounded-md px-3 py-2 text-sm ${s.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{s.ok ? s.message : s.error}</p> : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Change password">
        <form action={pwAction} className="space-y-3">
          <input name="current" type="password" placeholder="Current password" autoComplete="current-password" className={inputCls} required />
          <input name="next" type="password" placeholder="New password (8+ characters)" autoComplete="new-password" className={inputCls} required minLength={8} />
          <Msg s={pwState} />
          <button disabled={pwPending} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
            Update password
          </button>
        </form>
      </Card>

      <Card title="Admins" desc="Everyone here can edit the whole site.">
        <ul className="space-y-1.5">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm">
              <span>
                {a.name || a.email} <span className="text-white/40">{a.email}</span>
              </span>
              {a.id !== meId && (
                <button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      if (!confirm(`Remove ${a.email}?`)) return;
                      await deleteAdminAction(a.id);
                      router.refresh();
                    })
                  }
                  className="text-xs text-red-300/70 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        <form action={addAction} className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold">Add an admin</p>
          <input name="name" placeholder="Name" className={inputCls} required />
          <input name="email" type="email" placeholder="Email" className={inputCls} required />
          <input name="password" type="password" placeholder="Password (8+ characters)" autoComplete="new-password" className={inputCls} required minLength={8} />
          <Msg s={addState} />
          <button disabled={addPending} className="rounded-lg border border-white/20 px-4 py-2 text-sm">
            Add admin
          </button>
        </form>
      </Card>
    </div>
  );
}
