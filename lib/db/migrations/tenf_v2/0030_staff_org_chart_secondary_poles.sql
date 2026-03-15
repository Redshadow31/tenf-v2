-- TENF v2 - 0030
-- Multi-pole support for staff org chart entries

alter table if exists public.staff_org_chart_entries
  add column if not exists secondary_poles jsonb not null default '[]'::jsonb;

create index if not exists idx_staff_org_chart_entries_secondary_poles
  on public.staff_org_chart_entries using gin (secondary_poles);
