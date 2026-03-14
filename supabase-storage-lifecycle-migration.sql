-- Storage lifecycle migration for postcard assets
-- Goal: move image bytes to Supabase Storage and keep DB as metadata/index.

begin;

-- 1) Extend postcards metadata (non-breaking / idempotent)
alter table public.postcards
  add column if not exists front_path text,
  add column if not exists back_path text,
  add column if not exists storage_provider text not null default 'supabase',
  add column if not exists expires_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists version integer not null default 1;

create index if not exists idx_postcards_user_created_at
  on public.postcards (user_id, created_at desc);

create index if not exists idx_postcards_expires_at
  on public.postcards (expires_at)
  where expires_at is not null and deleted_at is null;

create index if not exists idx_postcards_deleted_at
  on public.postcards (deleted_at);

-- 2) Create storage bucket (private)
insert into storage.buckets (id, name, public)
select 'postcards', 'postcards', false
where not exists (
  select 1 from storage.buckets where id = 'postcards'
);

-- 3) Storage policies: user can only access own folder: postcards/{uid}/...
drop policy if exists "postcards_user_read_own" on storage.objects;
create policy "postcards_user_read_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'postcards'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "postcards_user_insert_own" on storage.objects;
create policy "postcards_user_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'postcards'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "postcards_user_update_own" on storage.objects;
create policy "postcards_user_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'postcards'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'postcards'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "postcards_user_delete_own" on storage.objects;
create policy "postcards_user_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'postcards'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- 4) Cleanup log for expired assets
create table if not exists public.postcard_cleanup_logs (
  id bigserial primary key,
  postcard_id text,
  user_id text,
  front_path text,
  back_path text,
  reason text not null default 'expired',
  created_at timestamptz not null default now()
);

-- 5) Expiration cleanup function (call from cron / edge function)
create or replace function public.cleanup_expired_postcards(p_limit integer default 300)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  with target as (
    select id, user_id, front_path, back_path
    from public.postcards
    where deleted_at is null
      and expires_at is not null
      and expires_at <= now()
    order by expires_at asc
    limit greatest(coalesce(p_limit, 300), 1)
    for update skip locked
  ), logged as (
    insert into public.postcard_cleanup_logs(postcard_id, user_id, front_path, back_path, reason)
    select id::text, user_id::text, front_path, back_path, 'expired'
    from target
    returning postcard_id
  ), deleted_objects as (
    delete from storage.objects o
    where o.bucket_id = 'postcards'
      and o.name in (
        select front_path from target where front_path is not null
        union
        select back_path from target where back_path is not null
      )
  )
  delete from public.postcards p
  where p.id in (select id from target);

  get diagnostics v_count = row_count;
  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.cleanup_expired_postcards(integer) to service_role;

commit;

-- Optional schedule example (if pg_cron is enabled):
-- select cron.schedule('cleanup-expired-postcards-hourly', '15 * * * *', $$select public.cleanup_expired_postcards(500);$$);
