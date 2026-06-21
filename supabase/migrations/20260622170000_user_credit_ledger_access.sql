begin;

drop policy if exists "Admins and support can read credits_ledger" on public.credits_ledger;
drop policy if exists credits_ledger_read_own on public.credits_ledger;
drop policy if exists credits_ledger_read_own_or_staff on public.credits_ledger;

create policy credits_ledger_read_own_or_staff
  on public.credits_ledger for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (select private.is_admin_or_support())
  );

revoke select on public.credits_ledger from anon;
grant select on public.credits_ledger to authenticated;

commit;
