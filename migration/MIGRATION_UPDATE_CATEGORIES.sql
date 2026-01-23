-- Migration pour ajouter les catégories manquantes et changer les types d'ID
-- Appliquer cette migration via SQL Editor de Supabase

-- 1. Ajouter les nouvelles valeurs à l'enum event_category
ALTER TYPE "public"."event_category" ADD VALUE IF NOT EXISTS 'Soirée Film';
ALTER TYPE "public"."event_category" ADD VALUE IF NOT EXISTS 'Apéro';
ALTER TYPE "public"."event_category" ADD VALUE IF NOT EXISTS 'Formation';
ALTER TYPE "public"."event_category" ADD VALUE IF NOT EXISTS 'Jeux communautaire';
ALTER TYPE "public"."event_category" ADD VALUE IF NOT EXISTS 'Organisation Aventura 2026';

-- 2. Changer le type de l'ID des événements de uuid à text
-- Note: Cette opération nécessite de supprimer et recréer la table
-- On va plutôt utiliser une approche plus sûre : créer une nouvelle colonne

-- Pour events : changer id de uuid à text
ALTER TABLE "events" ALTER COLUMN "id" TYPE text USING "id"::text;
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_pkey";
ALTER TABLE "events" ADD PRIMARY KEY ("id");

-- Pour event_registrations : changer event_id de uuid à text
ALTER TABLE "event_registrations" ALTER COLUMN "event_id" TYPE text USING "event_id"::text;

-- Pour spotlights : changer id de uuid à text
ALTER TABLE "spotlights" ALTER COLUMN "id" TYPE text USING "id"::text;
ALTER TABLE "spotlights" DROP CONSTRAINT IF EXISTS "spotlights_pkey";
ALTER TABLE "spotlights" ADD PRIMARY KEY ("id");

-- Pour spotlight_presences : changer spotlight_id de uuid à text
ALTER TABLE "spotlight_presences" ALTER COLUMN "spotlight_id" TYPE text USING "spotlight_id"::text;

-- Pour spotlight_evaluations : changer spotlight_id de uuid à text
ALTER TABLE "spotlight_evaluations" ALTER COLUMN "spotlight_id" TYPE text USING "spotlight_id"::text;
