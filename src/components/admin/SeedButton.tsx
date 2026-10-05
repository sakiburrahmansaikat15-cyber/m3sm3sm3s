"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { seedDemoAction } from "@/app/admin/actions";

export default function SeedButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (!confirm("Add demo products/content where the database is empty? Existing content is not changed.")) return;
          await seedDemoAction();
          router.refresh();
        })
      }
      className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:border-white/40"
    >
      {pending ? "Adding…" : "Fill missing demo content"}
    </button>
  );
}
