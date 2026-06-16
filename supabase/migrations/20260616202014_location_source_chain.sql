begin;

alter table public.postcard_metadata
  add column if not exists location_source text not null default 'unknown'
    check (location_source in ('exif_gps', 'exif_text', 'ai_place', 'manual', 'unknown')),
  add column if not exists raw_location_label text,
  add column if not exists location_confidence numeric(4, 2)
    check (location_confidence is null or (location_confidence >= 0 and location_confidence <= 1)),
  add column if not exists map_eligible boolean not null default false,
  add column if not exists rejected_location_reason text;

create index if not exists postcard_metadata_user_map_eligible_idx
  on public.postcard_metadata (user_id, map_eligible, updated_at desc);

create index if not exists postcard_metadata_location_source_idx
  on public.postcard_metadata (location_source);

update public.postcard_metadata
set
  location_source = case
    when latitude is not null and longitude is not null then 'exif_gps'
    when coalesce(city, country) is not null then 'ai_place'
    else 'unknown'
  end,
  raw_location_label = nullif(trim(concat_ws(', ', nullif(city, ''), nullif(country, ''))), ''),
  map_eligible = latitude is not null
    and longitude is not null
    and not (
      lower(coalesce(city, '')) in ('家中', '家里', '家裡', '在家', '室内', '室內', '房间', '房間', '客厅', '客廳', '卧室', '臥室', '厨房', '廚房', 'home', 'at home', 'indoors', 'inside', 'room', 'living room')
      or lower(coalesce(country, '')) in ('家中', '家里', '家裡', '在家', '室内', '室內', '房间', '房間', '客厅', '客廳', '卧室', '臥室', '厨房', '廚房', 'home', 'at home', 'indoors', 'inside', 'room', 'living room')
    ),
  rejected_location_reason = case
    when latitude is null or longitude is null then 'missing_coordinates'
    when lower(coalesce(city, '')) in ('家中', '家里', '家裡', '在家', '室内', '室內', '房间', '房間', '客厅', '客廳', '卧室', '臥室', '厨房', '廚房', 'home', 'at home', 'indoors', 'inside', 'room', 'living room')
      or lower(coalesce(country, '')) in ('家中', '家里', '家裡', '在家', '室内', '室內', '房间', '房間', '客厅', '客廳', '卧室', '臥室', '厨房', '廚房', 'home', 'at home', 'indoors', 'inside', 'room', 'living room')
      then 'generic_private_place'
    else null
  end
where location_source = 'unknown'
  or raw_location_label is null
  or map_eligible = false;

create or replace function public.refresh_user_travel_stats(p_limit integer default 20000)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_refreshed integer := 0;
begin
  insert into public.user_travel_stats (
    user_id,
    countries_count,
    cities_count,
    postcards_count,
    updated_at
  )
  select
    pm.user_id,
    count(distinct nullif(pm.country, ''))::integer as countries_count,
    count(distinct coalesce(nullif(pm.city, ''), '') || '|' || coalesce(nullif(pm.country, ''), '') || '|' || round(pm.latitude::numeric, 2)::text || '|' || round(pm.longitude::numeric, 2)::text)::integer as cities_count,
    count(*)::integer as postcards_count,
    now() as updated_at
  from (
    select *
    from public.postcard_metadata
    where map_eligible = true
    order by updated_at desc
    limit greatest(1, p_limit)
  ) pm
  group by pm.user_id
  on conflict (user_id) do update
  set
    countries_count = excluded.countries_count,
    cities_count = excluded.cities_count,
    postcards_count = excluded.postcards_count,
    updated_at = excluded.updated_at;

  get diagnostics v_refreshed = row_count;
  return v_refreshed;
end;
$$;

revoke all on function public.refresh_user_travel_stats(integer) from public, anon, authenticated;
grant execute on function public.refresh_user_travel_stats(integer) to service_role;

commit;
