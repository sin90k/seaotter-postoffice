begin;

create or replace function private.can_use_personal_brand()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        coalesce(total_paid_credits, 0) > 0
        or coalesce(paid_credits, 0) > 0
        or role = 'admin'
      )
  );
$$;

revoke all on function private.can_use_personal_brand() from public, anon;
grant execute on function private.can_use_personal_brand() to authenticated, service_role;

drop policy if exists user_brand_settings_insert_paid on public.user_brand_settings;
create policy user_brand_settings_insert_paid
  on public.user_brand_settings for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and private.can_use_personal_brand()
  );

drop policy if exists user_brand_settings_update_paid on public.user_brand_settings;
create policy user_brand_settings_update_paid
  on public.user_brand_settings for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and private.can_use_personal_brand()
  )
  with check (
    (select auth.uid()) = user_id
    and private.can_use_personal_brand()
  );

drop function if exists private.has_paid_branding_entitlement(uuid);

revoke all on public.user_brand_settings from public, anon;
grant select, insert, update, delete on public.user_brand_settings to authenticated;

commit;
