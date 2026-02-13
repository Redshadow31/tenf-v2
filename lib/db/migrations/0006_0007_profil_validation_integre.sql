-- ============================================================
-- Migration intégrée : Profil membre + validation admin
-- À exécuter dans Supabase SQL Editor
-- Idempotent : peut être exécuté plusieurs fois sans erreur
-- ============================================================

-- 1. Table des demandes de modification en attente de validation
CREATE TABLE IF NOT EXISTS "member_profile_pending" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "twitch_login" text NOT NULL,
  "discord_id" text,
  "description" text,
  "instagram" text,
  "tiktok" text,
  "twitter" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "submitted_at" timestamp DEFAULT now(),
  "reviewed_at" timestamp,
  "reviewed_by" text
);

-- 2. Colonnes réseaux sociaux sur members (si pas déjà présentes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'instagram') THEN
    ALTER TABLE "members" ADD COLUMN "instagram" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'tiktok') THEN
    ALTER TABLE "members" ADD COLUMN "tiktok" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'twitter') THEN
    ALTER TABLE "members" ADD COLUMN "twitter" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'profile_validation_status') THEN
    ALTER TABLE "members" ADD COLUMN "profile_validation_status" text DEFAULT 'non_soumis';
  END IF;
END $$;

-- 3. Marquer tous les membres existants comme validés (rétrocompatibilité)
UPDATE "members" SET "profile_validation_status" = 'valide' WHERE "profile_validation_status" = 'non_soumis';
