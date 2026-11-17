"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CartLineItem } from "@/components/CartLineItem";
import { StickyCTA } from "@/components/StickyCTA";
import { useCart } from "@/lib/cart-store";
import { formatCents } from "@/lib/money";

// S05 do recon.md.
export default function CartPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { items, updateQuantity, subtotalCents } = useCart();

  return (
    <div className="pb-28 px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={() => router.back()} aria-label="Voltar" className="text-xl">
          ←
        </button>
        <h1 className="text-lg font-bold">Carrinho</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted mb-4">Seu carrinho está vazio.</p>
          <Link href={`/loja/${slug}`} className="text-accent-text font-bold">
            Ver o cardápio
          </Link>
        </div>
      ) : (
        <>
          <ul>
            {items.map((item) => (
              <CartLineItem key={item.lineId} item={item} onQuantityChange={updateQuantity} />
            ))}
          </ul>
          <Link href={`/loja/${slug}`} className="block text-center text-accent-text font-bold py-4">
            Adicionar mais produtos
          </Link>
          <StickyCTA
            label="Avançar"
            totalLabel={formatCents(subtotalCents)}
            onClick={() => router.push(`/loja/${slug}/identifique-se`)}
          />
        </>
      )}
    </div>
  );
}
