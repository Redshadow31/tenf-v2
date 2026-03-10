-- TENF v2 - 0007
-- Domaine: evaluation

CREATE TABLE IF NOT EXISTS monthly_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key date NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  twitch_login text NOT NULL,
  calculated_by text,
  calculated_at timestamptz DEFAULT now(),
  total_points integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month_key, twitch_login)
);

CREATE TABLE IF NOT EXISTS evaluation_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  max_points integer NOT NULL DEFAULT 0,
  category text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_evaluation_id uuid NOT NULL REFERENCES monthly_evaluations(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES evaluation_components(id) ON DELETE RESTRICT,
  points integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (monthly_evaluation_id, component_id)
);

CREATE TABLE IF NOT EXISTS evaluation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_evaluation_id uuid NOT NULL REFERENCES monthly_evaluations(id) ON DELETE CASCADE,
  final_score integer NOT NULL DEFAULT 0,
  rank_label text,
  decision text,
  comments text,
  validated_by text,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (monthly_evaluation_id)
);

CREATE TABLE IF NOT EXISTS member_progression (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month_key date NOT NULL,
  previous_score integer,
  current_score integer,
  delta_score integer,
  trend text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, month_key)
);

CREATE INDEX IF NOT EXISTS idx_monthly_evaluations_month ON monthly_evaluations(month_key);
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_eval_id ON evaluation_scores(monthly_evaluation_id);
