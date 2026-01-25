"use client";

import React, { useState } from "react";

interface Conflict {
  month: string;
  staffSlug: string;
  staffName: string;
  type: 'missing' | 'different' | 'extra_in_supabase';
  blobData: {
    membersCount: number;
    validatedAt: string;
    members: Array<{
      twitchLogin: string;
      jeSuis?: boolean;
      meSuit?: boolean | null;
    }>;
  };
  supabaseData?: {
    membersCount: number;
    validatedAt: string;
    members: Array<{
      twitchLogin: string;
      follows: boolean;
    }>;
  };
  differences?: Array<{
    twitchLogin: string;
    blobValue: { jeSuis?: boolean; meSuit?: boolean | null };
    supabaseValue: { follows: boolean };
  }>;
}

interface SyncCheckResult {
  months: {
    inBlobs: string[];
    inSupabase: string[];
    missingInSupabase: string[];
    extraInSupabase: string[];
  };
  validations: {
    totalInBlobs: number;
    totalInSupabase: number;
    byMonth: Array<{
      month: string;
      inBlobs: number;
      inSupabase: number;
      missingInSupabase: number;
      byStaff: Array<{
        staffSlug: string;
        staffName: string;
        inBlobs: boolean;
        inSupabase: boolean;
        membersInBlobs: number;
        membersInSupabase: number;
      }>;
    }>;
  };
}

interface MigrationResult {
  success: boolean;
  message: string;
  summary?: {
    monthsProcessed: number;
    validationsMigrated: number;
    validationsSkipped: number;
    conflictsCount: number;
    totalInSupabase: number;
  };
  monthResults?: Array<{
    month: string;
    validationsMigrated: number;
    validationsSkipped: number;
    conflicts: Conflict[];
    errors: string[];
  }>;
  conflicts?: Conflict[];
  errors?: string[];
  error?: string;
}

export default function FollowsMigrationPage() {
  const [loading, setLoading] = useState(false);
  const [checkingSync, setCheckingSync] = useState(false);
  const [syncData, setSyncData] = useState<SyncCheckResult | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [selectedStaffSlugs, setSelectedStaffSlugs] = useState<Set<string>>(new Set());
  const [selectedConflicts, setSelectedConflicts] = useState<Set<string>>(new Set());
  const [showConflicts, setShowConflicts] = useState(false);

  const checkSync = async () => {
    setCheckingSync(true);
    setError(null);
    setSyncData(null);
    setSelectedMonths(new Set());
    setSelectedStaffSlugs(new Set());
    setSelectedConflicts(new Set());
    setShowConflicts(false);

    try {
      const response = await fetch('/api/admin/migration/check-sync-follows', {
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
        data.data.validations.byMonth.forEach((m: any) => {
          if (m.missingInSupabase > 0) {
            missingMonths.add(m.month);
          }
        });
        setSelectedMonths(missingMonths);
        
        // Sélectionner automatiquement tous les staff manquants
        const missingStaff = new Set<string>();
        data.data.validations.byMonth.forEach((m: any) => {
          m.byStaff.forEach((s: any) => {
            if (s.inBlobs && !s.inSupabase) {
              missingStaff.add(`${m.month}:${s.staffSlug}`);
            }
          });
        });
        setSelectedStaffSlugs(missingStaff);
      } else {
        throw new Error(data.error || 'Erreur lors de la vérification');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setCheckingSync(false);
    }
  };

  const runMigration = async (applyConflicts: boolean = false) => {
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
      const staffSlugsParam = selectedStaffSlugs.size > 0
        ? Array.from(selectedStaffSlugs).map(s => s.split(':')[1]).join(',')
        : undefined;

      const url = `/api/admin/migration/migrate-follows?months=${monthsParam}${staffSlugsParam ? `&staffSlugs=${staffSlugsParam}` : ''}${applyConflicts ? '&applyConflicts=true' : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setMigrationResult(data);

      // Si des conflits sont détectés, les afficher
      if (data.conflicts && data.conflicts.length > 0) {
        setShowConflicts(true);
        // Sélectionner tous les conflits par défaut
        const conflictKeys = data.conflicts.map((c: Conflict) => `${c.month}:${c.staffSlug}`);
        setSelectedConflicts(new Set(conflictKeys));
      }

      // Re-vérifier la synchronisation après migration (sans conflits)
      if (data.success && (!data.conflicts || data.conflicts.length === 0)) {
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

  const applySelectedConflicts = async () => {
    if (selectedConflicts.size === 0) {
      setError('Veuillez sélectionner au moins un conflit à appliquer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Extraire les mois et staffSlugs des conflits sélectionnés
      const months = new Set<string>();
      const staffSlugs = new Set<string>();
      
      selectedConflicts.forEach(key => {
        const [month, staffSlug] = key.split(':');
        months.add(month);
        staffSlugs.add(staffSlug);
      });

      const response = await fetch('/api/admin/migration/migrate-follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months: Array.from(months),
          staffSlugs: Array.from(staffSlugs),
          applyConflicts: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setMigrationResult(data);
      setShowConflicts(false);
      setSelectedConflicts(new Set());

      // Re-vérifier la synchronisation
      setTimeout(() => {
        checkSync();
      }, 1000);
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

  const toggleStaffSelection = (month: string, staffSlug: string) => {
    const key = `${month}:${staffSlug}`;
    const newSelected = new Set(selectedStaffSlugs);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedStaffSlugs(newSelected);
  };

  const toggleConflictSelection = (month: string, staffSlug: string) => {
    const key = `${month}:${staffSlug}`;
    const newSelected = new Set(selectedConflicts);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedConflicts(newSelected);
  };

  const selectAll = () => {
    if (!syncData) return;
    const missingMonths = new Set<string>(syncData.months.missingInSupabase);
    syncData.validations.byMonth.forEach(m => {
      if (m.missingInSupabase > 0) {
        missingMonths.add(m.month);
      }
    });
    setSelectedMonths(missingMonths);
    
    const missingStaff = new Set<string>();
    syncData.validations.byMonth.forEach(m => {
      m.byStaff.forEach(s => {
        if (s.inBlobs && !s.inSupabase) {
          missingStaff.add(`${m.month}:${s.staffSlug}`);
        }
      });
    });
    setSelectedStaffSlugs(missingStaff);
  };

  const deselectAll = () => {
    setSelectedMonths(new Set());
    setSelectedStaffSlugs(new Set());
  };

  const selectAllConflicts = () => {
    if (!migrationResult?.conflicts) return;
    const conflictKeys = migrationResult.conflicts.map(c => `${c.month}:${c.staffSlug}`);
    setSelectedConflicts(new Set(conflictKeys));
  };

  const deselectAllConflicts = () => {
    setSelectedConflicts(new Set());
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
          Migration des Validations de Follow
        </h1>
        <p className="text-gray-400">
          Migrer les validations de follow depuis Netlify Blobs vers Supabase
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
              <h3 className="text-lg font-bold text-white mb-4">Validations</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total dans Blobs:</span>
                  <span className="text-white font-semibold">{syncData.validations.totalInBlobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total dans Supabase:</span>
                  <span className="text-white font-semibold">{syncData.validations.totalInSupabase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Manquantes:</span>
                  <span className="text-orange-400 font-semibold">
                    {syncData.validations.totalInBlobs - syncData.validations.totalInSupabase}
                  </span>
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

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {syncData.validations.byMonth
                  .filter(m => syncData.months.missingInSupabase.includes(m.month))
                  .map((monthData) => {
                    const isMonthSelected = selectedMonths.has(monthData.month);
                    const missingStaff = monthData.byStaff.filter(s => s.inBlobs && !s.inSupabase);

                    return (
                      <div
                        key={monthData.month}
                        className={`p-4 border rounded-lg transition-all ${
                          isMonthSelected
                            ? 'border-[#9146ff] bg-[#9146ff]/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={isMonthSelected}
                            onChange={() => toggleMonthSelection(monthData.month)}
                            className="mt-1 w-5 h-5 text-[#9146ff] border-gray-600 rounded focus:ring-[#9146ff]"
                          />
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-2">
                              {formatMonth(monthData.month)}
                            </h4>
                            <div className="text-sm text-gray-400 space-y-1 mb-3">
                              <div>
                                <span className="text-orange-400">
                                  {monthData.missingInSupabase} validation(s) à migrer
                                </span>
                                {' '}
                                <span className="text-gray-500">
                                  ({monthData.inBlobs} dans Blobs, {monthData.inSupabase} dans Supabase)
                                </span>
                              </div>
                            </div>
                            
                            {/* Liste des staff par mois */}
                            {missingStaff.length > 0 && (
                              <div className="ml-4 space-y-2">
                                {missingStaff.map((staff) => {
                                  const staffKey = `${monthData.month}:${staff.staffSlug}`;
                                  const isStaffSelected = selectedStaffSlugs.has(staffKey);

                                  return (
                                    <div
                                      key={staff.staffSlug}
                                      className={`p-2 border rounded transition-all ${
                                        isStaffSelected
                                          ? 'border-[#9146ff] bg-[#9146ff]/10'
                                          : 'border-gray-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isStaffSelected}
                                          onChange={() => toggleStaffSelection(monthData.month, staff.staffSlug)}
                                          className="w-4 h-4 text-[#9146ff] border-gray-600 rounded focus:ring-[#9146ff]"
                                        />
                                        <span className="text-white text-sm">{staff.staffName}</span>
                                        <span className="text-gray-500 text-xs">
                                          ({staff.membersInBlobs} membres dans Blobs)
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
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
                  onClick={() => runMigration(false)}
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
           syncData.validations.totalInBlobs === syncData.validations.totalInSupabase && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-1">
                    Tout est synchronisé !
                  </h3>
                  <p className="text-gray-300">
                    Toutes les validations de follow sont présentes dans Supabase.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Affichage des conflits */}
      {showConflicts && migrationResult?.conflicts && migrationResult.conflicts.length > 0 && (
        <div className="mt-6 bg-orange-500/20 border border-orange-500 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-orange-400 mb-2">
                ⚠️ Conflits Détectés ({migrationResult.conflicts.length})
              </h3>
              <p className="text-gray-300 text-sm">
                Des différences ont été détectées entre Blobs et Supabase. Sélectionnez les conflits à appliquer.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllConflicts}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Tout sélectionner
              </button>
              <button
                onClick={deselectAllConflicts}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Tout ignorer
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {migrationResult.conflicts.map((conflict, idx) => {
              const conflictKey = `${conflict.month}:${conflict.staffSlug}`;
              const isSelected = selectedConflicts.has(conflictKey);

              return (
                <div
                  key={idx}
                  className={`p-4 border rounded-lg transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleConflictSelection(conflict.month, conflict.staffSlug)}
                      className="mt-1 w-5 h-5 text-orange-500 border-gray-600 rounded focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">
                        {conflict.staffName} - {formatMonth(conflict.month)}
                      </h4>
                      
                      {conflict.type === 'different' && conflict.differences && (
                        <div className="space-y-2">
                          <p className="text-orange-400 text-sm font-semibold">
                            {conflict.differences.length} différence(s) détectée(s)
                          </p>
                          <div className="text-xs text-gray-400 space-y-1 max-h-40 overflow-y-auto">
                            {conflict.differences.slice(0, 10).map((diff, diffIdx) => (
                              <div key={diffIdx} className="flex items-center gap-2">
                                <span className="font-mono">{diff.twitchLogin}</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-orange-300">
                                  Blobs: jeSuis={String(diff.blobValue.jeSuis ?? 'N/A')}, meSuit={String(diff.blobValue.meSuit ?? 'N/A')}
                                </span>
                                <span className="text-gray-500">vs</span>
                                <span className="text-blue-300">
                                  Supabase: follows={String(diff.supabaseValue.follows)}
                                </span>
                              </div>
                            ))}
                            {conflict.differences.length > 10 && (
                              <div className="text-gray-500">
                                ... et {conflict.differences.length - 10} autre(s) différence(s)
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {conflict.type === 'missing' && (
                        <p className="text-orange-400 text-sm">
                          Validation manquante dans Supabase ({conflict.blobData.membersCount} membres)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-700">
            <button
              onClick={() => {
                setShowConflicts(false);
                setSelectedConflicts(new Set());
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            >
              Ignorer tous les conflits
            </button>
            <button
              onClick={applySelectedConflicts}
              disabled={loading || selectedConflicts.size === 0}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Application...' : `Appliquer ${selectedConflicts.size} conflit(s) sélectionné(s)`}
            </button>
          </div>
        </div>
      )}

      {/* Résultats de la migration */}
      {migrationResult && !showConflicts && (
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
                  <span className="text-gray-400">Validations migrées:</span>
                  <span className="text-white font-semibold ml-2">
                    {migrationResult.summary.validationsMigrated}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Validations ignorées:</span>
                  <span className="text-white font-semibold ml-2">
                    {migrationResult.summary.validationsSkipped}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Conflits détectés:</span>
                  <span className="text-orange-400 font-semibold ml-2">
                    {migrationResult.summary.conflictsCount}
                  </span>
                </div>
              </div>

              {migrationResult.monthResults && migrationResult.monthResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-white font-semibold mb-2">Détails par mois:</h4>
                  <div className="space-y-1 text-xs">
                    {migrationResult.monthResults.map((result) => (
                      <div key={result.month} className="text-gray-400">
                        {formatMonth(result.month)}: {result.validationsMigrated} migrées, {result.validationsSkipped} ignorées
                        {result.conflicts.length > 0 && (
                          <span className="text-orange-400 ml-2">
                            ({result.conflicts.length} conflit(s))
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
