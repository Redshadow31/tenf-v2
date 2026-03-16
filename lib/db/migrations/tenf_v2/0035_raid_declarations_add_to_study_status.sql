-- TENF v2 - 0035
-- Ajout du statut "to_study" pour les declarations de raids

alter table if exists public.raid_declarations
  drop constraint if exists raid_declarations_status_check;

alter table if exists public.raid_declarations
  add constraint raid_declarations_status_check
  check (status in ('processing', 'to_study', 'validated', 'rejected'));

