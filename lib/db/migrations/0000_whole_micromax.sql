CREATE TYPE "public"."bonus_type" AS ENUM('decalage-horaire', 'implication-qualitative', 'conseils-remarquables', 'autre');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('Spotlight', 'Soirées communautaires', 'Ateliers créateurs', 'Aventura 2025');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('Affilié', 'Développement', 'Modérateur Junior', 'Mentor', 'Admin', 'Admin Adjoint', 'Créateur Junior', 'Communauté');--> statement-breakpoint
CREATE TYPE "public"."spotlight_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month" date NOT NULL,
	"twitch_login" text NOT NULL,
	"section_a_points" integer DEFAULT 0,
	"spotlight_evaluations" jsonb DEFAULT '[]'::jsonb,
	"event_evaluations" jsonb DEFAULT '[]'::jsonb,
	"raid_points" integer DEFAULT 0,
	"spotlight_bonus" integer DEFAULT 0,
	"section_b_points" integer DEFAULT 0,
	"discord_engagement" jsonb,
	"section_c_points" integer DEFAULT 0,
	"follow_validations" jsonb DEFAULT '[]'::jsonb,
	"section_d_bonuses" integer DEFAULT 0,
	"bonuses" jsonb DEFAULT '[]'::jsonb,
	"total_points" integer DEFAULT 0,
	"calculated_at" timestamp,
	"calculated_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"twitch_login" text NOT NULL,
	"display_name" text NOT NULL,
	"discord_id" text,
	"discord_username" text,
	"notes" text,
	"registered_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"date" timestamp NOT NULL,
	"category" "event_category" NOT NULL,
	"location" text,
	"invited_members" jsonb DEFAULT '[]'::jsonb,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"user_id" text,
	"username" text,
	"details" jsonb,
	"ip_address" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"twitch_login" text NOT NULL,
	"twitch_id" text,
	"twitch_url" text NOT NULL,
	"discord_id" text,
	"discord_username" text,
	"display_name" text NOT NULL,
	"site_username" text,
	"role" "member_role" DEFAULT 'Affilié' NOT NULL,
	"is_vip" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"badges" jsonb DEFAULT '[]'::jsonb,
	"list_id" integer,
	"role_manually_set" boolean DEFAULT false,
	"twitch_status" jsonb,
	"description" text,
	"custom_bio" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"updated_by" text,
	"integration_date" timestamp,
	"role_history" jsonb DEFAULT '[]'::jsonb,
	"parrain" text,
	CONSTRAINT "members_twitch_login_unique" UNIQUE("twitch_login"),
	CONSTRAINT "members_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
CREATE TABLE "spotlight_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spotlight_id" uuid NOT NULL,
	"streamer_twitch_login" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"total_score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"moderator_comments" text,
	"evaluated_at" timestamp DEFAULT now(),
	"evaluated_by" text NOT NULL,
	"validated" boolean DEFAULT false,
	"validated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "spotlight_presences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spotlight_id" uuid NOT NULL,
	"twitch_login" text NOT NULL,
	"display_name" text,
	"added_at" timestamp DEFAULT now(),
	"added_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"streamer_twitch_login" text NOT NULL,
	"streamer_display_name" text,
	"started_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"status" "spotlight_status" DEFAULT 'active' NOT NULL,
	"moderator_discord_id" text NOT NULL,
	"moderator_username" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vip_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month" date NOT NULL,
	"twitch_login" text NOT NULL,
	"display_name" text NOT NULL,
	"vip_badge" text,
	"consecutive_months" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlight_evaluations" ADD CONSTRAINT "spotlight_evaluations_spotlight_id_spotlights_id_fk" FOREIGN KEY ("spotlight_id") REFERENCES "public"."spotlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlight_presences" ADD CONSTRAINT "spotlight_presences_spotlight_id_spotlights_id_fk" FOREIGN KEY ("spotlight_id") REFERENCES "public"."spotlights"("id") ON DELETE cascade ON UPDATE no action;