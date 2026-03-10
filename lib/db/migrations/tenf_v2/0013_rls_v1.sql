-- TENF v2 - 0013
-- RLS v1 (base securite)
-- Objectif: activer RLS partout + acces complet service_role.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'members',
    'member_profiles',
    'member_roles',
    'member_badges',
    'member_status_history',
    'member_social_links',
    'integration_sessions',
    'integration_registrations',
    'integration_attendance',
    'community_events',
    'event_registrations',
    'event_presences',
    'event_proposals',
    'raids',
    'raid_participants',
    'spotlights',
    'spotlight_attendance',
    'spotlight_metrics',
    'monthly_evaluations',
    'evaluation_components',
    'evaluation_scores',
    'evaluation_results',
    'member_progression',
    'points_transactions',
    'reward_catalog',
    'reward_redemptions',
    'vip_assignments',
    'staff_members',
    'staff_roles',
    'staff_applications',
    'staff_votes',
    'staff_notes',
    'audit_logs',
    'admin_actions',
    'structured_logs',
    'sync_logs',
    'data_issues',
    'system_notifications'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS p_service_all ON %I', t);
      EXECUTE format(
        'CREATE POLICY p_service_all ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        t
      );
    END IF;
  END LOOP;
END $$;

-- Lecture publique minimale pour le site vitrine
DO $$
BEGIN
  IF to_regclass('public.members') IS NOT NULL THEN
    DROP POLICY IF EXISTS p_public_members_read ON members;
    CREATE POLICY p_public_members_read
      ON members
      FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;

  IF to_regclass('public.community_events') IS NOT NULL THEN
    DROP POLICY IF EXISTS p_public_community_events_read ON community_events;
    CREATE POLICY p_public_community_events_read
      ON community_events
      FOR SELECT
      TO anon, authenticated
      USING (is_published = true);
  END IF;

  IF to_regclass('public.reward_catalog') IS NOT NULL THEN
    DROP POLICY IF EXISTS p_public_reward_catalog_read ON reward_catalog;
    CREATE POLICY p_public_reward_catalog_read
      ON reward_catalog
      FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;
END $$;
