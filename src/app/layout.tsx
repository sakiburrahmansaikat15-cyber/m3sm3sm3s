import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getSiteData } from "@/server/content";
import { SiteDataProvider } from "@/components/providers/SiteData";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";

// Content comes from MySQL and is editable in /admin → always render fresh.
export const dynamic = "force-dynamic";

const display = localFont({
  src: "./fonts/Archivo-Wide-Italic.woff2",
  weight: "100 900",
  style: "italic",
  variable: "--font-archivo",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});
const geist = localFont({ src: "./fonts/Geist-Variable.woff2", weight: "100 900", variable: "--font-geist", display: "swap" });
const mono = localFont({ src: "./fonts/GeistMono-Variable.woff2", weight: "100 900", variable: "--font-geist-mono", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData();
  const { seo, brand } = settings;
  return {
    title: { default: seo.title || brand.name, template: `%s — ${brand.name}` },
    description: seo.description || brand.description,
    icons: { icon: brand.faviconUrl || "/favicon.svg" },
    openGraph: {
      title: seo.title || brand.name,
      description: seo.description || brand.description,
      type: "website",
      images: seo.ogImageUrl ? [seo.ogImageUrl] : undefined,
    },
  };
}

export const viewport: Viewport = { themeColor: "#000000" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings, products } = await getSiteData();
  const themeVars = {
    "--site-bg": settings.theme.background,
    "--accent": settings.theme.accent,
  } as React.CSSProperties;

  return (
    <html lang="en" className={`${display.variable} ${geist.variable} ${mono.variable}`} style={themeVars}>
      <body>
        <SiteDataProvider value={{ settings, products }}>
          <SmoothScroll />
          <Header />
          <CartDrawer />
          <main>{children}</main>
          <Footer />
        </SiteDataProvider>
      </body>
    </html>
  );
}
