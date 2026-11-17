-- replica/schema.sql
-- Pedidos online multi-loja. Postgres (Supabase). Dinheiro sempre em centavos inteiros.
-- Horários sempre em timestamptz (UTC). Cada loja é um "tenant" (stores.id).
-- Escritas do cliente final passam pelo servidor (chave de serviço), nunca direto do navegador.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- utilitários

create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- lojas

create table stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name text not null,
  logo_url text,
  cover_url text,
  accent_color text not null default '#d92d20'
    check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{10,13}$'),
  address_street text,
  address_number text,
  address_district text,
  address_city text,
  address_state text,
  address_zip text,
  timezone text not null default 'America/Sao_Paulo',
  min_order_cents integer not null default 0 check (min_order_cents >= 0),
  accepts_delivery boolean not null default true,
  accepts_pickup boolean not null default true,
  accepts_dine_in boolean not null default false,
  delivery_minutes_min integer check (delivery_minutes_min >= 0),
  delivery_minutes_max integer check (delivery_minutes_max >= delivery_minutes_min),
  pickup_minutes_min integer check (pickup_minutes_min >= 0),
  pickup_minutes_max integer check (pickup_minutes_max >= pickup_minutes_min),
  is_paused boolean not null default false,
  -- impressão da comanda no computador do lojista e aviso ao cliente por WhatsApp
  -- caixa de seleção nas configurações: imprimir a comanda quando chega pedido novo
  auto_print boolean not null default false,
  print_paper text not null default 'thermal_80mm' check (print_paper in ('thermal_80mm', 'a4')),
  print_copies integer not null default 1 check (print_copies between 1 and 5),
  whatsapp_confirmation text not null default 'link' check (whatsapp_confirmation in ('off', 'link', 'api')),
  -- primeira versão: pagamento só na entrega ou no balcão; pagamento online fica desligado
  online_payments_enabled boolean not null default false,
  accepts_card_on_delivery boolean not null default true,
  accepts_cash_on_delivery boolean not null default false,
  order_seq bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table store_members (
  store_id uuid not null references stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);
create index on store_members (user_id);

-- Horário de funcionamento. Se closes_at <= opens_at, a loja fecha depois da meia-noite
-- (o turno continua no dia seguinte). A hora é local da loja (stores.timezone).
create table store_hours (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  unique (store_id, weekday, opens_at)
);
create index on store_hours (store_id);

-- ---------------------------------------------------------------- cardápio

create table categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, store_id)
);
create index on categories (store_id, position);

create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  category_id uuid not null,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  image_url text,
  position integer not null default 0,
  active boolean not null default true,
  sold_out boolean not null default false,
  pinned_best_seller boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, store_id),
  -- produto e categoria precisam ser da mesma loja; a categoria só sai se estiver vazia
  foreign key (category_id, store_id) references categories(id, store_id) on delete restrict
);
create index on products (store_id, category_id, position);

create table option_groups (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  min_select integer not null default 0 check (min_select >= 0),
  max_select integer not null default 1 check (max_select >= 1),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, store_id),
  check (max_select >= min_select)
);
create index on option_groups (store_id);

create table product_option_groups (
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null,
  group_id uuid not null,
  position integer not null default 0,
  primary key (product_id, group_id),
  foreign key (product_id, store_id) references products(id, store_id) on delete cascade,
  foreign key (group_id, store_id) references option_groups(id, store_id) on delete cascade
);
create index on product_option_groups (group_id);
create index on product_option_groups (store_id);

create table options (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  group_id uuid not null,
  name text not null,
  price_cents integer not null default 0 check (price_cents >= 0),
  image_url text,
  position integer not null default 0,
  active boolean not null default true,
  sold_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (group_id, store_id) references option_groups(id, store_id) on delete cascade
);
create index on options (group_id, position);
create index on options (store_id);

create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  district text not null,
  fee_cents integer not null default 0 check (fee_cents >= 0),
  minutes_min integer check (minutes_min >= 0),
  minutes_max integer check (minutes_max >= minutes_min),
  active boolean not null default true
);
create unique index on delivery_zones (store_id, lower(district));

create table coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  code text not null check (code = upper(code)),
  kind text not null check (kind in ('percent', 'fixed')),
  value integer not null,
  min_order_cents integer not null default 0 check (min_order_cents >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer check (max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, code),
  check ((kind = 'fixed' and value > 0) or (kind = 'percent' and value between 1 and 100))
);

-- ---------------------------------------------------------------- clientes e pedidos

-- O cliente final não tem senha: é identificado por WhatsApp + nome, separado por loja
-- (um cliente em duas lojas são dois registros; nada vaza entre lojas).
create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  phone text not null check (phone ~ '^[0-9]{10,13}$' or phone like 'removido:%'),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, phone),
  unique (id, store_id)
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  label text,
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  state text not null,
  zip text,
  created_at timestamptz not null default now()
);
create index on addresses (customer_id);
create index on addresses (store_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete restrict,
  number bigint not null,
  customer_id uuid not null references customers(id) on delete restrict,
  fulfillment text not null check (fulfillment in ('delivery', 'pickup', 'dine_in')),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'received', 'accepted', 'preparing', 'ready',
                      'out_for_delivery', 'completed', 'cancelled', 'rejected')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  service_fee_cents integer not null default 0 check (service_fee_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency char(3) not null default 'BRL',
  coupon_id uuid references coupons(id) on delete set null,
  notes text,
  delivery_address jsonb,
  table_label text,
  -- reservado para o envio automático por WhatsApp (fase posterior); na primeira versão é o cliente quem envia
  whatsapp_consent boolean not null default false,
  -- "enviado para impressão" (o navegador não sabe se o papel saiu)
  printed_at timestamptz,
  print_count integer not null default 0 check (print_count >= 0),
  estimated_minutes_min integer,
  estimated_minutes_max integer,
  -- link de acompanhamento do cliente: quem tem o token vê o pedido, ninguém adivinha
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  -- evita pedido duplicado por duplo clique ou nova tentativa de rede
  idempotency_key text not null,
  placed_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, number),
  unique (store_id, idempotency_key),
  unique (id, store_id),
  foreign key (customer_id, store_id) references customers(id, store_id) on delete restrict,
  constraint total_matches
    check (total_cents = subtotal_cents + delivery_fee_cents + service_fee_cents - discount_cents),
  constraint delivery_needs_address
    check (fulfillment <> 'delivery' or delivery_address is not null)
);
create index on orders (store_id, status, placed_at desc);
create index on orders (customer_id, placed_at desc);
create index on orders (coupon_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete restrict,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  -- fotografia do que foi vendido: editar o cardápio depois não muda pedidos antigos
  name_snapshot text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  notes text,
  options jsonb not null default '[]',
  line_total_cents integer not null check (line_total_cents >= 0)
);
create index on order_items (order_id);
create index on order_items (product_id);
create index on order_items (store_id);

create table order_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete restrict,
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor text not null check (actor in ('customer', 'store', 'system', 'payment_provider')),
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on order_events (order_id, created_at);
create index on order_events (store_id);

-- ---------------------------------------------------------------- pagamentos

create table payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete restrict,
  order_id uuid not null references orders(id) on delete restrict,
  method text not null
    check (method in ('pix', 'card', 'nubank', 'cash_on_delivery', 'card_on_delivery')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'BRL',
  -- 'mercado_pago' (conta do lojista) ou nulo para pagar na entrega
  provider text,
  provider_payment_id text,
  pix_copy_paste text,
  pix_expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id),
  constraint pix_needs_expiry check (method <> 'pix' or pix_expires_at is not null)
);
create index on payments (order_id);
create index on payments (store_id, status);
create index on payments (status, pix_expires_at) where method = 'pix' and status = 'pending';
-- um pedido só pode ter um pagamento confirmado
create unique index one_paid_payment_per_order on payments (order_id) where status = 'paid';

-- Eventos recebidos do provedor de pagamento. O mesmo evento chega mais de uma vez:
-- a chave única faz a segunda entrega ser ignorada.
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete set null,
  provider text not null,
  event_id text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (provider, event_id)
);

-- Conta do Mercado Pago de cada lojista, ligada por OAuth. O dinheiro das vendas cai direto
-- nessa conta; a plataforma nunca recebe o valor do pedido. Os tokens ficam criptografados
-- (chave só no servidor) e esta tabela não tem política: o navegador nunca lê.
create table store_payment_accounts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references stores(id) on delete cascade,
  provider text not null default 'mercado_pago' check (provider in ('mercado_pago')),
  provider_user_id text not null,
  public_key text,
  access_token_enc text not null,
  refresh_token_enc text,
  token_expires_at timestamptz,
  status text not null default 'connected' check (status in ('connected', 'expired', 'revoked')),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

-- Avisos enviados por pedido. A chave única (pedido, tipo, canal) impede a confirmação
-- de pagamento de sair duas vezes, mesmo se o webhook chegar repetido.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete restrict,
  order_id uuid not null references orders(id) on delete cascade,
  channel text not null check (channel in ('whatsapp_api', 'whatsapp_link')),
  kind text not null check (kind in ('order_received', 'payment_confirmed', 'order_status')),
  to_phone text not null,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'read', 'failed')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, kind, channel)
);
create index on notifications (store_id, created_at desc);
create index on notifications (status) where status in ('queued', 'failed');

-- ---------------------------------------------------------------- assinatura do SaaS

create table plans (
  id text primary key,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  currency char(3) not null default 'BRL',
  active boolean not null default true
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references stores(id) on delete cascade,
  plan_id text not null references plans(id) on delete restrict,
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'canceled')),
  provider text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);
create index on subscriptions (plan_id);

-- ---------------------------------------------------------------- funções

-- Número do pedido por loja, sem buracos e sem repetir mesmo com pedidos simultâneos
-- (o update trava a linha da loja).
create function next_order_number(p_store uuid) returns bigint language sql as $$
  update stores set order_seq = order_seq + 1 where id = p_store returning order_seq;
$$;

-- Expira Pix não pago e cancela o pedido que ainda aguardava pagamento.
-- Chamada a cada minuto por pg_cron.
create function expire_pending_pix() returns integer language plpgsql as $$
declare
  n integer;
begin
  with expired as (
    update payments
       set status = 'expired'
     where method = 'pix' and status = 'pending' and pix_expires_at < now()
    returning order_id
  )
  update orders o
     set status = 'cancelled', cancelled_at = now(), cancel_reason = 'pix_expirado'
    from expired e
   where o.id = e.order_id and o.status = 'awaiting_payment';
  get diagnostics n = row_count;
  return n;
end $$;

-- Anonimiza o cliente (pedido de exclusão pela LGPD) sem apagar o histórico de vendas da loja.
create function anonymize_customer(p_customer uuid) returns void language plpgsql as $$
begin
  update customers set name = 'Cliente removido', phone = 'removido:' || id::text where id = p_customer;
  delete from addresses where customer_id = p_customer;
  update orders set delivery_address = null, notes = null where customer_id = p_customer;
end $$;

create function is_store_member(p_store uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from store_members m where m.store_id = p_store and m.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------- gatilhos

do $$
declare t text;
begin
  foreach t in array array['stores', 'categories', 'products', 'option_groups', 'options',
                           'coupons', 'customers', 'orders', 'payments', 'subscriptions',
                           'store_payment_accounts', 'notifications'] loop
    execute format(
      'create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- acesso (RLS)
-- Regra: o navegador do cliente final só LÊ o cardápio. Criar pedido, pagar e acompanhar
-- passam por rotas do servidor, que validam tudo e usam a chave de serviço.
-- O lojista (membro da loja) lê e escreve só o que é da própria loja.

do $$
declare t text;
begin
  foreach t in array array['stores', 'store_members', 'store_hours', 'categories', 'products',
                           'option_groups', 'product_option_groups', 'options', 'delivery_zones',
                           'coupons', 'customers', 'addresses', 'orders', 'order_items',
                           'order_events', 'payments', 'webhook_events', 'plans', 'subscriptions',
                           'store_payment_accounts', 'notifications'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- cardápio público (somente o que está ativo; o lojista vê tudo da própria loja)
create policy stores_public_read on stores for select using (true);
create policy stores_member_update on stores for update
  using (is_store_member(id)) with check (is_store_member(id));

create policy store_members_self_read on store_members for select using (user_id = auth.uid());

create policy plans_public_read on plans for select using (active);

create policy store_hours_public_read on store_hours for select using (true);
create policy product_option_groups_public_read on product_option_groups for select using (true);

create policy categories_public_read on categories for select
  using (active or is_store_member(store_id));
create policy products_public_read on products for select
  using (active or is_store_member(store_id));
create policy option_groups_public_read on option_groups for select
  using (active or is_store_member(store_id));
create policy options_public_read on options for select
  using (active or is_store_member(store_id));
create policy delivery_zones_public_read on delivery_zones for select
  using (active or is_store_member(store_id));

-- escrita do lojista no cardápio e nas configurações
do $$
declare t text;
begin
  foreach t in array array['store_hours', 'categories', 'products', 'option_groups',
                           'product_option_groups', 'options', 'delivery_zones', 'coupons'] loop
    execute format(
      'create policy %I on %I for all using (is_store_member(store_id)) with check (is_store_member(store_id))',
      t || '_member_write', t);
  end loop;
end $$;

-- dados de clientes e pedidos: só o lojista da loja lê; o cliente final nunca lê direto
do $$
declare t text;
begin
  foreach t in array array['customers', 'addresses', 'orders', 'order_items', 'order_events',
                           'payments', 'subscriptions', 'notifications'] loop
    execute format(
      'create policy %I on %I for select using (is_store_member(store_id))', t || '_member_read', t);
  end loop;
end $$;

-- o lojista muda o andamento do pedido; o valor e o pagamento ficam só com o servidor
create policy orders_member_update on orders for update
  using (is_store_member(store_id)) with check (is_store_member(store_id));
create policy order_events_member_insert on order_events for insert
  with check (is_store_member(store_id));

-- webhook_events e store_payment_accounts não têm política: ninguém lê ou escreve pelo navegador
-- (a chave de serviço ignora RLS). O painel mostra só o status da conexão, via rota do servidor.
