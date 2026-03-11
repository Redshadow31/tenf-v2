-- TENF v2 - 0019
-- Gestion des liens de lieux (vocaux Discord / externes)

CREATE TABLE IF NOT EXISTS event_location_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_location_links_active
  ON event_location_links(is_active);
