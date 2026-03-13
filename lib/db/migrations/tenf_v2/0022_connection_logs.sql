-- TENF v2 - 0022
-- Audit des connexions site (historique + temps reel)

create table if not exists public.connection_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  connection_type text not null check (connection_type in ('discord_member', 'general_visitor')),
  discord_id text,
  username text,
  session_key text not null,
  path text,
  source text not null default 'heartbeat',
  ip_masked text,
  ip_hash text,
  country_code text,
  country_name text,
  continent text,
  region text,
  city text,
  user_agent text
);

create table if not exists public.active_connections (
  session_key text primary key,
  first_seen_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  last_logged_at timestamptz not null default now(),
  connection_type text not null check (connection_type in ('discord_member', 'general_visitor')),
  discord_id text,
  username text,
  path text,
  ip_masked text,
  ip_hash text,
  country_code text,
  country_name text,
  continent text,
  region text,
  city text,
  user_agent text
);

create index if not exists idx_connection_logs_created_at
  on public.connection_logs (created_at desc);

create index if not exists idx_connection_logs_type_created_at
  on public.connection_logs (connection_type, created_at desc);

create index if not exists idx_connection_logs_country_created_at
  on public.connection_logs (country_code, created_at desc);

create index if not exists idx_connection_logs_discord_created_at
  on public.connection_logs (discord_id, created_at desc);

create index if not exists idx_active_connections_last_activity
  on public.active_connections (last_activity_at desc);
