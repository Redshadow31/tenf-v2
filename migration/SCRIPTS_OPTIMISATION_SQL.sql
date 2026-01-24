-- Scripts SQL pour optimiser les performances de la base de données
-- À exécuter dans le SQL Editor de Supabase

-- ============================================
-- INDEXES POUR OPTIMISER LES RECHERCHES
-- ============================================

-- Index sur members (recherches fréquentes)
CREATE INDEX IF NOT EXISTS idx_members_twitch_login ON members(twitch_login);
CREATE INDEX IF NOT EXISTS idx_members_discord_id ON members(discord_id);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_members_is_vip ON members(is_vip) WHERE is_vip = true;
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);

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
-- VUES MATÉRIALISÉES (Optionnel - pour les requêtes complexes)
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
-- FONCTIONS POUR OPTIMISER LES REQUÊTES
-- ============================================

-- Fonction pour obtenir les membres actifs avec pagination
CREATE OR REPLACE FUNCTION get_active_members(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  twitch_login text,
  display_name text,
  role text,
  is_vip boolean,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.twitch_login,
    m.display_name,
    m.role,
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
  id text,
  title text,
  description text,
  date timestamp,
  category text,
  location text,
  is_published boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.date,
    e.category,
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
-- ANALYSE DES TABLES (pour optimiser les statistiques)
-- ============================================

-- Analyser les tables pour mettre à jour les statistiques du planificateur
ANALYZE members;
ANALYZE events;
ANALYZE evaluations;
ANALYZE spotlights;
ANALYZE event_registrations;
ANALYZE event_presences;

-- ============================================
-- NOTES
-- ============================================

-- Pour rafraîchir les vues matérialisées :
-- REFRESH MATERIALIZED VIEW mv_active_members_stats;
-- REFRESH MATERIALIZED VIEW mv_upcoming_events;

-- Pour vérifier l'utilisation des index :
-- SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

-- Pour voir les requêtes lentes :
-- SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
