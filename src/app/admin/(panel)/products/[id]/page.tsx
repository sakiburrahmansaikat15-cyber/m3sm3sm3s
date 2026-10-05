import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { rowToProduct } from "@/server/content";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(schema.products).where(eq(schema.products.id, Number(id))).limit(1);
  if (!row) notFound();
  const { id: pid, ...product } = rowToProduct(row);
  return (
    <>
      <PageHeader title={product.name} desc={`/product/${product.slug}`} />
      <ProductForm key={pid} id={pid} initial={product} />
    </>
  );
}
