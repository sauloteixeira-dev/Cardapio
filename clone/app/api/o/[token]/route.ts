import { NextResponse } from "next/server";
import { getOrderByToken } from "@/lib/data";

// GET /api/o/{token} — architecture.md. Quem tem o token vê o pedido; ninguém adivinha
// (o token é longo e aleatório, nunca o número sequencial do pedido).
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  return NextResponse.json({ order });
}
