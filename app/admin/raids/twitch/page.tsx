"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";
import Link from "next/link";
import RaidStatsCard from "@/components/RaidStatsCard";
import RaidCharts from "@/components/RaidCharts";
import RaidAlertBadge from "@/components/RaidAlertBadge";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres" },
  { href: "/admin/raids", label: "Suivi des Raids Discord" },
  { href: "/admin/raids/twitch", label: "Suivi des Raids Twitch", active: true },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
  { href: "/admin/spotlight", label: "Gestion Spotlight" },
  { href: "/admin/logs", label: "Logs" },
];

export interface RaidStats {
  done: number;
  received: number;
  targets: Record<string, number>;
}

export interface MonthlyRaids {
  [twitchLogin: string]: RaidStats;
}

export default function TwitchRaidsPage() {
  const [raids, setRaids] = useState<MonthlyRaids>({});
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [computedStats, setComputedStats] = useState<any>(null);

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        setCurrentAdmin({ id: user.id, username: user.username });
      }
    }
    loadAdmin();

    // Initialiser le mois actuel
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
      
      // Charger uniquement les raids Twitch depuis l'API
      const dataResponse = await fetch(
        `/api/raids/twitch?month=${monthToLoad}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );
      
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        
        // Convertir les données au format attendu par le dashboard
        const raidsByMember: Record<string, any> = {};
        
        // Grouper les raids faits par membre (uniquement Twitch)
        (data.raidsFaits || []).forEach((raid: any) => {
          // Utiliser raider (qui peut être un Discord ID ou Twitch Login)
          const memberKey = raid.raider?.toLowerCase() || '';
          if (!memberKey) return;
          
          if (!raidsByMember[memberKey]) {
            raidsByMember[memberKey] = {
              done: 0,
              received: 0,
              targets: {},
            };
          }
          raidsByMember[memberKey].done += raid.count || 1;
          
          // Utiliser target (qui peut être un Discord ID ou Twitch Login)
          const targetKey = raid.target?.toLowerCase() || '';
          if (targetKey) {
            if (!raidsByMember[memberKey].targets[targetKey]) {
              raidsByMember[memberKey].targets[targetKey] = 0;
            }
            raidsByMember[memberKey].targets[targetKey] += raid.count || 1;
          }
        });
        
        // Grouper les raids reçus par membre (uniquement Twitch)
        (data.raidsRecus || []).forEach((raid: any) => {
          // Utiliser target (qui peut être un Discord ID ou Twitch Login)
          const memberKey = raid.target?.toLowerCase() || '';
          if (!memberKey) return;
          
          if (!raidsByMember[memberKey]) {
            raidsByMember[memberKey] = {
              done: 0,
              received: 0,
              targets: {},
            };
          }
          raidsByMember[memberKey].received += 1;
        });
        
        setRaids(raidsByMember);
        
        // Calculer les stats
        const totalRaidsFaits = data.totalRaidsFaits || 0;
        const totalRaidsRecus = data.totalRaidsRecus || 0;
        const raidersSet = new Set((data.raidsFaits || []).map((r: any) => (r.raider || '').toLowerCase()).filter(Boolean));
        const targetsSet = new Set((data.raidsRecus || []).map((r: any) => (r.target || '').toLowerCase()).filter(Boolean));
        
        // Top raideur
        const raiderCounts: Record<string, number> = {};
        (data.raidsFaits || []).forEach((r: any) => {
          const key = (r.raider || '').toLowerCase();
          if (key) {
            raiderCounts[key] = (raiderCounts[key] || 0) + (r.count || 1);
          }
        });
        const topRaider = Object.entries(raiderCounts).sort(([, a], [, b]) => b - a)[0];
        
        // Top cible
        const targetCounts: Record<string, number> = {};
        (data.raidsRecus || []).forEach((r: any) => {
          const key = (r.target || '').toLowerCase();
          if (key) {
            targetCounts[key] = (targetCounts[key] || 0) + 1;
          }
        });
        const topTarget = Object.entries(targetCounts).sort(([, a], [, b]) => b - a)[0];
        
        setComputedStats({
          totalDone: totalRaidsFaits,
          totalReceived: totalRaidsRecus,
          unmatchedCount: 0,
          activeRaidersCount: raidersSet.size,
          uniqueTargetsCount: targetsSet.size,
          topRaider: topRaider ? {
            name: topRaider[0],
            count: topRaider[1],
          } : null,
          topTarget: topTarget ? {
            name: topTarget[0],
            count: topTarget[1],
          } : null,
          alerts: [], // Les alertes seront calculées depuis les données
        });
      } else {
        const error = await dataResponse.json();
        console.error("[Twitch Raids Page] Erreur API:", error);
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
          <p className="text-gray-400">Chargement des raids Twitch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        <AdminHeader title="Suivi des Raids Twitch" navLinks={navLinks} />

        {/* En-tête avec sélecteur de mois */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              Raids Twitch TENF (EventSub)
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
              href={`/admin/raids?month=${selectedMonth}`}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              ← Retour aux raids Discord
            </Link>
            <button
              onClick={async () => {
                if (!confirm("Voulez-vous synchroniser les raids Twitch EventSub ?\n\nCela va créer ou vérifier la subscription EventSub pour recevoir les raids en direct.")) {
                  return;
                }
                try {
                  const response = await fetch("/api/twitch/setup-eventsub", {
                    method: "POST",
                  });
                  const data = await response.json();
                  if (response.ok) {
                    alert(`✅ ${data.message}\n\nStatus: ${data.subscription}`);
                  } else {
                    alert(`❌ Erreur: ${data.error}`);
                  }
                } catch (error) {
                  console.error("Erreur lors de la synchronisation:", error);
                  alert("Erreur lors de la synchronisation Twitch EventSub");
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              title="Synchroniser les raids Twitch EventSub"
            >
              🟣 Synchroniser EventSub
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
                    Alertes
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(raids).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      Aucun raid Twitch enregistré pour ce mois
                    </td>
                  </tr>
                ) : (
                  Object.entries(raids)
                    .sort((a, b) => b[1].done - a[1].done)
                    .map(([twitchLogin, stats]) => {
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
                              <span className="text-purple-400 text-xs">🟣 Twitch</span>
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
                            {excessive ? (
                              <RaidAlertBadge
                                alerts={Object.entries(stats.targets)
                                  .filter(([, count]) => count > 3)
                                  .map(([target, count]) => ({
                                    raider: twitchLogin,
                                    target,
                                    count: count as number,
                                  }))}
                              />
                            ) : (
                              <span className="text-gray-500 text-sm">-</span>
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

