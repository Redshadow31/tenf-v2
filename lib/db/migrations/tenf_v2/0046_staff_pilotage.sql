-- Pilotage staff (admin avancé) : responsables par événement, rôles opérationnels, planning.

-- 1–2 responsables staff par événement communautaire
create table if not exists public.staff_pilotage_event_leads (
  event_id uuid primary key references public.community_events (id) on delete cascade,
  primary_discord_id text not null,
  secondary_discord_id text,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by_discord_id text
);

create index if not exists idx_staff_pilotage_event_leads_updated
  on public.staff_pilotage_event_leads (updated_at desc);

-- Référents « métiers » (points Discord, raids, intégration, vérification fiches)
create table if not exists public.staff_pilotage_lane_owners (
  lane_key text primary key,
  primary_discord_id text not null,
  secondary_discord_id text,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by_discord_id text,
  constraint staff_pilotage_lane_key_valid check (
    lane_key in (
      'discord_points',
      'raids',
      'member_integration',
      'member_profile_verification'
    )
  )
);

-- Réunions d’intégration, actions planifiées, fenêtres raid, etc.
create table if not exists public.staff_pilotage_scheduled_items (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'action',
  title text not null,
  scheduled_at timestamptz,
  ends_at timestamptz,
  primary_discord_id text,
  secondary_discord_id text,
  status text not null default 'planned',
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_discord_id text,
  constraint staff_pilotage_scheduled_category_valid check (
    category in ('integration_meeting', 'action', 'raid_window', 'other')
  ),
  constraint staff_pilotage_scheduled_status_valid check (
    status in ('planned', 'in_progress', 'done', 'cancelled')
  )
);

create index if not exists idx_staff_pilotage_scheduled_sort
  on public.staff_pilotage_scheduled_items (sort_order asc, scheduled_at desc nulls last);

comment on table public.staff_pilotage_event_leads is 'Responsables staff (1–2) par événement — Mon compte pilotage.';
comment on table public.staff_pilotage_lane_owners is 'Référents opérationnels TENF (Discord, raids, intégration, fiches).';
comment on table public.staff_pilotage_scheduled_items is 'Planning réunions d’intégration et actions staff.';
