-- 0003: suporte ao cardápio simples (index.html) com pedido pelo WhatsApp
-- Já aplicada no projeto Supabase "Cardapio" em 2026-11-24. Este arquivo é o registro.

-- Bucket público para fotos do cardápio (pasta = store_id)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images','menu-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "menu_images_member_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'menu-images' and public.is_store_member(((storage.foldername(name))[1])::uuid));
create policy "menu_images_member_update" on storage.objects for update to authenticated
using (bucket_id = 'menu-images' and public.is_store_member(((storage.foldername(name))[1])::uuid));
create policy "menu_images_member_delete" on storage.objects for delete to authenticated
using (bucket_id = 'menu-images' and public.is_store_member(((storage.foldername(name))[1])::uuid));

-- Cadastro da loja pelo próprio lojista
create or replace function public.create_my_store(p_name text, p_slug text, p_whatsapp text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from store_members where user_id = v_uid) then
    raise exception 'already_has_store';
  end if;
  insert into stores (name, slug, whatsapp)
  values (trim(p_name), lower(trim(p_slug)), nullif(regexp_replace(coalesce(p_whatsapp,''), '\D', '', 'g'), ''))
  returning id into v_id;
  insert into store_members (store_id, user_id, role) values (v_id, v_uid, 'owner');
  return v_id;
end $$;

revoke all on function public.create_my_store(text,text,text) from public, anon;
grant execute on function public.create_my_store(text,text,text) to authenticated;
