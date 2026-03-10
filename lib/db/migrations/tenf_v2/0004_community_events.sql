-- TENF v2 - 0004
-- Domaine: activite communautaire

CREATE TABLE IF NOT EXISTS community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  starts_at timestamptz NOT NULL,
  location text,
  is_published boolean NOT NULL DEFAULT false,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  display_name text NOT NULL,
  discord_id text,
  discord_username text,
  notes text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, twitch_login)
);

CREATE TABLE IF NOT EXISTS event_presences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES event_registrations(id) ON DELETE SET NULL,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  display_name text,
  is_registered boolean NOT NULL DEFAULT false,
  present boolean NOT NULL DEFAULT true,
  note text,
  validated_by text,
  validated_at timestamptz NOT NULL DEFAULT now(),
  added_manually boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS event_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_by_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text,
  preferred_date timestamptz,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_presences_event_id ON event_presences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_proposals_status ON event_proposals(status);
