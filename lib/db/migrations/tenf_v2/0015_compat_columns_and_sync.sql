-- TENF v2 - 0015
-- Compatibilite applicative + sync de donnees legacy

-- ============================================================================
-- A) Colonnes de compatibilite pour community_events
-- ============================================================================
ALTER TABLE community_events
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS invited_members jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS legacy_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_events_legacy_event_id
  ON community_events(legacy_event_id)
  WHERE legacy_event_id IS NOT NULL;

-- ============================================================================
-- B) Colonnes de compatibilite pour event_presences
-- ============================================================================
ALTER TABLE event_presences
  ADD COLUMN IF NOT EXISTS discord_id text,
  ADD COLUMN IF NOT EXISTS discord_username text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ============================================================================
-- C) Colonne display_name pour spotlight_attendance
-- ============================================================================
ALTER TABLE spotlight_attendance
  ADD COLUMN IF NOT EXISTS display_name text;

-- ============================================================================
-- D) Compat spotlight: started_at <-> starts_at
-- ============================================================================
ALTER TABLE spotlights
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

UPDATE spotlights
SET started_at = starts_at
WHERE started_at IS NULL
  AND starts_at IS NOT NULL;

UPDATE spotlights
SET starts_at = started_at
WHERE starts_at IS NULL
  AND started_at IS NOT NULL;

-- ============================================================================
-- E) Sync display_name / discord dans event_presences depuis registrations
-- ============================================================================
UPDATE event_presences ep
SET
  discord_id = COALESCE(ep.discord_id, er.discord_id),
  discord_username = COALESCE(ep.discord_username, er.discord_username),
  display_name = COALESCE(ep.display_name, er.display_name)
FROM event_registrations er
WHERE ep.event_id = er.event_id
  AND lower(ep.twitch_login) = lower(er.twitch_login);

