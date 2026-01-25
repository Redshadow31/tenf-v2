-- ============================================
-- Script SQL pour ajouter les colonnes manquantes à la table evaluations
-- ============================================
-- Ce script doit être exécuté dans le SQL Editor de Supabase
-- pour corriger l'erreur 502 lors de la migration des évaluations
-- ============================================

-- Ajouter la colonne raid_points_manual (points manuels pour les raids)
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS raid_points_manual INTEGER;

-- Ajouter la colonne raid_notes (notes sur les raids)
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS raid_notes JSONB;

-- Ajouter la colonne final_note (note finale manuelle)
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS final_note INTEGER;

-- Ajouter la colonne final_note_saved_at (date de sauvegarde de la note finale)
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS final_note_saved_at TIMESTAMP;

-- Ajouter la colonne final_note_saved_by (Discord ID de celui qui a sauvegardé la note finale)
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS final_note_saved_by TEXT;

-- Ajouter la contrainte unique sur (twitch_login, month) si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'evaluations_twitch_login_month_unique'
    ) THEN
        ALTER TABLE "evaluations" 
        ADD CONSTRAINT "evaluations_twitch_login_month_unique" 
        UNIQUE("twitch_login", "month");
    END IF;
END $$;

-- ============================================
-- Vérification : Lister toutes les colonnes de la table evaluations
-- ============================================
-- Exécuter cette requête pour vérifier que toutes les colonnes sont présentes :
-- 
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'evaluations'
-- ORDER BY ordinal_position;
-- ============================================
