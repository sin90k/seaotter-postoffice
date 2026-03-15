-- Share Card / Travel Map / Market / Region Pricing
-- IMPORTANT:
-- 1) Do NOT modify existing postcards table structure.
-- 2) Use extension tables and RPC only.

begin;

-- ========== 0) Share bucket ==========
insert into storage.buckets (id, name, public)
values ('sharecards', 'sharecards', false)
on conflict (id) do nothing;

-- Users can read/write only their own folder in sharecards bucket
drop policy if exists "Sharecards read own folder" on storage.objects;
drop policy if exists "Sharecards insert own folder" on storage.objects;
drop policy if exists "Sharecards update own folder" on storage.objects;
drop policy if exists "Sharecards delete own folder" on storage.objects;

create policy "Sharecards read own folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'sharecards'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Sharecards insert own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'sharecards'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Sharecards update own folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'sharecards'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Sharecards delete own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'sharecards'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- ========== 1) Postcard metadata extension (no postcard schema change) ==========
create table if not exists public.postcard_metadata (
  postcard_id uuid primary key references public.postcards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  postcard_local_id text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  theme_slug text,
  source text not null default 'exif_or_ai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_postcard_metadata_user on public.postcard_metadata(user_id);
create index if not exists idx_postcard_metadata_city on public.postcard_metadata(city);
create index if not exists idx_postcard_metadata_country on public.postcard_metadata(country);
create index if not exists idx_postcard_metadata_theme on public.postcard_metadata(theme_slug);
create unique index if not exists idx_postcard_metadata_user_local_id
  on public.postcard_metadata(user_id, postcard_local_id)
  where postcard_local_id is not null and postcard_local_id <> '';

alter table public.postcard_metadata enable row level security;

drop policy if exists "Metadata read own" on public.postcard_metadata;
drop policy if exists "Metadata write own" on public.postcard_metadata;

create policy "Metadata read own"
on public.postcard_metadata for select
to authenticated
using (auth.uid() = user_id);

create policy "Metadata write own"
on public.postcard_metadata for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ========== 2) Share image records ==========
create table if not exists public.postcard_share_images (
  id uuid primary key default gen_random_uuid(),
  postcard_id uuid references public.postcards(id) on delete set null,
  postcard_local_id text,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_type text not null check (share_type in ('front_only', 'front_back')),
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_postcard_share_images_user on public.postcard_share_images(user_id);
create index if not exists idx_postcard_share_images_postcard on public.postcard_share_images(postcard_id);

alter table public.postcard_share_images enable row level security;
drop policy if exists "Share images read own" on public.postcard_share_images;
drop policy if exists "Share images write own" on public.postcard_share_images;

create policy "Share images read own"
on public.postcard_share_images for select
to authenticated
using (auth.uid() = user_id);

create policy "Share images write own"
on public.postcard_share_images for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ========== 3) Travel stats ==========
create table if not exists public.user_travel_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  countries_count integer not null default 0,
  cities_count integer not null default 0,
  postcards_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_travel_stats enable row level security;
drop policy if exists "Travel stats read own" on public.user_travel_stats;

create policy "Travel stats read own"
on public.user_travel_stats for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.refresh_user_travel_stats(p_limit integer default 5000)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_count integer := 0;
begin
  for r in
    select
      m.user_id,
      count(distinct m.country) filter (where m.country is not null and m.country <> '') as countries_count,
      count(distinct (m.city, m.country)) filter (where m.city is not null and m.city <> '') as cities_count,
      count(*) as postcards_count
    from public.postcard_metadata m
    group by m.user_id
    limit greatest(coalesce(p_limit, 5000), 1)
  loop
    insert into public.user_travel_stats (user_id, countries_count, cities_count, postcards_count, updated_at)
    values (r.user_id, coalesce(r.countries_count, 0), coalesce(r.cities_count, 0), coalesce(r.postcards_count, 0), now())
    on conflict (user_id) do update set
      countries_count = excluded.countries_count,
      cities_count = excluded.cities_count,
      postcards_count = excluded.postcards_count,
      updated_at = now();
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

grant execute on function public.refresh_user_travel_stats(integer) to service_role;

-- ========== 4) Market config ==========
create table if not exists public.market_config (
  id uuid primary key default gen_random_uuid(),
  country_code text not null unique,
  country_name text not null,
  language_code text not null,
  currency text not null,
  region_tier text not null default 'tier1' check (region_tier in ('tier1', 'tier2', 'tier3')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_market_config_country on public.market_config(country_code);

alter table public.market_config enable row level security;
drop policy if exists "Market read active" on public.market_config;
drop policy if exists "Market admin write" on public.market_config;

create policy "Market read active"
on public.market_config for select
to anon, authenticated
using (is_active = true);

create policy "Market admin write"
on public.market_config for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
);

insert into public.market_config (country_code, country_name, language_code, currency, region_tier, is_active)
values
  ('CN', 'China', 'zh', 'CNY', 'tier1', true),
  ('US', 'United States', 'en', 'USD', 'tier1', true),
  ('UK', 'United Kingdom', 'en', 'GBP', 'tier1', true),
  ('JP', 'Japan', 'ja', 'JPY', 'tier1', true),
  ('KR', 'South Korea', 'ko', 'KRW', 'tier1', true),
  ('DE', 'Germany', 'de', 'EUR', 'tier1', true),
  ('FR', 'France', 'fr', 'EUR', 'tier1', true),
  ('ES', 'Spain', 'es', 'EUR', 'tier1', true),
  ('SG', 'Singapore', 'en', 'SGD', 'tier1', true),
  ('AU', 'Australia', 'en', 'AUD', 'tier1', true),
  ('CA', 'Canada', 'en', 'CAD', 'tier1', true),
  ('NZ', 'New Zealand', 'en', 'NZD', 'tier1', true),
  ('TH', 'Thailand', 'th', 'THB', 'tier2', true),
  ('ID', 'Indonesia', 'id', 'IDR', 'tier2', true),
  ('VN', 'Vietnam', 'vi', 'VND', 'tier2', true),
  ('MY', 'Malaysia', 'ms', 'MYR', 'tier2', true),
  ('PH', 'Philippines', 'en', 'PHP', 'tier2', true),
  ('TW', 'Taiwan', 'zh-Hant', 'TWD', 'tier1', true)
on conflict (country_code) do update set
  country_name = excluded.country_name,
  language_code = excluded.language_code,
  currency = excluded.currency,
  region_tier = excluded.region_tier,
  is_active = excluded.is_active;

-- ========== 5) Pricing plans ==========
create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  market_code text not null unique,
  currency text not null,
  price_per_postcard numeric(12,4) not null,
  credits_per_pack integer not null default 10,
  pack_price text not null,
  packs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_pricing_plans_market on public.pricing_plans(market_code);

alter table public.pricing_plans enable row level security;
drop policy if exists "Pricing read" on public.pricing_plans;
drop policy if exists "Pricing admin write" on public.pricing_plans;

create policy "Pricing read"
on public.pricing_plans for select
to anon, authenticated
using (true);

create policy "Pricing admin write"
on public.pricing_plans for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
);

alter table public.pricing_plans
  add column if not exists packs jsonb not null default '[]'::jsonb;

insert into public.pricing_plans (market_code, currency, price_per_postcard, credits_per_pack, pack_price, packs)
values
  ('US', 'USD', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('UK', 'GBP', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('CA', 'CAD', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('AU', 'AUD', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('NZ', 'NZD', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('SG', 'SGD', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('JP', 'JPY', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('KR', 'KRW', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('DE', 'EUR', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('FR', 'EUR', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('ES', 'EUR', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('CN', 'CNY', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('TW', 'TWD', 0.99, 10, '9.9', '[{"amount":1,"price":"0.99"},{"amount":10,"price":"9.9"},{"amount":30,"price":"24"},{"amount":60,"price":"45"}]'::jsonb),
  ('TH', 'THB', 0.69, 10, '6.9', '[{"amount":1,"price":"0.69"},{"amount":10,"price":"6.9"},{"amount":30,"price":"16"},{"amount":60,"price":"30"}]'::jsonb),
  ('ID', 'IDR', 0.69, 10, '6.9', '[{"amount":1,"price":"0.69"},{"amount":10,"price":"6.9"},{"amount":30,"price":"16"},{"amount":60,"price":"30"}]'::jsonb),
  ('VN', 'VND', 0.69, 10, '6.9', '[{"amount":1,"price":"0.69"},{"amount":10,"price":"6.9"},{"amount":30,"price":"16"},{"amount":60,"price":"30"}]'::jsonb),
  ('MY', 'MYR', 0.69, 10, '6.9', '[{"amount":1,"price":"0.69"},{"amount":10,"price":"6.9"},{"amount":30,"price":"16"},{"amount":60,"price":"30"}]'::jsonb),
  ('PH', 'PHP', 0.69, 10, '6.9', '[{"amount":1,"price":"0.69"},{"amount":10,"price":"6.9"},{"amount":30,"price":"16"},{"amount":60,"price":"30"}]'::jsonb)
on conflict (market_code) do update set
  currency = excluded.currency,
  price_per_postcard = excluded.price_per_postcard,
  credits_per_pack = excluded.credits_per_pack,
  pack_price = excluded.pack_price,
  packs = excluded.packs;

-- ========== 6) Share branding ==========
create table if not exists public.share_branding (
  id uuid primary key default gen_random_uuid(),
  branding_enabled boolean not null default true,
  branding_text text not null default 'seaotterpost.com',
  branding_opacity numeric(3,2) not null default 0.70 check (branding_opacity >= 0 and branding_opacity <= 1),
  branding_size numeric(5,4) not null default 0.0200 check (branding_size > 0 and branding_size <= 0.1),
  updated_at timestamptz not null default now()
);

alter table public.share_branding enable row level security;
drop policy if exists "Share branding read" on public.share_branding;
drop policy if exists "Share branding admin write" on public.share_branding;

create policy "Share branding read"
on public.share_branding for select
to anon, authenticated
using (true);

create policy "Share branding admin write"
on public.share_branding for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
);

insert into public.share_branding (id, branding_enabled, branding_text, branding_opacity, branding_size, updated_at)
select gen_random_uuid(), true, 'seaotterpost.com', 0.70, 0.02, now()
where not exists (select 1 from public.share_branding);

commit;
