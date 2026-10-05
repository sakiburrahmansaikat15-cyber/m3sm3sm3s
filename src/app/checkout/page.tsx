"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cx, taka } from "@/lib/format";
import { cartSubtotal, useCart } from "@/store/cart";
import { useProductMap, useSettings } from "@/components/providers/SiteData";
import TeeFlat from "@/components/product/TeeFlat";

type Form = { name: string; phone: string; email: string; address: string; city: string; zone: "inside" | "outside"; note: string };

export default function CheckoutPage() {
  const site = useSettings();
  const map = useProductMap();
  const { lines, clear } = useCart();
  const payments = site.payments.filter((p) => p.enabled);
  const [mounted, setMounted] = useState(false);
  const [pay, setPay] = useState(payments[0]?.id ?? "cod");
  const [form, setForm] = useState<Form>({ name: "", phone: "", email: "", address: "", city: "Dhaka", zone: "inside", note: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<{ code: string; total: number } | null>(null);
  useEffect(() => setMounted(true), []);

  const valid = lines.filter((l) => map.has(l.slug));
  const subtotal = cartSubtotal(valid, map);
  const s = site.shipping;
  const shipping = subtotal >= s.freeOver || subtotal === 0 ? 0 : form.zone === "inside" ? s.insideDhaka : s.outsideDhaka;
  const total = subtotal + shipping;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, payment: pay, lines: valid }),
      });
      const data = await res.json();
      if (!res.ok) {
        const f = (data.fields ?? {}) as Record<string, string[]>;
        setErrors(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v[0]])));
        setFormError(data.error ?? "Something went wrong");
        return;
      }
      setOrder({ code: data.code, total: data.total });
      clear();
      window.scrollTo({ top: 0 });
    } catch {
      setFormError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!mounted) return <section className="min-h-svh" />;

  if (order) {
    return (
      <section className="grid min-h-svh place-items-center px-4 pt-24 text-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Order {order.code}</p>
          <h1 className="display mt-4 text-[12vw] md:text-[7vw]">Thank you!</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-white/80">
            Your order ({taka(order.total)}) is confirmed. We&apos;ll call {form.phone} to verify and send tracking by SMS.
          </p>
          <Link href="/shop" className="btn btn-ink mt-8">
            Keep shopping
          </Link>
        </div>
      </section>
    );
  }

  if (valid.length === 0) {
    return (
      <section className="grid min-h-svh place-items-center px-4 pt-24 text-center">
        <div>
          <h1 className="display text-5xl md:text-7xl">Your bag is empty</h1>
          <Link href="/shop" className="btn btn-ink mt-6">
            Shop the drop →
          </Link>
        </div>
      </section>
    );
  }

  const field = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest">{label}</span>
      <input
        value={form[k]}
        onChange={(e) => set(k, e.target.value as never)}
        className={cx(
          "w-full rounded-xl border-2 bg-white/[0.06] px-4 py-3 outline-none transition-colors focus:border-white",
          errors[k] ? "border-red-500" : "border-transparent",
        )}
        {...props}
      />
      {errors[k] && <span className="mt-1 block text-xs text-red-400">{errors[k]}</span>}
    </label>
  );

  return (
    <section className="px-4 pb-24 pt-36 md:px-16 md:pt-44">
      <h1 className="display text-[12vw] md:text-[6vw]">Checkout</h1>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <fieldset className="rounded-2xl bg-white/[0.05] p-5 md:p-8">
            <legend className="display float-left mb-6 w-full text-3xl">01 · Contact</legend>
            <div className="clear-both grid gap-4 sm:grid-cols-2">
              {field("name", "Full name", { autoComplete: "name" })}
              {field("phone", "Mobile number", { autoComplete: "tel", inputMode: "tel", placeholder: "01XXXXXXXXX" })}
              <div className="sm:col-span-2">{field("email", "Email (optional)", { type: "email", autoComplete: "email" })}</div>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl bg-white/[0.05] p-5 md:p-8">
            <legend className="display float-left mb-6 w-full text-3xl">02 · Delivery</legend>
            <div className="clear-both space-y-4">
              {field("address", "Address", { autoComplete: "street-address", placeholder: "House, road, area" })}
              {field("city", "City / District", { autoComplete: "address-level2" })}
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["inside", s.insideLabel, s.insideDhaka, s.insideEta],
                    ["outside", s.outsideLabel, s.outsideDhaka, s.outsideEta],
                  ] as const
                ).map(([id, label, fee, eta]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => set("zone", id)}
                    className={cx("rounded-xl border-2 p-4 text-left transition-colors", form.zone === id ? "border-white bg-white/[0.08]" : "border-transparent bg-white/[0.03]")}
                  >
                    <span className="block font-bold">{label}</span>
                    <span className="text-sm text-white/60">
                      {subtotal >= s.freeOver ? "Free" : taka(fee)} · {eta}
                    </span>
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest">Order note (optional)</span>
                <textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={3} className="w-full rounded-xl border-2 border-transparent bg-white/[0.06] px-4 py-3 outline-none focus:border-white" />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl bg-white/[0.05] p-5 md:p-8">
            <legend className="display float-left mb-6 w-full text-3xl">03 · Payment</legend>
            <div className="clear-both grid gap-2 sm:grid-cols-2">
              {payments.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPay(m.id)}
                  className={cx("flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors", pay === m.id ? "border-white bg-white/[0.08]" : "border-transparent bg-white/[0.03]")}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-white">
                    {pay === m.id && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                  </span>
                  <span>
                    <span className="block font-bold">{m.label}</span>
                    <span className="text-sm text-white/60">{m.note}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.05] p-6 md:p-8 lg:sticky lg:top-28 lg:col-span-5">
          <p className="display text-3xl">Order summary</p>
          <ul className="mt-6 space-y-3">
            {valid.map((l) => {
              const p = map.get(l.slug)!;
              return (
                <li key={l.slug + l.size} className="flex items-center gap-3">
                  <span className="relative h-16 w-16 shrink-0 rounded-xl p-1" style={{ background: p.bg }}>
                    <TeeFlat product={p} />
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-black">{l.qty}</span>
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold">{p.name}</span>
                    <span className="text-xs text-white/50">Size {l.size}</span>
                  </span>
                  <span className="font-bold">{taka(p.price * l.qty)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-white/15 pt-6 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{taka(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{shipping ? taka(shipping) : "Free"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-end justify-between border-t border-white/15 pt-4">
            <span className="text-sm uppercase tracking-widest">Total</span>
            <span className="display text-4xl">{taka(total)}</span>
          </div>
          {formError && <p className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{formError}</p>}
          <button type="submit" disabled={busy} className="btn btn-ink mt-6 h-14 w-full disabled:opacity-60">
            {busy ? "Placing order…" : `Place order · ${taka(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-white/50">By placing your order you agree to our terms.</p>
        </aside>
      </form>
    </section>
  );
}
