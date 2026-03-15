-- TENF v2 - 0033
-- Demandes membre pour relancer des formations

create table if not exists public.formation_requests (
  id uuid primary key default gen_random_uuid(),
  formation_title text not null,
  source_event_id uuid references public.community_events(id) on delete set null,
  member_discord_id text not null,
  member_twitch_login text not null,
  member_display_name text not null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'cancelled')),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_formation_requests_title
  on public.formation_requests (formation_title);

create index if not exists idx_formation_requests_requested_at
  on public.formation_requests (requested_at desc);

create index if not exists idx_formation_requests_member_discord
  on public.formation_requests (member_discord_id);

create unique index if not exists uniq_formation_requests_pending_per_member
  on public.formation_requests (formation_title, member_discord_id)
  where status = 'pending';

