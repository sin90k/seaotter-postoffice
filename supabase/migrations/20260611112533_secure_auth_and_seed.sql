begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin()
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
      and role = 'admin'
  );
$$;

create or replace function private.is_admin_or_support()
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
      and role in ('admin', 'support')
  );
$$;

revoke all on function private.is_admin() from public, anon;
revoke all on function private.is_admin_or_support() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.is_admin_or_support() to authenticated, service_role;

drop policy if exists profiles_select_all_auth on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_admin_support on public.profiles;

create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy profiles_select_admin_support
  on public.profiles for select
  to authenticated
  using (private.is_admin_or_support());

drop policy if exists postcards_read_all_auth on public.postcards;
drop policy if exists "Admins can read all postcards" on public.postcards;
drop policy if exists postcards_read_admin_support on public.postcards;

create policy postcards_read_admin_support
  on public.postcards for select
  to authenticated
  using (private.is_admin_or_support());

drop policy if exists "Admins can update payment_config" on public.payment_config;
create policy "Admins can update payment_config"
  on public.payment_config for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins can update any payments" on public.payments;
create policy "Admins can update any payments"
  on public.payments for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

insert into public.payment_config (
  id,
  signup_bonus_credits,
  credits_per_postcard,
  updated_at
)
values (1, 5, 1, now())
on conflict (id) do update
set signup_bonus_credits = 5,
    credits_per_postcard = coalesce(public.payment_config.credits_per_postcard, 1),
    updated_at = now();

alter function public.handle_new_user() set search_path = public;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.cleanup_expired_postcards(integer) from public, anon, authenticated;
revoke all on function public.admin_cleanup_expired_postcards(integer) from public, anon, authenticated;
revoke all on function public.refresh_user_travel_stats(integer) from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.is_admin_user(uuid) from public, anon, authenticated;

grant execute on function public.cleanup_expired_postcards(integer) to service_role;
grant execute on function public.refresh_user_travel_stats(integer) to service_role;

create or replace function public.update_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_reference_id text default null,
  p_notes text default null,
  p_operator text default 'system',
  p_bucket text default null
)
returns table (promo_credits integer, paid_credits integer, total_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_is_admin boolean := coalesce(private.is_admin(), false);
  v_promo integer;
  v_paid integer;
  v_total integer;
  v_need integer;
  v_type text;
begin
  if p_amount = 0 then
    raise exception 'amount cannot be zero';
  end if;

  if v_caller is not null then
    if p_source = 'generation_cost' then
      if p_user_id <> v_caller or p_amount >= 0 then
        raise exception 'permission denied';
      end if;
    elsif not v_is_admin then
      raise exception 'permission denied';
    end if;
  end if;

  select p.promo_credits, p.paid_credits
    into v_promo, v_paid
  from public.profiles p
  where p.id = p_user_id
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  v_promo := coalesce(v_promo, 0);
  v_paid := coalesce(v_paid, 0);

  if p_amount < 0 then
    v_need := -p_amount;
    if p_bucket = 'promo' then
      if v_promo < v_need then raise exception 'insufficient promo credits'; end if;
      v_promo := v_promo - v_need;
    elsif p_bucket = 'paid' then
      if v_paid < v_need then raise exception 'insufficient paid credits'; end if;
      v_paid := v_paid - v_need;
    else
      if v_promo + v_paid < v_need then raise exception 'insufficient total credits'; end if;
      if v_promo >= v_need then
        v_promo := v_promo - v_need;
      else
        v_need := v_need - v_promo;
        v_promo := 0;
        v_paid := v_paid - v_need;
      end if;
    end if;
    v_type := 'credit_deduct';
  else
    if p_bucket = 'promo' or p_source in ('signup_bonus', 'promo_reward') then
      v_promo := v_promo + p_amount;
    else
      v_paid := v_paid + p_amount;
    end if;
    v_type := 'credit_add';
  end if;

  v_total := v_promo + v_paid;

  update public.profiles
  set promo_credits = v_promo,
      paid_credits = v_paid,
      credits = v_total,
      total_paid_credits = case
        when p_source = 'purchase' and p_amount > 0
          then coalesce(total_paid_credits, 0) + p_amount
        else total_paid_credits
      end
  where id = p_user_id;

  insert into public.credits_ledger (
    user_id, credit_type, source, amount, balance_after,
    reference_id, notes, operator, type
  ) values (
    p_user_id,
    case when p_bucket = 'promo' or p_source in ('signup_bonus', 'promo_reward') then 'promo' else 'paid' end,
    p_source,
    p_amount,
    v_total,
    p_reference_id,
    p_notes,
    coalesce(p_operator, 'system'),
    v_type
  );

  return query select v_promo, v_paid, v_total;
end;
$$;

revoke all on function public.update_user_credits(uuid, integer, text, text, text, text, text)
  from public, anon;
grant execute on function public.update_user_credits(uuid, integer, text, text, text, text, text)
  to authenticated, service_role;

revoke select on public.profiles, public.postcards, public.events,
  public.credits_ledger, public.payments, public.postcard_cleanup_logs,
  public.postcard_metadata, public.postcard_share_images, public.user_travel_stats
  from anon;

commit;
