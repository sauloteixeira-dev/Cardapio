// Ajuda os specs a criar e apagar, a cada teste, os dados que precisam de login
// (lojista, segunda loja para o teste de isolamento) — nunca à mão no banco de produção.
// Usa a chave de serviço, então só corre no servidor de teste, nunca no navegador.
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltam as variáveis do Supabase para rodar os testes — veja .env.local.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getStoreIdBySlug(slug: string): Promise<string> {
  const { data, error } = await admin().from("stores").select("id").eq("slug", slug).single();
  if (error || !data) throw new Error(`Loja "${slug}" não encontrada — rode o seed primeiro.`);
  return data.id;
}

export async function createTestOwner(storeSlug: string) {
  const supabase = admin();
  const email = `e2e-${randomUUID()}@example.test`;
  const password = `Teste!${randomUUID().slice(0, 8)}`;

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userError || !userData.user) throw new Error(`Falha ao criar usuário de teste: ${userError?.message}`);

  const storeId = await getStoreIdBySlug(storeSlug);
  const { error: memberError } = await supabase
    .from("store_members")
    .insert({ store_id: storeId, user_id: userData.user.id, role: "owner" });
  if (memberError) throw new Error(`Falha ao ligar usuário à loja: ${memberError.message}`);

  return {
    email,
    password,
    userId: userData.user.id,
    storeId,
    async cleanup() {
      await supabase.auth.admin.deleteUser(userData.user.id);
    },
  };
}

// Cria uma segunda loja (sem vínculo com a primeira) e um usuário dono só dela — para o
// teste F04-E2: confirmar que a RLS nunca deixa um lojista ver pedido de outra loja.
export async function createOtherStoreWithOwner() {
  const supabase = admin();
  const slug = `e2e-outra-loja-${randomUUID().slice(0, 8)}`;
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .insert({ slug, name: "Loja de Teste (isolamento)" })
    .select()
    .single();
  if (storeError || !store) throw new Error(`Falha ao criar segunda loja: ${storeError?.message}`);

  const email = `e2e-${randomUUID()}@example.test`;
  const password = `Teste!${randomUUID().slice(0, 8)}`;
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userError || !userData.user) throw new Error(`Falha ao criar usuário de teste: ${userError?.message}`);

  await supabase.from("store_members").insert({ store_id: store.id, user_id: userData.user.id, role: "owner" });

  return {
    email,
    password,
    storeId: store.id,
    slug,
    async cleanup() {
      await supabase.auth.admin.deleteUser(userData.user.id);
      await supabase.from("stores").delete().eq("id", store.id);
    },
  };
}

// Cria um pedido direto pela API pública (o mesmo caminho que o cliente usa), para os
// testes do painel não precisarem repetir o fluxo de compra inteiro.
export async function seedOrder(baseURL: string, slug: string, overrides?: { quantity?: number }) {
  const menuRes = await fetch(`${baseURL}/api/s/${slug}/menu`);
  const menu = await menuRes.json();
  const product = menu.products[0];

  const idempotencyKey = randomUUID();
  const res = await fetch(`${baseURL}/api/s/${slug}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: { phone: "35999990000", name: "Cliente de Teste" },
      fulfillment: "pickup",
      idempotencyKey,
      items: [{ productId: product.id, quantity: overrides?.quantity ?? 1, notes: "", optionIds: [] }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Falha ao criar pedido de teste: ${data.error}`);
  return data.order;
}
