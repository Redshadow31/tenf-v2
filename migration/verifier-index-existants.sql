-- Script pour vérifier les index existants avant d'appliquer les nouveaux
-- À exécuter dans le SQL Editor de Supabase

-- Vérifier tous les index sur les tables principales
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN (
        'members',
        'events',
        'evaluations',
        'spotlights',
        'event_registrations',
        'event_presences',
        'spotlight_presences',
        'vip_history'
    )
ORDER BY
    tablename, indexname;

-- Compter les index par table
SELECT
    tablename,
    COUNT(*) as index_count
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN (
        'members',
        'events',
        'evaluations',
        'spotlights',
        'event_registrations',
        'event_presences',
        'spotlight_presences',
        'vip_history'
    )
GROUP BY
    tablename
ORDER BY
    tablename;

-- Vérifier spécifiquement les index que nous allons créer
SELECT
    tablename,
    indexname,
    CASE
        WHEN indexname LIKE 'idx_%' THEN '✅ Index personnalisé'
        ELSE '⚠️ Index système'
    END as index_type
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN (
        'members',
        'events',
        'evaluations',
        'spotlights',
        'event_registrations',
        'event_presences',
        'spotlight_presences',
        'vip_history'
    )
    AND indexname LIKE 'idx_%'
ORDER BY
    tablename, indexname;
