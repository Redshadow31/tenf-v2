-- TENF v2 - 0029
-- Surcouche d'affichage publique pour l'organigramme staff

create table if not exists public.staff_org_chart_entries (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  role_key text not null default 'MODERATEUR',
  role_label text not null default 'Modérateur',
  status_key text not null default 'ACTIVE',
  status_label text not null default 'Actif',
  pole_key text not null default 'POLE_ANIMATION_EVENTS',
  pole_label text not null default 'Pôle Animation & Événements',
  bio_short text not null default '',
  display_order integer not null default 0,
  is_visible boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(member_id)
);

create index if not exists idx_staff_org_chart_entries_visible_order
  on public.staff_org_chart_entries (is_visible, is_archived, display_order asc, updated_at desc);

create index if not exists idx_staff_org_chart_entries_role_status
  on public.staff_org_chart_entries (role_key, status_key);

create index if not exists idx_staff_org_chart_entries_pole
  on public.staff_org_chart_entries (pole_key);
