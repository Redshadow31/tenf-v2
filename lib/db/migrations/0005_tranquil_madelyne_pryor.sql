CREATE TABLE "public_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"pseudo" text NOT NULL,
	"message" text NOT NULL,
	"hearts" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "structured_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"category" text NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb,
	"actor_discord_id" text,
	"actor_role" text,
	"resource_type" text,
	"resource_id" text,
	"route" text,
	"duration_ms" integer,
	"status_code" integer
);
