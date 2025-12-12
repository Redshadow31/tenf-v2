"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";
import Link from "next/link";
import { computeRaidStats, ComputedRaidStats } from "@/lib/computeRaidStats";
import RaidStatsCard from "@/components/RaidStatsCard";
import RaidCharts from "@/components/RaidCharts";
import RaidAlertBadge from "@/components/RaidAlertBadge";

export interface RaidStats {
  done: number;
  received: number;
  targets: Record<string, number>;
}

export interface MonthlyRaids {
  [twitchLogin: string]: RaidStats;
}

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres" },
  { href: "/admin/raids", label: "Suivi des Raids", active: true },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
  { href: "/admin/spotlight", label: "Gestion Spotlight" },
  { href: "/admin/logs", label: "Logs" },
];

export default function RaidsPage() {
  const [raids, setRaids] = useState<MonthlyRaids>({});
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [unmatched, setUnmatched] = useState<any[]>([]);
  const [computedStats, setComputedStats] = useState<ComputedRaidStats | null>(null);

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        setCurrentAdmin({ id: user.id, username: user.username });
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
      
      // Charger les raids du mois sélectionné (avec conversion Discord ID -> Twitch Login)
      const raidsUrl = monthToLoad 
        ? `/api/discord/raids?month=${monthToLoad}`
        : "/api/discord/raids";
      
      const raidsResponse = await fetch(raidsUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      let raidsData: any = { raids: {} };
      if (raidsResponse.ok) {
        raidsData = await raidsResponse.json();
        console.log("[Raids Page] Données reçues:", {
          raidsCount: Object.keys(raidsData.raids || {}).length,
          month: raidsData.month,
        });
        setRaids(raidsData.raids || {});
      } else {
        const error = await raidsResponse.json();
        console.error("[Raids Page] Erreur API:", error);
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

      // Charger les raids non reconnus pour les statistiques
      let unmatchedData: any = { unmatched: [] };
      const unmatchedResponse = await fetch(`/api/discord/raids/unmatched?month=${monthToLoad}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (unmatchedResponse.ok) {
        unmatchedData = await unmatchedResponse.json();
        setUnmatched(unmatchedData.unmatched || []);
      }

      // Calculer les statistiques
      const stats = computeRaidStats(raidsData.raids || {}, unmatchedData.unmatched || []);
      setComputedStats(stats);
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

  async function scanRaids(scanAllHistory: boolean = false) {
    try {
      const url = scanAllHistory 
        ? "/api/discord/raids/scan"
        : `/api/discord/raids/scan?month=${selectedMonth}`;
      
      const response = await fetch(url, {
        method: "POST",
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        let message = 
          `Scan terminé :\n` +
          `- ${data.messagesInMonth || data.messagesScanned || 0} message(s) du mois scanné(s)\n` +
          `- ${data.messagesWithRaids || 0} message(s) avec raids détectés\n` +
          `- ${data.newRaidsAdded || 0} nouveau(x) raid(s) ajouté(s) en attente\n` +
          `- ${data.raidsValidated || 0} raid(s) validé(s)\n` +
          `- ${data.raidsRejected || 0} raid(s) rejeté(s)\n`;
        
        if (data.messagesNotRecognized > 0) {
          message += `- ${data.messagesNotRecognized} message(s) non reconnus\n`;
        }
        
        if (data.errors && data.errors.length > 0) {
          message += `\n⚠️ ${data.errors.length} erreur(s) (voir console pour détails)\n`;
          console.warn('[Raid Scan] Erreurs:', data.errors);
        }
        
        if (data.unrecognizedMessages && data.unrecognizedMessages.length > 0) {
          console.warn('[Raid Scan] Messages non reconnus:', data.unrecognizedMessages);
        }
        
        if (data.maxReached) {
          message += `\n⚠️ Maximum de messages atteint (5000), le scan a été arrêté.`;
        }
        
        alert(message);
        await loadData(selectedMonth);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur lors du scan:", error);
      alert("Erreur lors du scan des raids");
    }
  }

  const getMemberDisplayName = (twitchLogin: string): string => {
    const member = members.find(m => m.twitchLogin.toLowerCase() === twitchLogin.toLowerCase());
    return member?.displayName || twitchLogin;
  };

  const hasExcessiveRaids = (stats: RaidStats): boolean => {
    for (const count of Object.values(stats.targets)) {
      if (count > 3) {
        return true;
      }
    }
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des raids...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        <AdminHeader title="Suivi des Raids" navLinks={navLinks} />

        {/* En-tête avec sélecteur de mois et boutons */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              Raids TENF
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
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/raids/review?month=${selectedMonth}`}
              className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              🔧 Vérifier les raids non reconnus
            </Link>
            <button
              onClick={() => scanRaids(false)}
              className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              title={`Scanner uniquement le mois ${selectedMonth}`}
            >
              ⚡ Scanner ce mois uniquement
            </button>
            <button
              onClick={() => scanRaids(true)}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              title="Scanner tout l'historique (peut être long)"
            >
              🔄 Scanner tout l'historique
            </button>
          </div>
        </div>

        {/* Statistiques des raids */}
        {computedStats && (
          <RaidStatsCard
            stats={computedStats}
            month={selectedMonth}
            getMemberDisplayName={getMemberDisplayName}
          />
        )}

        {/* Graphiques */}
        {Object.keys(raids).length > 0 && (
          <RaidCharts raids={raids} getMemberDisplayName={getMemberDisplayName} />
        )}

        {/* Tableau des raids */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                    Membre
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                    Raids faits
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                    Raids reçus
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                    Détail des raids
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                    Alertes
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(raids).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Aucun raid enregistré pour ce mois
                    </td>
                  </tr>
                ) : (
                  Object.entries(raids)
                    .sort((a, b) => b[1].done - a[1].done)
                    .map(([twitchLogin, stats]) => {
                      // Trouver les alertes pour ce membre
                      const memberAlerts = computedStats?.alerts.filter(
                        (alert) => alert.raider === twitchLogin
                      ) || [];
                      const excessive = hasExcessiveRaids(stats);
                      
                      return (
                        <tr
                          key={twitchLogin}
                          className={`border-b border-gray-700 hover:bg-gray-800/50 transition-colors ${
                            excessive ? "bg-red-900/20" : ""
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">
                                {getMemberDisplayName(twitchLogin)}
                              </span>
                              <span className="text-gray-500 text-sm">
                                ({twitchLogin})
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-white font-semibold">
                              {stats.done}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-white font-semibold">
                              {stats.received}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(stats.targets).map(([target, count]) => (
                                <span
                                  key={target}
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    count >= 3
                                      ? "bg-red-900/30 text-red-300 border border-red-700"
                                      : "bg-gray-700 text-gray-300"
                                  }`}
                                  title={`${count} raid(s) vers ${getMemberDisplayName(target)}`}
                                >
                                  {getMemberDisplayName(target)}: {count}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {memberAlerts.length > 0 ? (
                              <RaidAlertBadge
                                alerts={memberAlerts}
                                getMemberDisplayName={getMemberDisplayName}
                              />
                            ) : (
                              <span className="text-gray-500 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

