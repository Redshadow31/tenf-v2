-- TENF v2 - 0048
-- Annonces : image bannière + audience (staff vs communauté)

ALTER TABLE staff_announcements
  ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE staff_announcements
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'staff';

ALTER TABLE staff_announcements
  DROP CONSTRAINT IF EXISTS staff_announcements_audience_check;

ALTER TABLE staff_announcements
  ADD CONSTRAINT staff_announcements_audience_check
  CHECK (audience IN ('staff', 'community'));
