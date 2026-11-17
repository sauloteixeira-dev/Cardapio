import { NextResponse } from "next/server";
import { getStoreBySlug, upsertCustomer } from "@/lib/data";

const PHONE_RE = /^[0-9]{10,13}$/;

// POST /api/s/{slug}/customer — architecture.md. Identifica por WhatsApp + nome, sem senha.
// Na versão real, aqui entra limite de requisições por IP (abuso de pedido falso).
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const phone = String(body?.phone ?? "").replace(/\D/g, "");
  const name = String(body?.name ?? "").trim();

  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "Informe um WhatsApp válido, com DDD." }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: "Informe seu nome e sobrenome." }, { status: 400 });
  }

  const customer = await upsertCustomer(store.id, phone, name);
  return NextResponse.json({ customer });
}
