-- TENF v2 - 0017
-- Migration du module Follow vers Supabase

-- ============================================================================
-- A) Configuration staff follow
-- ============================================================================
CREATE TABLE IF NOT EXISTS follow_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_staff_order
  ON follow_staff(order_index, slug);

-- ============================================================================
-- B) Validations mensuelles follow (une feuille par staff et par mois)
-- ============================================================================
CREATE TABLE IF NOT EXISTS follow_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key date NOT NULL,
  staff_slug text NOT NULL,
  staff_name text NOT NULL,
  members jsonb NOT NULL DEFAULT '[]'::jsonb,
  moderator_comments text,
  validated_at timestamptz NOT NULL DEFAULT now(),
  validated_by text NOT NULL DEFAULT 'system',
  staff_twitch_id text,
  staff_discord_id text,
  stats jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month_key, staff_slug)
);

CREATE INDEX IF NOT EXISTS idx_follow_validations_month
  ON follow_validations(month_key);

CREATE INDEX IF NOT EXISTS idx_follow_validations_staff
  ON follow_validations(staff_slug, month_key DESC);
