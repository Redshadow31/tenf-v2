-- ============================================
-- TOUS LES SCRIPTS SQL À INTÉGRER DANS SUPABASE
-- ============================================
-- Date : $(date)
-- 
-- ⚠️ IMPORTANT : Exécuter ce script dans l'ordre suivant :
-- 1. Index SQL (pour optimiser les performances)
-- 2. Table raids (si migration des raids prévue)
-- 3. Fonctions SQL (calculs et agrégations)
-- ============================================

-- ============================================
-- PARTIE 1 : INDEX SQL (OPTIMISATION)
-- ============================================

-- Index sur members (recherches fréquentes)
CREATE INDEX IF NOT EXISTS idx_members_twitch_login ON members(twitch_login);
CREATE INDEX IF NOT EXISTS idx_members_discord_id ON members(discord_id);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_members_is_vip ON members(is_vip) WHERE is_vip = true;
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
CREATE INDEX IF NOT EXISTS idx_members_updated_at ON members(updated_at);

-- Index composite pour les recherches combinées
CREATE INDEX IF NOT EXISTS idx_members_active_role ON members(is_active, role) WHERE is_active = true;

-- Index sur events (recherches par date et statut)
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_date_published ON events(date, is_published) WHERE is_published = true;

-- Index sur evaluations (recherches par mois et membre)
CREATE INDEX IF NOT EXISTS idx_evaluations_month ON evaluations(month);
CREATE INDEX IF NOT EXISTS idx_evaluations_twitch_login ON evaluations(twitch_login);
CREATE INDEX IF NOT EXISTS idx_evaluations_month_login ON evaluations(month, twitch_login);

-- Index sur spotlights (recherches par date)
CREATE INDEX IF NOT EXISTS idx_spotlights_started_at ON spotlights(started_at);
CREATE INDEX IF NOT EXISTS idx_spotlights_status ON spotlights(status);
CREATE INDEX IF NOT EXISTS idx_spotlights_streamer ON spotlights(streamer_twitch_login);

-- Index sur event_registrations (recherches par événement)
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_twitch_login ON event_registrations(twitch_login);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_login ON event_registrations(event_id, twitch_login);

-- Index sur event_presences (recherches par événement)
CREATE INDEX IF NOT EXISTS idx_event_presences_event_id ON event_presences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_presences_twitch_login ON event_presences(twitch_login);
CREATE INDEX IF NOT EXISTS idx_event_presences_event_login ON event_presences(event_id, twitch_login);

-- Index sur spotlight_presences (recherches par spotlight)
CREATE INDEX IF NOT EXISTS idx_spotlight_presences_spotlight_id ON spotlight_presences(spotlight_id);
CREATE INDEX IF NOT EXISTS idx_spotlight_presences_twitch_login ON spotlight_presences(twitch_login);

-- Index sur vip_history (recherches par mois)
CREATE INDEX IF NOT EXISTS idx_vip_history_month ON vip_history(month);
CREATE INDEX IF NOT EXISTS idx_vip_history_twitch_login ON vip_history(twitch_login);
CREATE INDEX IF NOT EXISTS idx_vip_history_month_login ON vip_history(month, twitch_login);

-- ============================================
-- PARTIE 2 : TABLE raids (SI MIGRATION DES RAIDS)
-- ============================================

CREATE TABLE IF NOT EXISTS raids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raider_discord_id TEXT NOT NULL,
  raider_twitch_login TEXT,
  target_discord_id TEXT NOT NULL,
  target_twitch_login TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  source TEXT CHECK (source IN ('discord', 'twitch-live', 'manual', 'bot', 'admin')),
  message_id TEXT,
  month_key TEXT NOT NULL, -- Format: 'YYYY-MM'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les requêtes raids
CREATE INDEX IF NOT EXISTS idx_raids_raider_discord_id ON raids(raider_discord_id);
CREATE INDEX IF NOT EXISTS idx_raids_target_discord_id ON raids(target_discord_id);
CREATE INDEX IF NOT EXISTS idx_raids_month_key ON raids(month_key);
CREATE INDEX IF NOT EXISTS idx_raids_timestamp ON raids(timestamp);
CREATE INDEX IF NOT EXISTS idx_raids_raider_twitch_login ON raids(raider_twitch_login);
CREATE INDEX IF NOT EXISTS idx_raids_target_twitch_login ON raids(target_twitch_login);
CREATE INDEX IF NOT EXISTS idx_raids_month_raider ON raids(month_key, raider_twitch_login);
CREATE INDEX IF NOT EXISTS idx_raids_month_target ON raids(month_key, target_twitch_login);

-- ============================================
-- PARTIE 3 : FONCTIONS SQL POUR LES CALCULS
-- ============================================

-- ============================================
-- 3.1 : FONCTION compute_raid_stats()
-- ============================================
-- Calcule les statistiques de raids par membre pour un mois donné
-- Équivalent à lib/computeRaidStats.ts

CREATE OR REPLACE FUNCTION compute_raid_stats(
  p_month_key TEXT DEFAULT NULL -- Format: 'YYYY-MM' ou NULL pour le mois en cours
)
RETURNS TABLE (
  twitch_login TEXT,
  raids_done INTEGER,
  raids_received INTEGER,
  total_points INTEGER,
  targets JSONB -- Détail des raids vers chaque cible { "twitch_login": count }
) AS $$
DECLARE
  v_month_key TEXT;
BEGIN
  -- Déterminer le mois à utiliser
  IF p_month_key IS NULL THEN
    v_month_key := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  ELSE
    v_month_key := p_month_key;
  END IF;

  -- Calculer les stats par membre (via Twitch login)
  RETURN QUERY
  WITH raid_counts AS (
    SELECT
      COALESCE(r.raider_twitch_login, m_raider.twitch_login) as raider_login,
      COALESCE(r.target_twitch_login, m_target.twitch_login) as target_login,
      COUNT(*) as raid_count
    FROM raids r
    LEFT JOIN members m_raider ON m_raider.discord_id = r.raider_discord_id
    LEFT JOIN members m_target ON m_target.discord_id = r.target_discord_id
    WHERE r.month_key = v_month_key
    GROUP BY raider_login, target_login
  ),
  raids_done_stats AS (
    SELECT
      raider_login as twitch_login,
      SUM(raid_count) as total_done,
      jsonb_object_agg(
        target_login,
        raid_count
      ) FILTER (WHERE target_login IS NOT NULL) as targets_json
    FROM raid_counts
    WHERE raider_login IS NOT NULL
    GROUP BY raider_login
  ),
  raids_received_stats AS (
    SELECT
      target_login as twitch_login,
      SUM(raid_count) as total_received
    FROM raid_counts
    WHERE target_login IS NOT NULL
    GROUP BY target_login
  )
  SELECT
    COALESCE(done.twitch_login, received.twitch_login) as twitch_login,
    COALESCE(done.total_done, 0)::INTEGER as raids_done,
    COALESCE(received.total_received, 0)::INTEGER as raids_received,
    -- Calcul des points selon la logique métier
    -- 0 raid = 0 point, 1-2 = 1 point, 3 = 2 points, 4 = 3 points, 5 = 4 points, 6+ = 5 points
    CASE
      WHEN COALESCE(done.total_done, 0) = 0 THEN 0
      WHEN COALESCE(done.total_done, 0) BETWEEN 1 AND 2 THEN 1
      WHEN COALESCE(done.total_done, 0) = 3 THEN 2
      WHEN COALESCE(done.total_done, 0) = 4 THEN 3
      WHEN COALESCE(done.total_done, 0) = 5 THEN 4
      WHEN COALESCE(done.total_done, 0) >= 6 THEN 5
      ELSE 0
    END::INTEGER as total_points,
    COALESCE(done.targets_json, '{}'::jsonb) as targets
  FROM raids_done_stats done
  FULL OUTER JOIN raids_received_stats received ON done.twitch_login = received.twitch_login
  ORDER BY raids_done DESC, raids_received DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3.2 : FONCTION compute_raid_stats_global()
-- ============================================
-- Calcule les statistiques globales (équivalent à ComputedRaidStats)

CREATE OR REPLACE FUNCTION compute_raid_stats_global(
  p_month_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_month_key TEXT;
  v_stats JSONB;
BEGIN
  -- Déterminer le mois à utiliser
  IF p_month_key IS NULL THEN
    v_month_key := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  ELSE
    v_month_key := p_month_key;
  END IF;

  -- Calculer les stats globales
  WITH stats AS (
    SELECT * FROM compute_raid_stats(v_month_key)
  ),
  totals AS (
    SELECT
      SUM(raids_done) as total_done,
      SUM(raids_received) as total_received,
      COUNT(DISTINCT twitch_login) FILTER (WHERE raids_done > 0) as active_raiders_count,
      COUNT(DISTINCT twitch_login) FILTER (WHERE raids_received > 0) as unique_targets_count
    FROM stats
  ),
  top_raider AS (
    SELECT
      twitch_login as name,
      raids_done as count
    FROM stats
    WHERE raids_done > 0
    ORDER BY raids_done DESC
    LIMIT 1
  ),
  top_target AS (
    SELECT
      twitch_login as name,
      raids_received as count
    FROM stats
    WHERE raids_received > 0
    ORDER BY raids_received DESC
    LIMIT 1
  ),
  alerts AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'raider', twitch_login,
          'target', key,
          'count', value::INTEGER
        )
      ) as alerts_array
    FROM stats,
    jsonb_each_text(targets) as target_data
    WHERE value::INTEGER >= 3
  )
  SELECT
    jsonb_build_object(
      'totalDone', totals.total_done,
      'totalReceived', totals.total_received,
      'unmatchedCount', 0, -- À calculer séparément si nécessaire
      'activeRaidersCount', totals.active_raiders_count,
      'uniqueTargetsCount', totals.unique_targets_count,
      'topRaider', CASE WHEN top_raider.name IS NOT NULL THEN jsonb_build_object('name', top_raider.name, 'count', top_raider.count) ELSE NULL END,
      'topTarget', CASE WHEN top_target.name IS NOT NULL THEN jsonb_build_object('name', top_target.name, 'count', top_target.count) ELSE NULL END,
      'alerts', COALESCE(alerts.alerts_array, '[]'::jsonb)
    )
  INTO v_stats
  FROM totals
  LEFT JOIN top_raider ON true
  LEFT JOIN top_target ON true
  LEFT JOIN alerts ON true;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3.3 : FONCTION calculate_spotlight_points()
-- ============================================
-- Calcule les points Spotlight selon la logique :
-- Points = (nombre de présences / nombre total de spotlights) * 5, arrondi
-- Équivalent à lib/evaluationSynthesisHelpers.ts::calculateSpotlightPoints()

CREATE OR REPLACE FUNCTION calculate_spotlight_points(
  p_presences INTEGER,
  p_total_spotlights INTEGER
)
RETURNS INTEGER AS $$
BEGIN
  IF p_total_spotlights = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((p_presences::NUMERIC / p_total_spotlights::NUMERIC) * 5);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 3.4 : FONCTION calculate_raid_points()
-- ============================================
-- Calcule les points Raids selon la logique :
-- 0 raid = 0 point, 1-2 = 1 point, 3 = 2 points, 4 = 3 points, 5 = 4 points, 6+ = 5 points
-- Équivalent à lib/evaluationSynthesisHelpers.ts::calculateRaidPoints()

CREATE OR REPLACE FUNCTION calculate_raid_points(
  p_raids_done INTEGER
)
RETURNS INTEGER AS $$
BEGIN
  IF p_raids_done = 0 THEN
    RETURN 0;
  ELSIF p_raids_done BETWEEN 1 AND 2 THEN
    RETURN 1;
  ELSIF p_raids_done = 3 THEN
    RETURN 2;
  ELSIF p_raids_done = 4 THEN
    RETURN 3;
  ELSIF p_raids_done = 5 THEN
    RETURN 4;
  ELSIF p_raids_done >= 6 THEN
    RETURN 5;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 3.5 : FONCTION calculate_total_hors_bonus()
-- ============================================
-- Calcule le total hors bonus
-- Spotlight (/5) + Raids (/5) + Discord (/5) + Events (/2 converti en /5) + Follow (/5) = /25
-- Équivalent à lib/evaluationSynthesisHelpers.ts::calculateTotalHorsBonus()

CREATE OR REPLACE FUNCTION calculate_total_hors_bonus(
  p_spotlight INTEGER, -- /5
  p_raids INTEGER, -- /5
  p_discord INTEGER, -- /5
  p_events INTEGER, -- /2
  p_follow INTEGER -- /5
)
RETURNS JSONB AS $$
DECLARE
  v_events_normalized NUMERIC;
  v_total NUMERIC;
  v_max INTEGER := 25;
BEGIN
  -- Convertir Events de /2 à /5 proportionnellement
  v_events_normalized := (p_events::NUMERIC / 2.0) * 5.0;
  
  -- Total = 5 + 5 + 5 + 5 + 5 = 25
  v_total := p_spotlight + p_raids + p_discord + v_events_normalized + p_follow;
  
  RETURN jsonb_build_object(
    'total', ROUND(v_total),
    'max', v_max,
    'eventsNormalized', ROUND(v_events_normalized, 2)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 3.6 : FONCTION calculate_bonus_total()
-- ============================================
-- Calcule le total des bonus pour un membre
-- Équivalent à lib/evaluationBonusHelpers.ts::calculateBonusTotal()

CREATE OR REPLACE FUNCTION calculate_bonus_total(
  p_timezone_bonus_enabled BOOLEAN,
  p_moderation_bonus INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_timezone_bonus INTEGER := 0;
  v_timezone_bonus_points INTEGER := 2; -- Constante TIMEZONE_BONUS_POINTS
  v_moderation_bonus INTEGER;
  v_total INTEGER;
BEGIN
  -- Calcul du bonus décalage horaire
  IF p_timezone_bonus_enabled THEN
    v_timezone_bonus := v_timezone_bonus_points;
  END IF;
  
  -- Bonus modération
  v_moderation_bonus := COALESCE(p_moderation_bonus, 0);
  
  -- Total
  v_total := v_timezone_bonus + v_moderation_bonus;
  
  RETURN jsonb_build_object(
    'timezoneBonus', v_timezone_bonus,
    'moderationBonus', v_moderation_bonus,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 3.7 : FONCTION get_evaluation_bonus()
-- ============================================
-- Récupère et calcule les bonus d'évaluation pour un membre et un mois
-- Utilise les données de la table evaluations

CREATE OR REPLACE FUNCTION get_evaluation_bonus(
  p_month DATE,
  p_twitch_login TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_eval RECORD;
  v_bonus JSONB;
BEGIN
  -- Récupérer l'évaluation
  SELECT 
    timezone_bonus_enabled,
    moderation_bonus
  INTO v_eval
  FROM evaluations
  WHERE month = p_month
    AND twitch_login = p_twitch_login;
  
  -- Si pas d'évaluation, retourner des valeurs par défaut
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'timezoneBonus', 0,
      'moderationBonus', 0,
      'total', 0
    );
  END IF;
  
  -- Calculer les bonus
  SELECT calculate_bonus_total(
    COALESCE(v_eval.timezone_bonus_enabled, false),
    COALESCE(v_eval.moderation_bonus, 0)
  ) INTO v_bonus;
  
  RETURN v_bonus;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTIE 4 : VUES MATÉRIALISÉES (OPTIONNEL)
-- ============================================

-- Vue matérialisée pour les statistiques des membres actifs
-- (À rafraîchir périodiquement, ex: toutes les heures)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_active_members_stats AS
SELECT
  COUNT(*) as total_active,
  COUNT(*) FILTER (WHERE is_vip = true) as total_vip,
  COUNT(*) FILTER (WHERE role = 'Admin') as total_admins
FROM members
WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_active_members_stats ON mv_active_members_stats(total_active);

-- Vue matérialisée pour les événements à venir
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_upcoming_events AS
SELECT
  id,
  title,
  date,
  category,
  location,
  is_published
FROM events
WHERE date >= CURRENT_DATE
  AND is_published = true
ORDER BY date ASC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_upcoming_events ON mv_upcoming_events(id);

-- ============================================
-- PARTIE 5 : FONCTIONS POUR OPTIMISER LES REQUÊTES
-- ============================================

-- Fonction pour obtenir les membres actifs avec pagination
CREATE OR REPLACE FUNCTION get_active_members(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  twitch_login TEXT,
  display_name TEXT,
  role TEXT,
  is_vip BOOLEAN,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.twitch_login,
    m.display_name,
    m.role::TEXT,
    m.is_vip,
    m.is_active
  FROM members m
  WHERE m.is_active = true
  ORDER BY m.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les événements publiés avec pagination
CREATE OR REPLACE FUNCTION get_published_events(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  date TIMESTAMP,
  category TEXT,
  location TEXT,
  is_published BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.date,
    e.category::TEXT,
    e.location,
    e.is_published
  FROM events e
  WHERE e.is_published = true
  ORDER BY e.date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTIE 6 : ANALYSE DES TABLES
-- ============================================
-- Analyser les tables pour mettre à jour les statistiques du planificateur

ANALYZE members;
ANALYZE events;
ANALYZE evaluations;
ANALYZE spotlights;
ANALYZE event_registrations;
ANALYZE event_presences;
ANALYZE spotlight_presences;
ANALYZE vip_history;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- 
-- Pour tester les fonctions :
-- 
-- 1. Stats raids par membre :
--    SELECT * FROM compute_raid_stats('2024-01');
-- 
-- 2. Stats raids globales :
--    SELECT compute_raid_stats_global('2024-01');
-- 
-- 3. Points Spotlight :
--    SELECT calculate_spotlight_points(3, 5); -- 3 présences sur 5 spotlights = 3 points
-- 
-- 4. Points Raids :
--    SELECT calculate_raid_points(4); -- 4 raids = 3 points
-- 
-- 5. Total hors bonus :
--    SELECT calculate_total_hors_bonus(5, 3, 4, 2, 3);
-- 
-- 6. Bonus total :
--    SELECT calculate_bonus_total(true, 3); -- timezone bonus activé + 3 points modération = 5 total
-- 
-- 7. Bonus d'évaluation :
--    SELECT get_evaluation_bonus('2024-01-01'::DATE, 'nexou31');
-- 
-- 8. Membres actifs :
--    SELECT * FROM get_active_members(10, 0);
-- 
-- 9. Événements publiés :
--    SELECT * FROM get_published_events(10, 0);
-- 
-- ============================================
