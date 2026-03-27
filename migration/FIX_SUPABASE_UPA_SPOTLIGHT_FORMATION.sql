-- FIX SUPABASE: UPA + Spotlight + Formation (idempotent)
-- A executer dans l'editeur SQL Supabase (production).

begin;

-- 1) UPA EVENT CONTENT
create table if not exists public.upa_event_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  general jsonb not null default '{}'::jsonb,
  social_proof jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  editorial_sections jsonb not null default '[]'::jsonb,
  staff jsonb not null default '[]'::jsonb,
  streamers jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  official_links jsonb not null default '[]'::jsonb,
  partner_communities jsonb not null default '[]'::jsonb,
  cta jsonb not null default '{}'::jsonb,
  display_settings jsonb not null default '{}'::jsonb,
  status_messages jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.upa_event_pages
  add column if not exists streamers jsonb not null default '[]'::jsonb;

create index if not exists idx_upa_event_pages_slug on public.upa_event_pages (slug);
create index if not exists idx_upa_event_pages_updated_at on public.upa_event_pages (updated_at desc);

insert into public.upa_event_pages (slug)
values ('upa-event')
on conflict (slug) do nothing;

-- 2) SPOTLIGHT ATTENDANCE (compat colonne display_name)
create table if not exists public.spotlight_attendance (
  id uuid primary key default gen_random_uuid(),
  spotlight_id text not null,
  member_id uuid references public.members(id) on delete set null,
  twitch_login text not null,
  display_name text,
  present boolean not null default true,
  added_by text,
  added_at timestamptz not null default now(),
  unique (spotlight_id, twitch_login)
);

alter table public.spotlight_attendance
  add column if not exists display_name text;

create index if not exists idx_spotlight_attendance_spotlight_id
  on public.spotlight_attendance (spotlight_id);

-- 3) FORMATION REQUESTS
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

commit;
