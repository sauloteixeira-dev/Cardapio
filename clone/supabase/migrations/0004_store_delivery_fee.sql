-- 0004: taxa de entrega fixa por loja (preenchida pelo lojista no painel)
-- Já aplicada no projeto Supabase "Cardapio" em 2026-11-24.
alter table public.stores add column if not exists delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0);
