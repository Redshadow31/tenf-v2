"use client";

import React, { useState } from "react";

interface SyncCheckResult {
  months: {
    inBlobs: string[];
    inSupabase: string[];
    missingInSupabase: string[];
    extraInSupabase: string[];
  };
  evaluations: {
    totalInBlobs: number;
    totalInSupabase: number;
    byMonth: Array<{
      month: string;
      inBlobs: number;
      inSupabase: number;
      missingInSupabase: number;
    }>;
  };
  sections: {
    sectionA: {
      totalInBlobs: number;
      totalInSupabase: number;
      byMonth: Array<{
        month: string;
        inBlobs: number;
        inSupabase: number;
      }>;
    };
    sectionC: {
      totalInBlobs: number;
      totalInSupabase: number;
      byMonth: Array<{
        month: string;
        inBlobs: number;
        inSupabase: number;
      }>;
    };
    sectionD: {
      totalInBlobs: number;
      totalInSupabase: number;
      byMonth: Array<{
        month: string;
        inBlobs: number;
        inSupabase: number;
      }>;
    };
  };
}

interface MigrationResult {
  success: boolean;
  message: string;
  summary?: {
    monthsProcessed: number;
    evaluationsMigrated: number;
    evaluationsSkipped: number;
    totalInSupabase: number;
  };
  monthResults?: Array<{
    month: string;
    evaluationsMigrated: number;
    evaluationsSkipped: number;
    errors: string[];
  }>;
  errors?: string[];
  error?: string;
}

export default function EvaluationsMigrationPage() {
  const [loading, setLoading] = useState(false);
  const [checkingSync, setCheckingSync] = useState(false);
  const [syncData, setSyncData] = useState<SyncCheckResult | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());

  const checkSync = async () => {
    setCheckingSync(true);
    setError(null);
    setSyncData(null);
    setSelectedMonths(new Set());

    try {
      const response = await fetch('/api/admin/migration/check-sync-evaluations', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSyncData(data.data);
        // Sélectionner automatiquement tous les mois manquants
        const missingMonths = new Set<string>(data.data.months.missingInSupabase);
        // Ajouter aussi les mois avec des évaluations manquantes
        data.data.evaluations.byMonth.forEach((m: any) => {
          if (m.missingInSupabase > 0) {
            missingMonths.add(m.month);
          }
        });
        setSelectedMonths(missingMonths);
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

    if (selectedMonths.size === 0) {
      setError('Veuillez sélectionner au moins un mois à migrer');
      return;
    }

    setLoading(true);
    setError(null);
    setMigrationResult(null);

    try {
      const monthsParam = Array.from(selectedMonths).join(',');
      const response = await fetch(`/api/admin/migration/migrate-evaluations?months=${monthsParam}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setMigrationResult(data);

      // Re-vérifier la synchronisation après migration
      if (data.success) {
        setTimeout(() => {
          checkSync();
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const toggleMonthSelection = (month: string) => {
    const newSelected = new Set(selectedMonths);
    if (newSelected.has(month)) {
      newSelected.delete(month);
    } else {
      newSelected.add(month);
    }
    setSelectedMonths(newSelected);
  };

  const selectAll = () => {
    if (!syncData) return;
    const missingMonths = new Set<string>(syncData.months.missingInSupabase);
    syncData.evaluations.byMonth.forEach(m => {
      if (m.missingInSupabase > 0) {
        missingMonths.add(m.month);
      }
    });
    setSelectedMonths(missingMonths);
  };

  const deselectAll = () => {
    setSelectedMonths(new Set());
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Migration des Évaluations
        </h1>
        <p className="text-gray-400">
          Migrer les évaluations mensuelles depuis Netlify Blobs vers Supabase
        </p>
      </div>

      {/* Bouton de vérification */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Vérification de Synchronisation
            </h2>
            <p className="text-gray-400 text-sm">
              Compare les données entre Netlify Blobs et Supabase
            </p>
          </div>
          <button
            onClick={checkSync}
            disabled={checkingSync}
            className="px-6 py-3 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingSync ? 'Vérification...' : '🔍 Vérifier la Synchronisation'}
          </button>
        </div>
      </div>

      {/* Résultats de la vérification */}
      {syncData && (
        <div className="space-y-6">
          {/* Résumé */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Mois</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Dans Blobs:</span>
                  <span className="text-white font-semibold">{syncData.months.inBlobs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dans Supabase:</span>
                  <span className="text-white font-semibold">{syncData.months.inSupabase.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Manquants dans Supabase:</span>
                  <span className="text-orange-400 font-semibold">
                    {syncData.months.missingInSupabase.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Évaluations</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total dans Blobs:</span>
                  <span className="text-white font-semibold">{syncData.evaluations.totalInBlobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total dans Supabase:</span>
                  <span className="text-white font-semibold">{syncData.evaluations.totalInSupabase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Manquantes:</span>
                  <span className="text-orange-400 font-semibold">
                    {syncData.evaluations.totalInBlobs - syncData.evaluations.totalInSupabase}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Section A</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Dans Blobs:</span>
                  <span className="text-white font-semibold">{syncData.sections.sectionA.totalInBlobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dans Supabase:</span>
                  <span className="text-white font-semibold">{syncData.sections.sectionA.totalInSupabase}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Section C</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Dans Blobs:</span>
                  <span className="text-white font-semibold">{syncData.sections.sectionC.totalInBlobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dans Supabase:</span>
                  <span className="text-white font-semibold">{syncData.sections.sectionC.totalInSupabase}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Section D</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Dans Blobs:</span>
                  <span className="text-white font-semibold">{syncData.sections.sectionD.totalInBlobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dans Supabase:</span>
                  <span className="text-white font-semibold">{syncData.sections.sectionD.totalInSupabase}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des mois à migrer */}
          {syncData.months.missingInSupabase.length > 0 && (
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Mois à Migrer ({syncData.months.missingInSupabase.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {syncData.months.missingInSupabase.map((month) => {
                  const monthData = syncData.evaluations.byMonth.find(m => m.month === month);
                  const isSelected = selectedMonths.has(month);

                  return (
                    <div
                      key={month}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#9146ff] bg-[#9146ff]/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => toggleMonthSelection(month)}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMonthSelection(month)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 w-5 h-5 text-[#9146ff] border-gray-600 rounded focus:ring-[#9146ff]"
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">
                            {formatMonth(month)}
                          </h4>
                          <div className="text-sm text-gray-400 space-y-1">
                            {monthData && (
                              <>
                                <div>
                                  <span className="text-orange-400">
                                    {monthData.missingInSupabase} évaluation(s) à migrer
                                  </span>
                                  {' '}
                                  <span className="text-gray-500">
                                    ({monthData.inBlobs} dans Blobs, {monthData.inSupabase} dans Supabase)
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bouton de migration */}
          {syncData.months.missingInSupabase.length > 0 && (
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Lancer la Migration
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {selectedMonths.size > 0
                      ? `${selectedMonths.size} mois sélectionné(s)`
                      : 'Sélectionnez au moins un mois à migrer'}
                  </p>
                </div>
                <button
                  onClick={runMigration}
                  disabled={loading || selectedMonths.size === 0}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Migration en cours...' : '🚀 Migrer les Données'}
                </button>
              </div>
            </div>
          )}

          {/* Message si tout est synchronisé */}
          {syncData.months.missingInSupabase.length === 0 && 
           syncData.evaluations.totalInBlobs === syncData.evaluations.totalInSupabase && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-1">
                    Tout est synchronisé !
                  </h3>
                  <p className="text-gray-300">
                    Toutes les évaluations sont présentes dans Supabase.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Résultats de la migration */}
      {migrationResult && (
        <div className={`mt-6 border rounded-lg p-6 ${
          migrationResult.success
            ? 'bg-green-500/20 border-green-500'
            : 'bg-red-500/20 border-red-500'
        }`}>
          <h3 className={`text-lg font-bold mb-4 ${
            migrationResult.success ? 'text-green-400' : 'text-red-400'
          }`}>
            {migrationResult.success ? '✅ Migration Réussie' : '❌ Erreur de Migration'}
          </h3>
          
          {migrationResult.success && migrationResult.summary && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Mois traités:</span>
                  <span className="text-white font-semibold ml-2">
                    {migrationResult.summary.monthsProcessed}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Évaluations migrées:</span>
                  <span className="text-white font-semibold ml-2">
                    {migrationResult.summary.evaluationsMigrated}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Évaluations ignorées:</span>
                  <span className="text-white font-semibold ml-2">
                    {migrationResult.summary.evaluationsSkipped}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Total dans Supabase:</span>
                  <span className="text-white font-semibold ml-2">
                    {migrationResult.summary.totalInSupabase}
                  </span>
                </div>
              </div>

              {migrationResult.monthResults && migrationResult.monthResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-white font-semibold mb-2">Détails par mois:</h4>
                  <div className="space-y-1 text-xs">
                    {migrationResult.monthResults.map((result) => (
                      <div key={result.month} className="text-gray-400">
                        {formatMonth(result.month)}: {result.evaluationsMigrated} migrées, {result.evaluationsSkipped} ignorées
                        {result.errors.length > 0 && (
                          <span className="text-orange-400 ml-2">
                            ({result.errors.length} erreur(s))
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {migrationResult.errors && migrationResult.errors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-orange-400 font-semibold mb-2">Erreurs:</h4>
                  <div className="space-y-1 text-xs text-orange-300 max-h-40 overflow-y-auto">
                    {migrationResult.errors.map((err, idx) => (
                      <div key={idx}>{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {migrationResult.error && (
            <div className="mt-4 text-red-400 text-sm">
              {migrationResult.error}
            </div>
          )}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="mt-6 bg-red-500/20 border border-red-500 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="text-lg font-bold text-red-400 mb-1">Erreur</h3>
              <p className="text-gray-300">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
