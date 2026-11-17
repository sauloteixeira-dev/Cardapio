import { NextResponse } from "next/server";
import { getStoreBySlug, quote } from "@/lib/data";
import type { QuoteInput } from "@/lib/types";

// POST /api/s/{slug}/quote — architecture.md. Recalcula tudo no servidor; o total mostrado
// no carrinho do navegador é só uma prévia até passar por aqui.
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  const body = (await req.json().catch(() => null)) as QuoteInput | null;
  if (!body || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const result = await quote(store.id, body);
  return NextResponse.json(result);
}
