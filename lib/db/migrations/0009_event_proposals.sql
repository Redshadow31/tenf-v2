CREATE TABLE IF NOT EXISTS "event_proposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "description" text NOT NULL,
  "category" event_category NOT NULL,
  "proposed_date" timestamp,
  "status" text NOT NULL DEFAULT 'pending',
  "is_anonymous" boolean NOT NULL DEFAULT true,
  "proposed_by_discord_id" text NOT NULL,
  "proposed_by_twitch_login" text,
  "proposed_by_display_name" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "event_proposal_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "proposal_id" uuid NOT NULL REFERENCES "event_proposals"("id") ON DELETE CASCADE,
  "voter_discord_id" text NOT NULL,
  "voter_twitch_login" text,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_proposal_votes_unique_vote_idx"
  ON "event_proposal_votes" ("proposal_id", "voter_discord_id");
