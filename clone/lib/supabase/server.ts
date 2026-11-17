import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Cliente ligado à sessão do lojista logado (cookies httpOnly, lidos do próprio request).
// Toda consulta feita com este cliente passa pela RLS de supabase/migrations/0001_init.sql —
// a função is_store_member() decide o que ele vê e o que ele muda. Usado só pelas rotas e
// páginas de /admin (painel do lojista), nunca pelo fluxo do cliente final.
export async function supabaseServer() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de dentro de um Server Component, que não pode escrever cookie — o
          // middleware.ts já renova a sessão a cada requisição, então isso é inofensivo.
        }
      },
    },
  });
}
