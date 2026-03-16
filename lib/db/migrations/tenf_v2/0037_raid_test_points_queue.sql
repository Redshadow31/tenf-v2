-- TENF v2 - 0037
-- Historique d'attribution des points Discord pour raids EventSub test

create table if not exists public.raid_test_points (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.raid_test_runs(id) on delete cascade,
  raid_test_event_id uuid not null references public.raid_test_events(id) on delete cascade,
  raider_twitch_login text not null,
  target_twitch_login text not null,
  event_at timestamptz not null,
  points integer not null default 500 check (points > 0),
  status text not null default 'awarded' check (status in ('awarded', 'cancelled')),
  note text not null default '',
  awarded_by_discord_id text not null,
  awarded_by_username text not null,
  awarded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists uniq_raid_test_points_event
  on public.raid_test_points (raid_test_event_id);

create index if not exists idx_raid_test_points_run
  on public.raid_test_points (run_id);

create index if not exists idx_raid_test_points_awarded_at
  on public.raid_test_points (awarded_at desc);

create index if not exists idx_raid_test_points_raider
  on public.raid_test_points (raider_twitch_login);
