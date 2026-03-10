-- TENF v2 - 0003
-- Domaine: integration

CREATE TABLE IF NOT EXISTS integration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  starts_at timestamptz NOT NULL,
  location_name text,
  location_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_session_id uuid NOT NULL REFERENCES integration_sessions(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  display_name text NOT NULL,
  discord_id text,
  discord_username text,
  mentor_twitch_login text,
  notes text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_session_id, twitch_login)
);

CREATE TABLE IF NOT EXISTS integration_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_session_id uuid NOT NULL REFERENCES integration_sessions(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES integration_registrations(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  present boolean NOT NULL DEFAULT true,
  validated_by text,
  validated_at timestamptz NOT NULL DEFAULT now(),
  note text
);

CREATE INDEX IF NOT EXISTS idx_integration_registrations_session_id ON integration_registrations(integration_session_id);
CREATE INDEX IF NOT EXISTS idx_integration_attendance_session_id ON integration_attendance(integration_session_id);
