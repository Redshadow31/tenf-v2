-- TENF v2 - 0018
-- migration2: Supabase legacy -> Supabase v2 (global, idempotent)
-- Objectif: consolider les donnees legacy dans les tables v2.
-- Securite: chaque bloc est defensif (IF EXISTS / WHERE NOT EXISTS / ON CONFLICT).

-- ============================================================================
-- A) MEMBRES
-- ============================================================================

-- A1) members: normalisation minimale (pas de duplication, table commune legacy/v2)
UPDATE members
SET
  twitch_login = lower(twitch_login),
  display_name = COALESCE(NULLIF(display_name, ''), twitch_login),
  updated_at = now()
WHERE twitch_login IS NOT NULL
  AND (
    twitch_login <> lower(twitch_login)
    OR display_name IS NULL
    OR display_name = ''
  );

-- A2) member_profiles depuis members
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
      SET bio = COALESCE(mp.bio, m.description),
          updated_at = now()
      FROM members m
      WHERE m.id = mp.member_id
        AND m.description IS NOT NULL
    ';
  END IF;
END $$;

-- A3) member_roles depuis members.role / members.is_vip
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'role'
  ) THEN
    EXECUTE '
      INSERT INTO member_roles (member_id, role_name, source, is_active)
      SELECT m.id, m.role::text, ''migration2'', true
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
      SELECT m.id, ''VIP'', ''migration2'', true
      FROM members m
      WHERE m.is_vip = true
      ON CONFLICT (member_id, role_name) DO NOTHING
    ';
  END IF;
END $$;

-- A4) member_social_links depuis members
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='members' AND column_name='twitch_url'
  ) THEN
    EXECUTE '
      INSERT INTO member_social_links (member_id, platform, url, is_primary)
      SELECT m.id, ''twitch'', m.twitch_url, true
      FROM members m
      WHERE COALESCE(m.twitch_url, '''') <> ''''
      ON CONFLICT (member_id, platform, url) DO NOTHING
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='members' AND column_name='instagram'
  ) THEN
    EXECUTE '
      INSERT INTO member_social_links (member_id, platform, url, is_primary)
      SELECT m.id, ''instagram'', m.instagram, false
      FROM members m
      WHERE COALESCE(m.instagram, '''') <> ''''
      ON CONFLICT (member_id, platform, url) DO NOTHING
    ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='members' AND column_name='tiktok'
  ) THEN
    EXECUTE '
      INSERT INTO member_social_links (member_id, platform, url, is_primary)
      SELECT m.id, ''tiktok'', m.tiktok, false
      FROM members m
      WHERE COALESCE(m.tiktok, '''') <> ''''
      ON CONFLICT (member_id, platform, url) DO NOTHING
    ';
  END IF;
END $$;

-- A5) member_badges / vip_assignments seed depuis is_vip
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'members' AND column_name = 'is_vip'
  ) THEN
    EXECUTE '
      INSERT INTO member_badges (member_id, badge_name, awarded_by, metadata)
      SELECT m.id, ''VIP'', ''migration2'', jsonb_build_object(''source'', ''members.is_vip'')
      FROM members m
      WHERE m.is_vip = true
        AND NOT EXISTS (
          SELECT 1
          FROM member_badges mb
          WHERE mb.member_id = m.id
            AND mb.badge_name = ''VIP''
        )
    ';

    EXECUTE '
      INSERT INTO vip_assignments (member_id, twitch_login, vip_type, starts_at, assigned_by, reason)
      SELECT m.id, m.twitch_login, ''VIP'', COALESCE(m.created_at, now()), ''migration2'', ''legacy_is_vip''
      FROM members m
      WHERE m.is_vip = true
        AND NOT EXISTS (
          SELECT 1
          FROM vip_assignments va
          WHERE lower(va.twitch_login) = lower(m.twitch_login)
            AND va.reason = ''legacy_is_vip''
        )
    ';
  END IF;
END $$;

-- A6) member_status_history (etat initial)
INSERT INTO member_status_history (member_id, old_status, new_status, reason, changed_by)
SELECT m.id, NULL, CASE WHEN m.is_active THEN 'active' ELSE 'inactive' END, 'migration2_snapshot', 'system'
FROM members m
WHERE NOT EXISTS (
  SELECT 1
  FROM member_status_history msh
  WHERE msh.member_id = m.id
    AND msh.reason = 'migration2_snapshot'
);

-- ============================================================================
-- B) INTEGRATION
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.integrations') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO integration_sessions (
        title, description, category, starts_at, location_name, is_published, created_by, created_at, updated_at
      )
      SELECT
        COALESCE(i.title, ''Integration''),
        i.description,
        COALESCE(i.category::text, ''integration''),
        COALESCE(
          (to_jsonb(i)->>''starts_at'')::timestamptz,
          (to_jsonb(i)->>''date'')::timestamptz,
          now()
        ),
        COALESCE((to_jsonb(i)->>''location''), (to_jsonb(i)->>''location_name'')),
        COALESCE((to_jsonb(i)->>''is_published'')::boolean, false),
        (to_jsonb(i)->>''created_by''),
        COALESCE((to_jsonb(i)->>''created_at'')::timestamptz, now()),
        COALESCE((to_jsonb(i)->>''updated_at'')::timestamptz, now())
      FROM integrations i
      WHERE NOT EXISTS (
        SELECT 1
        FROM integration_sessions s
        WHERE s.title = COALESCE(i.title, ''Integration'')
          AND s.starts_at = COALESCE(
            (to_jsonb(i)->>''starts_at'')::timestamptz,
            (to_jsonb(i)->>''date'')::timestamptz,
            now()
          )
      )
    ';
  END IF;
END $$;

-- ============================================================================
-- C) COMMUNITY EVENTS (events -> community_events + registrations + presences)
-- ============================================================================

-- C1) community_events depuis events
DO $$
BEGIN
  IF to_regclass('public.events') IS NOT NULL THEN
    INSERT INTO community_events (
      title, description, category, starts_at, location, is_published, created_by, created_at, updated_at
    )
    SELECT
      COALESCE(e.title, 'Evenement'),
      e.description,
      COALESCE((to_jsonb(e)->>'category'), 'Non classé'),
      COALESCE((to_jsonb(e)->>'date')::timestamptz, (to_jsonb(e)->>'starts_at')::timestamptz, now()),
      (to_jsonb(e)->>'location'),
      COALESCE((to_jsonb(e)->>'is_published')::boolean, (to_jsonb(e)->>'isPublished')::boolean, false),
      (to_jsonb(e)->>'created_by'),
      COALESCE((to_jsonb(e)->>'created_at')::timestamptz, now()),
      COALESCE((to_jsonb(e)->>'updated_at')::timestamptz, now())
    FROM events e
    WHERE NOT EXISTS (
      SELECT 1
      FROM community_events ce
      WHERE ce.title = COALESCE(e.title, 'Evenement')
        AND ce.starts_at = COALESCE((to_jsonb(e)->>'date')::timestamptz, (to_jsonb(e)->>'starts_at')::timestamptz, now())
    );
  END IF;
END $$;

-- C2) sync des colonnes de compat (legacy_event_id, image, invited_members)
DO $$
BEGIN
  IF to_regclass('public.events') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='community_events' AND column_name='legacy_event_id'
    ) THEN
      WITH candidates AS (
        SELECT
          ce.id AS community_event_id,
          (to_jsonb(e)->>'id') AS legacy_id,
          row_number() OVER (
            PARTITION BY (to_jsonb(e)->>'id')
            ORDER BY ce.created_at NULLS LAST, ce.id
          ) AS rn
        FROM community_events ce
        JOIN events e
          ON ce.title = COALESCE(e.title, 'Evenement')
         AND ce.starts_at = COALESCE((to_jsonb(e)->>'date')::timestamptz, (to_jsonb(e)->>'starts_at')::timestamptz, now())
        WHERE (to_jsonb(e)->>'id') IS NOT NULL
          AND ce.legacy_event_id IS NULL
      )
      UPDATE community_events ce
      SET legacy_event_id = c.legacy_id
      FROM candidates c
      WHERE ce.id = c.community_event_id
        AND c.rn = 1
        AND NOT EXISTS (
          SELECT 1
          FROM community_events ce2
          WHERE ce2.legacy_event_id = c.legacy_id
            AND ce2.id <> ce.id
        );
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='community_events' AND column_name='image'
    ) THEN
      UPDATE community_events ce
      SET image = COALESCE(ce.image, (to_jsonb(e)->>'image'))
      FROM events e
      WHERE ce.title = COALESCE(e.title, 'Evenement')
        AND ce.starts_at = COALESCE((to_jsonb(e)->>'date')::timestamptz, (to_jsonb(e)->>'starts_at')::timestamptz, now())
        AND COALESCE((to_jsonb(e)->>'image'), '') <> ''
        AND ce.image IS NULL;
    END IF;
  END IF;
END $$;

-- C2b) compat colonnes si tables legacy pre-existantes
DO $$
BEGIN
  IF to_regclass('public.event_registrations') IS NOT NULL THEN
    ALTER TABLE event_registrations
      ADD COLUMN IF NOT EXISTS member_id uuid,
      ADD COLUMN IF NOT EXISTS notes text,
      ADD COLUMN IF NOT EXISTS registered_at timestamptz DEFAULT now();

    -- Si une FK legacy pointe encore vers events, on la remplace vers community_events.
    ALTER TABLE event_registrations
      DROP CONSTRAINT IF EXISTS event_registrations_event_id_events_id_fk;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'event_registrations'
        AND column_name = 'event_id'
        AND data_type = 'uuid'
    ) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'event_registrations'
          AND c.conname = 'event_registrations_event_id_community_events_id_fk'
      ) THEN
        ALTER TABLE event_registrations
          ADD CONSTRAINT event_registrations_event_id_community_events_id_fk
          FOREIGN KEY (event_id) REFERENCES community_events(id) ON DELETE CASCADE;
      END IF;
    ELSE
      CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id_text
        ON event_registrations(event_id);
    END IF;
  END IF;

  IF to_regclass('public.event_presences') IS NOT NULL THEN
    ALTER TABLE event_presences
      ADD COLUMN IF NOT EXISTS registration_id uuid,
      ADD COLUMN IF NOT EXISTS member_id uuid,
      ADD COLUMN IF NOT EXISTS display_name text,
      ADD COLUMN IF NOT EXISTS is_registered boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS note text,
      ADD COLUMN IF NOT EXISTS validated_by text,
      ADD COLUMN IF NOT EXISTS validated_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS added_manually boolean NOT NULL DEFAULT false;

    ALTER TABLE event_presences
      DROP CONSTRAINT IF EXISTS event_presences_event_id_events_id_fk;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'event_presences'
        AND column_name = 'event_id'
        AND data_type = 'uuid'
    ) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        WHERE t.relname = 'event_presences'
          AND c.conname = 'event_presences_event_id_community_events_id_fk'
      ) THEN
        ALTER TABLE event_presences
          ADD CONSTRAINT event_presences_event_id_community_events_id_fk
          FOREIGN KEY (event_id) REFERENCES community_events(id) ON DELETE CASCADE;
      END IF;
    ELSE
      CREATE INDEX IF NOT EXISTS idx_event_presences_event_id_text
        ON event_presences(event_id);
    END IF;
  END IF;
END $$;

-- C3) event_registrations depuis legacy event_registrations
DO $$
BEGIN
  IF to_regclass('public.events') IS NOT NULL
     AND to_regclass('public.event_registrations') IS NOT NULL THEN
    INSERT INTO event_registrations (
      event_id, member_id, twitch_login, display_name, discord_id, discord_username, notes, registered_at
    )
    SELECT
      ce.id,
      m.id,
      (to_jsonb(er)->>'twitch_login'),
      COALESCE((to_jsonb(er)->>'display_name'), (to_jsonb(er)->>'twitch_login'), 'Membre'),
      (to_jsonb(er)->>'discord_id'),
      (to_jsonb(er)->>'discord_username'),
      (to_jsonb(er)->>'notes'),
      COALESCE((to_jsonb(er)->>'registered_at')::timestamptz, now())
    FROM event_registrations er
    JOIN events e
      ON (to_jsonb(e)->>'id') = (to_jsonb(er)->>'event_id')
    JOIN community_events ce
      ON ce.title = COALESCE(e.title, 'Evenement')
     AND ce.starts_at = COALESCE((to_jsonb(e)->>'date')::timestamptz, (to_jsonb(e)->>'starts_at')::timestamptz, now())
    LEFT JOIN members m
      ON lower(m.twitch_login) = lower((to_jsonb(er)->>'twitch_login'))
    WHERE COALESCE((to_jsonb(er)->>'twitch_login'), '') <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM event_registrations x
        WHERE (to_jsonb(x)->>'event_id') = ce.id::text
          AND lower((to_jsonb(x)->>'twitch_login')) = lower((to_jsonb(er)->>'twitch_login'))
      );
  END IF;
END $$;

-- C4) event_presences depuis legacy event_presences
DO $$
BEGIN
  IF to_regclass('public.events') IS NOT NULL
     AND to_regclass('public.event_presences') IS NOT NULL THEN
    INSERT INTO event_presences (
      event_id, registration_id, member_id, twitch_login, display_name,
      is_registered, present, note, validated_by, validated_at, added_manually
    )
    SELECT
      ce.id,
      reg.id,
      m.id,
      (to_jsonb(ep)->>'twitch_login'),
      COALESCE((to_jsonb(ep)->>'display_name'), (to_jsonb(ep)->>'twitch_login')),
      COALESCE(reg.id IS NOT NULL, false),
      COALESCE((to_jsonb(ep)->>'present')::boolean, true),
      (to_jsonb(ep)->>'note'),
      (to_jsonb(ep)->>'validated_by'),
      COALESCE((to_jsonb(ep)->>'validated_at')::timestamptz, now()),
      COALESCE((to_jsonb(ep)->>'added_manually')::boolean, false)
    FROM event_presences ep
    JOIN events e
      ON (to_jsonb(e)->>'id') = (to_jsonb(ep)->>'event_id')
    JOIN community_events ce
      ON ce.title = COALESCE(e.title, 'Evenement')
     AND ce.starts_at = COALESCE((to_jsonb(e)->>'date')::timestamptz, (to_jsonb(e)->>'starts_at')::timestamptz, now())
    LEFT JOIN members m
      ON lower(m.twitch_login) = lower((to_jsonb(ep)->>'twitch_login'))
    LEFT JOIN event_registrations reg
      ON (to_jsonb(reg)->>'event_id') = ce.id::text
     AND lower((to_jsonb(reg)->>'twitch_login')) = lower((to_jsonb(ep)->>'twitch_login'))
    WHERE COALESCE((to_jsonb(ep)->>'twitch_login'), '') <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM event_presences x
        WHERE (to_jsonb(x)->>'event_id') = ce.id::text
          AND lower((to_jsonb(x)->>'twitch_login')) = lower((to_jsonb(ep)->>'twitch_login'))
      );
  END IF;
END $$;

-- C5) event_proposals: si ancienne table existe deja, normalisation minimale
UPDATE event_proposals
SET
  category = COALESCE(NULLIF(category, ''), 'general'),
  status = COALESCE(NULLIF(status, ''), 'pending')
WHERE category IS NULL
   OR category = ''
   OR status IS NULL
   OR status = '';

-- ============================================================================
-- D) RAIDS
-- ============================================================================

-- D1) raids: hardening schema (certaines bases ont un schema partiel)
DO $$
BEGIN
  IF to_regclass('public.raids') IS NOT NULL THEN
    ALTER TABLE raids
      ADD COLUMN IF NOT EXISTS raid_date timestamptz,
      ADD COLUMN IF NOT EXISTS source_twitch_login text,
      ADD COLUMN IF NOT EXISTS target_twitch_login text,
      ADD COLUMN IF NOT EXISTS declared_by text,
      ADD COLUMN IF NOT EXISTS points_awarded integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS note text,
      ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- D2) raid_participants
DO $$
BEGIN
  IF to_regclass('public.raid_participants') IS NOT NULL THEN
    INSERT INTO raid_participants (raid_id, member_id, twitch_login, participation_type, points_awarded, created_at)
    SELECT
      rp.raid_id,
      m.id,
      (to_jsonb(rp)->>'twitch_login'),
      COALESCE((to_jsonb(rp)->>'participation_type'), 'viewer'),
      COALESCE((to_jsonb(rp)->>'points_awarded')::integer, 0),
      COALESCE((to_jsonb(rp)->>'created_at')::timestamptz, now())
    FROM raid_participants rp
    LEFT JOIN members m ON lower(m.twitch_login) = lower((to_jsonb(rp)->>'twitch_login'))
    WHERE rp.raid_id IS NOT NULL
      AND COALESCE((to_jsonb(rp)->>'twitch_login'), '') <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM raid_participants x
        WHERE x.raid_id = rp.raid_id
          AND lower(x.twitch_login) = lower((to_jsonb(rp)->>'twitch_login'))
      );
  END IF;
END $$;

-- ============================================================================
-- E) SPOTLIGHT
-- ============================================================================

-- E1) spotlights depuis legacy spotlights
DO $$
BEGIN
  IF to_regclass('public.spotlights') IS NOT NULL THEN
    ALTER TABLE spotlights
      ADD COLUMN IF NOT EXISTS streamer_member_id uuid,
      ADD COLUMN IF NOT EXISTS streamer_twitch_login text,
      ADD COLUMN IF NOT EXISTS streamer_display_name text,
      ADD COLUMN IF NOT EXISTS moderator_discord_id text,
      ADD COLUMN IF NOT EXISTS moderator_username text,
      ADD COLUMN IF NOT EXISTS starts_at timestamptz,
      ADD COLUMN IF NOT EXISTS ends_at timestamptz,
      ADD COLUMN IF NOT EXISTS status text,
      ADD COLUMN IF NOT EXISTS created_by text,
      ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

    -- Normalisation des colonnes legacy -> v2 sur la meme table.
    UPDATE spotlights
    SET
      starts_at = COALESCE(starts_at, (to_jsonb(spotlights)->>'started_at')::timestamptz, now()),
      streamer_twitch_login = COALESCE(streamer_twitch_login, (to_jsonb(spotlights)->>'twitch_login')),
      created_at = COALESCE(created_at, now())
    WHERE starts_at IS NULL
       OR streamer_twitch_login IS NULL;

    -- status peut etre text ou enum (spotlight_status) selon les environnements.
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'spotlights'
        AND column_name = 'status'
        AND udt_name = 'spotlight_status'
    ) THEN
      EXECUTE '
        UPDATE spotlights
        SET status = COALESCE(status, ''active''::spotlight_status)
        WHERE status IS NULL
      ';
    ELSE
      EXECUTE '
        UPDATE spotlights
        SET status = COALESCE(NULLIF(status, ''''), ''active'')
        WHERE status IS NULL
           OR status = ''''
      ';
    END IF;

    UPDATE spotlights s
    SET streamer_member_id = m.id
    FROM members m
    WHERE s.streamer_member_id IS NULL
      AND COALESCE(s.streamer_twitch_login, '') <> ''
      AND lower(m.twitch_login) = lower(s.streamer_twitch_login);
  END IF;
END $$;

-- E2) spotlight_attendance depuis spotlight_presences (legacy)
DO $$
BEGIN
  IF to_regclass('public.spotlight_presences') IS NOT NULL THEN
    INSERT INTO spotlight_attendance (spotlight_id, member_id, twitch_login, present, added_by, added_at)
    SELECT
      (to_jsonb(sp)->>'spotlight_id'),
      m.id,
      (to_jsonb(sp)->>'twitch_login'),
      true,
      (to_jsonb(sp)->>'added_by'),
      COALESCE((to_jsonb(sp)->>'added_at')::timestamptz, now())
    FROM spotlight_presences sp
    LEFT JOIN members m ON lower(m.twitch_login) = lower((to_jsonb(sp)->>'twitch_login'))
    WHERE COALESCE((to_jsonb(sp)->>'spotlight_id'), '') <> ''
      AND COALESCE((to_jsonb(sp)->>'twitch_login'), '') <> ''
    ON CONFLICT (spotlight_id, twitch_login) DO NOTHING;
  END IF;
END $$;

-- E3) spotlight_metrics depuis spotlight_evaluations (legacy)
DO $$
BEGIN
  IF to_regclass('public.spotlight_evaluations') IS NOT NULL THEN
    INSERT INTO spotlight_metrics (spotlight_id, metric_name, metric_value, metric_unit, measured_at, metadata)
    SELECT
      (to_jsonb(se)->>'spotlight_id'),
      'evaluation_total_score',
      COALESCE((to_jsonb(se)->>'total_score')::numeric, 0),
      'points',
      COALESCE((to_jsonb(se)->>'evaluated_at')::timestamptz, now()),
      jsonb_build_object(
        'max_score', (to_jsonb(se)->>'max_score')::numeric,
        'evaluated_by', (to_jsonb(se)->>'evaluated_by'),
        'validated', COALESCE((to_jsonb(se)->>'validated')::boolean, false)
      )
    FROM spotlight_evaluations se
    WHERE COALESCE((to_jsonb(se)->>'spotlight_id'), '') <> '';
  END IF;
END $$;

-- ============================================================================
-- F) EVALUATION
-- ============================================================================

-- F1) monthly_evaluations depuis evaluations (legacy)
DO $$
BEGIN
  IF to_regclass('public.evaluations') IS NOT NULL THEN
    INSERT INTO monthly_evaluations (
      month_key, member_id, twitch_login, calculated_by, calculated_at, total_points, status, created_at, updated_at
    )
    SELECT
      (to_jsonb(e)->>'month')::date,
      m.id,
      (to_jsonb(e)->>'twitch_login'),
      (to_jsonb(e)->>'calculated_by'),
      COALESCE((to_jsonb(e)->>'calculated_at')::timestamptz, now()),
      COALESCE((to_jsonb(e)->>'total_points')::integer, 0),
      'validated',
      COALESCE((to_jsonb(e)->>'created_at')::timestamptz, now()),
      COALESCE((to_jsonb(e)->>'updated_at')::timestamptz, now())
    FROM evaluations e
    LEFT JOIN members m ON lower(m.twitch_login) = lower((to_jsonb(e)->>'twitch_login'))
    WHERE (to_jsonb(e)->>'month') IS NOT NULL
      AND COALESCE((to_jsonb(e)->>'twitch_login'), '') <> ''
    ON CONFLICT (month_key, twitch_login) DO UPDATE
    SET total_points = EXCLUDED.total_points,
        calculated_by = EXCLUDED.calculated_by,
        calculated_at = EXCLUDED.calculated_at,
        updated_at = now();
  END IF;
END $$;

-- F2) evaluation_components seed (si vide)
INSERT INTO evaluation_components (code, label, max_points, category, is_active)
SELECT x.code, x.label, x.max_points, x.category, true
FROM (
  VALUES
    ('section_a_points', 'Section A', 100, 'core'),
    ('section_b_points', 'Section B', 100, 'core'),
    ('section_c_points', 'Section C', 100, 'core'),
    ('section_d_bonuses', 'Bonus section D', 100, 'bonus'),
    ('raid_points', 'Raids', 100, 'community'),
    ('spotlight_bonus', 'Bonus Spotlight', 100, 'community')
) AS x(code, label, max_points, category)
WHERE NOT EXISTS (
  SELECT 1 FROM evaluation_components ec WHERE ec.code = x.code
);

-- F3) evaluation_results depuis monthly_evaluations (si total_points present)
INSERT INTO evaluation_results (monthly_evaluation_id, final_score, decision, validated_by, validated_at, created_at)
SELECT
  me.id,
  me.total_points,
  CASE WHEN me.total_points >= 0 THEN 'accepted' ELSE 'review' END,
  COALESCE(me.calculated_by, 'system'),
  COALESCE(me.calculated_at, now()),
  now()
FROM monthly_evaluations me
WHERE NOT EXISTS (
  SELECT 1 FROM evaluation_results er WHERE er.monthly_evaluation_id = me.id
);

-- F4) member_progression calculee depuis monthly_evaluations
WITH ordered AS (
  SELECT
    me.member_id,
    me.month_key,
    me.total_points,
    lag(me.total_points) OVER (PARTITION BY me.member_id ORDER BY me.month_key) AS previous_score
  FROM monthly_evaluations me
  WHERE me.member_id IS NOT NULL
)
INSERT INTO member_progression (
  member_id, month_key, previous_score, current_score, delta_score, trend, metadata
)
SELECT
  o.member_id,
  o.month_key,
  o.previous_score,
  o.total_points,
  CASE WHEN o.previous_score IS NULL THEN NULL ELSE o.total_points - o.previous_score END,
  CASE
    WHEN o.previous_score IS NULL THEN 'stable'
    WHEN o.total_points > o.previous_score THEN 'up'
    WHEN o.total_points < o.previous_score THEN 'down'
    ELSE 'stable'
  END,
  jsonb_build_object('source', 'migration2')
FROM ordered o
WHERE NOT EXISTS (
  SELECT 1
  FROM member_progression mp
  WHERE mp.member_id = o.member_id
    AND mp.month_key = o.month_key
);

-- ============================================================================
-- G) RECOMPENSES
-- ============================================================================

-- G1) points_transactions seed depuis evaluations.total_points
DO $$
BEGIN
  IF to_regclass('public.evaluations') IS NOT NULL THEN
    INSERT INTO points_transactions (member_id, twitch_login, amount, transaction_type, source_type, source_id, reason, created_by, created_at)
    SELECT
      m.id,
      (to_jsonb(e)->>'twitch_login'),
      COALESCE((to_jsonb(e)->>'total_points')::integer, 0),
      'credit',
      'evaluation',
      COALESCE((to_jsonb(e)->>'id'), md5((to_jsonb(e)->>'twitch_login') || ':' || (to_jsonb(e)->>'month'))),
      'migration2_total_points',
      'system',
      COALESCE((to_jsonb(e)->>'calculated_at')::timestamptz, now())
    FROM evaluations e
    LEFT JOIN members m ON lower(m.twitch_login) = lower((to_jsonb(e)->>'twitch_login'))
    WHERE COALESCE((to_jsonb(e)->>'total_points')::integer, 0) <> 0
      AND NOT EXISTS (
        SELECT 1
        FROM points_transactions pt
        WHERE pt.source_type = 'evaluation'
          AND pt.source_id = COALESCE((to_jsonb(e)->>'id'), md5((to_jsonb(e)->>'twitch_login') || ':' || (to_jsonb(e)->>'month')))
      );
  END IF;
END $$;

-- G2) reward_catalog seed minimal
INSERT INTO reward_catalog (code, name, description, points_cost, is_active)
SELECT x.code, x.name, x.description, x.points_cost, true
FROM (
  VALUES
    ('spotlight_full', 'Spotlight complet', 'Passage Spotlight complet', 1000),
    ('channel_audit', 'Analyse de chaîne', 'Audit stream et recommandations', 700),
    ('social_boost', 'Mise en avant reseaux', 'Boost de visibilite reseaux TENF', 500)
) AS x(code, name, description, points_cost)
WHERE NOT EXISTS (
  SELECT 1 FROM reward_catalog rc WHERE rc.code = x.code
);

-- ============================================================================
-- H) STAFF
-- ============================================================================

-- H1) staff_members + staff_roles depuis members.role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='members' AND column_name='role'
  ) THEN
    INSERT INTO staff_members (member_id, twitch_login, discord_id, display_name, is_active, joined_at)
    SELECT
      m.id,
      m.twitch_login,
      m.discord_id,
      m.display_name,
      m.is_active,
      COALESCE(m.created_at, now())
    FROM members m
    WHERE m.role::text IN (
      'Admin', 'Admin Coordinateur', 'Admin Adjoint', 'Modérateur', 'Modérateur Junior', 'Mentor'
    )
    ON CONFLICT (twitch_login) DO NOTHING;

    INSERT INTO staff_roles (staff_member_id, role_name, scope, starts_at, assigned_by)
    SELECT
      sm.id::text,
      m.role::text,
      'global',
      COALESCE(m.created_at, now()),
      'migration2'
    FROM staff_members sm
    JOIN members m ON lower(m.twitch_login) = lower(sm.twitch_login)
    WHERE m.role::text IN (
      'Admin', 'Admin Coordinateur', 'Admin Adjoint', 'Modérateur', 'Modérateur Junior', 'Mentor'
    )
    ON CONFLICT (staff_member_id, role_name, starts_at) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- I) LOGS / SYSTEME
-- ============================================================================

-- I1) sync log d'execution
INSERT INTO sync_logs (sync_type, status, started_at, ended_at, duration_ms, details)
VALUES (
  'migration2_legacy_to_v2',
  'completed',
  now(),
  now(),
  0,
  jsonb_build_object('script', '0018_migration2_legacy_supabase_to_v2.sql')
);

-- I2) notification admin de fin de migration
INSERT INTO system_notifications (channel, title, message, level, audience, metadata)
VALUES (
  'admin',
  'Migration2 terminee',
  'La migration legacy -> v2 (script 0018) a ete executee.',
  'info',
  'admin',
  jsonb_build_object('script', '0018_migration2_legacy_supabase_to_v2.sql')
);
