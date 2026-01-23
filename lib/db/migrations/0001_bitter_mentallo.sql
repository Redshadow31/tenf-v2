ALTER TYPE "public"."event_category" ADD VALUE 'Soirée Film' BEFORE 'Ateliers créateurs';--> statement-breakpoint
ALTER TYPE "public"."event_category" ADD VALUE 'Apéro' BEFORE 'Ateliers créateurs';--> statement-breakpoint
ALTER TYPE "public"."event_category" ADD VALUE 'Formation' BEFORE 'Ateliers créateurs';--> statement-breakpoint
ALTER TYPE "public"."event_category" ADD VALUE 'Jeux communautaire' BEFORE 'Ateliers créateurs';--> statement-breakpoint
ALTER TYPE "public"."event_category" ADD VALUE 'Organisation Aventura 2026';--> statement-breakpoint
ALTER TABLE "event_registrations" ALTER COLUMN "event_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "spotlight_evaluations" ALTER COLUMN "spotlight_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "spotlight_presences" ALTER COLUMN "spotlight_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "spotlights" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "spotlights" ALTER COLUMN "id" DROP DEFAULT;