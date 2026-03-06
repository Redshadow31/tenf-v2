-- Ajout des dates anniversaires membre (profil + admin)
-- Idempotent: peut etre execute plusieurs fois sans erreur

ALTER TABLE "members"
  ADD COLUMN IF NOT EXISTS "birthday" date,
  ADD COLUMN IF NOT EXISTS "twitch_affiliate_date" date;

ALTER TABLE "member_profile_pending"
  ADD COLUMN IF NOT EXISTS "birthday" date,
  ADD COLUMN IF NOT EXISTS "twitch_affiliate_date" date;
