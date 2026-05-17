-- TENF v2 - 0053
-- Nouveaux paliers de modération et rôle contributeur invité dans l'enum `member_role`.
-- Les valeurs historiques (`Modérateur en formation`, `Admin`, etc.) restent valides
-- pour la rétrocompatibilité ; l'organigramme et les formulaires admin peuvent désormais
-- persister les libellés affinés alignés sur la nomenclature 2026.

ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Modérateur en Découverte';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Modérateur en Accompagnement';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Modérateur en Autonomie';
ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Contributeur Invité TENF';
