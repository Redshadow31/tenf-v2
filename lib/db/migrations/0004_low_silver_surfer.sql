CREATE TABLE "event_presences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"twitch_login" text NOT NULL,
	"display_name" text NOT NULL,
	"discord_id" text,
	"discord_username" text,
	"is_registered" boolean DEFAULT false,
	"present" boolean NOT NULL,
	"note" text,
	"validated_at" timestamp,
	"validated_by" text,
	"added_manually" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "event_presences_event_id_twitch_login_unique" UNIQUE("event_id","twitch_login")
);
--> statement-breakpoint
ALTER TABLE "event_presences" ADD CONSTRAINT "event_presences_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;