-- Fix: Supabase 不允许在 SQL 中直接 DELETE storage.objects，必须用 Storage API 删文件。
-- 本脚本：cleanup 函数只删除 public.postcards 并写日志，返回要删的 path 列表；
-- 由调用方（Vercel /api/cron/storage-cleanup 或 /api/admin/storage/cleanup-expired）用 Storage API 删文件。

begin;

-- 1) cleanup_expired_postcards: 只删 postcards 表并写日志，返回需从 Storage 删除的 path 列表（不再操作 storage.objects）
create or replace function public.cleanup_expired_postcards(p_limit integer default 300)
returns table(path text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with target as (
    select id, user_id, front_path, back_path
    from public.postcards
    where deleted_at is null
      and expires_at is not null
      and expires_at <= now()
    order by expires_at asc
    limit greatest(coalesce(p_limit, 300), 1)
    for update skip locked
  ),
  logged as (
    insert into public.postcard_cleanup_logs(postcard_id, user_id, front_path, back_path, reason)
    select id::text, user_id::text, front_path, back_path, 'expired'
    from target
    returning postcard_id
  ),
  deleted as (
    delete from public.postcards p
    where p.id in (select id from target)
    returning id
  )
  select p from (
    select front_path as p from target where front_path is not null and front_path <> ''
    union all
    select back_path from target where back_path is not null and back_path <> ''
  ) x;
end;
$$;

grant execute on function public.cleanup_expired_postcards(integer) to service_role;

-- 2) admin 包装：改为返回 path 列表（与底层一致）；前端应改为调后端 API 做“RPC + Storage 删除”
create or replace function public.admin_cleanup_expired_postcards(p_limit integer default 300)
returns table(path text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.is_admin_user(v_uid) then
    raise exception 'permission denied';
  end if;
  return query select public.cleanup_expired_postcards(p_limit);
end;
$$;

grant execute on function public.admin_cleanup_expired_postcards(integer) to authenticated;

commit;
