-- ============================================================================
-- TENF - ETAPE 1
-- Architecture cible v1 (DDL complet) - compatible Supabase/Postgres
-- IMPORTANT:
-- - Ce script pose la structure cible avec IF NOT EXISTS.
-- - Il n'applique pas de migration de donnees entre ancien et nouveau modele.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1) MEMBRES
-- ============================================================================

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twitch_login text NOT NULL UNIQUE,
  twitch_id text,
  display_name text NOT NULL,
  twitch_url text,
  discord_id text UNIQUE,
  discord_username text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  bio text,
  custom_bio text,
  primary_language text,
  timezone text,
  country_code text,
  birthday date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id)
);

CREATE TABLE IF NOT EXISTS member_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role_name text NOT NULL,
  source text DEFAULT 'manual',
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, role_name)
);

CREATE TABLE IF NOT EXISTS member_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  badge_name text NOT NULL,
  awarded_by text,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS member_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  reason text,
  changed_by text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, platform, url)
);

CREATE INDEX IF NOT EXISTS idx_member_roles_member_id ON member_roles(member_id);
CREATE INDEX IF NOT EXISTS idx_member_badges_member_id ON member_badges(member_id);
CREATE INDEX IF NOT EXISTS idx_member_status_history_member_id ON member_status_history(member_id);

-- ============================================================================
-- 2) INTEGRATION
-- ============================================================================

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

-- ============================================================================
-- 3) ACTIVITE COMMUNAUTAIRE
-- ============================================================================

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

-- ============================================================================
-- 4) RAIDS
-- ============================================================================

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

-- Compatibilite avec bases existantes: si la table raids existe deja sans raid_date,
-- on ajoute la colonne avant de poser l'index.
ALTER TABLE raids
  ADD COLUMN IF NOT EXISTS raid_date timestamptz;

ALTER TABLE raid_participants
  ADD COLUMN IF NOT EXISTS raid_id uuid;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'raids'
      AND column_name = 'raid_date'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_raids_raid_date ON raids(raid_date);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'raid_participants'
      AND column_name = 'raid_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_raid_participants_raid_id ON raid_participants(raid_id);
  END IF;
END $$;

-- ============================================================================
-- 5) SPOTLIGHT
-- ============================================================================

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

-- Compatibilite avec bases existantes:
-- certains schemas historiques utilisent "started_at" au lieu de "starts_at".
ALTER TABLE spotlights
  ADD COLUMN IF NOT EXISTS starts_at timestamptz;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'spotlights'
      AND column_name = 'started_at'
  ) THEN
    EXECUTE '
      UPDATE spotlights
      SET starts_at = started_at
      WHERE starts_at IS NULL
    ';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'spotlights'
      AND column_name = 'starts_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_spotlights_starts_at ON spotlights(starts_at);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'spotlight_attendance'
      AND column_name = 'spotlight_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_spotlight_attendance_spotlight_id ON spotlight_attendance(spotlight_id);
  END IF;
END $$;

-- ============================================================================
-- 6) EVALUATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key date NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  calculated_by text,
  calculated_at timestamptz DEFAULT now(),
  total_points integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month_key, twitch_login)
);

CREATE TABLE IF NOT EXISTS evaluation_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  max_points integer NOT NULL DEFAULT 0,
  category text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_evaluation_id uuid NOT NULL REFERENCES monthly_evaluations(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES evaluation_components(id) ON DELETE RESTRICT,
  points integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (monthly_evaluation_id, component_id)
);

CREATE TABLE IF NOT EXISTS evaluation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_evaluation_id uuid NOT NULL REFERENCES monthly_evaluations(id) ON DELETE CASCADE,
  final_score integer NOT NULL DEFAULT 0,
  rank_label text,
  decision text,
  comments text,
  validated_by text,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (monthly_evaluation_id)
);

CREATE TABLE IF NOT EXISTS member_progression (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month_key date NOT NULL,
  previous_score integer,
  current_score integer,
  delta_score integer,
  trend text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, month_key)
);

CREATE INDEX IF NOT EXISTS idx_monthly_evaluations_month ON monthly_evaluations(month_key);
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_eval_id ON evaluation_scores(monthly_evaluation_id);

-- ============================================================================
-- 7) RECOMPENSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  source_type text,
  source_id text,
  reason text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  stock integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id uuid NOT NULL REFERENCES reward_catalog(id) ON DELETE RESTRICT,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text,
  points_spent integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by text,
  note text
);

CREATE TABLE IF NOT EXISTS vip_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  vip_type text NOT NULL DEFAULT 'VIP Elite',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  assigned_by text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_transactions_member_id ON points_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);

-- ============================================================================
-- 8) STAFF
-- ============================================================================

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

-- Compatibilite legacy: on ne cree les index que si les colonnes existent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'staff_roles'
      AND column_name = 'staff_member_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_staff_roles_staff_member_id ON staff_roles(staff_member_id);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'staff_applications'
      AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_staff_applications_status ON staff_applications(status);
  END IF;
END $$;

-- ============================================================================
-- 9) LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  actor_id text,
  actor_username text,
  previous_value jsonb,
  new_value jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS structured_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  service text,
  route text,
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_structured_logs_level ON structured_logs(level);

-- ============================================================================
-- 10) SYSTEME
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,
  status text NOT NULL DEFAULT 'started',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_ms integer,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS data_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  resource_type text,
  resource_id text,
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS system_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL DEFAULT 'admin',
  title text NOT NULL,
  message text NOT NULL,
  level text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  audience text NOT NULL DEFAULT 'admin',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_data_issues_status ON data_issues(status);
CREATE INDEX IF NOT EXISTS idx_system_notifications_is_read ON system_notifications(is_read);

-- ============================================================================
-- Fin ETAPE 1
-- ============================================================================
