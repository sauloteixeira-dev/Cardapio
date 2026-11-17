import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente com a chave de serviço do Supabase: ignora a RLS do supabase/migrations/0001_init.sql.
// É o que esse arquivo chama de "chave de serviço" — só pode ser importado em código que roda
// no servidor (rotas de API, nunca em componente "use client"). Usado para:
//   - leituras públicas do cardápio (lib/data.ts), que não precisam de sessão;
//   - escritas do cliente final (upsertCustomer, createOrder), que também não têm sessão —
//     por isso não têm política de insert no banco, de propósito.
// As ações do lojista (painel) NÃO passam por aqui — usam lib/supabase/server.ts, vinculado
// à sessão dele, para a RLS (is_store_member) valer de verdade.
let cached: SupabaseClient | null = null;

export function supabaseService(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY. Copie .env.example para " +
        ".env.local e preencha com os valores do seu projeto Supabase (replica/backend.md).",
    );
  }

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
