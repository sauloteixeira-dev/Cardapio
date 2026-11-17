import { NextResponse } from "next/server";
import { createOrder, getStoreBySlug } from "@/lib/data";
import type { QuoteInput } from "@/lib/types";

// POST /api/s/{slug}/orders — architecture.md. Cria o pedido com os valores recalculados
// pelo servidor. Exige uma chave de idempotência do navegador (duplo clique não duplica).
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  const body = (await req.json().catch(() => null)) as {
    customer?: { phone: string; name: string };
    idempotencyKey?: string;
  } & QuoteInput;

  if (!body?.customer?.phone || !body.customer.name) {
    return NextResponse.json({ error: "Identifique-se antes de finalizar o pedido." }, { status: 400 });
  }
  if (!body.idempotencyKey) {
    return NextResponse.json({ error: "Requisição sem chave de idempotência." }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "O carrinho está vazio." }, { status: 400 });
  }

  const { order, errors } = await createOrder(store.id, body.customer, body, body.idempotencyKey);
  if (!order) return NextResponse.json({ error: errors.join(" ") || "Não foi possível criar o pedido." }, { status: 422 });

  return NextResponse.json({ order });
}
