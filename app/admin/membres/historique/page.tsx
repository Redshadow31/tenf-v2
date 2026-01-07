"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/admin";

interface MemberEvent {
  id: string;
  memberId: string;
  type: string;
  createdAt: string;
  source?: 'twitch_eventsub' | 'twitch_poll' | 'manual' | 'discord' | 'system';
  actor?: string;
  payload?: Record<string, any>;
}

export default function MembresHistoriquePage() {
  const [events, setEvents] = useState<MemberEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [filters, setFilters] = useState({
    memberSearch: "",
    type: "",
    source: "",
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 50;

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        try {
          const roleResponse = await fetch("/api/user/role");
          const roleData = await roleResponse.json();
          if (!roleData.hasAdminAccess) {
            window.location.href = "/unauthorized";
            return;
          }
          const isAdminRole = roleData.role === "Admin";
          const isAdminAdjoint = roleData.role === "Admin Adjoint";
          const founderStatus = isFounder(user.id);
          setCurrentAdmin({
            id: user.id,
            username: user.username,
            isFounder: founderStatus || isAdminRole || isAdminAdjoint,
          });
        } catch (err) {
          const founderStatus = isFounder(user.id);
          if (!founderStatus) {
            window.location.href = "/unauthorized";
            return;
          }
          setCurrentAdmin({ id: user.id, username: user.username, isFounder: founderStatus });
        }
      } else {
        window.location.href = "/auth/login?redirect=/admin/membres/historique";
      }
    }
    loadAdmin();
  }, []);

  useEffect(() => {
    if (currentAdmin?.isFounder) {
      loadEvents();
    }
  }, [currentAdmin?.isFounder, filters, currentPage]);

  async function loadEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.memberSearch) params.append('memberId', filters.memberSearch);
      if (filters.type) params.append('type', filters.type);
      if (filters.source) params.append('source', filters.source);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', String(eventsPerPage * currentPage));

      const response = await fetch(`/api/admin/members/events?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setLoading(false);
    }
  }

  const formatEventSummary = (event: MemberEvent): string => {
    switch (event.type) {
      case 'role_changed':
        return `Rôle changé: ${event.payload?.fromRole || 'N/A'} → ${event.payload?.toRole || 'N/A'}`;
      case 'integration_validated':
        return `Intégration validée le ${new Date(event.payload?.date || event.createdAt).toLocaleDateString('fr-FR')}`;
      case 'manual_note_updated':
        return `Notes internes mises à jour`;
      case 'raid':
        return `Raid: ${event.payload?.raider || 'N/A'} → ${event.payload?.target || 'N/A'}`;
      case 'follow_import_wizebot':
        return `Import Wizebot: Follow détecté${event.payload?.followedAt ? ` le ${new Date(event.payload.followedAt).toLocaleDateString('fr-FR')}` : ''}`;
      default:
        return event.type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'role_changed':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'integration_validated':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'manual_note_updated':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'raid':
        return 'bg-[#9146ff]/20 text-[#9146ff] border-[#9146ff]/30';
      case 'follow_import_wizebot':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'twitch_eventsub':
        return '🎮';
      case 'twitch_poll':
        return '📊';
      case 'manual':
        return '✋';
      case 'discord':
        return '💬';
      case 'system':
        return '⚙️';
      default:
        return '❓';
    }
  };

  const displayedEvents = events.slice(0, eventsPerPage * currentPage);
  const hasMore = events.length > eventsPerPage * currentPage;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (!currentAdmin?.isFounder) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <h1 className="text-4xl font-bold text-white mb-8">Historique des Membres</h1>
        <p className="text-red-400">Accès refusé. Cette page est réservée aux fondateurs.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Historique des Membres</h1>

      {/* Filtres */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Recherche membre (Twitch login)
            </label>
            <input
              type="text"
              value={filters.memberSearch}
              onChange={(e) => setFilters({ ...filters, memberSearch: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="Ex: nexou31"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Type d'événement
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Tous</option>
              <option value="role_changed">Changement de rôle</option>
              <option value="integration_validated">Intégration validée</option>
              <option value="manual_note_updated">Notes mises à jour</option>
              <option value="raid">Raid</option>
              <option value="follow_import_wizebot">Import Wizebot</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Source
            </label>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Toutes</option>
              <option value="twitch_eventsub">Twitch EventSub</option>
              <option value="twitch_poll">Twitch Poll</option>
              <option value="manual">Manuel</option>
              <option value="discord">Discord</option>
              <option value="system">Système</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  memberSearch: "",
                  type: "",
                  source: "",
                  startDate: "",
                  endDate: "",
                });
                setCurrentPage(1);
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des événements */}
      {displayedEvents.length === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 text-xl font-semibold">Aucun événement trouvé</p>
          <p className="text-gray-500 mt-2">Aucun événement ne correspond aux filtres sélectionnés.</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Membre</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Type</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Source</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Résumé</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Acteur</th>
                </tr>
              </thead>
              <tbody>
                {displayedEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6 text-gray-300 text-sm">
                      {new Date(event.createdAt).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        href={`/admin/membres/gestion?search=${event.memberId}`}
                        className="text-[#9146ff] hover:text-[#5a32b4] font-medium"
                      >
                        {event.memberId}
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getEventTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300 text-sm">
                      <span className="flex items-center gap-2">
                        <span>{getSourceIcon(event.source)}</span>
                        <span>{event.source || 'N/A'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300 text-sm">
                      {formatEventSummary(event)}
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {event.actor || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Charger plus ({events.length - displayedEvents.length} restants)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

