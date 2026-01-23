-- Migration corrigée pour ajouter les catégories et changer les types d'ID
-- Appliquer cette migration via SQL Editor de Supabase

-- 1. Ajouter les nouvelles valeurs à l'enum event_category
ALTER TYPE "public"."event_category" ADD VALUE IF NOT EXISTS 'Soirée Film';
ALTER TYPE "public"."event_category" ADD VALUE IF NOT EXISTS 'Apéro';
ALTER TYPE "public"."event_category" ADD VALUE IF NOT EXISTS 'Formation';
ALTER TYPE "public"."event_category" ADD VALUE IF NOT EXISTS 'Jeux communautaire';
ALTER TYPE "public"."event_category" ADD VALUE IF NOT EXISTS 'Organisation Aventura 2026';

-- 2. Supprimer les contraintes de clé étrangère avant de changer les types
ALTER TABLE "event_registrations" DROP CONSTRAINT IF EXISTS "event_registrations_event_id_events_id_fk";
ALTER TABLE "spotlight_presences" DROP CONSTRAINT IF EXISTS "spotlight_presences_spotlight_id_spotlights_id_fk";
ALTER TABLE "spotlight_evaluations" DROP CONSTRAINT IF EXISTS "spotlight_evaluations_spotlight_id_spotlights_id_fk";

-- 3. Changer les types d'ID
-- Pour events : changer id de uuid à text
ALTER TABLE "events" ALTER COLUMN "id" TYPE text USING "id"::text;
ALTER TABLE "events" ALTER COLUMN "id" DROP DEFAULT;

-- Pour event_registrations : changer event_id de uuid à text
ALTER TABLE "event_registrations" ALTER COLUMN "event_id" TYPE text USING "event_id"::text;

-- Pour spotlights : changer id de uuid à text
ALTER TABLE "spotlights" ALTER COLUMN "id" TYPE text USING "id"::text;
ALTER TABLE "spotlights" ALTER COLUMN "id" DROP DEFAULT;

-- Pour spotlight_presences : changer spotlight_id de uuid à text
ALTER TABLE "spotlight_presences" ALTER COLUMN "spotlight_id" TYPE text USING "spotlight_id"::text;

-- Pour spotlight_evaluations : changer spotlight_id de uuid à text
ALTER TABLE "spotlight_evaluations" ALTER COLUMN "spotlight_id" TYPE text USING "spotlight_id"::text;

-- 4. Recréer les contraintes de clé étrangère
ALTER TABLE "event_registrations" 
  ADD CONSTRAINT "event_registrations_event_id_events_id_fk" 
  FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "spotlight_presences" 
  ADD CONSTRAINT "spotlight_presences_spotlight_id_spotlights_id_fk" 
  FOREIGN KEY ("spotlight_id") REFERENCES "public"."spotlights"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "spotlight_evaluations" 
  ADD CONSTRAINT "spotlight_evaluations_spotlight_id_spotlights_id_fk" 
  FOREIGN KEY ("spotlight_id") REFERENCES "public"."spotlights"("id") ON DELETE cascade ON UPDATE no action;
