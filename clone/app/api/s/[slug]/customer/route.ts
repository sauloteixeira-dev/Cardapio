import { NextResponse } from "next/server";
import { getStoreBySlug, upsertCustomer } from "@/lib/data";
import { customerSchema } from "@/lib/zod-schemas";

// POST /api/s/{slug}/customer — architecture.md. Identifica por WhatsApp + nome, sem senha.
// Limite de requisições por IP (abuso de pedido falso) fica para a passagem de "essenciais"
// do architecture.md — ver replica/backend.md > "Não feito nesta passagem".
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = customerSchema.safeParse({
    phone: String(body?.phone ?? "").replace(/\D/g, ""),
    name: String(body?.name ?? ""),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const customer = await upsertCustomer(store.id, parsed.data.phone, parsed.data.name);
  return NextResponse.json({ customer });
}
