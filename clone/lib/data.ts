// Camada de dados do cardápio e do pedido do CLIENTE FINAL. Fala com o Postgres de
// verdade (Supabase) usando a chave de serviço (lib/supabase/service.ts), porque quem
// chama estas funções são só as rotas do servidor em app/api/s/ e app/api/o/ — nunca o
// navegador direto (ver supabase/migrations/0001_init.sql, "escritas do cliente final
// passam pelo servidor"). As ações do PAINEL DO LOJISTA (autenticadas, sob RLS de
// verdade) ficam em lib/admin-data.ts — não aqui.
//
// Cada função mantém a mesma assinatura que tinha na fatia vertical (quando isto era uma
// camada em memória): nenhuma tela ou rota precisou mudar além do corpo deste arquivo.

import { supabaseService } from "./supabase/service";
import type {
  Category,
  Customer,
  OptionGroupT,
  OrderT,
  Product,
  QuoteInput,
  QuoteResult,
  SelectedOption,
  Store,
} from "./types";

// ---------------------------------------------------------------- conversão banco -> tipos

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStore(row: any): Store {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    accentColor: row.accent_color,
    whatsapp: row.whatsapp,
    timezone: row.timezone,
    minOrderCents: row.min_order_cents,
    acceptsDelivery: row.accepts_delivery,
    acceptsPickup: row.accepts_pickup,
    acceptsDineIn: row.accepts_dine_in,
    onlinePaymentsEnabled: row.online_payments_enabled,
    acceptsCardOnDelivery: row.accepts_card_on_delivery,
    acceptsCashOnDelivery: row.accepts_cash_on_delivery,
    autoPrint: row.auto_print,
    printPaper: row.print_paper,
    // store_hours ainda não é lido aqui (A04, configurações, é a próxima passagem do
    // architecture.md) — por ora só reflete a pausa manual da loja.
    isOpenNow: !row.is_paused,
    opensUntilLabel: row.is_paused ? "Fechada no momento" : "Aberto agora",
  };
}

const PRODUCT_SELECT = `
  id, store_id, category_id, name, description, price_cents, image_url, sold_out,
  pinned_best_seller, position,
  product_option_groups (
    position,
    option_groups (
      id, name, min_select, max_select,
      options ( id, name, price_cents, sold_out, position, active )
    )
  )
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(row: any): Product {
  const groups: OptionGroupT[] = (row.product_option_groups ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((pog: any) => pog.option_groups)
    .filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((g: any) => ({
      id: g.id,
      name: g.name,
      minSelect: g.min_select,
      maxSelect: g.max_select,
      options: (g.options ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((o: any) => o.active)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => a.position - b.position)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((o: any) => ({
          id: o.id,
          groupId: g.id,
          name: o.name,
          priceCents: o.price_cents,
          soldOut: o.sold_out,
        })),
    }));

  return {
    id: row.id,
    storeId: row.store_id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    imageUrl: row.image_url,
    soldOut: row.sold_out,
    pinnedBestSeller: row.pinned_best_seller,
    optionGroups: groups,
  };
}

async function getStoreById(storeId: string): Promise<Store | null> {
  const { data, error } = await supabaseService().from("stores").select("*").eq("id", storeId).maybeSingle();
  if (error || !data) return null;
  return mapStore(data);
}

async function mapOrderRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
): Promise<OrderT> {
  const supabase = supabaseService();
  const [{ data: itemRows }, { data: customerRow }, { data: paymentRow }] = await Promise.all([
    supabase
      .from("order_items")
      .select("product_id, name_snapshot, unit_price_cents, quantity, notes, options, line_total_cents")
      .eq("order_id", row.id),
    supabase.from("customers").select("phone, name").eq("id", row.customer_id).maybeSingle(),
    supabase.from("payments").select("method").eq("order_id", row.id).maybeSingle(),
  ]);

  return {
    id: row.id,
    storeId: row.store_id,
    number: row.number,
    customer: { phone: customerRow?.phone ?? "", name: customerRow?.name ?? "" },
    fulfillment: row.fulfillment,
    status: row.status,
    items: (itemRows ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (i: any) => ({
        productId: i.product_id,
        nameSnapshot: i.name_snapshot,
        unitPriceCents: i.unit_price_cents,
        quantity: i.quantity,
        notes: i.notes ?? "",
        options: i.options ?? [],
        lineTotalCents: i.line_total_cents,
      }),
    ),
    subtotalCents: row.subtotal_cents,
    deliveryFeeCents: row.delivery_fee_cents,
    serviceFeeCents: row.service_fee_cents,
    discountCents: row.discount_cents,
    totalCents: row.total_cents,
    paymentMethod: (paymentRow?.method as "card_on_delivery" | "cash_on_delivery") ?? "cash_on_delivery",
    notes: row.notes,
    publicToken: row.public_token,
    placedAt: row.placed_at,
    estimatedMinutesMin: row.estimated_minutes_min,
    estimatedMinutesMax: row.estimated_minutes_max,
  };
}

// ---------------------------------------------------------------- leitura do cardápio

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const { data, error } = await supabaseService().from("stores").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return mapStore(data);
}

export async function listCategories(storeId: string): Promise<Category[]> {
  const { data, error } = await supabaseService()
    .from("categories")
    .select("id, store_id, name, position")
    .eq("store_id", storeId)
    .eq("active", true)
    .order("position");
  if (error || !data) return [];
  return data.map((c) => ({ id: c.id, storeId: c.store_id, name: c.name, position: c.position }));
}

export async function listProducts(storeId: string): Promise<Product[]> {
  const { data, error } = await supabaseService()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("store_id", storeId)
    .eq("active", true)
    .order("position");
  if (error || !data) return [];
  return data.map(mapProduct);
}

export async function listBestSellers(storeId: string): Promise<Product[]> {
  const { data, error } = await supabaseService()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("store_id", storeId)
    .eq("active", true)
    .eq("pinned_best_seller", true)
    .order("position");
  if (error || !data) return [];
  return data.map(mapProduct);
}

export async function getProduct(storeId: string, productId: string): Promise<Product | null> {
  const { data, error } = await supabaseService()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("store_id", storeId)
    .eq("id", productId)
    .maybeSingle();
  if (error || !data) return null;
  return mapProduct(data);
}

// ---------------------------------------------------------------- cliente (sem senha)

export async function upsertCustomer(storeId: string, phone: string, name: string): Promise<Customer> {
  const { data, error } = await supabaseService()
    .from("customers")
    .upsert({ store_id: storeId, phone, name }, { onConflict: "store_id,phone" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, storeId: data.store_id, phone: data.phone, name: data.name };
}

// ---------------------------------------------------------------- cálculo do pedido (quote)
// O servidor é quem manda no preço. O carrinho do navegador é só uma prévia; isto aqui é
// recalculado de novo dentro de createOrder, com os mesmos dados, para nunca confiar no
// valor que veio do cliente.

export async function quote(storeId: string, input: QuoteInput): Promise<QuoteResult> {
  const empty: QuoteResult = {
    ok: false,
    errors: ["Loja não encontrada."],
    subtotalCents: 0,
    deliveryFeeCents: 0,
    serviceFeeCents: 0,
    discountCents: 0,
    totalCents: 0,
    estimatedMinutesMin: null,
    estimatedMinutesMax: null,
  };

  const store = await getStoreById(storeId);
  if (!store) return empty;

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

  const deliveryFeeCents = 0; // zonas de entrega: fase posterior
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
  const supabase = supabaseService();

  // idempotência: duplo clique ou nova tentativa de rede com a mesma chave devolve o
  // pedido já criado, em vez de criar outro (replica/schema.sql > orders.idempotency_key).
  const { data: existingRow } = await supabase
    .from("orders")
    .select("id")
    .eq("store_id", storeId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existingRow) {
    const existing = await getOrder(existingRow.id);
    if (existing) return { order: existing, errors: [] };
  }

  const q = await quote(storeId, input);
  if (!q.ok) return { errors: q.errors };

  const store = await getStoreById(storeId);
  if (!store) return { errors: ["Loja não encontrada."] };

  const cust = await upsertCustomer(storeId, customer.phone, customer.name);

  const lineInputs: { product: Product; line: QuoteInput["items"][number] }[] = [];
  for (const line of input.items) {
    const product = await getProduct(storeId, line.productId);
    if (product) lineInputs.push({ product, line });
  }

  const { data: numberRow, error: numberError } = await supabase.rpc("next_order_number", {
    p_store: storeId,
  });
  if (numberError || numberRow == null) {
    return { errors: ["Não foi possível gerar o número do pedido. Tente novamente."] };
  }

  const paymentMethod: "card_on_delivery" | "cash_on_delivery" = store.acceptsCardOnDelivery
    ? "card_on_delivery"
    : "cash_on_delivery";

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: storeId,
      number: numberRow,
      customer_id: cust.id,
      fulfillment: input.fulfillment,
      status: "received", // sem pagamento online nesta fase: o pedido já entra como recebido
      subtotal_cents: q.subtotalCents,
      delivery_fee_cents: q.deliveryFeeCents,
      service_fee_cents: q.serviceFeeCents,
      discount_cents: q.discountCents,
      total_cents: q.totalCents,
      estimated_minutes_min: q.estimatedMinutesMin,
      estimated_minutes_max: q.estimatedMinutesMax,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (orderError || !orderRow) {
    // duas requisições quase simultâneas com a mesma chave: a unique (store_id,
    // idempotency_key) rejeita a segunda — busca o pedido que a primeira criou, em vez de
    // devolver erro para quem só clicou duas vezes.
    if (orderError?.code === "23505") {
      const { data: raceRow } = await supabase
        .from("orders")
        .select("id")
        .eq("store_id", storeId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (raceRow) {
        const raceOrder = await getOrder(raceRow.id);
        if (raceOrder) return { order: raceOrder, errors: [] };
      }
    }
    return { errors: ["Não foi possível criar o pedido. Tente novamente."] };
  }

  const itemRows = lineInputs.map(({ product, line }) => {
    const selected: SelectedOption[] = [];
    let unit = product.priceCents;
    for (const optId of line.optionIds) {
      const opt = product.optionGroups.flatMap((g) => g.options).find((o) => o.id === optId);
      const grp = product.optionGroups.find((g) => g.options.some((o) => o.id === optId));
      if (!opt || !grp) continue;
      unit += opt.priceCents;
      selected.push({
        groupId: grp.id,
        groupName: grp.name,
        optionId: opt.id,
        optionName: opt.name,
        priceCents: opt.priceCents,
      });
    }
    return {
      store_id: storeId,
      order_id: orderRow.id,
      product_id: product.id,
      name_snapshot: product.name,
      unit_price_cents: unit,
      quantity: line.quantity,
      notes: line.notes || null,
      options: selected,
      line_total_cents: unit * line.quantity,
    };
  });

  const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
  if (itemsError) {
    return { errors: ["Pedido criado, mas falhou ao salvar os itens. Fale com a loja pelo WhatsApp."] };
  }

  // registro do pagamento: "pendente" porque é pago na entrega, fora da plataforma — não
  // existe captura online nesta fase (store.onlinePaymentsEnabled = false).
  await supabase.from("payments").insert({
    store_id: storeId,
    order_id: orderRow.id,
    method: paymentMethod,
    status: "pending",
    amount_cents: q.totalCents,
  });

  await supabase.from("order_events").insert({
    store_id: storeId,
    order_id: orderRow.id,
    from_status: null,
    to_status: "received",
    actor: "customer",
  });

  const order = await getOrder(orderRow.id);
  if (!order) return { errors: ["Pedido criado, mas não foi possível carregá-lo de volta."] };
  return { order, errors: [] };
}

export async function getOrder(orderId: string): Promise<OrderT | null> {
  const { data, error } = await supabaseService().from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error || !data) return null;
  return mapOrderRow(data);
}

export async function getOrderByToken(token: string): Promise<OrderT | null> {
  // "quem tem o token vê o pedido" (replica/schema.sql) — chave de serviço aqui só porque
  // esta rota não tem sessão de ninguém; a proteção real é o token ser longo e aleatório.
  const { data, error } = await supabaseService().from("orders").select("*").eq("public_token", token).maybeSingle();
  if (error || !data) return null;
  return mapOrderRow(data);
}
