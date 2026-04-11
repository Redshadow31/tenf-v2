-- TENF v2 - 0040
-- Réunions mensuelles staff : date et discours structurés (JSON)

create table if not exists public.staff_monthly_meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_date date not null,
  title text not null default '',
  discours jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create index if not exists idx_staff_monthly_meetings_date
  on public.staff_monthly_meetings (meeting_date desc);
