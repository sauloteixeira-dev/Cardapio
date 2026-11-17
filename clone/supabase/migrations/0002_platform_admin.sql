-- supabase/migrations/0002_platform_admin.sql
-- Painel do DONO DA PLATAFORMA (você) — separado dos painéis das lojas. Sem isto só existia
-- um jeito de ver/gerenciar lojas: direto no SQL. Veja lib/platform-data.ts e
-- app/admin/plataforma/*.

create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;
-- Sem política de propósito: ninguém lê/escreve isto pela API pública (anon/authenticated),
-- só a chave de serviço (bypassa RLS) depois que is_platform_admin() já confirmou a sessão.
revoke all on platform_admins from anon, authenticated;

create or replace function is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from platform_admins where user_id = auth.uid()
  );
$$;

-- Mesmo padrão de is_store_member(): authenticated precisa poder chamar via RPC
-- (lib/platform-data.ts), anon não.
revoke execute on function is_platform_admin() from public, anon;
grant execute on function is_platform_admin() to authenticated;
