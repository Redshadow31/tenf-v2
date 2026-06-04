-- TENF v2 - 0055
-- Journal des changements d'identité (pseudos Twitch/Discord/site, IDs).

ALTER TABLE "public"."members"
  ADD COLUMN IF NOT EXISTS "identity_history" jsonb NOT NULL DEFAULT '[]'::jsonb;
