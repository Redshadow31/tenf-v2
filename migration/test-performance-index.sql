-- Script pour tester les performances avant et après les index
-- À exécuter dans le SQL Editor de Supabase

-- ============================================
-- TEST 1 : Recherche par twitch_login
-- ============================================
-- Devrait utiliser idx_members_twitch_login après création
EXPLAIN ANALYZE
SELECT * FROM members
WHERE twitch_login = 'nexou31';

-- ============================================
-- TEST 2 : Filtrage des membres actifs
-- ============================================
-- Devrait utiliser idx_members_is_active après création
EXPLAIN ANALYZE
SELECT * FROM members
WHERE is_active = true
ORDER BY updated_at DESC
LIMIT 50;

-- ============================================
-- TEST 3 : Recherche d'évaluations par mois
-- ============================================
-- Devrait utiliser idx_evaluations_month_login après création
EXPLAIN ANALYZE
SELECT * FROM evaluations
WHERE month = '2024-01-01'
  AND twitch_login = 'nexou31';

-- ============================================
-- TEST 4 : Recherche d'événements publiés
-- ============================================
-- Devrait utiliser idx_events_is_published après création
EXPLAIN ANALYZE
SELECT * FROM events
WHERE is_published = true
ORDER BY date DESC
LIMIT 20;

-- ============================================
-- TEST 5 : Recherche de présences d'événement
-- ============================================
-- Devrait utiliser idx_event_presences_event_id après création
EXPLAIN ANALYZE
SELECT * FROM event_presences
WHERE event_id = 'event-123'
ORDER BY created_at DESC;

-- ============================================
-- TEST 6 : Recherche de spotlights par statut
-- ============================================
-- Devrait utiliser idx_spotlights_status après création
EXPLAIN ANALYZE
SELECT * FROM spotlights
WHERE status = 'active'
ORDER BY started_at DESC
LIMIT 1;

-- ============================================
-- TEST 7 : Recherche de VIP par mois
-- ============================================
-- Devrait utiliser idx_vip_history_month_login après création
EXPLAIN ANALYZE
SELECT * FROM vip_history
WHERE month = '2024-01-01'
  AND twitch_login = 'nexou31';

-- ============================================
-- NOTES
-- ============================================
-- Après avoir créé les index, vous devriez voir :
-- - "Index Scan using idx_..." au lieu de "Seq Scan"
-- - Temps d'exécution réduit de 50-80%
-- - Moins de lignes analysées
