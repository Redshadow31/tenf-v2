-- Missions staff nominatives (OBS, budget, etc.) par personne — affichées sur Mon compte et gérables par la direction.

create table if not exists public.staff_mission_assignments (
  id uuid primary key default gen_random_uuid(),
  assignee_discord_id text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_discord_id text
);

create index if not exists idx_staff_mission_assignments_assignee
  on public.staff_mission_assignments (assignee_discord_id, sort_order asc, created_at desc);

comment on table public.staff_mission_assignments is 'Missions staff nominatives liées au Discord ID du staff (affichage Mon compte).';
