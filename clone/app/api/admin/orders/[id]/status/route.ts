import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/data";
import type { OrderStatus } from "@/lib/types";

// PATCH /api/admin/orders/{id}/status — architecture.md. Fatia vertical: sem login de
// lojista ainda, então qualquer um que abra /admin/pedidos age — a /replica-backend fecha
// isso com Supabase Auth e a política "is_store_member" antes de ir ao ar.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const to = body?.status as OrderStatus | undefined;
  if (!to) return NextResponse.json({ error: "Informe o novo status." }, { status: 400 });

  const { order, error } = await updateOrderStatus(id, to);
  if (error) return NextResponse.json({ error }, { status: 422 });
  return NextResponse.json({ order });
}
