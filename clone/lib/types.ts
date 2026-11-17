// Tipos espelhando replica/schema.sql. Quando a replica-backend plugar o banco de
// verdade, estes tipos continuam valendo — só lib/data.ts muda de lugar (memória -> Postgres).

export type Fulfillment = "delivery" | "pickup" | "dine_in";

export type OrderStatus =
  | "awaiting_payment"
  | "received"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled"
  | "rejected";

export interface Store {
  id: string;
  slug: string;
  name: string;
  accentColor: string;
  whatsapp: string | null;
  timezone: string;
  minOrderCents: number;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  acceptsDineIn: boolean;
  onlinePaymentsEnabled: boolean; // false na primeira versão (decisão do projeto)
  acceptsCardOnDelivery: boolean;
  acceptsCashOnDelivery: boolean;
  autoPrint: boolean; // caixa de seleção das configurações
  printPaper: "thermal_80mm" | "a4";
  isOpenNow: boolean;
  opensUntilLabel: string; // ex.: "Aberto até 23h59" — calculado de store_hours no backend real
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  position: number;
}

export interface Option {
  id: string;
  groupId: string;
  name: string;
  priceCents: number;
  soldOut: boolean;
}

export interface OptionGroupT {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: Option[];
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  soldOut: boolean;
  pinnedBestSeller: boolean;
  optionGroups: OptionGroupT[];
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceCents: number;
}

export interface CartItem {
  lineId: string; // id só do carrinho no aparelho, não é order_items.id
  productId: string;
  name: string;
  unitPriceCents: number; // preço base + soma dos complementos
  quantity: number;
  notes: string;
  options: SelectedOption[];
}

export interface Customer {
  id: string;
  storeId: string;
  phone: string;
  name: string;
}

export interface OrderItemT {
  productId: string;
  nameSnapshot: string;
  unitPriceCents: number;
  quantity: number;
  notes: string;
  options: SelectedOption[];
  lineTotalCents: number;
}

export interface OrderT {
  id: string;
  storeId: string;
  number: number;
  customer: { phone: string; name: string };
  fulfillment: Fulfillment;
  status: OrderStatus;
  items: OrderItemT[];
  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: "card_on_delivery" | "cash_on_delivery";
  notes: string | null;
  publicToken: string;
  placedAt: string; // ISO
  estimatedMinutesMin: number | null;
  estimatedMinutesMax: number | null;
}

export interface QuoteInput {
  items: { productId: string; quantity: number; notes: string; optionIds: string[] }[];
  fulfillment: Fulfillment;
}

export interface QuoteResult {
  ok: boolean;
  errors: string[];
  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  discountCents: number;
  totalCents: number;
  estimatedMinutesMin: number | null;
  estimatedMinutesMax: number | null;
}
