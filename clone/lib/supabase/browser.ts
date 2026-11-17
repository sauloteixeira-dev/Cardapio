"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente do navegador, só para a tela de login (app/admin/entrar) chamar
// supabase.auth.signInWithPassword / signOut. Nunca usado para ler ou escrever dados do
// cardápio ou dos pedidos direto do navegador — isso continua passando pelas rotas de API.
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
