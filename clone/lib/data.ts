// Camada de dados falsa da fatia vertical. Cada função tem a assinatura que vai ter quando
// a /replica-backend ligar o Postgres de verdade: nenhuma tela chama "memória" diretamente,
// só estas funções — trocar o corpo delas por consultas SQL não muda nenhum componente.
//
// Roda em memória do processo. Serve para ver o fluxo de ponta a ponta; reinicia ao reiniciar
// o servidor de desenvolvimento. Não é o armazenamento do produto.

import type {
  Category,
  Customer,
  OrderStatus,
  OrderT,
  Product,
  QuoteInput,
  QuoteResult,
  SelectedOption,
  Store,
} from "./types";

// ---------------------------------------------------------------- seed (loja de exemplo)

const store: Store = {
  id: "store_1",
  slug: "burgueria-exemplo",
  name: "Burgueria Exemplo",
  accentColor: "#3463e0",
  whatsapp: "35999998888",
  timezone: "America/Sao_Paulo",
  minOrderCents: 200,
  acceptsDelivery: false, // decisão do projeto: entrega ainda não está no escopo desta fatia
  acceptsPickup: true,
  acceptsDineIn: true,
  onlinePaymentsEnabled: false, // decisão do projeto: pagamento só na entrega, por enquanto
  acceptsCardOnDelivery: true,
  acceptsCashOnDelivery: false,
  autoPrint: false,
  printPaper: "thermal_80mm",
  isOpenNow: true,
  opensUntilLabel: "Aberto até 23h59",
};

const categories: Category[] = [
  { id: "cat_lanches", storeId: store.id, name: "Lanches", position: 0 },
  { id: "cat_porcoes", storeId: store.id, name: "Porções", position: 1 },
  { id: "cat_bebidas", storeId: store.id, name: "Bebidas", position: 2 },
];

const products: Product[] = [
  {
    id: "prod_xtudo",
    storeId: store.id,
    categoryId: "cat_lanches",
    name: "X-Tudo",
    description: "Pão, hambúrguer, bacon, presunto, queijo, alface, tomate, batata palha, ovo.",
    priceCents: 2300,
    imageUrl: null,
    soldOut: false,
    pinnedBestSeller: true,
    optionGroups: [
      {
        id: "grp_adicionais_xtudo",
        name: "Adicionais",
        minSelect: 0,
        maxSelect: 10,
        options: [
          { id: "opt_alface", groupId: "grp_adicionais_xtudo", name: "Alface", priceCents: 200, soldOut: false },
          { id: "opt_tomate", groupId: "grp_adicionais_xtudo", name: "Tomate", priceCents: 150, soldOut: false },
          { id: "opt_milho", groupId: "grp_adicionais_xtudo", name: "Milho", priceCents: 200, soldOut: false },
          { id: "opt_abacaxi", groupId: "grp_adicionais_xtudo", name: "Abacaxi", priceCents: 200, soldOut: false },
          { id: "opt_batata_palha", groupId: "grp_adicionais_xtudo", name: "Batata palha", priceCents: 150, soldOut: false },
          { id: "opt_catupiry", groupId: "grp_adicionais_xtudo", name: "Catupiry", priceCents: 300, soldOut: true },
        ],
      },
    ],
  },
  {
    id: "prod_contrafile",
    storeId: store.id,
    categoryId: "cat_porcoes",
    name: "Contra-filé na chapa",
    description: "300g de contra-filé, 300g de batata frita, cebola e cheiro-verde.",
    priceCents: 5999,
    imageUrl: null,
    soldOut: false,
    pinnedBestSeller: false,
    optionGroups: [],
  },
  {
    id: "prod_coca600",
    storeId: store.id,
    categoryId: "cat_bebidas",
    name: "Coca-Cola 600ml",
    description: null,
    priceCents: 1000,
    imageUrl: null,
    soldOut: false,
    pinnedBestSeller: true,
    optionGroups: [],
  },
];

const customers = new Map<string, Customer>(); // chave: storeId + "|" + telefone
const orders = new Map<string, OrderT>(); // chave: order.id
const ordersByToken = new Map<string, string>(); // publicToken -> order.id
let orderSeq = 0;

// ---------------------------------------------------------------- leitura do cardápio

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  return store.slug === slug ? store : null;
}

// Painel A04 (configurações) ainda não foi construído nesta fatia — este é só o suficiente
// para a caixa de seleção "Imprimir comanda quando chegar pedido" funcionar no A02.
export async function setAutoPrint(storeId: string, value: boolean): Promise<Store> {
  if (store.id === storeId) store.autoPrint = value;
  return store;
}

export async function listCategories(storeId: string): Promise<Category[]> {
  return categories.filter((c) => c.storeId === storeId).sort((a, b) => a.position - b.position);
}

export async function listProducts(storeId: string): Promise<Product[]> {
  return products.filter((p) => p.storeId === storeId);
}

export async function listBestSellers(storeId: string): Promise<Product[]> {
  return products.filter((p) => p.storeId === storeId && p.pinnedBestSeller);
}

export async function getProduct(storeId: string, productId: string): Promise<Product | null> {
  return products.find((p) => p.storeId === storeId && p.id === productId) ?? null;
}

// ---------------------------------------------------------------- cliente (sem senha)

export async function upsertCustomer(storeId: string, phone: string, name: string): Promise<Customer> {
  const key = `${storeId}|${phone}`;
  const existing = customers.get(key);
  const customer: Customer = { id: existing?.id ?? `cust_${customers.size + 1}`, storeId, phone, name };
  customers.set(key, customer);
  return customer;
}

// ---------------------------------------------------------------- cálculo do pedido (quote)
// O servidor é quem manda no preço. O carrinho do navegador é só uma prévia; isto aqui é
// recalculado de novo dentro de createOrder, com os mesmos dados, para nunca confiar no
// valor que veio do cliente.

export async function quote(storeId: string, input: QuoteInput): Promise<QuoteResult> {
  const errors: string[] = [];
  let subtotalCents = 0;

  for (const line of input.items) {
    const product = await getProduct(storeId, line.productId);
    if (!product) {
      errors.push(`Produto não encontrado: ${line.productId}`);
      continue;
    }
    if (product.soldOut) {
      errors.push(`"${product.name}" está esgotado.`);
      continue;
    }
    if (line.quantity < 1) {
      errors.push(`Quantidade inválida para "${product.name}".`);
      continue;
    }
    let unit = product.priceCents;
    for (const optId of line.optionIds) {
      const opt = product.optionGroups.flatMap((g) => g.options).find((o) => o.id === optId);
      if (!opt) {
        errors.push(`Complemento não encontrado em "${product.name}".`);
        continue;
      }
      if (opt.soldOut) {
        errors.push(`"${opt.name}" está esgotado.`);
        continue;
      }
      unit += opt.priceCents;
    }
    subtotalCents += unit * line.quantity;
  }

  if (input.fulfillment === "delivery" && !store.acceptsDelivery) {
    errors.push("Esta loja ainda não entrega pelo site. Escolha retirada ou consumo no local.");
  }
  if (input.fulfillment === "pickup" && !store.acceptsPickup) {
    errors.push("Esta loja não aceita retirada.");
  }
  if (input.fulfillment === "dine_in" && !store.acceptsDineIn) {
    errors.push("Esta loja não aceita consumo no local.");
  }
  if (subtotalCents > 0 && subtotalCents < store.minOrderCents) {
    errors.push(
      `O pedido mínimo é de ${(store.minOrderCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
    );
  }

  const deliveryFeeCents = input.fulfillment === "delivery" ? 0 : 0; // zonas de entrega: fase posterior
  const serviceFeeCents = 0; // só existe com pagamento online (fase posterior)
  const discountCents = 0; // cupom: fase posterior
  const totalCents = subtotalCents + deliveryFeeCents + serviceFeeCents - discountCents;

  return {
    ok: errors.length === 0 && subtotalCents > 0,
    errors,
    subtotalCents,
    deliveryFeeCents,
    serviceFeeCents,
    discountCents,
    totalCents,
    estimatedMinutesMin: input.fulfillment === "pickup" ? 25 : null,
    estimatedMinutesMax: input.fulfillment === "pickup" ? 35 : null,
  };
}

// ---------------------------------------------------------------- pedidos

export async function createOrder(
  storeId: string,
  customer: { phone: string; name: string },
  input: QuoteInput,
  idempotencyKey: string,
): Promise<{ order?: OrderT; errors: string[] }> {
  // idempotência simples (fase real: unique index em (store_id, idempotency_key) no banco)
  const already = [...orders.values()].find((o) => o.storeId === storeId && (o as unknown as { idempotencyKey?: string }).idempotencyKey === idempotencyKey);
  if (already) return { order: already, errors: [] };

  const q = await quote(storeId, input);
  if (!q.ok) return { errors: q.errors };

  const cust = await upsertCustomer(storeId, customer.phone, customer.name);
  orderSeq += 1;

  const items = [];
  for (const line of input.items) {
    const product = await getProduct(storeId, line.productId);
    if (!product) continue;
    const selected: SelectedOption[] = [];
    let unit = product.priceCents;
    for (const optId of line.optionIds) {
      const opt = product.optionGroups.flatMap((g) => g.options).find((o) => o.id === optId);
      const grp = product.optionGroups.find((g) => g.options.some((o) => o.id === optId));
      if (!opt || !grp) continue;
      unit += opt.priceCents;
      selected.push({ groupId: grp.id, groupName: grp.name, optionId: opt.id, optionName: opt.name, priceCents: opt.priceCents });
    }
    items.push({
      productId: product.id,
      nameSnapshot: product.name,
      unitPriceCents: unit,
      quantity: line.quantity,
      notes: line.notes,
      options: selected,
      lineTotalCents: unit * line.quantity,
    });
  }

  const order: OrderT & { idempotencyKey: string } = {
    id: `order_${orderSeq}`,
    storeId,
    number: orderSeq,
    customer: cust,
    fulfillment: input.fulfillment,
    status: "received", // sem pagamento online: o pedido já entra como recebido (decisão do projeto)
    items,
    subtotalCents: q.subtotalCents,
    deliveryFeeCents: q.deliveryFeeCents,
    serviceFeeCents: q.serviceFeeCents,
    discountCents: q.discountCents,
    totalCents: q.totalCents,
    paymentMethod: store.acceptsCardOnDelivery ? "card_on_delivery" : "cash_on_delivery",
    notes: null,
    publicToken: `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
    placedAt: new Date().toISOString(),
    estimatedMinutesMin: q.estimatedMinutesMin,
    estimatedMinutesMax: q.estimatedMinutesMax,
    idempotencyKey,
  };

  orders.set(order.id, order);
  ordersByToken.set(order.publicToken, order.id);
  return { order, errors: [] };
}

export async function getOrderByToken(token: string): Promise<OrderT | null> {
  const id = ordersByToken.get(token);
  if (!id) return null;
  return orders.get(id) ?? null;
}

export async function listOrdersForStore(storeId: string): Promise<OrderT[]> {
  return [...orders.values()]
    .filter((o) => o.storeId === storeId)
    .sort((a, b) => b.number - a.number);
}

export async function getOrder(orderId: string): Promise<OrderT | null> {
  return orders.get(orderId) ?? null;
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ["received", "cancelled"],
  received: ["accepted", "rejected"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  rejected: [],
};

export async function updateOrderStatus(
  orderId: string,
  to: OrderStatus,
): Promise<{ order?: OrderT; error?: string }> {
  const order = orders.get(orderId);
  if (!order) return { error: "Pedido não encontrado." };
  const allowed = NEXT_STATUS[order.status];
  if (!allowed.includes(to)) {
    return { error: `Não dá para ir de "${order.status}" para "${to}".` };
  }
  const updated = { ...order, status: to };
  orders.set(orderId, updated);
  return { order: updated };
}
