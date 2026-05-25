-- TENF v2 - 0054
-- Rôles de sortie : membres ayant quitté TENF ou bannis (toujours inactifs, hors suivi).

ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Départ';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Banni';
