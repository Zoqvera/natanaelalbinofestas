grant select on table public.natanael_admins to authenticated;
grant select on table public.natanael_acquisition_events to authenticated;

drop policy if exists natanael_admin_self_read on public.natanael_admins;
create policy natanael_admin_self_read
on public.natanael_admins
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists natanael_admin_event_read on public.natanael_acquisition_events;
create policy natanael_admin_event_read
on public.natanael_acquisition_events
for select
to authenticated
using (
  exists (
    select 1
    from public.natanael_admins admins
    where admins.user_id = (select auth.uid())
  )
);

alter function public.get_natanael_acquisition_summary(integer) security invoker;
revoke all on function public.get_natanael_acquisition_summary(integer) from public, anon;
grant execute on function public.get_natanael_acquisition_summary(integer) to authenticated;
