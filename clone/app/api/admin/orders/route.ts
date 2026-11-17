import { NextResponse } from "next/server";
import { getStoreBySlug, listOrdersForStore } from "@/lib/data";

// GET /api/admin/orders — architecture.md. Painel A02: por enquanto consulta a cada poucos
// segundos (ver app/admin/pedidos/page.tsx); o Supabase Realtime da /replica-backend troca
// esse polling por uma assinatura, sem mudar esta rota nem a tela.
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const store = await getStoreBySlug(slug);
  if (!store) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  const orders = await listOrdersForStore(store.id);
  return NextResponse.json({ orders });
}
