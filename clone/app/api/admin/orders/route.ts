import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getStoreForMember, isMemberOfStore, listOrdersForStore } from "@/lib/admin-data";

// GET /api/admin/orders — architecture.md. Protegida pelo middleware.ts (precisa estar
// logado); a RLS (is_store_member) garante que só vêm pedidos da loja do lojista logado,
// mesmo que o "slug" na URL seja de outra loja — ver replica/build-log.md > "A02 ... sem
// login", que esta etapa (/replica-backend) fecha.
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const supabase = await supabaseServer();

  const store = await getStoreForMember(supabase, slug);
  if (!store) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });
  if (!(await isMemberOfStore(supabase, store.id))) {
    return NextResponse.json({ error: "Você não tem acesso a esta loja." }, { status: 403 });
  }

  const orders = await listOrdersForStore(supabase, store.id);
  return NextResponse.json({ orders });
}
