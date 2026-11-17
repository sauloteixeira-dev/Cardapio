import type { OrderStatus } from "@/lib/types";

// components.md > OrderStatusBadge. Sempre texto + cor, nunca só a cor.
const LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Aguardando pagamento",
  received: "Pedido recebido",
  accepted: "Aceito pela loja",
  preparing: "Em preparo",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  completed: "Concluído",
  cancelled: "Cancelado",
  rejected: "Recusado pela loja",
};

const CLASSES: Record<OrderStatus, string> = {
  awaiting_payment: "bg-surface-raised text-muted",
  received: "bg-accent/20 text-accent-text",
  accepted: "bg-accent/20 text-accent-text",
  preparing: "bg-warning/20 text-warning",
  ready: "bg-warning/20 text-warning",
  out_for_delivery: "bg-warning/20 text-warning",
  completed: "bg-success/20 text-success",
  cancelled: "bg-danger/20 text-danger",
  rejected: "bg-danger/20 text-danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block px-2 py-1 rounded-sm text-xs font-bold ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
