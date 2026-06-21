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

create table if not exists public.user_brand_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  brand_name text not null default '',
  logo_path text,
  qr_target_url text not null default '',
  position text not null default 'bottom-right'
    check (position in ('top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right')),
  qr_scale numeric(4, 2) not null default 1
    check (qr_scale between 0.5 and 2.5),
  logo_scale numeric(4, 2) not null default 1
    check (logo_scale between 0.5 and 2.5),
  opacity numeric(4, 2) not null default 0.8
    check (opacity between 0.35 and 1),
  updated_at timestamptz not null default now()
);

alter table public.user_brand_settings enable row level security;

drop policy if exists user_brand_settings_select_own on public.user_brand_settings;
create policy user_brand_settings_select_own
  on public.user_brand_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

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

drop policy if exists user_brand_settings_delete_own on public.user_brand_settings;
create policy user_brand_settings_delete_own
  on public.user_brand_settings for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.user_brand_settings from public, anon;
grant select, insert, update, delete on public.user_brand_settings to authenticated;

commit;
