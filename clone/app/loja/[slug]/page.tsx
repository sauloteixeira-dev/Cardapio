import { notFound } from "next/navigation";
import { getStoreBySlug, listBestSellers, listCategories, listProducts } from "@/lib/data";
import { MenuClient } from "./menu-client";

// S01/S02 do recon.md.
export default async function StoreHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const [categories, products, bestSellers] = await Promise.all([
    listCategories(store.id),
    listProducts(store.id),
    listBestSellers(store.id),
  ]);

  return <MenuClient store={store} categories={categories} products={products} bestSellers={bestSellers} />;
}
