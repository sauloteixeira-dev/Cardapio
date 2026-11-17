import { NextResponse } from "next/server";
import { getStoreBySlug, setAutoPrint } from "@/lib/data";

// PATCH /api/admin/store — architecture.md. Nesta fatia só liga/desliga a impressão
// automática (PrintSettingToggle do components.md); o resto das configurações (A04) fica
// para a passagem de "essenciais" do architecture.md > Ordem de construção.
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = String(body?.slug ?? "");
  const store = await getStoreBySlug(slug);
  if (!store) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  if (typeof body?.autoPrint === "boolean") {
    await setAutoPrint(store.id, body.autoPrint);
  }
  return NextResponse.json({ store: await getStoreBySlug(slug) });
}
