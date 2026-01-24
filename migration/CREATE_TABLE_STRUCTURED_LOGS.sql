-- Migration: Création de la table structured_logs
-- Date: 2025-01-08
-- Description: Table pour stocker les logs structurés du système de logging

CREATE TABLE IF NOT EXISTS structured_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  actor_discord_id TEXT,
  actor_role TEXT,
  resource_type TEXT,
  resource_id TEXT,
  route TEXT,
  duration_ms INTEGER,
  status_code INTEGER
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_structured_logs_timestamp ON structured_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_structured_logs_category ON structured_logs(category);
CREATE INDEX IF NOT EXISTS idx_structured_logs_level ON structured_logs(level);
CREATE INDEX IF NOT EXISTS idx_structured_logs_actor_discord_id ON structured_logs(actor_discord_id);
CREATE INDEX IF NOT EXISTS idx_structured_logs_resource_type ON structured_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_structured_logs_route ON structured_logs(route);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_structured_logs_category_level ON structured_logs(category, level);
CREATE INDEX IF NOT EXISTS idx_structured_logs_timestamp_category ON structured_logs(timestamp DESC, category);

-- Commentaires
COMMENT ON TABLE structured_logs IS 'Table pour stocker les logs structurés du système de logging';
COMMENT ON COLUMN structured_logs.category IS 'Catégorie du log (ex: api_route, member_action, etc.)';
COMMENT ON COLUMN structured_logs.level IS 'Niveau du log (debug, info, warn, error)';
COMMENT ON COLUMN structured_logs.message IS 'Message du log';
COMMENT ON COLUMN structured_logs.details IS 'Détails supplémentaires en JSON';
COMMENT ON COLUMN structured_logs.actor_discord_id IS 'Discord ID de l''acteur (admin) qui a initié l''action';
COMMENT ON COLUMN structured_logs.actor_role IS 'Rôle de l''acteur';
COMMENT ON COLUMN structured_logs.resource_type IS 'Type de ressource affectée (ex: member, event)';
COMMENT ON COLUMN structured_logs.resource_id IS 'ID de la ressource affectée';
COMMENT ON COLUMN structured_logs.route IS 'Route API concernée';
COMMENT ON COLUMN structured_logs.duration_ms IS 'Durée de l''opération en millisecondes';
COMMENT ON COLUMN structured_logs.status_code IS 'Code HTTP de la réponse';
