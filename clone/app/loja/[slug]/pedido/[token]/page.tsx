import { notFound } from "next/navigation";
import { getOrderByToken, getStoreBySlug } from "@/lib/data";
import { OrderClient } from "./order-client";

// S11 (nova) do recon.md / architecture.md.
export default async function OrderPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  const order = await getOrderByToken(token);
  if (!order || order.storeId !== store.id) notFound();

  return <OrderClient store={store} order={order} />;
}
