"use client";

import { useMemo, useState } from "react";
import { BottomBar } from "@/components/BottomBar";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ProductRow } from "@/components/ProductRow";
import { StoreHeader } from "@/components/StoreHeader";
import { useCart } from "@/lib/cart-store";
import type { Category, Product, Store } from "@/lib/types";

// S01 (cabeçalho + "Os mais pedidos") e S02 (lista por categoria) do recon.md: no original
// são a mesma página rolando/filtrando, então aqui também é uma página só com abas.
export function MenuClient({
  store,
  categories,
  products,
  bestSellers,
}: {
  store: Store;
  categories: Category[];
  products: Product[];
  bestSellers: Product[];
}) {
  const [activeId, setActiveId] = useState<string | "all">("all");
  const { itemCount } = useCart();

  const visible = useMemo(() => {
    if (activeId === "all") return null; // "all" mostra a seção de mais pedidos, não a lista
    return products.filter((p) => p.categoryId === activeId);
  }, [activeId, products]);

  return (
    <>
      <StoreHeader store={store} />
      <CategoryTabs categories={categories} activeId={activeId} onChange={setActiveId} />

      {activeId === "all" ? (
        <section aria-labelledby="mais-pedidos-title" className="py-4">
          <h2 id="mais-pedidos-title" className="font-bold px-4 mb-2">
            Os mais pedidos
          </h2>
          {bestSellers.length === 0 ? (
            <p className="px-4 text-sm text-muted">Nenhum produto em destaque ainda.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto px-4 pb-1">
              {bestSellers.map((p) => (
                <ProductRow key={p.id} storeSlug={store.slug} product={p} />
              ))}
            </div>
          )}
          <h2 className="font-bold px-4 mt-4 mb-2">Todos os produtos</h2>
          {products.map((p) => (
            <ProductRow key={p.id} storeSlug={store.slug} product={p} />
          ))}
        </section>
      ) : (
        <section aria-label="Produtos da categoria">
          {visible && visible.length > 0 ? (
            visible.map((p) => <ProductRow key={p.id} storeSlug={store.slug} product={p} />)
          ) : (
            <p className="px-4 py-6 text-sm text-muted text-center">
              Nenhum produto nesta categoria ainda.
            </p>
          )}
        </section>
      )}

      <BottomBar storeSlug={store.slug} cartCount={itemCount} />
    </>
  );
}
