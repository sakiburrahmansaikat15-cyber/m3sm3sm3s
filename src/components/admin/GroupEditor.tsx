"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/types";
import { resetSettingsAction, saveSettingsAction } from "@/app/admin/actions";
import { cx } from "@/lib/format";

/**
 * Wraps one settings group (brand, faq, poses …): keeps a local draft,
 * shows a sticky save bar when it changes and saves via a server action.
 */
export function GroupEditor<K extends keyof SiteSettings>({
  group,
  initial,
  children,
  preview = "/",
}: {
  group: K;
  initial: SiteSettings[K];
  children: (value: SiteSettings[K], set: (v: SiteSettings[K]) => void) => React.ReactNode;
  preview?: string;
}) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const dirty = JSON.stringify(value) !== saved;

  const save = () =>
    start(async () => {
      const r = await saveSettingsAction(group, value);
      if (r.ok) {
        setSaved(JSON.stringify(value));
        setMsg({ ok: true, text: "Saved — live on the site" });
      } else setMsg({ ok: false, text: r.error });
      router.refresh();
    });

  const reset = () =>
    start(async () => {
      if (!confirm("Reset this section to the default content?")) return;
      await resetSettingsAction(group);
      router.refresh();
      setMsg({ ok: true, text: "Reset to defaults — reloading…" });
      setTimeout(() => location.reload(), 400);
    });

  return (
    <div className="pb-24">
      {children(value, (v) => {
        setValue(v);
        setMsg(null);
      })}
      <div
        className={cx(
          "fixed bottom-4 left-1/2 z-40 flex w-[min(640px,calc(100%-2rem))] -translate-x-1/2 items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 shadow-2xl backdrop-blur transition md:left-[calc(50%+120px)]",
          dirty || msg ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <p className={cx("flex-1 text-sm", msg ? (msg.ok ? "text-emerald-400" : "text-red-400") : "text-white/70")}>
          {msg ? msg.text : "You have unsaved changes"}
        </p>
        <a href={preview} target="_blank" className="hidden text-xs text-white/50 underline sm:inline">
          Preview
        </a>
        <button type="button" onClick={reset} disabled={pending} className="rounded-md px-3 py-1.5 text-xs text-white/60 hover:text-white">
          Reset
        </button>
        {dirty && (
          <button type="button" onClick={() => { setValue(JSON.parse(saved)); setMsg(null); }} className="rounded-md border border-white/15 px-3 py-1.5 text-xs">
            Discard
          </button>
        )}
        <button type="button" onClick={save} disabled={!dirty || pending} className="rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-black disabled:opacity-40">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
