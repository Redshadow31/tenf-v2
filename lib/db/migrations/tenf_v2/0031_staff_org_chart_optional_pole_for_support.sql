-- TENF v2 - 0031
-- Pôle optionnel pour les profils Soutien TENF

alter table if exists public.staff_org_chart_entries
  alter column pole_key drop not null;

alter table if exists public.staff_org_chart_entries
  alter column pole_label drop not null;

alter table if exists public.staff_org_chart_entries
  alter column pole_key drop default;

alter table if exists public.staff_org_chart_entries
  alter column pole_label drop default;
