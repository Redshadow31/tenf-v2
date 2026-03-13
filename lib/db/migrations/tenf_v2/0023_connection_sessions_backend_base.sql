-- TENF v2 - 0023
-- Base technique robuste pour logs de connexion admin

create table if not exists public.connection_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  user_id text,
  username text,
  is_discord_auth boolean not null default false,
  connection_type text not null check (connection_type in ('discord', 'guest')),
  ip_masked text,
  ip_hash text,
  country text,
  country_code text,
  region text,
  city text,
  latitude double precision,
  longitude double precision,
  user_agent text,
  device_type text,
  browser text,
  os text,
  path text,
  referer text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  last_event_at timestamptz
);

create table if not exists public.connection_session_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.connection_sessions(session_id) on delete cascade,
  user_id text,
  username text,
  is_discord_auth boolean not null default false,
  connection_type text not null check (connection_type in ('discord', 'guest')),
  ip_masked text,
  ip_hash text,
  country text,
  country_code text,
  region text,
  city text,
  latitude double precision,
  longitude double precision,
  user_agent text,
  device_type text,
  browser text,
  os text,
  path text,
  referer text,
  created_at timestamptz not null default now()
);

create index if not exists idx_connection_sessions_last_seen
  on public.connection_sessions (last_seen_at desc);

create index if not exists idx_connection_sessions_active
  on public.connection_sessions (is_active, last_seen_at desc);

create index if not exists idx_connection_sessions_country
  on public.connection_sessions (country_code, last_seen_at desc);

create index if not exists idx_connection_sessions_user
  on public.connection_sessions (user_id, last_seen_at desc);

create index if not exists idx_connection_session_events_created
  on public.connection_session_events (created_at desc);

create index if not exists idx_connection_session_events_type_created
  on public.connection_session_events (connection_type, created_at desc);

create index if not exists idx_connection_session_events_country_created
  on public.connection_session_events (country_code, created_at desc);

create index if not exists idx_connection_session_events_user_created
  on public.connection_session_events (user_id, created_at desc);
