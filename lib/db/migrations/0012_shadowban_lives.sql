-- Ajout du flag shadowban lives (visible sur site, masque seulement /lives)
-- Idempotent

ALTER TABLE "members"
  ADD COLUMN IF NOT EXISTS "shadowban_lives" boolean DEFAULT false;
