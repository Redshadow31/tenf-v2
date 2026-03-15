-- TENF v2 - 0034
-- Declarations de raids membres pour validation staff

create table if not exists public.raid_declarations (
  id uuid primary key default gen_random_uuid(),
  member_discord_id text not null,
  member_twitch_login text not null,
  member_display_name text not null,
  target_twitch_login text not null,
  raid_at timestamptz not null,
  is_approximate boolean not null default true,
  note text not null default '',
  status text not null default 'processing' check (status in ('processing', 'validated', 'rejected')),
  staff_comment text,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_raid_declarations_member_discord
  on public.raid_declarations (member_discord_id);

create index if not exists idx_raid_declarations_status
  on public.raid_declarations (status);

create index if not exists idx_raid_declarations_raid_at
  on public.raid_declarations (raid_at desc);

