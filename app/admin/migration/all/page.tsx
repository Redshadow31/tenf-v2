"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Database, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

interface SyncStatus {
  type: 'events' | 'evaluations' | 'follows' | 'members';
  label: string;
  inBlobs: number;
  inSupabase: number;
  missing: number;
  status: 'synced' | 'partial' | 'missing';
  error?: string;
}

interface MigrationResult {
  success: boolean;
  message: string;
  results: {
    events?: { migrated: number; skipped: number; errors: number };
    evaluations?: { migrated: number; skipped: number; errors: number };
    follows?: { migrated: number; skipped: number; errors: number };
    members?: { migrated: number; skipped: number; errors: number };
  };
  errors?: string[];
  error?: string;
}

export default function AllMigrationPage() {
  const [loading, setLoading] = useState(false);
  const [checkingSync, setCheckingSync] = useState(false);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const checkSync = async () => {
    setCheckingSync(true);
    setError(null);
    setSyncStatuses([]);
    setSelectedTypes(new Set());
    setMigrationResult(null);

    try {
      const response = await fetch('/api/admin/migration/check-sync-all', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        const statuses: SyncStatus[] = [];
        
        // Events
        if (data.data.events) {
          const events = data.data.events;
          const missing = events.missingInSupabase?.length || 0;
          statuses.push({
            type: 'events',
            label: 'Événements',
            inBlobs: events.inBlobs || 0,
            inSupabase: events.inSupabase || 0,
            missing,
            status: missing === 0 ? 'synced' : missing < events.inBlobs ? 'partial' : 'missing',
          });
        }

        // Evaluations
        if (data.data.evaluations) {
          const evaluations = data.data.evaluations;
          const missing = evaluations.missingInSupabase?.length || 0;
          statuses.push({
            type: 'evaluations',
            label: 'Évaluations',
            inBlobs: evaluations.inBlobs || 0,
            inSupabase: evaluations.inSupabase || 0,
            missing,
            status: missing === 0 ? 'synced' : missing < evaluations.inBlobs ? 'partial' : 'missing',
          });
        }

        // Follows
        if (data.data.follows) {
          const follows = data.data.follows;
          const missing = follows.missingInSupabase?.length || 0;
          statuses.push({
            type: 'follows',
            label: 'Validations Follow',
            inBlobs: follows.inBlobs || 0,
            inSupabase: follows.inSupabase || 0,
            missing,
            status: missing === 0 ? 'synced' : missing < follows.inBlobs ? 'partial' : 'missing',
          });
        }

        // Members
        if (data.data.members) {
          const members = data.data.members;
          const missing = members.missingInSupabase?.length || 0;
          statuses.push({
            type: 'members',
            label: 'Membres',
            inBlobs: members.totalInBlobs || members.inBlobs || 0,
            inSupabase: members.totalInSupabase || members.inSupabase || 0,
            missing,
            status: missing === 0 ? 'synced' : missing < (members.totalInBlobs || members.inBlobs || 0) ? 'partial' : 'missing',
          });
        }

        setSyncStatuses(statuses);
        
        // Sélectionner automatiquement les types avec des données manquantes
        const typesWithMissing = statuses
          .filter(s => s.missing > 0)
          .map(s => s.type);
        setSelectedTypes(new Set(typesWithMissing));
      } else {
        throw new Error(data.error || 'Erreur lors de la vérification');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setCheckingSync(false);
    }
  };

  const runMigration = async () => {
    if (selectedTypes.size === 0) {
      setError('Veuillez sélectionner au moins un type de données à migrer');
      return;
    }

    setLoading(true);
    setError(null);
    setMigrationResult(null);

    try {
      const response = await fetch('/api/admin/migration/migrate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          types: Array.from(selectedTypes),
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setMigrationResult(data);
      
      if (data.success) {
        // Recharger la synchronisation après migration
        await checkSync();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allTypes = syncStatuses.filter(s => s.missing > 0).map(s => s.type);
    setSelectedTypes(new Set(allTypes));
  };

  const deselectAll = () => {
    setSelectedTypes(new Set());
  };

  const getStatusIcon = (status: SyncStatus['status']) => {
    switch (status) {
      case 'synced':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: SyncStatus['status']) => {
    switch (status) {
      case 'synced':
        return 'bg-green-500/20 border-green-500';
      case 'partial':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'missing':
        return 'bg-red-500/20 border-red-500';
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin/control-center"
            className="inline-flex items-center gap-2 text-sm mb-4 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Centre de contrôle
          </Link>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Migration Globale - Tous les Blobs vers Supabase
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Migrer toutes les données depuis Netlify Blobs vers Supabase en une seule fois
          </p>
        </div>

        {/* Bouton de vérification */}
        <div className="mb-6">
          <button
            onClick={checkSync}
            disabled={checkingSync}
            className="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: checkingSync ? 'var(--color-surface)' : '#9146ff',
              color: 'white',
            }}
          >
            {checkingSync ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Vérification en cours...
              </span>
            ) : (
              'Vérifier la synchronisation'
            )}
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: '#ef444420', borderColor: '#ef4444', color: '#ef4444' }}>
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {/* Statuts de synchronisation */}
        {syncStatuses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              État de la synchronisation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syncStatuses.map((status) => (
                <div
                  key={status.type}
                  className={`rounded-lg border p-6 ${getStatusColor(status.status)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status.status)}
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                        {status.label}
                      </h3>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTypes.has(status.type)}
                        onChange={() => toggleType(status.type)}
                        disabled={status.missing === 0}
                        className="w-5 h-5 rounded border mr-2"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Migrer
                      </span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Dans Blobs :</span>
                      <span style={{ color: 'var(--color-text)' }}>{status.inBlobs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Dans Supabase :</span>
                      <span style={{ color: 'var(--color-text)' }}>{status.inSupabase}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Manquants :</span>
                      <span style={{ color: status.missing > 0 ? '#ef4444' : '#10b981' }}>
                        {status.missing}
                      </span>
                    </div>
                  </div>
                  {status.missing === 0 && (
                    <div className="mt-4 text-xs" style={{ color: '#10b981' }}>
                      ✓ Synchronisé
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={selectAll}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                Tout sélectionner
              </button>
              <button
                onClick={deselectAll}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                Tout désélectionner
              </button>
              <button
                onClick={runMigration}
                disabled={loading || selectedTypes.size === 0}
                className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: loading || selectedTypes.size === 0 ? 'var(--color-surface)' : '#10b981',
                  color: 'white',
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Migration en cours...
                  </span>
                ) : (
                  `Migrer ${selectedTypes.size} type(s) sélectionné(s)`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Résultat de la migration */}
        {migrationResult && (
          <div className={`mb-6 p-6 rounded-lg border ${migrationResult.success ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}>
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              {migrationResult.success ? '✓ Migration réussie' : '✗ Erreur lors de la migration'}
            </h3>
            <p className="mb-4" style={{ color: 'var(--color-text)' }}>
              {migrationResult.message}
            </p>
            {migrationResult.results && (
              <div className="space-y-2">
                {Object.entries(migrationResult.results).map(([type, result]: [string, any]) => (
                  <div key={type} className="text-sm">
                    <strong style={{ color: 'var(--color-text)' }}>{type} :</strong>{' '}
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {result.migrated} migré(s), {result.skipped} ignoré(s), {result.errors} erreur(s)
                    </span>
                  </div>
                ))}
              </div>
            )}
            {migrationResult.errors && migrationResult.errors.length > 0 && (
              <div className="mt-4">
                <strong style={{ color: 'var(--color-text)' }}>Erreurs :</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {migrationResult.errors.map((err, idx) => (
                    <li key={idx} className="text-sm" style={{ color: '#ef4444' }}>
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Liens vers les migrations individuelles */}
        <div className="mt-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Migrations individuelles
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Vous pouvez également migrer chaque type de données individuellement pour plus de contrôle :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/migration/events"
              className="p-4 rounded-lg border transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Événements</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Migrer les événements, inscriptions et présences
              </p>
            </Link>
            <Link
              href="/admin/migration/evaluations"
              className="p-4 rounded-lg border transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Évaluations</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Migrer les évaluations mensuelles
              </p>
            </Link>
            <Link
              href="/admin/migration/follows"
              className="p-4 rounded-lg border transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Validations Follow</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Migrer les validations de follow
              </p>
            </Link>
            <Link
              href="/admin/migration/members"
              className="p-4 rounded-lg border transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Membres</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Migrer les données des membres
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
