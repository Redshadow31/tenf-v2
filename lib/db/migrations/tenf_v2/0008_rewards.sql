-- TENF v2 - 0008
-- Domaine: recompenses

CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  source_type text,
  source_id text,
  reason text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  stock integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id uuid NOT NULL REFERENCES reward_catalog(id) ON DELETE RESTRICT,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text,
  points_spent integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by text,
  note text
);

CREATE TABLE IF NOT EXISTS vip_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  vip_type text NOT NULL DEFAULT 'VIP Elite',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  assigned_by text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_transactions_member_id ON points_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
