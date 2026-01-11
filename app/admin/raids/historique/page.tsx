"use client";

import React, { useState, useEffect } from "react";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess, isFounder } from "@/lib/admin";

interface RaidEntry {
  id: string;
  raider: string;
  raiderTwitchLogin?: string;
  raiderDisplayName?: string;
  target: string;
  targetTwitchLogin?: string;
  targetDisplayName?: string;
  date: string;
  source: string;
  count?: number;
  type: 'fait' | 'recu';
}

interface Member {
  discordId: string;
  displayName: string;
  twitchLogin: string;
}

export default function RaidsHistoriquePage() {
  const [raids, setRaids] = useState<RaidEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        const founderStatus = isFounder(user.id);
        setCurrentAdmin({ id: user.id, username: user.username, isFounder: founderStatus });
      }
    }
    loadAdmin();

    // Initialiser avec le mois en cours
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonthStr = `${year}-${month}`;
    setSelectedMonth(currentMonthStr);

    // Générer la liste des mois disponibles (12 derniers mois)
    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      months.push(`${y}-${m}`);
    }
    setAvailableMonths(months);

    loadData(currentMonthStr);
  }, []);

  async function loadData(month?: string) {
    try {
      setLoading(true);
      const monthToLoad = month || selectedMonth;

      // Charger les données depuis l'API
      const dataResponse = await fetch(
        `/api/discord/raids/data-v2?month=${monthToLoad}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      let allRaids: RaidEntry[] = [];
      if (dataResponse.ok) {
        const data = await dataResponse.json();

        // Combiner tous les raids (faits et reçus) en une seule liste
        const raidsFaits: RaidEntry[] = (data.raidsFaits || []).map((raid: any) => ({
          id: raid.id || `${raid.raider}-${raid.target}-${raid.date}`,
          raider: raid.raider || '',
          raiderTwitchLogin: raid.raiderTwitchLogin || raid.raider,
          raiderDisplayName: raid.raiderDisplayName || raid.raiderTwitchLogin || raid.raider,
          target: raid.target || '',
          targetTwitchLogin: raid.targetTwitchLogin || raid.target,
          targetDisplayName: raid.targetDisplayName || raid.targetTwitchLogin || raid.target,
          date: raid.date || new Date().toISOString(),
          source: raid.source || (raid.manual ? 'manual' : 'twitch-live'),
          count: raid.count || 1,
          type: 'fait' as const,
        }));

        const raidsRecus: RaidEntry[] = (data.raidsRecus || []).map((raid: any) => ({
          id: raid.id || `${raid.raider}-${raid.target}-${raid.date}`,
          raider: raid.raider || '',
          raiderTwitchLogin: raid.raiderTwitchLogin || raid.raider,
          raiderDisplayName: raid.raiderDisplayName || raid.raiderTwitchLogin || raid.raider,
          target: raid.target || '',
          targetTwitchLogin: raid.targetTwitchLogin || raid.target,
          targetDisplayName: raid.targetDisplayName || raid.targetTwitchLogin || raid.target,
          date: raid.date || new Date().toISOString(),
          source: raid.source || (raid.manual ? 'manual' : 'twitch-live'),
          count: 1,
          type: 'recu' as const,
        }));

        // Combiner et trier du plus récent au plus ancien (nouveaux en haut)
        allRaids = [...raidsFaits, ...raidsRecus].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // Ordre décroissant (plus récent en premier)
        });

        setRaids(allRaids);
      } else {
        const error = await dataResponse.json();
        console.error("[Raids Historique] Erreur API:", error);
      }

      // Charger les membres pour avoir les noms d'affichage
      const membersResponse = await fetch("/api/members/public", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData.members || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleMonthChange(newMonth: string) {
    setSelectedMonth(newMonth);
    loadData(newMonth);
  }

  function getMemberDisplayName(twitchLogin: string): string {
    const member = members.find(m => m.twitchLogin.toLowerCase() === twitchLogin.toLowerCase());
    return member?.displayName || twitchLogin;
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  function getSourceLabel(source: string): string {
    switch (source) {
      case 'twitch-live':
      case 'bot':
        return 'Twitch EventSub';
      case 'manual':
      case 'admin':
        return 'Manuel';
      default:
        return source;
    }
  }

  function getSourceColor(source: string): string {
    switch (source) {
      case 'twitch-live':
      case 'bot':
        return 'bg-purple-600/20 text-purple-300 border-purple-500/30';
      case 'manual':
      case 'admin':
        return 'bg-green-600/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-500/30';
    }
  }

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

  return (
    <div className="text-white">
      <h1 className="text-4xl font-bold text-white mb-8">Historique des Raids</h1>

      {/* En-tête avec sélecteur de mois */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">
            Liste chronologique des raids
          </h2>
          <div className="flex items-center gap-4">
            <label className="text-gray-400 text-sm">
              Mois :
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
            >
              {availableMonths.map((month) => {
                const [year, monthNum] = month.split('-');
                const monthNames = [
                  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                ];
                const monthName = monthNames[parseInt(monthNum) - 1];
                return (
                  <option key={month} value={month}>
                    {monthName} {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total raids</div>
          <div className="text-2xl font-bold text-white">{raids.length}</div>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Raids faits</div>
          <div className="text-2xl font-bold text-purple-400">
            {raids.filter(r => r.type === 'fait').length}
          </div>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Raids reçus</div>
          <div className="text-2xl font-bold text-green-400">
            {raids.filter(r => r.type === 'recu').length}
          </div>
        </div>
      </div>

      {/* Liste des raids */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
        {raids.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            Aucun raid enregistré pour ce mois
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 sticky top-0">
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Date/Heure</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Type</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Raider</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Cible</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Source</th>
                </tr>
              </thead>
              <tbody>
                {raids.map((raid, index) => (
                  <tr
                    key={raid.id || index}
                    className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-gray-300">
                      {formatDate(raid.date)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          raid.type === 'fait'
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                            : 'bg-green-600/20 text-green-300 border border-green-500/30'
                        }`}
                      >
                        {raid.type === 'fait' ? 'Fait' : 'Reçu'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-white font-semibold">
                          {getMemberDisplayName(raid.raiderTwitchLogin || raid.raider)}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {raid.raiderTwitchLogin || raid.raider}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-white font-semibold">
                          {getMemberDisplayName(raid.targetTwitchLogin || raid.target)}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {raid.targetTwitchLogin || raid.target}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSourceColor(raid.source)}`}
                      >
                        {getSourceLabel(raid.source)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note sur l'ordre */}
      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 Les raids sont triés du plus récent au plus ancien (nouveaux en haut, anciens en bas).
          Cela permet de savoir facilement où vous vous êtes arrêté lors de la dernière consultation.
        </p>
      </div>
    </div>
  );
}


