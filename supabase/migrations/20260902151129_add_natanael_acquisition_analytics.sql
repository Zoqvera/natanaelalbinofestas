create table if not exists public.natanael_acquisition_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique,
  event_name text not null check (event_name in ('page_view', 'generate_lead', 'begin_checkout')),
  visitor_id uuid not null,
  session_id uuid not null,
  source text not null default 'direct',
  medium text not null default 'none',
  campaign text not null default 'not_set',
  traffic_channel text not null default 'direct',
  ai_assistant text,
  page_path text not null default '/',
  landing_page text not null default '/',
  cta_location text,
  cta_label text,
  cta_method text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.natanael_acquisition_events enable row level security;
revoke all on table public.natanael_acquisition_events from public, anon, authenticated;
grant select, insert, delete on table public.natanael_acquisition_events to service_role;

create index if not exists natanael_acquisition_events_occurred_at_idx on public.natanael_acquisition_events (occurred_at desc);
create index if not exists natanael_acquisition_events_event_name_idx on public.natanael_acquisition_events (event_name, occurred_at desc);
create index if not exists natanael_acquisition_events_source_idx on public.natanael_acquisition_events (source, occurred_at desc);
create index if not exists natanael_acquisition_events_ai_assistant_idx on public.natanael_acquisition_events (ai_assistant, occurred_at desc) where ai_assistant is not null;
create index if not exists natanael_acquisition_events_cta_location_idx on public.natanael_acquisition_events (cta_location, occurred_at desc) where cta_location is not null;

create table if not exists public.natanael_analytics_rate_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.natanael_analytics_rate_limits enable row level security;
revoke all on table public.natanael_analytics_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.natanael_analytics_rate_limits to service_role;

create table if not exists public.natanael_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.natanael_admins enable row level security;
revoke all on table public.natanael_admins from public, anon, authenticated;
grant select, insert, delete on table public.natanael_admins to service_role;

insert into public.natanael_admins (user_id)
select users.id
from auth.users users
join public.teacher_admins admins on lower(admins.email) = lower(users.email)
where users.email is not null
on conflict (user_id) do nothing;

create or replace function public.consume_natanael_analytics_rate_limit(
  target_bucket_key text,
  target_window_seconds integer default 3600,
  target_max_requests integer default 120
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  bounded_window integer := greatest(60, least(coalesce(target_window_seconds, 3600), 86400));
  bounded_max integer := greatest(1, least(coalesce(target_max_requests, 120), 10000));
  current_count integer;
begin
  if target_bucket_key is null or length(target_bucket_key) < 3 or length(target_bucket_key) > 180 then
    return false;
  end if;

  insert into public.natanael_analytics_rate_limits as limits (bucket_key, window_started_at, request_count, updated_at)
  values (target_bucket_key, now(), 1, now())
  on conflict (bucket_key) do update
  set window_started_at = case when limits.window_started_at <= now() - make_interval(secs => bounded_window) then now() else limits.window_started_at end,
      request_count = case when limits.window_started_at <= now() - make_interval(secs => bounded_window) then 1 else limits.request_count + 1 end,
      updated_at = now()
  returning request_count into current_count;

  return current_count <= bounded_max;
end;
$$;

revoke all on function public.consume_natanael_analytics_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_natanael_analytics_rate_limit(text, integer, integer) to service_role;
