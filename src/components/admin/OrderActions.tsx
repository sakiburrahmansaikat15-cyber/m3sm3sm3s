"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES } from "@/lib/types";
import { deleteOrderAction, setOrderStatusAction } from "@/app/admin/actions";
import { SelectField } from "./fields";

export default function OrderActions({ id, status, phone }: { id: number; status: string; phone: string }) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 p-5">
      <SelectField
        label="Status"
        value={value}
        onChange={(v) => {
          setValue(v);
          start(async () => {
            await setOrderStatusAction(id, v);
            router.refresh();
          });
        }}
        options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))}
      />
      <a href={`tel:${phone}`} className="block rounded-md border border-white/15 py-2 text-center text-sm">
        Call customer
      </a>
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (!confirm("Delete this order permanently?")) return;
            await deleteOrderAction(id);
            router.push("/admin/orders");
          })
        }
        className="w-full rounded-md border border-red-400/30 py-2 text-sm text-red-300"
      >
        Delete order
      </button>
    </div>
  );
}
