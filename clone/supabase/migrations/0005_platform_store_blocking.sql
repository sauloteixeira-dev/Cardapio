-- 0005: administrador da plataforma só visualiza e bloqueia lojas (não edita).
-- Já aplicada no projeto Supabase "Cardapio" em 2026-11-24.
alter table public.stores add column if not exists blocked_at timestamptz;
alter table public.stores add column if not exists blocked_reason text;

-- Loja bloqueada: membros perdem permissão de escrita
create or replace function public.is_store_member(p_store uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from store_members m join stores s on s.id = m.store_id
    where m.store_id = p_store and m.user_id = auth.uid() and s.blocked_at is null
  );
$$;

-- Só o administrador da plataforma altera as colunas de bloqueio
create or replace function public.guard_store_block_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.blocked_at is distinct from old.blocked_at or new.blocked_reason is distinct from old.blocked_reason)
     and auth.uid() is not null and not public.is_platform_admin() then
    raise exception 'only_platform_admin_can_block';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_store_block on public.stores;
create trigger trg_guard_store_block before update on public.stores
for each row execute function public.guard_store_block_columns();

create or replace function public.admin_list_stores()
returns table (id uuid, name text, slug text, owner_email text, products bigint, created_at timestamptz, blocked_at timestamptz, blocked_reason text, has_whatsapp boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  return query
  select s.id, s.name, s.slug,
         (select u.email::text from store_members m join auth.users u on u.id = m.user_id
           where m.store_id = s.id order by (m.role = 'owner') desc, m.created_at limit 1),
         (select count(*) from products p where p.store_id = s.id),
         s.created_at, s.blocked_at, s.blocked_reason, s.whatsapp is not null
  from stores s order by s.created_at desc;
end $$;

create or replace function public.admin_set_store_blocked(p_store uuid, p_blocked boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  update stores set blocked_at = case when p_blocked then now() else null end,
                    blocked_reason = case when p_blocked then nullif(trim(p_reason),'') else null end
  where id = p_store;
end $$;

revoke all on function public.admin_list_stores() from public, anon;
revoke all on function public.admin_set_store_blocked(uuid, boolean, text) from public, anon;
grant execute on function public.admin_list_stores() to authenticated;
grant execute on function public.admin_set_store_blocked(uuid, boolean, text) to authenticated;

-- Conta de administrador não pode ser dona de loja
create or replace function public.create_my_store(p_name text, p_slug text, p_whatsapp text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if public.is_platform_admin() then raise exception 'admin_cannot_own_store'; end if;
  if exists (select 1 from store_members where user_id = v_uid) then raise exception 'already_has_store'; end if;
  insert into stores (name, slug, whatsapp)
  values (trim(p_name), lower(trim(p_slug)), nullif(regexp_replace(coalesce(p_whatsapp,''), '\D', '', 'g'), ''))
  returning id into v_id;
  insert into store_members (store_id, user_id, role) values (v_id, v_uid, 'owner');
  return v_id;
end $$;
