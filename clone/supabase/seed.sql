-- supabase/seed.sql
-- Dados de exemplo (loja "burgueria-exemplo"), sem pessoas reais — só para ver o sistema
-- funcionando depois das migrations. Rode no SQL Editor do Supabase, ou:
--   supabase db execute -f supabase/seed.sql

do $$
declare
  v_store uuid;
  v_cat_lanches uuid;
  v_cat_porcoes uuid;
  v_cat_bebidas uuid;
  v_prod_xtudo uuid;
  v_grp uuid;
begin
  insert into stores (
    slug, name, accent_color, whatsapp, min_order_cents,
    accepts_delivery, accepts_pickup, accepts_dine_in,
    accepts_card_on_delivery, accepts_cash_on_delivery
  ) values (
    'burgueria-exemplo', 'Burgueria Exemplo', '#3463e0', '35999998888', 200,
    false, true, true, -- decisão do projeto: entrega pelo site ainda desligada
    true, false
  )
  returning id into v_store;

  insert into categories (store_id, name, position) values (v_store, 'Lanches', 0) returning id into v_cat_lanches;
  insert into categories (store_id, name, position) values (v_store, 'Porções', 1) returning id into v_cat_porcoes;
  insert into categories (store_id, name, position) values (v_store, 'Bebidas', 2) returning id into v_cat_bebidas;

  insert into products (store_id, category_id, name, description, price_cents, pinned_best_seller)
  values (
    v_store, v_cat_lanches, 'X-Tudo',
    'Pão, hambúrguer, bacon, presunto, queijo, alface, tomate, batata palha, ovo.',
    2300, true
  )
  returning id into v_prod_xtudo;

  insert into option_groups (store_id, name, min_select, max_select)
  values (v_store, 'Adicionais', 0, 10)
  returning id into v_grp;

  insert into product_option_groups (store_id, product_id, group_id, position)
  values (v_store, v_prod_xtudo, v_grp, 0);

  insert into options (store_id, group_id, name, price_cents, sold_out, position) values
    (v_store, v_grp, 'Alface', 200, false, 0),
    (v_store, v_grp, 'Tomate', 150, false, 1),
    (v_store, v_grp, 'Milho', 200, false, 2),
    (v_store, v_grp, 'Abacaxi', 200, false, 3),
    (v_store, v_grp, 'Batata palha', 150, false, 4),
    (v_store, v_grp, 'Catupiry', 300, true, 5);

  insert into products (store_id, category_id, name, description, price_cents)
  values (
    v_store, v_cat_porcoes, 'Contra-filé na chapa',
    '300g de contra-filé, 300g de batata frita, cebola e cheiro-verde.',
    5999
  );

  insert into products (store_id, category_id, name, price_cents, pinned_best_seller)
  values (v_store, v_cat_bebidas, 'Coca-Cola 600ml', 1000, true);

  insert into plans (id, name, price_cents)
  values ('starter', 'Starter', 9900)
  on conflict (id) do nothing;
end $$;

-- ---------------------------------------------------------------------------------------
-- Depois de criar seu usuário de login (veja replica/backend.md > "Primeiro acesso do
-- lojista"), ligue esse usuário à loja de exemplo trocando o uuid abaixo pelo id dele
-- (Authentication > Users, no painel do Supabase):
--
-- insert into store_members (store_id, user_id, role)
-- select id, '<uuid-do-usuário>'::uuid, 'owner' from stores where slug = 'burgueria-exemplo';
