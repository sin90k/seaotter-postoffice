begin;

create table if not exists public.brand_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null default 'Sea Otter Post Office',
  brand_name_zh text not null default '海獭邮局',
  brand_domain text not null default 'seaotter-postoffice.vercel.app',
  logo_url text not null default '/seaotter-logo.svg',
  watermark_position text not null default 'bottom-center'
    check (watermark_position in ('bottom-center', 'bottom-left', 'bottom-right', 'top-center', 'top-left', 'top-right')),
  watermark_opacity numeric(4, 2) not null default 0.62
    check (watermark_opacity >= 0 and watermark_opacity <= 1),
  watermark_size numeric(4, 2) not null default 1
    check (watermark_size >= 0.1 and watermark_size <= 2),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.brand_settings enable row level security;

drop policy if exists brand_settings_read_public on public.brand_settings;
create policy brand_settings_read_public
  on public.brand_settings for select
  to anon, authenticated
  using (true);

drop policy if exists brand_settings_insert_admin on public.brand_settings;
create policy brand_settings_insert_admin
  on public.brand_settings for insert
  to authenticated
  with check (private.is_admin());

drop policy if exists brand_settings_update_admin on public.brand_settings;
create policy brand_settings_update_admin
  on public.brand_settings for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant select on public.brand_settings to anon, authenticated;
grant insert, update on public.brand_settings to authenticated;

insert into public.brand_settings (
  id,
  brand_name,
  brand_name_zh,
  brand_domain,
  logo_url,
  watermark_position,
  watermark_opacity,
  watermark_size,
  updated_at
)
values (
  1,
  'Sea Otter Post Office',
  '海獭邮局',
  'seaotter-postoffice.vercel.app',
  '/seaotter-logo.svg',
  'bottom-center',
  0.62,
  1,
  now()
)
on conflict (id) do nothing;

commit;
