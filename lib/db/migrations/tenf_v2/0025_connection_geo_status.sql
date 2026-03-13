alter table if exists public.connection_sessions
  add column if not exists geo_status text,
  add column if not exists geo_reason text;

alter table if exists public.connection_session_events
  add column if not exists geo_status text,
  add column if not exists geo_reason text;

create index if not exists idx_connection_sessions_geo_status
  on public.connection_sessions (geo_status);

create index if not exists idx_connection_session_events_geo_status
  on public.connection_session_events (geo_status);
