import { formatCents } from "./money";
import type { OrderT, Store } from "./types";

const FULFILLMENT_LABEL: Record<OrderT["fulfillment"], string> = {
  delivery: "ENTREGA",
  pickup: "RETIRADA",
  dine_in: "CONSUMO NO LOCAL",
};

// components.md > ComandaPrint. Abre uma janela só com a comanda e chama window.print():
// o navegador não sabe listar impressoras nem imprimir sem mostrar a janela de impressão.
// Para sair direto (modo "silencioso" do architecture.md), o lojista abre o painel por um
// atalho do Chrome com --kiosk-printing; sem isso, a janela de impressão aparece sempre.
export function printTicket(store: Store, order: OrderT) {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return;

  const lines = order.items.map((item) => {
    const opts = item.options.length ? `\n   + ${item.options.map((o) => o.optionName).join(", ")}` : "";
    const notes = item.notes ? `\n   obs: ${item.notes}` : "";
    return `${item.quantity}x ${item.nameSnapshot}${opts}${notes}\n   ${formatCents(item.lineTotalCents)}`;
  });

  win.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Comanda #${order.number}</title>
        <style>
          /* Bobina de 80mm: preto sobre branco, mono, sem nenhuma cor — impressora térmica
             não imprime cor. replica/design/components.md > ComandaPrint. */
          @page { size: 80mm auto; margin: 4mm; }
          body { font-family: "Courier New", monospace; font-size: 12px; width: 72mm; color: #000; }
          h1 { font-size: 14px; text-align: center; margin: 0 0 4px; }
          .center { text-align: center; }
          .line { border-top: 1px dashed #000; margin: 6px 0; }
          pre { white-space: pre-wrap; font-family: inherit; margin: 2px 0; }
          .total { font-weight: bold; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>${store.name}</h1>
        <p class="center">Pedido #${order.number}</p>
        <p class="center">${new Date(order.placedAt).toLocaleString("pt-BR")}</p>
        <div class="line"></div>
        <p><strong>${order.customer.name}</strong><br/>${order.customer.phone}</p>
        <p><strong>${FULFILLMENT_LABEL[order.fulfillment]}</strong></p>
        <div class="line"></div>
        <pre>${lines.join("\n\n")}</pre>
        <div class="line"></div>
        <p class="total">TOTAL: ${formatCents(order.totalCents)}</p>
        <p>Pagamento na entrega</p>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
