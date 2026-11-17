// Painel do DONO DA PLATAFORMA (você) — diferente do painel do lojista (lib/admin-data.ts).
// Aqui quem entra enxerga TODAS as lojas, porque é você vendendo o SaaS, não um lojista.
// Por isso:
//   - a checagem de permissão (isPlatformAdmin) usa o cliente da SESSÃO (RLS normal), chamando
//     is_platform_admin() — só retorna true pra quem está na tabela platform_admins;
//   - depois de confirmado, as leituras/escritas usam a chave de SERVIÇO (supabaseService),
//     que ignora a RLS de propósito — é assim que conseguimos ver lojas de todo mundo.
// Nenhuma rota chama supabaseService() aqui sem antes confirmar isPlatformAdmin() com a
// chave da sessão — é essa ordem que impede um lojista comum de usar isto.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseService } from "./supabase/service";

export async function isPlatformAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) return false;
  return Boolean(data);
}

export type PlatformStoreRow = {
  id: string;
  slug: string;
  name: string;
  isPaused: boolean;
  createdAt: string;
  ownerEmail: string | null;
  plan: string | null;
  subscriptionStatus: string | null;
};

export async function listAllStores(): Promise<PlatformStoreRow[]> {
  const service = supabaseService();

  const { data: stores, error } = await service
    .from("stores")
    .select("id, slug, name, is_paused, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!stores || stores.length === 0) return [];

  const storeIds = stores.map((s) => s.id);

  const [{ data: members }, { data: subs }] = await Promise.all([
    service
      .from("store_members")
      .select("store_id, user_id, role")
      .in("store_id", storeIds)
      .eq("role", "owner"),
    service.from("subscriptions").select("store_id, plan_id, status").in("store_id", storeIds),
  ]);

  // auth.users não dá pra filtrar por "in" direto pela API — busca uma a uma é demais pra
  // escala real, mas pro tamanho de uma lista de lojas de um admin isso é desprezível.
  const ownerEmailByUserId = new Map<string, string | null>();
  for (const m of members ?? []) {
    if (ownerEmailByUserId.has(m.user_id)) continue;
    const { data } = await service.auth.admin.getUserById(m.user_id);
    ownerEmailByUserId.set(m.user_id, data?.user?.email ?? null);
  }

  const ownerByStore = new Map<string, string | null>();
  for (const m of members ?? []) {
    if (!ownerByStore.has(m.store_id)) ownerByStore.set(m.store_id, ownerEmailByUserId.get(m.user_id) ?? null);
  }
  const subByStore = new Map((subs ?? []).map((s) => [s.store_id, s]));

  return stores.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    isPaused: s.is_paused,
    createdAt: s.created_at,
    ownerEmail: ownerByStore.get(s.id) ?? null,
    plan: subByStore.get(s.id)?.plan_id ?? null,
    subscriptionStatus: subByStore.get(s.id)?.status ?? null,
  }));
}

export async function createStoreWithOwner(input: {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
}): Promise<{ storeId: string; slug: string }> {
  const service = supabaseService();

  const { data: store, error: storeErr } = await service
    .from("stores")
    .insert({ name: input.name, slug: input.slug })
    .select("id, slug")
    .single();
  if (storeErr) {
    // unique_violation na slug é o caso mais comum aqui
    throw new Error(storeErr.code === "23505" ? "Já existe uma loja com essa slug." : storeErr.message);
  }

  const { data: userData, error: userErr } = await service.auth.admin.createUser({
    email: input.ownerEmail,
    password: input.ownerPassword,
    email_confirm: true,
  });
  if (userErr) {
    await service.from("stores").delete().eq("id", store.id); // desfaz a loja órfã
    throw new Error(userErr.message);
  }

  const { error: memberErr } = await service
    .from("store_members")
    .insert({ store_id: store.id, user_id: userData.user.id, role: "owner" });
  if (memberErr) {
    await service.from("stores").delete().eq("id", store.id);
    throw new Error(memberErr.message);
  }

  const { error: subErr } = await service
    .from("subscriptions")
    .insert({ store_id: store.id, plan_id: "starter", status: "trialing" });
  if (subErr) {
    // não bloqueia a criação da loja por isso — assinatura/cobrança ainda nem existe no
    // sistema (replica/backend.md); isto é só um registro pra já deixar o dado presente.
  }

  return { storeId: store.id, slug: store.slug };
}
