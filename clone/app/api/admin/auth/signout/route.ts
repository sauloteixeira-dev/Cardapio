import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// POST /api/admin/auth/signout — chamada pelo botão "Sair" do painel (admin-orders-client.tsx).
export async function POST() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
