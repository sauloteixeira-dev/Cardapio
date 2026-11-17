"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { BottomBar } from "@/components/BottomBar";
import { useCart } from "@/lib/cart-store";
import { formatCents } from "@/lib/money";
import type { OrderT } from "@/lib/types";

// F03 do recon.md: "aba Pedidos". Sem login, por isso lista só os tokens guardados neste
// aparelho (architecture.md explica por que não dá para listar pelo telefone digitado).
export default function OrdersPage() {
  const { slug } = useParams<{ slug: string }>();
  const { itemCount } = useCart();
  const [orders, setOrders] = useState<OrderT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let tokens: string[] = [];
    try {
      tokens = JSON.parse(localStorage.getItem(`cardapio-clone:orders:${slug}`) ?? "[]");
    } catch {
      tokens = [];
    }
    Promise.all(
      tokens.map((t) =>
        fetch(`/api/o/${t}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.order as OrderT | null),
      ),
    ).then((results) => {
      setOrders(results.filter((o): o is OrderT => Boolean(o)));
      setLoading(false);
    });
  }, [slug]);

  return (
    <div className="px-4 pt-4 pb-24">
      <h1 className="text-lg font-bold mb-4">Seus pedidos neste aparelho</h1>
      {loading ? (
        <p className="text-muted">Carregando…</p>
      ) : orders.length === 0 ? (
        <p className="text-muted">Você ainda não fez nenhum pedido por aqui.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/loja/${slug}/pedido/${order.publicToken}`}
                className="block p-4 rounded-md border border-border"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold">Pedido #{order.number}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <span className="text-sm text-muted">{formatCents(order.totalCents)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <BottomBar storeSlug={slug} cartCount={itemCount} />
    </div>
  );
}
