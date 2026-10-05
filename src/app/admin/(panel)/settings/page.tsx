import { Suspense } from "react";
import { loadSettings } from "@/server/content";
import PageHeader from "@/components/admin/PageHeader";
import Tabs from "@/components/admin/Tabs";
import SeedButton from "@/components/admin/SeedButton";
import {
  BrandEditor,
  LinksEditor,
  PaymentsEditor,
  SeoEditor,
  ShippingEditor,
  ShopEditor,
  ThemeEditor,
} from "@/components/admin/editors";

export const metadata = { title: "Site settings" };

const TABS = [
  { id: "brand", label: "Brand" },
  { id: "theme", label: "Theme & 3D" },
  { id: "seo", label: "SEO" },
  { id: "menu", label: "Menu" },
  { id: "socials", label: "Social links" },
  { id: "legal", label: "Legal links" },
  { id: "shipping", label: "Delivery" },
  { id: "payments", label: "Payments" },
  { id: "shop", label: "Shop page" },
];

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "brand" } = await searchParams;
  const s = await loadSettings();
  return (
    <>
      <PageHeader title="Site settings" desc="Global content used on every page.">
        <SeedButton />
      </PageHeader>
      <Suspense>
        <Tabs tabs={TABS} base="/admin/settings" />
      </Suspense>
      {tab === "brand" && <BrandEditor key="brand" initial={s.brand} />}
      {tab === "theme" && <ThemeEditor key="theme" initial={s.theme} />}
      {tab === "seo" && <SeoEditor key="seo" initial={s.seo} />}
      {tab === "menu" && <LinksEditor key="nav" group="nav" initial={s.nav} title="Menu" desc="Links in the full-screen menu." />}
      {tab === "socials" && <LinksEditor key="socials" group="socials" initial={s.socials} title="Social links" desc="Shown in the menu and footers." />}
      {tab === "legal" && <LinksEditor key="legal" group="legal" initial={s.legal} title="Legal links" desc="Shown in the footer bars." />}
      {tab === "shipping" && <ShippingEditor key="shipping" initial={s.shipping} />}
      {tab === "payments" && <PaymentsEditor key="payments" initial={s.payments} />}
      {tab === "shop" && <ShopEditor key="shop" initial={s.shop} />}
    </>
  );
}
