import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { emptyProduct } from "@/lib/defaults";
import { loadProducts } from "@/server/content";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const all = await loadProducts({ all: true });
  return (
    <>
      <PageHeader title="New product" />
      <ProductForm id={null} initial={{ ...emptyProduct, sortOrder: all.length }} />
    </>
  );
}
