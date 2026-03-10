
-- Ajoute les nouveaux rôles staff/public à l'enum member_role
-- puis normalise les anciennes valeurs legacy.

ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Modérateur';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Modérateur en formation';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Modérateur en activité réduite';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Modérateur en pause';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Admin Coordinateur';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Soutien TENF';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Contributeur TENF du Mois';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Nouveau';

-- Migration des anciennes valeurs vers les noms canoniques
UPDATE "members"
SET "role" = 'Admin Coordinateur'
WHERE "role" = 'Admin Adjoint';

UPDATE "members"
SET "role" = 'Modérateur'
WHERE "role" = 'Mentor';

UPDATE "members"
SET "role" = 'Modérateur en formation'
WHERE "role" = 'Modérateur Junior';
