-- TENF v2 - 0012
-- Backfill v1 (ancien schema -> tables tenf_v2)
-- Idempotent et defensif.

-- ============================================================================
-- A) member_profiles depuis members
-- ============================================================================

INSERT INTO member_profiles (member_id)
SELECT m.id
FROM members m
LEFT JOIN member_profiles mp ON mp.member_id = m.id
WHERE mp.id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'description'
  ) THEN
    EXECUTE '
      UPDATE member_profiles mp
      SET bio = m.description
      FROM members m
      WHERE m.id = mp.member_id
        AND mp.bio IS NULL
        AND m.description IS NOT NULL
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'custom_bio'
  ) THEN
    EXECUTE '
      UPDATE member_profiles mp
      SET custom_bio = m.custom_bio
      FROM members m
      WHERE m.id = mp.member_id
        AND mp.custom_bio IS NULL
        AND m.custom_bio IS NOT NULL
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'primary_language'
  ) THEN
    EXECUTE '
      UPDATE member_profiles mp
      SET primary_language = m.primary_language
      FROM members m
      WHERE m.id = mp.member_id
        AND mp.primary_language IS NULL
        AND m.primary_language IS NOT NULL
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'timezone'
  ) THEN
    EXECUTE '
      UPDATE member_profiles mp
      SET timezone = m.timezone
      FROM members m
      WHERE m.id = mp.member_id
        AND mp.timezone IS NULL
        AND m.timezone IS NOT NULL
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'country_code'
  ) THEN
    EXECUTE '
      UPDATE member_profiles mp
      SET country_code = m.country_code
      FROM members m
      WHERE m.id = mp.member_id
        AND mp.country_code IS NULL
        AND m.country_code IS NOT NULL
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'birthday'
  ) THEN
    EXECUTE '
      UPDATE member_profiles mp
      SET birthday = m.birthday
      FROM members m
      WHERE m.id = mp.member_id
        AND mp.birthday IS NULL
        AND m.birthday IS NOT NULL
    ';
  END IF;
END $$;

-- ============================================================================
-- B) member_roles depuis members.role + vip
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'role'
  ) THEN
    EXECUTE '
      INSERT INTO member_roles (member_id, role_name, source, is_active)
      SELECT m.id, m.role::text, ''migration'', true
      FROM members m
      WHERE m.role IS NOT NULL
      ON CONFLICT (member_id, role_name) DO NOTHING
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'is_vip'
  ) THEN
    EXECUTE '
      INSERT INTO member_roles (member_id, role_name, source, is_active)
      SELECT m.id, ''VIP'', ''migration'', true
      FROM members m
      WHERE m.is_vip = true
      ON CONFLICT (member_id, role_name) DO NOTHING
    ';
  END IF;
END $$;

-- ============================================================================
-- C) member_social_links depuis members
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'twitch_url'
  ) THEN
    EXECUTE '
      INSERT INTO member_social_links (member_id, platform, url, is_primary)
      SELECT m.id, ''twitch'', m.twitch_url, true
      FROM members m
      WHERE m.twitch_url IS NOT NULL AND m.twitch_url <> ''''
      ON CONFLICT (member_id, platform, url) DO NOTHING
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'instagram'
  ) THEN
    EXECUTE '
      INSERT INTO member_social_links (member_id, platform, url, is_primary)
      SELECT m.id, ''instagram'', m.instagram, false
      FROM members m
      WHERE m.instagram IS NOT NULL AND m.instagram <> ''''
      ON CONFLICT (member_id, platform, url) DO NOTHING
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'tiktok'
  ) THEN
    EXECUTE '
      INSERT INTO member_social_links (member_id, platform, url, is_primary)
      SELECT m.id, ''tiktok'', m.tiktok, false
      FROM members m
      WHERE m.tiktok IS NOT NULL AND m.tiktok <> ''''
      ON CONFLICT (member_id, platform, url) DO NOTHING
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'twitter'
  ) THEN
    EXECUTE '
      INSERT INTO member_social_links (member_id, platform, url, is_primary)
      SELECT m.id, ''twitter'', m.twitter, false
      FROM members m
      WHERE m.twitter IS NOT NULL AND m.twitter <> ''''
      ON CONFLICT (member_id, platform, url) DO NOTHING
    ';
  END IF;
END $$;

-- ============================================================================
-- D) member_status_history depuis members.is_active (etat initial)
-- ============================================================================

INSERT INTO member_status_history (member_id, old_status, new_status, reason, changed_by)
SELECT m.id, NULL, CASE WHEN m.is_active THEN 'active' ELSE 'inactive' END, 'initial_migration', 'system'
FROM members m
WHERE NOT EXISTS (
  SELECT 1
  FROM member_status_history msh
  WHERE msh.member_id = m.id
    AND msh.reason = 'initial_migration'
);

-- ============================================================================
-- E) community_events depuis events
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.events') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO community_events (
        title, description, category, starts_at, location, is_published, created_by, created_at, updated_at
      )
      SELECT
        e.title,
        e.description,
        COALESCE(e.category::text, ''Non classé'') AS category,
        e.date AS starts_at,
        e.location,
        COALESCE(e.is_published, false),
        e.created_by,
        COALESCE(e.created_at, now()),
        COALESCE(e.updated_at, now())
      FROM events e
      WHERE NOT EXISTS (
        SELECT 1
        FROM community_events ce
        WHERE ce.title = e.title
          AND ce.starts_at = e.date
      )
    ';
  END IF;
END $$;

-- ============================================================================
-- F) event_registrations depuis ancien event_registrations + events
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.events') IS NOT NULL
     AND to_regclass('public.event_registrations') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'event_registrations' AND column_name = 'member_id'
     ) THEN
    EXECUTE '
      INSERT INTO event_registrations (
        event_id, member_id, twitch_login, display_name, discord_id, discord_username, notes, registered_at
      )
      SELECT
        ce.id,
        m.id,
        er.twitch_login,
        er.display_name,
        er.discord_id,
        er.discord_username,
        er.notes,
        COALESCE(er.registered_at, now())
      FROM event_registrations er
      JOIN events e ON e.id = er.event_id
      JOIN community_events ce
        ON ce.title = e.title
       AND ce.starts_at = e.date
      LEFT JOIN members m ON lower(m.twitch_login) = lower(er.twitch_login)
      WHERE NOT EXISTS (
        SELECT 1
        FROM event_registrations er2
        WHERE er2.event_id = ce.id
          AND lower(er2.twitch_login) = lower(er.twitch_login)
      )
    ';
  END IF;
END $$;

-- ============================================================================
-- G) spotlights depuis ancien spotlights (id text/uuid tolere)
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.spotlights') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'spotlights' AND column_name = 'streamer_member_id'
     )
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'spotlights' AND column_name = 'starts_at'
     ) THEN
    EXECUTE '
      INSERT INTO spotlights (
        id, streamer_member_id, streamer_twitch_login, streamer_display_name,
        moderator_discord_id, moderator_username, starts_at, ends_at, status, created_by, created_at
      )
      SELECT
        CASE
          WHEN s.id ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$''
            THEN s.id::uuid
          ELSE gen_random_uuid()
        END,
        m.id,
        s.streamer_twitch_login,
        s.streamer_display_name,
        s.moderator_discord_id,
        s.moderator_username,
        COALESCE(s.started_at, now()),
        s.ends_at,
        COALESCE(s.status::text, ''active''),
        s.created_by,
        COALESCE(s.created_at, now())
      FROM spotlights s
      LEFT JOIN members m ON lower(m.twitch_login) = lower(s.streamer_twitch_login)
      WHERE NOT EXISTS (
        SELECT 1
        FROM spotlights sn
        WHERE lower(sn.streamer_twitch_login) = lower(s.streamer_twitch_login)
          AND sn.starts_at = COALESCE(s.started_at, now())
      )
    ';
  END IF;
END $$;

-- ============================================================================
-- H) spotlight_attendance depuis spotlight_presences
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.spotlight_presences') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO spotlight_attendance (
        spotlight_id, member_id, twitch_login, present, added_by, added_at
      )
      SELECT
        sp.spotlight_id::text,
        m.id,
        sp.twitch_login,
        true,
        sp.added_by,
        COALESCE(sp.added_at, now())
      FROM spotlight_presences sp
      LEFT JOIN members m ON lower(m.twitch_login) = lower(sp.twitch_login)
      ON CONFLICT (spotlight_id, twitch_login) DO NOTHING
    ';
  END IF;
END $$;

-- ============================================================================
-- I) spotlight_metrics depuis spotlight_evaluations
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.spotlight_evaluations') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO spotlight_metrics (spotlight_id, metric_name, metric_value, metric_unit, measured_at, metadata)
      SELECT
        se.spotlight_id::text,
        ''evaluation_total_score'',
        COALESCE(se.total_score, 0),
        ''points'',
        COALESCE(se.evaluated_at, now()),
        jsonb_build_object(
          ''max_score'', se.max_score,
          ''evaluated_by'', se.evaluated_by,
          ''validated'', se.validated
        )
      FROM spotlight_evaluations se
    ';
  END IF;
END $$;

-- ============================================================================
-- J) staff_members / staff_roles seed depuis members.role
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'role'
  ) THEN
    EXECUTE '
      INSERT INTO staff_members (member_id, twitch_login, discord_id, display_name, is_active, joined_at)
      SELECT
        m.id,
        m.twitch_login,
        m.discord_id,
        m.display_name,
        m.is_active,
        now()
      FROM members m
      WHERE m.role::text IN (
        ''Admin'', ''Admin Coordinateur'', ''Admin Adjoint'', ''Modérateur'', ''Modérateur Junior'', ''Mentor''
      )
      ON CONFLICT (twitch_login) DO NOTHING
    ';

    EXECUTE '
      INSERT INTO staff_roles (staff_member_id, role_name, scope, starts_at, assigned_by)
      SELECT
        sm.id::text,
        m.role::text,
        ''global'',
        now(),
        ''migration''
      FROM staff_members sm
      JOIN members m ON lower(m.twitch_login) = lower(sm.twitch_login)
      WHERE m.role::text IN (
        ''Admin'', ''Admin Coordinateur'', ''Admin Adjoint'', ''Modérateur'', ''Modérateur Junior'', ''Mentor''
      )
      ON CONFLICT (staff_member_id, role_name, starts_at) DO NOTHING
    ';
  END IF;
END $$;

-- ============================================================================
-- K) points_transactions seed minimal depuis evaluations.total_points
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.evaluations') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO points_transactions (member_id, twitch_login, amount, transaction_type, source_type, source_id, reason, created_by, created_at)
      SELECT
        m.id,
        e.twitch_login,
        COALESCE(e.total_points, 0),
        ''credit'',
        ''evaluation'',
        e.id::text,
        ''migration_initial_total_points'',
        ''system'',
        COALESCE(e.calculated_at, e.created_at, now())
      FROM evaluations e
      LEFT JOIN members m ON lower(m.twitch_login) = lower(e.twitch_login)
      WHERE COALESCE(e.total_points, 0) <> 0
        AND NOT EXISTS (
          SELECT 1
          FROM points_transactions pt
          WHERE pt.source_type = ''evaluation''
            AND pt.source_id = e.id::text
        )
    ';
  END IF;
END $$;
