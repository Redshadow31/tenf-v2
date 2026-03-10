-- TENF v2 - 0006
-- Domaine: spotlight

CREATE TABLE IF NOT EXISTS spotlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_event_id uuid REFERENCES community_events(id) ON DELETE SET NULL,
  streamer_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  streamer_twitch_login text NOT NULL,
  streamer_display_name text,
  moderator_discord_id text,
  moderator_username text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS spotlight_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotlight_id text NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  present boolean NOT NULL DEFAULT true,
  added_by text,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (spotlight_id, twitch_login)
);

CREATE TABLE IF NOT EXISTS spotlight_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotlight_id text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  metric_unit text,
  measured_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE spotlights
  ADD COLUMN IF NOT EXISTS starts_at timestamptz;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'spotlights' AND column_name = 'started_at'
  ) THEN
    EXECUTE '
      UPDATE spotlights
      SET starts_at = started_at
      WHERE starts_at IS NULL
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'spotlights' AND column_name = 'starts_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_spotlights_starts_at ON spotlights(starts_at);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'spotlight_attendance' AND column_name = 'spotlight_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_spotlight_attendance_spotlight_id ON spotlight_attendance(spotlight_id);
  END IF;
END $$;
