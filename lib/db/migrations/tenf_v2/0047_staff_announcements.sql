-- TENF v2 - 0047
-- Annonces staff + notifications membres (admin)
--
-- Prérequis : si la migration 0019 n’a jamais été appliquée sur cette base,
-- les blocs IF NOT EXISTS ci-dessous créent les tables nécessaires avant la FK.

CREATE TABLE IF NOT EXISTS member_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NOT NULL UNIQUE,
  audience text NOT NULL DEFAULT 'admin_access',
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES member_notifications(id) ON DELETE CASCADE,
  member_discord_id text NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(notification_id, member_discord_id)
);

CREATE INDEX IF NOT EXISTS idx_member_notifications_active_audience
  ON member_notifications(is_active, audience);

CREATE INDEX IF NOT EXISTS idx_member_notification_reads_member
  ON member_notification_reads(member_discord_id);

CREATE INDEX IF NOT EXISTS idx_member_notification_reads_read_at
  ON member_notification_reads(read_at DESC);

CREATE TABLE IF NOT EXISTS staff_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  link text,
  image_url text,
  audience text NOT NULL DEFAULT 'staff',
  author_discord_id text NOT NULL,
  author_display_name text,
  notification_id uuid REFERENCES member_notifications(id) ON DELETE SET NULL,
  discord_dm_sent_at timestamptz,
  discord_dm_attempted integer NOT NULL DEFAULT 0,
  discord_dm_failed integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_announcements_audience_check CHECK (audience IN ('staff', 'community'))
);

CREATE INDEX IF NOT EXISTS idx_staff_announcements_active_created
  ON staff_announcements(is_active, created_at DESC);
