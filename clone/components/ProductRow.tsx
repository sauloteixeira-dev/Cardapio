import Link from "next/link";
import { formatCents } from "@/lib/money";
import type { Product } from "@/lib/types";

// components.md > ProductRow / BestSellerCard. Linha inteira é alvo de toque (mín. 44px).
export function ProductRow({ storeSlug, product }: { storeSlug: string; product: Product }) {
  return (
    <Link
      href={`/loja/${storeSlug}/produto/${product.id}`}
      className="flex items-center gap-3 py-3 px-4 border-b border-border min-h-[44px] hover:bg-surface"
    >
      <div
        aria-hidden="true"
        className="w-14 h-14 rounded-sm bg-surface-raised shrink-0 flex items-center justify-center text-xs text-muted"
      >
        {product.imageUrl ? null : "sem foto"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-base truncate">{product.name}</p>
        {product.description ? (
          <p className="text-sm text-muted line-clamp-2">{product.description}</p>
        ) : null}
        {product.soldOut ? (
          <p className="text-sm text-danger font-semibold mt-1">Esgotado</p>
        ) : (
          <p className="text-base font-bold mt-1">{formatCents(product.priceCents)}</p>
        )}
      </div>
    </Link>
  );
}
