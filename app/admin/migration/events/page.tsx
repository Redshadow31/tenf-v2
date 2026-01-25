"use client";

import React, { useState, useEffect } from "react";

interface BlobEvent {
  id: string;
  title: string;
  date: string;
  category: string;
  isPublished: boolean;
}

interface SyncCheckResult {
  events: {
    inBlobs: number;
    inSupabase: number;
    missingInSupabase: BlobEvent[];
    extraInSupabase: string[];
  };
  registrations: {
    totalInBlobs: number;
    totalInSupabase: number;
    byEvent: Array<{
      eventId: string;
      eventTitle: string;
      inBlobs: number;
      inSupabase: number;
      missingInSupabase: number;
    }>;
  };
}

interface MigrationResult {
  success: boolean;
  message: string;
  summary?: {
    eventsInBlobs: number;
    eventsMigrated: number;
    eventsSkipped: number;
    totalRegistrations: number;
    registrationsMigrated: number;
    registrationsSkipped: number;
    totalEventsInSupabase: number;
    totalRegistrationsInSupabase: number;
  };
  eventResults?: string[];
  error?: string;
}

export default function EventsMigrationPage() {
  const [loading, setLoading] = useState(false);
  const [checkingSync, setCheckingSync] = useState(false);
  const [syncData, setSyncData] = useState<SyncCheckResult | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const checkSync = async () => {
    setCheckingSync(true);
    setError(null);
    setSyncData(null);
    setSelectedEvents(new Set());

    try {
      const response = await fetch('/api/admin/migration/check-sync', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSyncData(data.data);
        // Sélectionner automatiquement tous les événements manquants
        const missingIds = new Set(data.data.events.missingInSupabase.map((e: BlobEvent) => e.id));
        setSelectedEvents(missingIds);
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
    if (selectedEvents.size === 0) {
      setError('Veuillez sélectionner au moins un événement à migrer');
      return;
    }

    setLoading(true);
    setError(null);
    setMigrationResult(null);

    try {
      const response = await fetch('/api/admin/migration/migrate-events', {
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

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const selectAll = () => {
    if (!syncData) return;
    const allMissing = new Set(syncData.events.missingInSupabase.map(e => e.id));
    setSelectedEvents(allMissing);
  };

  const deselectAll = () => {
    setSelectedEvents(new Set());
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Migration des Événements
        </h1>
        <p className="text-gray-400">
          Migrer les événements et inscriptions depuis Netlify Blobs vers Supabase
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
              <h3 className="text-lg font-bold text-white mb-4">Événements</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Dans Blobs:</span>
                  <span className="text-white font-semibold">{syncData.events.inBlobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dans Supabase:</span>
                  <span className="text-white font-semibold">{syncData.events.inSupabase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Manquants dans Supabase:</span>
                  <span className="text-orange-400 font-semibold">
                    {syncData.events.missingInSupabase.length}
                  </span>
                </div>
                {syncData.events.extraInSupabase.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Supplémentaires dans Supabase:</span>
                    <span className="text-blue-400 font-semibold">
                      {syncData.events.extraInSupabase.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Inscriptions</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total dans Blobs:</span>
                  <span className="text-white font-semibold">{syncData.registrations.totalInBlobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total dans Supabase:</span>
                  <span className="text-white font-semibold">{syncData.registrations.totalInSupabase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Manquantes:</span>
                  <span className="text-orange-400 font-semibold">
                    {syncData.registrations.totalInBlobs - syncData.registrations.totalInSupabase}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des événements à migrer */}
          {syncData.events.missingInSupabase.length > 0 && (
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Événements à Migrer ({syncData.events.missingInSupabase.length})
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
                {syncData.events.missingInSupabase.map((event) => {
                  const eventRegs = syncData.registrations.byEvent.find(r => r.eventId === event.id);
                  const isSelected = selectedEvents.has(event.id);

                  return (
                    <div
                      key={event.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#9146ff] bg-[#9146ff]/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => toggleEventSelection(event.id)}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEventSelection(event.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 w-5 h-5 text-[#9146ff] border-gray-600 rounded focus:ring-[#9146ff]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold">{event.title}</h4>
                            {event.isPublished && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                Publié
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 space-y-1">
                            <div>ID: {event.id}</div>
                            <div>Date: {new Date(event.date).toLocaleDateString('fr-FR')}</div>
                            <div>Catégorie: {event.category}</div>
                            {eventRegs && (
                              <div className="mt-2">
                                <span className="text-orange-400">
                                  {eventRegs.missingInSupabase} inscription(s) à migrer
                                </span>
                                {' '}
                                <span className="text-gray-500">
                                  ({eventRegs.inBlobs} dans Blobs, {eventRegs.inSupabase} dans Supabase)
                                </span>
                              </div>
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
          {syncData.events.missingInSupabase.length > 0 && (
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Lancer la Migration
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {selectedEvents.size > 0
                      ? `${selectedEvents.size} événement(s) sélectionné(s)`
                      : 'Sélectionnez au moins un événement à migrer'}
                  </p>
                </div>
                <button
                  onClick={runMigration}
                  disabled={loading || selectedEvents.size === 0}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Migration en cours...' : '🚀 Migrer les Données'}
                </button>
              </div>
            </div>
          )}

          {/* Message si tout est synchronisé */}
          {syncData.events.missingInSupabase.length === 0 && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-1">
                    Tout est synchronisé !
                  </h3>
                  <p className="text-gray-300">
                    Tous les événements et inscriptions sont présents dans Supabase.
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
                  <span className="text-gray-400">Événements migrés:</span>
                  <span className="text-white font-semibold ml-2">
                    {migrationResult.summary.eventsMigrated}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Inscriptions migrées:</span>
                  <span className="text-white font-semibold ml-2">
                    {migrationResult.summary.registrationsMigrated}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Total événements dans Supabase:</span>
                  <span className="text-white font-semibold ml-2">
                    {migrationResult.summary.totalEventsInSupabase}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Total inscriptions dans Supabase:</span>
                  <span className="text-white font-semibold ml-2">
                    {migrationResult.summary.totalRegistrationsInSupabase}
                  </span>
                </div>
              </div>
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
