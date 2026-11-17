import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/data";
import { CartProvider } from "@/lib/cart-store";
import { StoreShell } from "./store-shell";

// Casca de toda a área do cliente final (S01 a S11): carrega a loja pelo slug uma vez e
// deixa o carrinho disponível para as telas filhas, do jeito que replica-build > Passo 1 pede.
export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  return (
    <CartProvider storeSlug={slug}>
      <StoreShell accentColor={store.accentColor}>{children}</StoreShell>
    </CartProvider>
  );
}
