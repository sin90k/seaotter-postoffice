-- Admin patch for storage lifecycle operations
-- Execute this AFTER supabase-storage-lifecycle-migration.sql

begin;

-- Helper: check admin/support role in profiles
create or replace function public.is_admin_user(p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_uid
      and role in ('admin', 'support')
  );
$$;

grant execute on function public.is_admin_user(uuid) to authenticated;

-- Wrapper RPC: callable by authenticated admin/support from frontend
create or replace function public.admin_cleanup_expired_postcards(p_limit integer default 300)
returns integer
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
  return public.cleanup_expired_postcards(p_limit);
end;
$$;

grant execute on function public.admin_cleanup_expired_postcards(integer) to authenticated;

commit;

