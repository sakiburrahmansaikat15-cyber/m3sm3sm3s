import Link from "next/link";
import { loadProducts } from "@/server/content";
import PageHeader from "@/components/admin/PageHeader";
import ProductTable from "@/components/admin/ProductTable";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const products = await loadProducts({ all: true });
  return (
    <>
      <PageHeader title="Products" desc="Drag order, publish, duplicate or edit. The homepage carousel uses this order.">
        <Link href="/admin/products/new" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">
          + New product
        </Link>
      </PageHeader>
      <ProductTable products={products} />
    </>
  );
}
