import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isPlatformAdmin, listAllStores, createStoreWithOwner } from "@/lib/platform-data";
import { createStoreSchema } from "@/lib/zod-schemas";

// Fica sob /api/admin/*, então o middleware.ts já exige sessão. Daqui pra baixo, a camada
// extra é isPlatformAdmin(): só quem está na tabela platform_admins (você) passa — um
// lojista comum logado cai no 403.
export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login para acessar o painel." }, { status: 401 });
  if (!(await isPlatformAdmin(supabase))) {
    return NextResponse.json({ error: "Acesso restrito ao dono da plataforma." }, { status: 403 });
  }

  const stores = await listAllStores();
  return NextResponse.json({ stores });
}

export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login para acessar o painel." }, { status: 401 });
  if (!(await isPlatformAdmin(supabase))) {
    return NextResponse.json({ error: "Acesso restrito ao dono da plataforma." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const result = await createStoreWithOwner(parsed.data);
    return NextResponse.json({ store: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar a loja." },
      { status: 422 },
    );
  }
}
