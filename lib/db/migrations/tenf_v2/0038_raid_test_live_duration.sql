-- TENF v2 - 0038
-- Ajoute le contexte de live du raider pour les events raids-sub

alter table if exists public.raid_test_events
  add column if not exists raider_stream_started_at timestamptz;

alter table if exists public.raid_test_events
  add column if not exists raider_live_duration_minutes integer;
