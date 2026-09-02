create or replace function public.get_natanael_acquisition_summary(period_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  bounded_days integer;
  result jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.natanael_admins admins where admins.user_id = (select auth.uid())
  ) then
    raise exception 'Acesso negado ao painel Natanael.' using errcode = '42501';
  end if;

  bounded_days := greatest(1, least(coalesce(period_days, 30), 365));

  with base as (
    select * from public.natanael_acquisition_events
    where occurred_at >= now() - make_interval(days => bounded_days)
  ),
  overview as (
    select
      count(distinct visitor_id) filter (where event_name = 'page_view') as visitors,
      count(*) filter (where event_name = 'page_view') as page_views,
      count(*) filter (where event_name <> 'page_view') as cta_clicks,
      count(distinct visitor_id) filter (where event_name <> 'page_view') as cta_visitors,
      count(*) filter (where event_name = 'generate_lead') as whatsapp_clicks,
      count(*) filter (where event_name = 'begin_checkout') as checkout_clicks,
      count(distinct visitor_id) filter (where event_name = 'page_view' and ai_assistant = 'chatgpt') as chatgpt_visitors,
      count(*) filter (where event_name <> 'page_view' and ai_assistant = 'chatgpt') as chatgpt_clicks
    from base
  ),
  source_stats as (
    select
      coalesce(nullif(source, ''), 'direct') as source_name,
      coalesce(nullif(traffic_channel, ''), 'direct') as channel_name,
      count(distinct visitor_id) filter (where event_name = 'page_view') as visitors,
      count(*) filter (where event_name <> 'page_view') as clicks,
      count(distinct visitor_id) filter (where event_name <> 'page_view') as cta_visitors
    from base
    group by coalesce(nullif(source, ''), 'direct'), coalesce(nullif(traffic_channel, ''), 'direct')
  ),
  ai_stats as (
    select
      ai_assistant as assistant,
      count(distinct visitor_id) filter (where event_name = 'page_view') as visitors,
      count(*) filter (where event_name <> 'page_view') as clicks,
      count(distinct visitor_id) filter (where event_name <> 'page_view') as cta_visitors
    from base
    where ai_assistant is not null and ai_assistant <> '' and ai_assistant <> 'not_set'
    group by ai_assistant
  ),
  cta_stats as (
    select
      event_name,
      coalesce(nullif(cta_location, ''), 'unknown') as location,
      coalesce(nullif(cta_label, ''), 'CTA sem rótulo') as label,
      coalesce(nullif(cta_method, ''), 'website') as method,
      count(*) as clicks,
      count(distinct visitor_id) as visitors
    from base
    where event_name <> 'page_view'
    group by event_name, coalesce(nullif(cta_location, ''), 'unknown'), coalesce(nullif(cta_label, ''), 'CTA sem rótulo'), coalesce(nullif(cta_method, ''), 'website')
  ),
  daily_stats as (
    select
      (occurred_at at time zone 'America/Sao_Paulo')::date as day,
      count(distinct visitor_id) filter (where event_name = 'page_view') as visitors,
      count(*) filter (where event_name = 'page_view') as page_views,
      count(*) filter (where event_name <> 'page_view') as cta_clicks
    from base
    group by (occurred_at at time zone 'America/Sao_Paulo')::date
  ),
  recent_ctas as (
    select event_id, event_name, occurred_at, source, medium, traffic_channel, ai_assistant, page_path, cta_location, cta_label, cta_method
    from base
    where event_name <> 'page_view'
    order by occurred_at desc
    limit 100
  )
  select jsonb_build_object(
    'period_days', bounded_days,
    'visitors', coalesce(o.visitors, 0),
    'page_views', coalesce(o.page_views, 0),
    'cta_clicks', coalesce(o.cta_clicks, 0),
    'whatsapp_clicks', coalesce(o.whatsapp_clicks, 0),
    'checkout_clicks', coalesce(o.checkout_clicks, 0),
    'conversion_rate', case when coalesce(o.visitors, 0) = 0 then 0 else round((o.cta_visitors::numeric * 100) / o.visitors, 1) end,
    'chatgpt_visitors', coalesce(o.chatgpt_visitors, 0),
    'chatgpt_clicks', coalesce(o.chatgpt_clicks, 0),
    'channels', coalesce((select jsonb_agg(jsonb_build_object(
      'source', source_name,
      'channel', channel_name,
      'visitors', visitors,
      'clicks', clicks,
      'conversion_rate', case when visitors = 0 then 0 else round((cta_visitors::numeric * 100) / visitors, 1) end
    ) order by visitors desc, clicks desc, source_name) from source_stats), '[]'::jsonb),
    'ai_assistants', coalesce((select jsonb_agg(jsonb_build_object(
      'assistant', assistant,
      'visitors', visitors,
      'clicks', clicks,
      'conversion_rate', case when visitors = 0 then 0 else round((cta_visitors::numeric * 100) / visitors, 1) end
    ) order by visitors desc, clicks desc, assistant) from ai_stats), '[]'::jsonb),
    'cta_positions', coalesce((select jsonb_agg(jsonb_build_object(
      'event_name', event_name,
      'location', location,
      'label', label,
      'method', method,
      'clicks', clicks,
      'visitors', visitors
    ) order by clicks desc, location, label) from cta_stats), '[]'::jsonb),
    'daily', coalesce((select jsonb_agg(jsonb_build_object(
      'date', day,
      'visitors', visitors,
      'page_views', page_views,
      'cta_clicks', cta_clicks
    ) order by day) from daily_stats), '[]'::jsonb),
    'recent_ctas', coalesce((select jsonb_agg(to_jsonb(recent_ctas) order by occurred_at desc) from recent_ctas), '[]'::jsonb)
  ) into result
  from overview o;

  return coalesce(result, jsonb_build_object(
    'period_days', bounded_days,
    'visitors', 0,
    'page_views', 0,
    'cta_clicks', 0,
    'whatsapp_clicks', 0,
    'checkout_clicks', 0,
    'conversion_rate', 0,
    'chatgpt_visitors', 0,
    'chatgpt_clicks', 0,
    'channels', '[]'::jsonb,
    'ai_assistants', '[]'::jsonb,
    'cta_positions', '[]'::jsonb,
    'daily', '[]'::jsonb,
    'recent_ctas', '[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_natanael_acquisition_summary(integer) from public, anon;
grant execute on function public.get_natanael_acquisition_summary(integer) to authenticated;
