ALTER TABLE "members"
ADD COLUMN IF NOT EXISTS "onboarding_status" text DEFAULT 'a_faire',
ADD COLUMN IF NOT EXISTS "mentor_twitch_login" text,
ADD COLUMN IF NOT EXISTS "primary_language" text,
ADD COLUMN IF NOT EXISTS "timezone" text,
ADD COLUMN IF NOT EXISTS "country_code" text,
ADD COLUMN IF NOT EXISTS "last_review_at" timestamp,
ADD COLUMN IF NOT EXISTS "next_review_at" timestamp;
