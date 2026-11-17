"use client";

import { useEffect, useState } from "react";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { formatCents } from "@/lib/money";
import { buildWhatsAppOrderLink } from "@/lib/whatsapp";
import type { OrderT, Store } from "@/lib/types";

// S11 (nova, substitui o S10 de Pix do original): pedido feito, sem pagamento online por
// enquanto. Consulta o status a cada poucos segundos — o Realtime da /replica-backend troca
// isto por uma assinatura, sem mudar a tela.
export function OrderClient({ store, order: initial }: { store: Store; order: OrderT }) {
  const [order, setOrder] = useState(initial);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/o/${initial.publicToken}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [initial.publicToken]);

  const whatsappLink =
    typeof window !== "undefined" ? buildWhatsAppOrderLink(store, order, window.location.origin) : "";

  return (
    <div className="px-4 pt-6 pb-10 max-w-md mx-auto text-center">
      <p aria-hidden="true" className="text-5xl mb-3">
        ✅
      </p>
      <h1 className="text-lg font-bold mb-1">Pedido #{order.number} feito!</h1>
      <div className="mb-4">
        <OrderStatusBadge status={order.status} />
      </div>

      {order.estimatedMinutesMin ? (
        <p className="text-muted mb-4">
          Previsão: entre {order.estimatedMinutesMin} e {order.estimatedMinutesMax} minutos
        </p>
      ) : null}

      <ul className="text-left bg-surface rounded-md p-4 mb-4">
        {order.items.map((item, i) => (
          <li key={i} className="py-1 text-sm">
            {item.quantity}x {item.nameSnapshot} — {formatCents(item.lineTotalCents)}
          </li>
        ))}
        <li className="pt-2 mt-2 border-t border-border font-bold flex justify-between">
          <span>Total</span>
          <span>{formatCents(order.totalCents)}</span>
        </li>
      </ul>

      <p className="text-sm text-muted mb-4">Pagamento na entrega, na maquininha do entregador.</p>

      {whatsappLink ? (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          onClick={() => setSent(true)}
          className="inline-flex items-center justify-center gap-2 w-full h-14 rounded-md bg-success text-on-accent font-bold"
        >
          {sent ? "Pedido enviado pelo WhatsApp ✓" : "Enviar pedido pelo WhatsApp"}
        </a>
      ) : null}
    </div>
  );
}
