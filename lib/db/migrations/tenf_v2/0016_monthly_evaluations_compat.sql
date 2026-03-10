-- TENF v2 - 0016
-- Compatibilite "evaluations" sur monthly_evaluations

ALTER TABLE monthly_evaluations
  ADD COLUMN IF NOT EXISTS section_a_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS section_b_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS section_c_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS section_d_bonuses integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spotlight_evaluations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS event_evaluations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS raid_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS raid_points_manual integer,
  ADD COLUMN IF NOT EXISTS raid_notes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spotlight_bonus integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discord_engagement jsonb,
  ADD COLUMN IF NOT EXISTS follow_validations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bonuses jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS final_note integer,
  ADD COLUMN IF NOT EXISTS final_note_saved_at timestamptz,
  ADD COLUMN IF NOT EXISTS final_note_saved_by text;

-- Synchronisation initiale depuis l'ancienne table evaluations (si elle existe)
DO $$
BEGIN
  IF to_regclass('public.evaluations') IS NOT NULL THEN
    INSERT INTO monthly_evaluations (
      month_key,
      member_id,
      twitch_login,
      calculated_by,
      calculated_at,
      total_points,
      created_at,
      updated_at,
      section_a_points,
      section_b_points,
      section_c_points,
      section_d_bonuses,
      spotlight_evaluations,
      event_evaluations,
      raid_points,
      raid_points_manual,
      raid_notes,
      spotlight_bonus,
      discord_engagement,
      follow_validations,
      bonuses,
      final_note,
      final_note_saved_at,
      final_note_saved_by
    )
    SELECT
      e.month::date,
      m.id,
      e.twitch_login,
      (to_jsonb(e)->>'calculated_by'),
      (to_jsonb(e)->>'calculated_at')::timestamptz,
      COALESCE((to_jsonb(e)->>'total_points')::integer, 0),
      COALESCE((to_jsonb(e)->>'created_at')::timestamptz, now()),
      COALESCE((to_jsonb(e)->>'updated_at')::timestamptz, now()),
      COALESCE((to_jsonb(e)->>'section_a_points')::integer, 0),
      COALESCE((to_jsonb(e)->>'section_b_points')::integer, 0),
      COALESCE((to_jsonb(e)->>'section_c_points')::integer, 0),
      COALESCE((to_jsonb(e)->>'section_d_bonuses')::integer, 0),
      COALESCE((to_jsonb(e)->'spotlight_evaluations'), '[]'::jsonb),
      COALESCE((to_jsonb(e)->'event_evaluations'), '[]'::jsonb),
      COALESCE((to_jsonb(e)->>'raid_points')::integer, 0),
      (to_jsonb(e)->>'raid_points_manual')::integer,
      COALESCE((to_jsonb(e)->'raid_notes'), '[]'::jsonb),
      COALESCE((to_jsonb(e)->>'spotlight_bonus')::integer, 0),
      (to_jsonb(e)->'discord_engagement'),
      COALESCE((to_jsonb(e)->'follow_validations'), '[]'::jsonb),
      COALESCE((to_jsonb(e)->'bonuses'), '[]'::jsonb),
      (to_jsonb(e)->>'final_note')::integer,
      (to_jsonb(e)->>'final_note_saved_at')::timestamptz,
      (to_jsonb(e)->>'final_note_saved_by')
    FROM evaluations e
    LEFT JOIN members m ON lower(m.twitch_login) = lower(e.twitch_login)
    ON CONFLICT (month_key, twitch_login) DO UPDATE
    SET
      section_a_points = EXCLUDED.section_a_points,
      section_b_points = EXCLUDED.section_b_points,
      section_c_points = EXCLUDED.section_c_points,
      section_d_bonuses = EXCLUDED.section_d_bonuses,
      total_points = EXCLUDED.total_points,
      spotlight_evaluations = EXCLUDED.spotlight_evaluations,
      event_evaluations = EXCLUDED.event_evaluations,
      raid_points = EXCLUDED.raid_points,
      raid_points_manual = EXCLUDED.raid_points_manual,
      raid_notes = EXCLUDED.raid_notes,
      spotlight_bonus = EXCLUDED.spotlight_bonus,
      discord_engagement = EXCLUDED.discord_engagement,
      follow_validations = EXCLUDED.follow_validations,
      bonuses = EXCLUDED.bonuses,
      final_note = EXCLUDED.final_note,
      final_note_saved_at = EXCLUDED.final_note_saved_at,
      final_note_saved_by = EXCLUDED.final_note_saved_by,
      calculated_by = EXCLUDED.calculated_by,
      calculated_at = EXCLUDED.calculated_at,
      updated_at = now();
  END IF;
END $$;
