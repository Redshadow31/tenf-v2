-- Harmonisation rôles/badges 2026
-- 1) Ajoute le rôle manquant "Les P'tits Jeunes"
-- 2) Normalise les éventuelles anciennes valeurs "Communauté (mineur)" vers "Communauté"

ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Les P''tits Jeunes';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'members'
      AND column_name = 'role'
  ) THEN
    EXECUTE 'UPDATE "public"."members" SET "role" = ''Communauté'' WHERE "role"::text = ''Communauté (mineur)''';
  END IF;
END $$;
