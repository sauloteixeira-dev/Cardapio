import { formatCents } from "./money";
import type { OrderT, Store } from "./types";

const FULFILLMENT_LABEL: Record<OrderT["fulfillment"], string> = {
  delivery: "Entrega",
  pickup: "Retirada",
  dine_in: "Consumo no local",
};

// Decisão do projeto: o cliente é quem envia, pelo WhatsApp dele, para o WhatsApp da loja —
// nada sai sozinho. Ver architecture.md > "Do pedido feito à tela do lojista...".
export function buildWhatsAppOrderLink(store: Store, order: OrderT, origin: string): string {
  if (!store.whatsapp) return "";

  const lines = [
    `Pedido #${order.number} — ${store.name}`,
    "",
    ...order.items.map((item) => {
      const opts = item.options.length ? ` (${item.options.map((o) => o.optionName).join(", ")})` : "";
      const notes = item.notes ? ` — obs.: ${item.notes}` : "";
      return `${item.quantity}x ${item.nameSnapshot}${opts}${notes}`;
    }),
    "",
    `Total: ${formatCents(order.totalCents)}`,
    `${FULFILLMENT_LABEL[order.fulfillment]} · pagamento na entrega`,
    "",
    `Acompanhar: ${origin}/loja/${store.slug}/pedido/${order.publicToken}`,
  ];

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/55${store.whatsapp}?text=${text}`;
}
