-- Marquer tous les membres existants comme validés (rétrocompatibilité)
-- Les nouveaux membres devront soumettre leur profil et attendre la validation admin
UPDATE "members" SET "profile_validation_status" = 'valide' WHERE "profile_validation_status" = 'non_soumis';
