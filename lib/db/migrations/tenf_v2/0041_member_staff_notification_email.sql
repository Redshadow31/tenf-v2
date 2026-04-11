-- E-mail de contact staff (notifications importantes), saisi par l'admin sur "Mon compte"
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS staff_notification_email text;

COMMENT ON COLUMN members.staff_notification_email IS 'E-mail pour notifications staff importantes (fiche Mon compte admin)';
