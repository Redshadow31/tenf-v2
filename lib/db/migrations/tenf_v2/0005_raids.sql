-- TENF v2 - 0005
-- Domaine: raids

CREATE TABLE IF NOT EXISTS raids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_date timestamptz NOT NULL DEFAULT now(),
  source_twitch_login text NOT NULL,
  target_twitch_login text NOT NULL,
  declared_by text,
  points_awarded integer NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raid_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id uuid NOT NULL REFERENCES raids(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  participation_type text DEFAULT 'viewer',
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (raid_id, twitch_login)
);

ALTER TABLE raids
  ADD COLUMN IF NOT EXISTS raid_date timestamptz;

ALTER TABLE raid_participants
  ADD COLUMN IF NOT EXISTS raid_id uuid;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'raids' AND column_name = 'raid_date'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_raids_raid_date ON raids(raid_date);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'raid_participants' AND column_name = 'raid_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_raid_participants_raid_id ON raid_participants(raid_id);
  END IF;
END $$;
