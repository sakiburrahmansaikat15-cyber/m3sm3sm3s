import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getSiteData } from "@/server/content";
import ProductView from "@/components/product/ProductView";
import ShopGrid from "@/components/home/ShopGrid";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${p.combo}`,
    description: `${p.tagline} ${p.description}`.trim(),
    openGraph: p.gallery[0] ? { images: [p.gallery[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const { products } = await getSiteData();
  const i = products.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = products[i];
  const related = [1, 2, 3].map((k) => products[(i + k) % products.length]).filter((x, j, a) => x.slug !== slug && a.indexOf(x) === j);

  return (
    <>
      <ProductView product={p} />
      {related.length > 0 && (
        <div className="pt-24">
          <ShopGrid items={related} title="You may also like" kicker="More drops" />
        </div>
      )}
    </>
  );
}
