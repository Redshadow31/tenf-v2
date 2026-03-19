"use client";

import React, { useState, useEffect } from "react";
import { LogCategory, LogLevel } from "@/lib/logging/logger";

interface StructuredLog {
  id?: string;
  timestamp: string;
  category: LogCategory;
  level: LogLevel;
  message: string;
  details?: any;
  userId?: string;
  route?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface LogStats {
  total: number;
  byCategory: Record<LogCategory, number>;
  byLevel: Record<LogLevel, number>;
  errors: number;
  warnings: number;
}

export default function StructuredLogsPage() {
  const [logs, setLogs] = useState<StructuredLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveLogins, setLiveLogins] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    category: '' as LogCategory | '',
    level: '' as LogLevel | '',
    search: '',
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.level) params.set('level', filters.level);
      params.set('limit', '100');

      const response = await fetch(`/api/admin/logs?${params.toString()}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();
      setLogs(data.logs || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters.category, filters.level]);

  useEffect(() => {
    const extractTwitchLogin = (log: StructuredLog): string | null => {
      const fromDetails = String(log.details?.twitchLogin || log.details?.twitch_login || "").trim().toLowerCase();
      if (/^[a-z0-9_]{3,25}$/.test(fromDetails)) return fromDetails;
      return null;
    };

    const logins = Array.from(new Set(logs.map(extractTwitchLogin).filter((value): value is string => Boolean(value))));
    if (logins.length === 0) {
      setLiveLogins(new Set());
      return;
    }

    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/twitch/streams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logins }),
        });
        if (!response.ok) {
          if (active) setLiveLogins(new Set());
          return;
        }
        const payload = await response.json();
        const streams = Array.isArray(payload?.streams) ? payload.streams : [];
        const next = new Set<string>(
          streams
            .map((stream: any) => String(stream?.userLogin || "").toLowerCase())
            .filter(Boolean)
        );
        if (active) setLiveLogins(next);
      } catch {
        if (active) setLiveLogins(new Set());
      }
    })();

    return () => {
      active = false;
    };
  }, [logs]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000); // Rafraîchir toutes les 5 secondes
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filters]);

  const clearLogs = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider tous les logs ?')) return;
    
    try {
      const response = await fetch('/api/admin/logs', { method: 'DELETE' });
      if (response.ok) {
        setLogs([]);
        setStats(null);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case LogLevel.WARN:
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case LogLevel.INFO:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case LogLevel.DEBUG:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getCategoryLabel = (category: LogCategory) => {
    const labels: Record<LogCategory, string> = {
      [LogCategory.AUTH]: '🔐 Auth',
      [LogCategory.MEMBER_ACTION]: '👤 Membre',
      [LogCategory.EVENT_ACTION]: '📅 Événement',
      [LogCategory.SPOTLIGHT_ACTION]: '⭐ Spotlight',
      [LogCategory.EVALUATION_ACTION]: '📊 Évaluation',
      [LogCategory.API_ROUTE]: '🌐 Route API',
      [LogCategory.API_ERROR]: '❌ Erreur API',
      [LogCategory.API_SUCCESS]: '✅ Succès API',
      [LogCategory.DATABASE]: '🗄️ Base de données',
      [LogCategory.CACHE]: '💾 Cache',
      [LogCategory.TWITCH]: '🎮 Twitch',
      [LogCategory.DISCORD]: '💬 Discord',
      [LogCategory.STORAGE]: '📦 Storage',
      [LogCategory.PERFORMANCE]: '⚡ Performance',
      [LogCategory.QUERY]: '🔍 Requête',
      [LogCategory.SECURITY]: '🔒 Sécurité',
      [LogCategory.RATE_LIMIT]: '⏱️ Rate Limit',
      [LogCategory.SYSTEM_TEST]: '🧪 Test Système',
    };
    return labels[category] || category;
  };

  const filteredLogs = logs.filter(log => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        log.message.toLowerCase().includes(search) ||
        log.category.toLowerCase().includes(search) ||
        log.route?.toLowerCase().includes(search) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(search)
      );
    }
    return true;
  });

  const extractTwitchLogin = (log: StructuredLog): string | null => {
    const fromDetails = String(log.details?.twitchLogin || log.details?.twitch_login || "").trim().toLowerCase();
    if (/^[a-z0-9_]{3,25}$/.test(fromDetails)) return fromDetails;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Logs Structurés
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Suivi des actions, routes et systèmes du site par catégories
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              autoRefresh ? 'bg-green-500/10 border-green-500/20' : ''
            }`}
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            {autoRefresh ? '🔄 Auto-actif' : '⏸️ Auto-pause'}
          </button>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-4 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            {loading ? 'Chargement...' : '🔄 Actualiser'}
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: '#dc2626',
              color: '#dc2626',
            }}
          >
            🗑️ Vider
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total</div>
            <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{stats.total}</div>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Erreurs</div>
            <div className="text-2xl font-bold mt-1 text-red-500">{stats.errors}</div>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Avertissements</div>
            <div className="text-2xl font-bold mt-1 text-yellow-500">{stats.warnings}</div>
          </div>
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Logs affichés</div>
            <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{filteredLogs.length}</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value as LogCategory | '' })}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          <option value="">Toutes les catégories</option>
          {Object.values(LogCategory).map(cat => (
            <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
          ))}
        </select>

        <select
          value={filters.level}
          onChange={(e) => setFilters({ ...filters, level: e.target.value as LogLevel | '' })}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          <option value="">Tous les niveaux</option>
          {Object.values(LogLevel).map(level => (
            <option key={level} value={level}>{level.toUpperCase()}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      {/* Liste des logs */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Aucun log trouvé
            </p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={log.id || index}
              className={`p-4 rounded-lg border ${getLevelColor(log.level)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{getCategoryLabel(log.category)}</span>
                    <span className="text-xs opacity-70">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </span>
                    {log.duration && (
                      <span className="text-xs opacity-70">
                        ({log.duration}ms)
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {log.message}
                  </p>
                  {(() => {
                    const twitchLogin = extractTwitchLogin(log);
                    if (!twitchLogin) return null;
                    const isLive = liveLogins.has(twitchLogin);
                    return (
                      <a
                        href={`https://twitch.tv/${twitchLogin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-2 text-xs text-violet-300 hover:text-violet-200"
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${isLive ? "bg-red-500" : "bg-gray-500"}`}
                          title={isLive ? "En live" : "Hors live"}
                          aria-hidden="true"
                        />
                        @{twitchLogin}
                        {isLive ? " (live)" : ""}
                      </a>
                    );
                  })()}
                  {log.route && (
                    <p className="text-xs mt-1 opacity-70">
                      Route: {log.route}
                    </p>
                  )}
                  {log.details && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer opacity-70">
                        Détails
                      </summary>
                      <pre className="text-xs mt-2 p-2 rounded bg-black/20 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${getLevelColor(log.level)}`}>
                  {log.level.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
