-- TENF v2 - 0027
-- Snapshots follow engagement admin (overview + detail channels)

create table if not exists public.follow_engagement_snapshots (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null default now(),
  source_data_retrieved_at timestamptz not null,
  total_active_tenf_channels integer not null,
  tracked_members_count integer not null,
  generated_by_discord_id text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create index if not exists idx_follow_engagement_snapshots_generated_at
  on public.follow_engagement_snapshots (generated_at desc);

create table if not exists public.follow_engagement_snapshot_members (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.follow_engagement_snapshots(id) on delete cascade,
  discord_id text,
  display_name text not null,
  member_twitch_login text not null,
  linked_twitch_login text,
  linked_twitch_display_name text,
  followed_count integer,
  total_active_tenf_channels integer not null,
  follow_rate double precision,
  state text not null,
  reason text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (snapshot_id, member_twitch_login)
);

create index if not exists idx_follow_engagement_snapshot_members_snapshot_id
  on public.follow_engagement_snapshot_members (snapshot_id);

create index if not exists idx_follow_engagement_snapshot_members_discord_id
  on public.follow_engagement_snapshot_members (discord_id);

create table if not exists public.follow_engagement_snapshot_member_channels (
  id uuid primary key default gen_random_uuid(),
  snapshot_member_id uuid not null references public.follow_engagement_snapshot_members(id) on delete cascade,
  twitch_login text not null,
  twitch_id text,
  display_name text not null,
  is_followed boolean not null,
  is_own_channel boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_follow_engagement_snapshot_member_channels_member_id
  on public.follow_engagement_snapshot_member_channels (snapshot_member_id);

create index if not exists idx_follow_engagement_snapshot_member_channels_followed
  on public.follow_engagement_snapshot_member_channels (is_followed);
