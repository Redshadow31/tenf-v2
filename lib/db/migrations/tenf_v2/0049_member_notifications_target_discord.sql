-- TENF v2 - 0049
-- Notifications personnalisées (rappels d'inscriptions événements / intégrations)

ALTER TABLE member_notifications
  ADD COLUMN IF NOT EXISTS target_discord_id text;

CREATE INDEX IF NOT EXISTS idx_member_notifications_member_direct_target
  ON member_notifications(is_active, audience, target_discord_id)
  WHERE audience = 'member_direct' AND target_discord_id IS NOT NULL;
