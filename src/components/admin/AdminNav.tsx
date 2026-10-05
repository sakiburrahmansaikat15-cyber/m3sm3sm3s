"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/admin/actions";
import { cx } from "@/lib/format";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "◎" },
  { href: "/admin/products", label: "Products", icon: "◧" },
  { href: "/admin/homepage", label: "Homepage", icon: "▤" },
  { href: "/admin/settings", label: "Site settings", icon: "⚙" },
  { href: "/admin/media", label: "Media library", icon: "▦" },
  { href: "/admin/orders", label: "Orders", icon: "◫" },
  { href: "/admin/subscribers", label: "Subscribers", icon: "✉" },
  { href: "/admin/account", label: "Account", icon: "◉" },
];

export default function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-neutral-950/90 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-semibold">Admin</span>
        <button onClick={() => setOpen((o) => !o)} className="rounded-md border border-white/15 px-3 py-1 text-sm">
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-white/10 bg-neutral-950 p-4 transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link href="/admin" className="mb-6 block px-2 pt-2">
          <p className="text-lg font-bold tracking-tight">Store admin</p>
          <p className="truncate text-xs text-white/40">{name}</p>
        </Link>
        <nav className="flex-1 space-y-0.5">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cx("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition", active(n.href) ? "bg-white text-black" : "text-white/70 hover:bg-white/5 hover:text-white")}
            >
              <span className="w-4 text-center">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 pt-3">
          <a href="/" target="_blank" className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5">
            View site ↗
          </a>
          <form action={logoutAction}>
            <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5">Sign out</button>
          </form>
        </div>
      </aside>
    </>
  );
}
