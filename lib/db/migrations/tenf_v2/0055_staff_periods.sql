-- Périodes staff confirmées manuellement (Phase B pilotage)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS staff_periods jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN members.staff_periods IS 'Périodes staff confirmées (dates officielles, prioritaires sur la reconstruction auto)';
