"use client";

import { OrderStatusBadge } from "./OrderStatusBadge";
import { Button } from "./Button";
import { formatCents } from "@/lib/money";
import type { OrderT, Store } from "@/lib/types";
import { printTicket } from "@/lib/print-ticket";

const NEXT_LABEL: Partial<Record<OrderT["status"], string>> = {
  accepted: "Preparar",
  preparing: "Marcar pronto",
  ready: "Concluir",
};
const NEXT_STATUS: Partial<Record<OrderT["status"], OrderT["status"]>> = {
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
};

// components.md > AdminOrderCard. Pedido novo com borda de destaque até o lojista abrir;
// os botões de ação mudam conforme o status (nunca mostramos um avanço que o pedido não
// pode fazer — ver NEXT_STATUS em lib/data.ts, a mesma máquina de estados do servidor).
export function AdminOrderCard({
  store,
  order,
  isNew,
  onStatusChange,
}: {
  store: Store;
  order: OrderT;
  isNew: boolean;
  onStatusChange: (orderId: string, status: OrderT["status"]) => void;
}) {
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <li
      className={`p-4 rounded-md bg-surface-raised mb-3 ${isNew ? "border-2 border-accent" : "border border-border"}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold">
            Pedido #{order.number} · {order.customer.name}
          </p>
          <p className="text-xs text-muted">{order.customer.phone}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <ul className="text-sm mb-2">
        {order.items.map((item, i) => (
          <li key={i}>
            {item.quantity}x {item.nameSnapshot}
          </li>
        ))}
      </ul>
      <p className="font-bold text-sm mb-3">{formatCents(order.totalCents)} · pagamento na entrega</p>

      <div className="flex flex-wrap gap-2">
        {order.status === "received" ? (
          <>
            <Button variant="primary" onClick={() => onStatusChange(order.id, "accepted")}>
              Aceitar
            </Button>
            <Button variant="danger" onClick={() => onStatusChange(order.id, "rejected")}>
              Recusar
            </Button>
          </>
        ) : null}
        {nextStatus ? (
          <Button variant="secondary" onClick={() => onStatusChange(order.id, nextStatus)}>
            {NEXT_LABEL[order.status]}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => printTicket(store, order)}>
          🖨️ Imprimir
        </Button>
      </div>
    </li>
  );
}
