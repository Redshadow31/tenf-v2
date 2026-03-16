-- TENF v2 - 0036
-- Fondations du pipeline de test EventSub raids (isole de la prod)

create table if not exists public.raid_test_runs (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed', 'cancelled')),
  config jsonb not null default '{}'::jsonb,
  notes text not null default '',
  started_at timestamptz,
  ended_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_raid_test_runs_status
  on public.raid_test_runs (status);

create index if not exists idx_raid_test_runs_created_at
  on public.raid_test_runs (created_at desc);

create table if not exists public.raid_test_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.raid_test_runs(id) on delete cascade,
  eventsub_message_id text,
  dedupe_key text not null,
  from_broadcaster_user_id text not null,
  from_broadcaster_user_login text not null,
  from_broadcaster_user_name text not null,
  to_broadcaster_user_id text not null,
  to_broadcaster_user_login text not null,
  to_broadcaster_user_name text not null,
  viewers integer not null default 0,
  event_at timestamptz not null default now(),
  received_at timestamptz not null default now(),
  match_from_member boolean not null default false,
  match_to_member boolean not null default false,
  processing_status text not null default 'received' check (processing_status in ('received', 'matched', 'ignored', 'duplicate', 'error')),
  error_reason text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists uniq_raid_test_events_run_dedupe
  on public.raid_test_events (run_id, dedupe_key);

create unique index if not exists uniq_raid_test_events_message_id
  on public.raid_test_events (eventsub_message_id)
  where eventsub_message_id is not null;

create index if not exists idx_raid_test_events_run
  on public.raid_test_events (run_id);

create index if not exists idx_raid_test_events_event_at
  on public.raid_test_events (event_at desc);

create index if not exists idx_raid_test_events_from_to
  on public.raid_test_events (from_broadcaster_user_id, to_broadcaster_user_id);

create table if not exists public.raid_test_subscriptions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.raid_test_runs(id) on delete cascade,
  twitch_subscription_id text,
  monitored_member_discord_id text,
  monitored_twitch_id text not null,
  monitored_twitch_login text not null,
  condition_type text not null check (condition_type in ('to_broadcaster', 'from_broadcaster')),
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists uniq_raid_test_subscriptions_twitch_subscription
  on public.raid_test_subscriptions (twitch_subscription_id)
  where twitch_subscription_id is not null;

create index if not exists idx_raid_test_subscriptions_run
  on public.raid_test_subscriptions (run_id);

create index if not exists idx_raid_test_subscriptions_status
  on public.raid_test_subscriptions (status);

create index if not exists idx_raid_test_subscriptions_monitored
  on public.raid_test_subscriptions (monitored_twitch_id, condition_type);

create table if not exists public.raid_test_declarations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.raid_test_runs(id) on delete cascade,
  raid_declaration_id uuid,
  member_discord_id text not null,
  member_twitch_login text not null,
  member_display_name text not null,
  target_twitch_login text not null,
  raid_at timestamptz not null,
  declaration_status text not null default 'processing' check (declaration_status in ('processing', 'to_study', 'validated', 'rejected')),
  imported_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists uniq_raid_test_declarations_run_source
  on public.raid_test_declarations (run_id, raid_declaration_id)
  where raid_declaration_id is not null;

create index if not exists idx_raid_test_declarations_run
  on public.raid_test_declarations (run_id);

create index if not exists idx_raid_test_declarations_member_discord
  on public.raid_test_declarations (member_discord_id);

create index if not exists idx_raid_test_declarations_raid_at
  on public.raid_test_declarations (raid_at desc);
