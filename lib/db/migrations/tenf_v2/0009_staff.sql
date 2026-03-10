-- TENF v2 - 0009
-- Domaine: staff

CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  twitch_login text NOT NULL UNIQUE,
  discord_id text UNIQUE,
  display_name text,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);

CREATE TABLE IF NOT EXISTS staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id text NOT NULL,
  role_name text NOT NULL,
  scope text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  assigned_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_member_id, role_name, starts_at)
);

CREATE TABLE IF NOT EXISTS staff_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  application_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text
);

CREATE TABLE IF NOT EXISTS staff_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id text,
  voter_staff_member_id text,
  vote text NOT NULL,
  reason text,
  voted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, voter_staff_member_id)
);

CREATE TABLE IF NOT EXISTS staff_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id text,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  note text NOT NULL,
  visibility text NOT NULL DEFAULT 'staff_only',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_roles' AND column_name = 'staff_member_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_staff_roles_staff_member_id ON staff_roles(staff_member_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_applications' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_staff_applications_status ON staff_applications(status);
  END IF;
END $$;
