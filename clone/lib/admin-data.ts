// Dados do painel do lojista (A02). Tudo aqui usa o cliente Supabase vinculado à sessão
// de quem está logado (lib/supabase/server.ts) — então toda consulta passa pela RLS real
// de supabase/migrations/0001_init.sql, e a função is_store_member() é quem decide o que
// aparece e o que pode ser mudado. Mesmo que uma rota erre e não confira a loja, o banco
// nunca devolve (ou aceita mudança em) pedido de uma loja da qual o usuário não é membro.
// Isto substitui, para o painel, o que lib/data.ts faz para o cliente final.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderStatus, OrderT, Store } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStoreRow(row: any): Store {
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
    isOpenNow: !row.is_paused,
    opensUntilLabel: row.is_paused ? "Fechada no momento" : "Aberto agora",
  };
}

async function mapOrderRow(
  supabase: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
): Promise<OrderT> {
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

// stores tem leitura pública (stores_public_read), então isto funciona independente de
// quem está logado — a proteção de verdade é isMemberOfStore(), chamada pela rota.
export async function getStoreForMember(supabase: SupabaseClient, slug: string): Promise<Store | null> {
  const { data, error } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return mapStoreRow(data);
}

export async function isMemberOfStore(supabase: SupabaseClient, storeId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_store_member", { p_store: storeId });
  if (error) return false;
  return Boolean(data);
}

export async function listOrdersForStore(supabase: SupabaseClient, storeId: string): Promise<OrderT[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("number", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return Promise.all(data.map((row) => mapOrderRow(supabase, row)));
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
  supabase: SupabaseClient,
  orderId: string,
  to: OrderStatus,
): Promise<{ order?: OrderT; error?: string }> {
  const { data: row, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error || !row) return { error: "Pedido não encontrado." };

  const allowed = NEXT_STATUS[row.status as OrderStatus];
  if (!allowed.includes(to)) {
    return { error: `Não dá para ir de "${row.status}" para "${to}".` };
  }

  const timestamps: Record<string, string> = {};
  if (to === "accepted") timestamps.accepted_at = new Date().toISOString();
  if (to === "completed") timestamps.completed_at = new Date().toISOString();
  if (to === "cancelled" || to === "rejected") timestamps.cancelled_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update({ status: to, ...timestamps })
    .eq("id", orderId)
    .select()
    .maybeSingle();

  if (updateError || !updated) {
    // a RLS (orders_member_update) impede a troca se o pedido não for da loja do usuário
    // logado — o update volta vazio em vez de dar erro, então tratamos os dois casos aqui.
    return { error: "Não foi possível mudar o status. Verifique se o pedido é da sua loja." };
  }

  await supabase.from("order_events").insert({
    store_id: updated.store_id,
    order_id: orderId,
    from_status: row.status,
    to_status: to,
    actor: "store",
  });

  return { order: await mapOrderRow(supabase, updated) };
}

export async function setAutoPrint(supabase: SupabaseClient, storeId: string, value: boolean): Promise<Store> {
  const { data, error } = await supabase
    .from("stores")
    .update({ auto_print: value })
    .eq("id", storeId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapStoreRow(data);
}
