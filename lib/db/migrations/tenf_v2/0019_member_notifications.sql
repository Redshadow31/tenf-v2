-- TENF v2 - 0019
-- Domaine: notifications membres (admins dashboard)

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
