CREATE TABLE IF NOT EXISTS "staff_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "applicant_discord_id" text NOT NULL,
  "applicant_username" text NOT NULL,
  "applicant_avatar" text,
  "answers" jsonb NOT NULL,
  "admin_status" text NOT NULL DEFAULT 'nouveau',
  "admin_notes" jsonb DEFAULT '[]'::jsonb,
  "red_flags" jsonb DEFAULT '[]'::jsonb,
  "has_red_flag" boolean NOT NULL DEFAULT false,
  "assigned_to" text,
  "last_contacted_at" timestamp,
  "score" integer
);

CREATE INDEX IF NOT EXISTS "idx_staff_applications_created_at"
  ON "staff_applications" ("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_staff_applications_status"
  ON "staff_applications" ("admin_status");

CREATE INDEX IF NOT EXISTS "idx_staff_applications_discord"
  ON "staff_applications" ("applicant_discord_id");
