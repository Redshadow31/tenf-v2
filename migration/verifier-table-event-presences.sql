-- Script pour vérifier la structure de la table event_presences
-- Exécutez ce script dans le SQL Editor de Supabase pour vérifier si la table existe et a la bonne structure

-- 1. Vérifier si la table existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'event_presences';

-- 2. Vérifier les colonnes de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'event_presences'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes (clés primaires, uniques, foreign keys)
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'event_presences';

-- 4. Compter les enregistrements (si la table existe)
SELECT COUNT(*) as total_presences FROM event_presences;
