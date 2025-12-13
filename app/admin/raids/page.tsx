"use client";

import { useState, useEffect } from "react";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";
import Link from "next/link";
import { computeRaidStats, ComputedRaidStats } from "@/lib/computeRaidStats";
import RaidStatsCard from "@/components/RaidStatsCard";
import RaidCharts from "@/components/RaidCharts";
import RaidAlertBadge from "@/components/RaidAlertBadge";
import RaidDetailsModal from "@/components/admin/RaidDetailsModal";
import RaidScanModal from "@/components/admin/RaidScanModal";

export interface RaidStats {
  done: number;
  received: number;
  targets: Record<string, number>;
}

export interface MonthlyRaids {
  [twitchLogin: string]: RaidStats;
}

export default function RaidsPage() {
  const [raids, setRaids] = useState<MonthlyRaids>({});
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [unmatched, setUnmatched] = useState<any[]>([]);
  const [computedStats, setComputedStats] = useState<ComputedRaidStats | null>(null);
  const [selectedMember, setSelectedMember] = useState<{ twitchLogin: string; displayName: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [sourceFilters, setSourceFilters] = useState({
    discord: true,
    twitch: true,
    manual: true,
  });
  const [rawRaidsData, setRawRaidsData] = useState<any>(null); // Stocker les données brutes pour le filtrage

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
      
      // Charger les données depuis la nouvelle API v2
      const dataResponse = await fetch(
        `/api/discord/raids/data-v2?month=${monthToLoad}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );
      
      let raidsData: any = { raids: {} };
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        
        // Convertir les données au format attendu par le dashboard
        const raidsByMember: Record<string, any> = {};
        
        // Stocker les données brutes pour le filtrage
        setRawRaidsData(data);
        
        // Filtrer selon les sources sélectionnées
        const filteredRaidsFaits = (data.raidsFaits || []).filter((raid: any) => {
          const source = raid.source || (raid.manual ? "admin" : "bot");
          if (source === "twitch-live" || source === "bot") return sourceFilters.twitch;
          if (source === "discord") return sourceFilters.discord;
          if (source === "manual" || source === "admin" || raid.manual) return sourceFilters.manual;
          return true; // Par défaut, inclure si source inconnue
        });
        
        const filteredRaidsRecus = (data.raidsRecus || []).filter((raid: any) => {
          const source = raid.source || (raid.manual ? "admin" : "bot");
          if (source === "twitch-live" || source === "bot") return sourceFilters.twitch;
          if (source === "discord") return sourceFilters.discord;
          if (source === "manual" || source === "admin" || raid.manual) return sourceFilters.manual;
          return true;
        });
        
        // Grouper les raids faits par membre (après filtrage)
        filteredRaidsFaits.forEach((raid: any) => {
          const memberKey = raid.raiderTwitchLogin || raid.raider;
          if (!raidsByMember[memberKey]) {
            raidsByMember[memberKey] = {
              done: 0,
              received: 0,
              targets: {},
            };
          }
          raidsByMember[memberKey].done += raid.count || 1;
          const targetKey = raid.targetTwitchLogin || raid.target;
          if (!raidsByMember[memberKey].targets[targetKey]) {
            raidsByMember[memberKey].targets[targetKey] = 0;
          }
          raidsByMember[memberKey].targets[targetKey] += raid.count || 1;
        });
        
        // Grouper les raids reçus par membre (après filtrage)
        filteredRaidsRecus.forEach((raid: any) => {
          const memberKey = raid.targetTwitchLogin || raid.target;
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
        
        // Mettre à jour les stats
        setComputedStats({
          totalDone: data.stats?.totalRaidsFaits || 0,
          totalReceived: data.stats?.totalRaidsRecus || 0,
          unmatchedCount: 0, // Sera mis à jour plus bas
          activeRaidersCount: data.stats?.activeRaiders || 0,
          uniqueTargetsCount: data.stats?.uniqueTargets || 0,
          topRaider: data.stats?.topRaider ? {
            name: data.stats.topRaider.twitchLogin,
            count: data.stats.topRaider.count,
          } : null,
          topTarget: data.stats?.topTarget ? {
            name: data.stats.topTarget.twitchLogin,
            count: data.stats.topTarget.count,
          } : null,
          alerts: (data.alerts || []).map((alert: any) => ({
            raider: alert.raiderTwitchLogin || alert.raider,
            target: alert.targetTwitchLogin || alert.target,
            count: alert.count,
          })),
        });
      } else {
        const error = await dataResponse.json();
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

      // Mettre à jour le compteur unmatched dans les stats
      if (unmatchedData.unmatched) {
        setComputedStats(prev => prev ? {
          ...prev,
          unmatchedCount: unmatchedData.unmatched.length,
        } : null);
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
  
  function handleSourceFilterChange(source: 'discord' | 'twitch' | 'manual') {
    const newFilters = {
      ...sourceFilters,
      [source]: !sourceFilters[source],
    };
    setSourceFilters(newFilters);
    
    // Recalculer avec les nouveaux filtres
    if (rawRaidsData) {
      const filteredRaidsFaits = (rawRaidsData.raidsFaits || []).filter((raid: any) => {
        const raidSource = raid.source || (raid.manual ? "manual" : "discord");
        if (raidSource === "twitch-live") return newFilters.twitch;
        if (raidSource === "discord") return newFilters.discord;
        if (raidSource === "manual" || raid.manual) return newFilters.manual;
        return true;
      });
      
      const filteredRaidsRecus = (rawRaidsData.raidsRecus || []).filter((raid: any) => {
        const raidSource = raid.source || (raid.manual ? "manual" : "discord");
        if (raidSource === "twitch-live") return newFilters.twitch;
        if (raidSource === "discord") return newFilters.discord;
        if (raidSource === "manual" || raid.manual) return newFilters.manual;
        return true;
      });
      
      // Recalculer les stats
      const raidsByMember: Record<string, any> = {};
      filteredRaidsFaits.forEach((raid: any) => {
        const memberKey = raid.raiderTwitchLogin || raid.raider;
        if (!raidsByMember[memberKey]) {
          raidsByMember[memberKey] = { done: 0, received: 0, targets: {} };
        }
        raidsByMember[memberKey].done += raid.count || 1;
        const targetKey = raid.targetTwitchLogin || raid.target;
        if (!raidsByMember[memberKey].targets[targetKey]) {
          raidsByMember[memberKey].targets[targetKey] = 0;
        }
        raidsByMember[memberKey].targets[targetKey] += raid.count || 1;
      });
      
      filteredRaidsRecus.forEach((raid: any) => {
        const memberKey = raid.targetTwitchLogin || raid.target;
        if (!raidsByMember[memberKey]) {
          raidsByMember[memberKey] = { done: 0, received: 0, targets: {} };
        }
        raidsByMember[memberKey].received += 1;
      });
      
      setRaids(raidsByMember);
      
      const totalRaidsFaits = filteredRaidsFaits.reduce((sum: number, r: any) => sum + (r.count || 1), 0);
      const totalRaidsRecus = filteredRaidsRecus.length;
      const raidersSet = new Set(filteredRaidsFaits.map((r: any) => r.raiderTwitchLogin || r.raider));
      const targetsSet = new Set(filteredRaidsRecus.map((r: any) => r.targetTwitchLogin || r.target));
      
      const raiderCounts: Record<string, number> = {};
      filteredRaidsFaits.forEach((r: any) => {
        const key = r.raiderTwitchLogin || r.raider;
        raiderCounts[key] = (raiderCounts[key] || 0) + (r.count || 1);
      });
      const topRaider = Object.entries(raiderCounts).sort(([, a], [, b]) => b - a)[0];
      
      const targetCounts: Record<string, number> = {};
      filteredRaidsRecus.forEach((r: any) => {
        const key = r.targetTwitchLogin || r.target;
        targetCounts[key] = (targetCounts[key] || 0) + 1;
      });
      const topTarget = Object.entries(targetCounts).sort(([, a], [, b]) => b - a)[0];
      
      setComputedStats(prev => prev ? {
        ...prev,
        totalDone: totalRaidsFaits,
        totalReceived: totalRaidsRecus,
        activeRaidersCount: raidersSet.size,
        uniqueTargetsCount: targetsSet.size,
        topRaider: topRaider ? { name: topRaider[0], count: topRaider[1] } : null,
        topTarget: topTarget ? { name: topTarget[0], count: topTarget[1] } : null,
      } : null);
    }
  }

  function scanRaids(scanAllHistory: boolean = false) {
    // Ouvrir le modal de scan (le modal gère le mode de scan)
    setIsScanModalOpen(true);
  }
  
  function handleScanComplete(results: any) {
    // Recharger les données après le scan
    loadData(selectedMonth);
  }

  const getMemberDisplayName = (twitchLogin: string): string => {
    const member = members.find(m => m.twitchLogin.toLowerCase() === twitchLogin.toLowerCase());
    return member?.displayName || twitchLogin;
  };
  
  // Fonction pour obtenir la répartition des sources pour un membre
  const getMemberSourceBreakdown = (twitchLogin: string): { discord: number; twitch: number; manual: number } => {
    if (!rawRaidsData) return { discord: 0, twitch: 0, manual: 0 };
    
    const raidsFaits = (rawRaidsData.raidsFaits || []).filter((r: any) => 
      (r.raiderTwitchLogin || r.raider).toLowerCase() === twitchLogin.toLowerCase()
    );
    
    const breakdown = { discord: 0, twitch: 0, manual: 0 };
    raidsFaits.forEach((raid: any) => {
      const source = raid.source || (raid.manual ? "admin" : "bot");
      if (source === "twitch-live" || source === "bot") breakdown.twitch += raid.count || 1;
      else if (source === "manual" || source === "admin" || raid.manual) breakdown.manual += raid.count || 1;
      else breakdown.discord += raid.count || 1;
    });
    
    return breakdown;
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
    <>
      <div className="text-white">
      <h1 className="text-4xl font-bold text-white mb-8">Suivi des Raids</h1>

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
              
              {/* Filtres de source */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-700">
                <span className="text-gray-400 text-sm">Sources :</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sourceFilters.discord}
                    onChange={() => handleSourceFilterChange('discord')}
                    className="w-4 h-4 text-[#9146ff] rounded"
                  />
                  <span className="text-gray-300 text-sm">Discord</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sourceFilters.twitch}
                    onChange={() => handleSourceFilterChange('twitch')}
                    className="w-4 h-4 text-[#9146ff] rounded"
                  />
                  <span className="text-gray-300 text-sm">Twitch</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sourceFilters.manual}
                    onChange={() => handleSourceFilterChange('manual')}
                    className="w-4 h-4 text-[#9146ff] rounded"
                  />
                  <span className="text-gray-300 text-sm">Manuel</span>
                </label>
              </div>
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
            <button
              onClick={async () => {
                if (!confirm("Voulez-vous créer les subscriptions Twitch EventSub ?\n\nCela va créer des subscriptions EventSub pour tous les membres actifs avec un login Twitch.")) {
                  return;
                }
                try {
                  const response = await fetch("/api/twitch/eventsub/subscribe", {
                    method: "POST",
                  });
                  const data = await response.json();
                  if (response.ok) {
                    const summary = data.summary || {};
                    alert(`✅ ${data.message}\n\nRésumé:\n- Créées: ${summary.created || 0}\n- Déjà actives: ${summary.alreadyExists || 0}\n- Erreurs: ${summary.errors || 0}\n\nTotal: ${summary.total || 0} membres`);
                  } else {
                    const errorMsg = data.error || 'Erreur inconnue';
                    const detailsMsg = data.message ? `\n\n${data.message}` : '';
                    const configMsg = data.details ? `\n\n${data.details}` : '';
                    alert(`❌ Erreur: ${errorMsg}${detailsMsg}${configMsg}`);
                  }
                } catch (error) {
                  console.error("Erreur lors de la synchronisation:", error);
                  alert("Erreur lors de la création des subscriptions Twitch EventSub\n\nVérifiez que les variables d'environnement sont configurées:\n- TWITCH_EVENTSUB_SECRET\n- TWITCH_APP_CLIENT_ID ou TWITCH_CLIENT_ID\n- TWITCH_CLIENT_SECRET");
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              title="Créer les subscriptions Twitch EventSub"
            >
              🟣 Créer subscriptions EventSub
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
                            <button
                              onClick={() => {
                                setSelectedMember({
                                  twitchLogin,
                                  displayName: getMemberDisplayName(twitchLogin),
                                });
                                setIsModalOpen(true);
                              }}
                              className="flex items-center gap-2 hover:text-[#9146ff] transition-colors cursor-pointer"
                            >
                              <span className="font-semibold text-white">
                                {getMemberDisplayName(twitchLogin)}
                              </span>
                              <span className="text-gray-500 text-sm">
                                ({twitchLogin})
                              </span>
                              <span className="text-gray-600 text-xs">👁️</span>
                            </button>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">
                                {stats.done}
                              </span>
                              {(() => {
                                const breakdown = getMemberSourceBreakdown(twitchLogin);
                                const sources: string[] = [];
                                if (breakdown.discord > 0) sources.push(`Discord: ${breakdown.discord}`);
                                if (breakdown.twitch > 0) sources.push(`Twitch: ${breakdown.twitch}`);
                                if (breakdown.manual > 0) sources.push(`Manuel: ${breakdown.manual}`);
                                if (sources.length > 0) {
                                  return (
                                    <span className="text-xs text-gray-500" title={sources.join(', ')}>
                                      ({sources.length > 1 ? 'mixte' : sources[0].split(':')[0]})
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-white font-semibold">
                              {stats.received}
                            </span>
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

        {/* Modal des détails des raids */}
        {selectedMember && (
          <RaidDetailsModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedMember(null);
            }}
            memberTwitchLogin={selectedMember.twitchLogin}
            memberDisplayName={selectedMember.displayName}
            month={selectedMonth}
            getMemberDisplayName={getMemberDisplayName}
            onRefresh={() => loadData(selectedMonth)}
          />
        )}

        {/* Modal de scan */}
        <RaidScanModal
          isOpen={isScanModalOpen}
          onClose={() => setIsScanModalOpen(false)}
          month={selectedMonth}
          onScanComplete={handleScanComplete}
        />
      </div>
    </div>
    </>
  );
}

