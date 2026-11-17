import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { updateOrderStatus } from "@/lib/admin-data";
import { orderStatusSchema } from "@/lib/zod-schemas";

// PATCH /api/admin/orders/{id}/status — architecture.md. Protegida pelo middleware.ts; a
// troca só é aceita se o pedido for de uma loja da qual o usuário logado é membro (RLS,
// is_store_member em lib/admin-data.ts).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = orderStatusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe o novo status." }, { status: 400 });

  const supabase = await supabaseServer();
  const { order, error } = await updateOrderStatus(supabase, id, parsed.data.status);
  if (error) return NextResponse.json({ error }, { status: 422 });
  return NextResponse.json({ order });
}
