-- TENF v2 - 0039
-- Historique d'attribution des points Discord pour presences evenements (admin)
-- Remplace le fichier local data/event-discord-points.json (incompatible serverless)

create table if not exists public.event_discord_points (
  id uuid primary key default gen_random_uuid(),
  presence_key text not null,
  event_id uuid not null references public.community_events(id) on delete cascade,
  event_title text not null,
  event_at timestamptz not null,
  twitch_login text not null,
  display_name text not null,
  discord_username text,
  points integer not null default 300 check (points > 0),
  status text not null default 'awarded' check (status in ('awarded', 'cancelled')),
  note text not null default '',
  awarded_by_discord_id text not null,
  awarded_by_username text not null,
  awarded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists uniq_event_discord_points_presence_key
  on public.event_discord_points (presence_key);

create index if not exists idx_event_discord_points_awarded_at
  on public.event_discord_points (awarded_at desc);

create index if not exists idx_event_discord_points_event_id
  on public.event_discord_points (event_id);

create index if not exists idx_event_discord_points_twitch_login
  on public.event_discord_points (twitch_login);
