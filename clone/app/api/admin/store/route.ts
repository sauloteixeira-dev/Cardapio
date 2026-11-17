import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getStoreForMember, isMemberOfStore, setAutoPrint } from "@/lib/admin-data";
import { storePatchSchema } from "@/lib/zod-schemas";

// PATCH /api/admin/store — architecture.md. Nesta fatia só liga/desliga a impressão
// automática (PrintSettingToggle do design/components.md); o resto das configurações (A04)
// fica para a próxima passagem do architecture.md > "Ordem de construção".
export async function PATCH(req: Request) {
  const parsed = storePatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const supabase = await supabaseServer();
  const store = await getStoreForMember(supabase, parsed.data.slug);
  if (!store) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });
  if (!(await isMemberOfStore(supabase, store.id))) {
    return NextResponse.json({ error: "Você não tem acesso a esta loja." }, { status: 403 });
  }

  if (typeof parsed.data.autoPrint === "boolean") {
    await setAutoPrint(supabase, store.id, parsed.data.autoPrint);
  }

  const updated = await getStoreForMember(supabase, parsed.data.slug);
  return NextResponse.json({ store: updated });
}
