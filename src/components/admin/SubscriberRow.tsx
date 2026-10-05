"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSubscriberAction } from "@/app/admin/actions";

export default function SubscriberRow({ id, email, date }: { id: number; email: string; date: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex items-center gap-4 border-b border-white/5 px-4 py-2.5 text-sm last:border-0">
      <a href={`mailto:${email}`} className="flex-1 truncate hover:underline">
        {email}
      </a>
      <span className="text-xs text-white/40">{date}</span>
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (!confirm(`Remove ${email}?`)) return;
            await deleteSubscriberAction(id);
            router.refresh();
          })
        }
        className="text-xs text-red-300/70 hover:text-red-300"
      >
        Remove
      </button>
    </div>
  );
}
