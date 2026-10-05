import { cx } from "@/lib/format";

const COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  confirmed: "bg-sky-500/15 text-sky-300",
  shipped: "bg-violet-500/15 text-violet-300",
  delivered: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-red-500/15 text-red-300",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={cx("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", COLORS[status] ?? "bg-white/10")}>{status}</span>;
}
