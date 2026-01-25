"use client";

import React, { useState } from "react";

interface MemberInfo {
  twitchLogin: string;
  displayName: string;
  source: 'admin' | 'bot' | 'both';
}

interface SyncCheckResult {
  adminMembers: {
    inBlobs: number;
    inSupabase: number;
    missingInSupabase: MemberInfo[];
    extraInSupabase: string[];
  };
  botMembers: {
    inBlobs: number;
    inSupabase: number;
    missingInSupabase: MemberInfo[];
    extraInSupabase: string[];
  };
  merged: {
    totalInBlobs: number;
    totalInSupabase: number;
    missingInSupabase: MemberInfo[];
    extraInSupabase: string[];
  };
}

interface MigrationResult {
  success: boolean;
  message: string;
  summary?: {
    totalInBlobs: number;
    migrated: number;
    skipped: number;
    errors: number;
  };
  errors?: string[];
  error?: string;
}

export default function MembersMigrationPage() {
  const [loading, setLoading] = useState(false);
  const [checkingSync, setCheckingSync] = useState(false);
  const [syncData, setSyncData] = useState<SyncCheckResult | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLogins, setSelectedLogins] = useState<Set<string>>(new Set());
  const [source, setSource] = useState<'admin' | 'bot' | 'merged'>('merged');

  const checkSync = async () => {
    setCheckingSync(true);
    setError(null);
    setSyncData(null);
    setSelectedLogins(new Set());

    try {
      const response = await fetch('/api/admin/migration/check-sync-members', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSyncData(data.data);
        // Sélectionner automatiquement tous les membres manquants selon la source
        const missingMembers = data.data[source === 'merged' ? 'merged' : source === 'admin' ? 'adminMembers' : 'botMembers'].missingInSupabase;
        const missingLogins = new Set<string>(missingMembers.map((m: MemberInfo) => m.twitchLogin.toLowerCase()));
        setSelectedLogins(missingLogins);
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
    if (!syncData) {
      setError('Veuillez d\'abord vérifier la synchronisation');
      return;
    }

    if (selectedLogins.size === 0) {
      setError('Veuillez sélectionner au moins un membre à migrer');
      return;
    }

    setLoading(true);
    setError(null);
    setMigrationResult(null);

    try {
      const response = await fetch('/api/admin/migration/migrate-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          selectedLogins: Array.from(selectedLogins),
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

  const selectAll = () => {
    if (!syncData) return;
    
    const missingMembers = syncData[source === 'merged' ? 'merged' : source === 'admin' ? 'adminMembers' : 'botMembers'].missingInSupabase;
    const allLogins = new Set<string>(missingMembers.map(m => m.twitchLogin.toLowerCase()));
    setSelectedLogins(allLogins);
  };

  const deselectAll = () => {
    setSelectedLogins(new Set());
  };

  const getMissingMembers = (): MemberInfo[] => {
    if (!syncData) return [];
    return syncData[source === 'merged' ? 'merged' : source === 'admin' ? 'adminMembers' : 'botMembers'].missingInSupabase;
  };

  const getStats = () => {
    if (!syncData) return null;
    const stats = syncData[source === 'merged' ? 'merged' : source === 'admin' ? 'adminMembers' : 'botMembers'];
    // Le type 'merged' utilise totalInBlobs/totalInSupabase, les autres utilisent inBlobs/inSupabase
    const inBlobs = 'totalInBlobs' in stats ? stats.totalInBlobs : stats.inBlobs;
    const inSupabase = 'totalInSupabase' in stats ? stats.totalInSupabase : stats.inSupabase;
    return {
      inBlobs,
      inSupabase,
      missing: stats.missingInSupabase.length,
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Migration des Membres</h1>
        <p className="text-gray-400 mb-8">
          Migrer les données des membres depuis Netlify Blobs vers Supabase
        </p>

        {/* Sélection de la source */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Source des données</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="source"
                value="merged"
                checked={source === 'merged'}
                onChange={(e) => setSource(e.target.value as 'merged')}
                className="w-4 h-4 text-[#9146ff]"
              />
              <span>Fusionné (Admin + Bot)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="source"
                value="admin"
                checked={source === 'admin'}
                onChange={(e) => setSource(e.target.value as 'admin')}
                className="w-4 h-4 text-[#9146ff]"
              />
              <span>Admin uniquement</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="source"
                value="bot"
                checked={source === 'bot'}
                onChange={(e) => setSource(e.target.value as 'bot')}
                className="w-4 h-4 text-[#9146ff]"
              />
              <span>Bot uniquement</span>
            </label>
          </div>
        </div>

        {/* Bouton vérification */}
        <div className="mb-6">
          <button
            onClick={checkSync}
            disabled={checkingSync}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {checkingSync ? 'Vérification...' : '🔍 Vérifier la synchronisation'}
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Résultats de synchronisation */}
        {syncData && stats && (
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Dans Blobs</p>
                <p className="text-3xl font-bold text-blue-400">{stats.inBlobs}</p>
              </div>
              <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Dans Supabase</p>
                <p className="text-3xl font-bold text-green-400">{stats.inSupabase}</p>
              </div>
              <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Manquants</p>
                <p className="text-3xl font-bold text-orange-400">{stats.missing}</p>
              </div>
            </div>

            {/* Message si tout est synchronisé */}
            {stats.missing === 0 && (
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-6">
                <p className="text-green-300 text-lg font-semibold">
                  ✅ Tout est synchronisé ! Aucune migration nécessaire.
                </p>
              </div>
            )}

            {/* Liste des membres manquants */}
            {stats.missing > 0 && (
              <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    Membres manquants dans Supabase ({stats.missing})
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded transition-colors"
                    >
                      Tout sélectionner
                    </button>
                    <button
                      onClick={deselectAll}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded transition-colors"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getMissingMembers().map((member) => {
                    const isSelected = selectedLogins.has(member.twitchLogin.toLowerCase());
                    return (
                      <div
                        key={member.twitchLogin}
                        className={`p-3 border rounded transition-all ${
                          isSelected
                            ? 'border-[#9146ff] bg-[#9146ff]/10'
                            : 'border-gray-700'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const newSelected = new Set(selectedLogins);
                              if (isSelected) {
                                newSelected.delete(member.twitchLogin.toLowerCase());
                              } else {
                                newSelected.add(member.twitchLogin.toLowerCase());
                              }
                              setSelectedLogins(newSelected);
                            }}
                            className="w-4 h-4 text-[#9146ff] border-gray-600 rounded focus:ring-[#9146ff]"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{member.displayName}</span>
                              <span className="text-gray-400 text-sm">({member.twitchLogin})</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                member.source === 'admin' ? 'bg-blue-500/20 text-blue-300' :
                                member.source === 'bot' ? 'bg-purple-500/20 text-purple-300' :
                                'bg-green-500/20 text-green-300'
                              }`}>
                                {member.source === 'admin' ? 'Admin' : member.source === 'bot' ? 'Bot' : 'Les deux'}
                              </span>
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>

                {/* Bouton migration */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={runMigration}
                    disabled={loading || selectedLogins.size === 0}
                    className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Migration...' : `Migrer ${selectedLogins.size} membre(s)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Résultats de migration */}
        {migrationResult && (
          <div className={`mt-6 border rounded-lg p-6 ${
            migrationResult.success
              ? 'bg-green-500/20 border-green-500'
              : 'bg-red-500/20 border-red-500'
          }`}>
            <h2 className="text-xl font-semibold mb-4">
              {migrationResult.success ? '✅ Migration réussie' : '❌ Erreur de migration'}
            </h2>
            <p className="mb-4">{migrationResult.message}</p>
            
            {migrationResult.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-2xl font-bold">{migrationResult.summary.totalInBlobs}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Migrés</p>
                  <p className="text-2xl font-bold text-green-400">{migrationResult.summary.migrated}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ignorés</p>
                  <p className="text-2xl font-bold text-yellow-400">{migrationResult.summary.skipped}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Erreurs</p>
                  <p className="text-2xl font-bold text-red-400">{migrationResult.summary.errors}</p>
                </div>
              </div>
            )}

            {migrationResult.errors && migrationResult.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Erreurs détaillées:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
                  {migrationResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
