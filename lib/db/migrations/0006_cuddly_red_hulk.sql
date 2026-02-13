CREATE TABLE "member_profile_pending" (
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
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "tiktok" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "twitter" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "profile_validation_status" text DEFAULT 'non_soumis';