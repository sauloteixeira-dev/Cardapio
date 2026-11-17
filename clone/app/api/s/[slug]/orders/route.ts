import { NextResponse } from "next/server";
import { createOrder, getStoreBySlug } from "@/lib/data";
import { createOrderSchema } from "@/lib/zod-schemas";

// POST /api/s/{slug}/orders — architecture.md. Cria o pedido com os valores recalculados
// pelo servidor. Exige uma chave de idempotência do navegador (duplo clique não duplica).
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Identifique-se antes de finalizar o pedido." }, { status: 400 });
  }

  const { customer, idempotencyKey, ...quoteInput } = parsed.data;
  const { order, errors } = await createOrder(store.id, customer, quoteInput, idempotencyKey);
  if (!order) {
    return NextResponse.json({ error: errors.join(" ") || "Não foi possível criar o pedido." }, { status: 422 });
  }

  return NextResponse.json({ order });
}
