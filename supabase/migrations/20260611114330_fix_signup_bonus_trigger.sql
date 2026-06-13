create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bonus integer := 0;
begin
  insert into public.profiles (
    id,
    email,
    nickname,
    credits,
    promo_credits,
    paid_credits,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    0,
    0,
    0,
    'user'
  )
  on conflict (id) do nothing;

  select coalesce(signup_bonus_credits, 0)
    into v_bonus
  from public.payment_config
  where id = 1;

  if v_bonus > 0 then
    perform public.update_user_credits(
      new.id,
      v_bonus,
      'signup_bonus',
      null,
      'Signup welcome bonus',
      'system',
      'promo'
    );
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
