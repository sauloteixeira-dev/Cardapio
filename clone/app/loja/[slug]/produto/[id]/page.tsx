import { notFound } from "next/navigation";
import { getProduct, getStoreBySlug } from "@/lib/data";
import { ProductClient } from "./product-client";

// S03/S04 do recon.md.
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  const product = await getProduct(store.id, id);
  if (!product) notFound();

  return <ProductClient storeSlug={slug} product={product} />;
}
