-- ============================================
-- MIGRATION DES RAIDS VERS SUPABASE
-- ============================================
-- Ce script crée la table raids et les fonctions SQL
-- pour calculer les statistiques de raids
--
-- ⚠️ IMPORTANT : Exécuter ce script dans l'ordre suivant :
-- 1. Créer la table raids
-- 2. Migrer les données depuis Netlify Blobs (script séparé)
-- 3. Créer les fonctions SQL
-- ============================================

-- ============================================
-- ÉTAPE 1 : CRÉER LA TABLE raids
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

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_raids_raider_discord_id ON raids(raider_discord_id);
CREATE INDEX IF NOT EXISTS idx_raids_target_discord_id ON raids(target_discord_id);
CREATE INDEX IF NOT EXISTS idx_raids_month_key ON raids(month_key);
CREATE INDEX IF NOT EXISTS idx_raids_timestamp ON raids(timestamp);
CREATE INDEX IF NOT EXISTS idx_raids_raider_twitch_login ON raids(raider_twitch_login);
CREATE INDEX IF NOT EXISTS idx_raids_target_twitch_login ON raids(target_twitch_login);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_raids_month_raider ON raids(month_key, raider_twitch_login);
CREATE INDEX IF NOT EXISTS idx_raids_month_target ON raids(month_key, target_twitch_login);

-- ============================================
-- ÉTAPE 2 : FONCTION SQL compute_raid_stats()
-- ============================================
-- Calcule les statistiques de raids par membre pour un mois donné
-- Retourne : twitch_login, raids_done, raids_received, total_points, targets

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
-- ÉTAPE 3 : FONCTION SQL compute_raid_stats_global()
-- ============================================
-- Calcule les statistiques globales (équivalent à ComputedRaidStats)
-- Retourne : JSONB avec toutes les stats globales

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
-- TESTS
-- ============================================
-- Pour tester les fonctions (après avoir migré les données) :

-- Test 1 : Stats par membre pour le mois en cours
-- SELECT * FROM compute_raid_stats();

-- Test 2 : Stats par membre pour un mois spécifique
-- SELECT * FROM compute_raid_stats('2024-01');

-- Test 3 : Stats globales pour le mois en cours
-- SELECT compute_raid_stats_global();

-- Test 4 : Stats globales pour un mois spécifique
-- SELECT compute_raid_stats_global('2024-01');
