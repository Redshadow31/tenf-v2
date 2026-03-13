create table if not exists public.page_activity_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id text,
  username text,
  is_authenticated boolean not null default false,
  zone text not null check (zone in ('public', 'admin')),
  path text not null,
  title text,
  event_type text not null check (event_type in ('page_view', 'click')),
  target text,
  created_at timestamptz not null default now()
);

create index if not exists idx_page_activity_events_created_at
  on public.page_activity_events (created_at desc);

create index if not exists idx_page_activity_events_zone_created_at
  on public.page_activity_events (zone, created_at desc);

create index if not exists idx_page_activity_events_path_created_at
  on public.page_activity_events (path, created_at desc);

create index if not exists idx_page_activity_events_session_created_at
  on public.page_activity_events (session_id, created_at desc);

create index if not exists idx_page_activity_events_user_created_at
  on public.page_activity_events (user_id, created_at desc);
