"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess, isFounder } from "@/lib/adminRoles";
import Link from "next/link";
import { computeRaidStats, ComputedRaidStats } from "@/lib/computeRaidStats";
import RaidStatsCard from "@/components/RaidStatsCard";
import RaidCharts from "@/components/RaidCharts";
import RaidDailyChart, { type DailyRaidPoint } from "@/components/RaidDailyChart";
import RaidAlertBadge from "@/components/RaidAlertBadge";
import RaidDetailsModal from "@/components/admin/RaidDetailsModal";
import RaidImportModal from "@/components/admin/RaidImportModal";

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
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [unmatched, setUnmatched] = useState<any[]>([]);
  const [computedStats, setComputedStats] = useState<ComputedRaidStats | null>(null);
  const [selectedMember, setSelectedMember] = useState<{ twitchLogin: string; displayName: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [rawRaidsData, setRawRaidsData] = useState<any>(null); // Stocker les données brutes pour le filtrage
  const [sortColumn, setSortColumn] = useState<'membre' | 'done' | 'received'>('done');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicatesList, setDuplicatesList] = useState<Array<{ key: string; raider: string; target: string; date: string; count: number; raiderDisplay?: string; targetDisplay?: string }>>([]);
  const [deduplicating, setDeduplicating] = useState(false);

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
        
        // Mode manuel uniquement : ignorer complètement les raids Twitch/EventSub
        const filteredRaidsFaits = (data.raidsFaits || []).filter((raid: any) => {
          const source = raid.source || (raid.manual ? "admin" : "twitch-live");
          if (source === "discord") return false;
          return source === "manual" || source === "admin" || raid.manual;
        });
        
        const filteredRaidsRecus = (data.raidsRecus || []).filter((raid: any) => {
          const source = raid.source || (raid.manual ? "admin" : "twitch-live");
          if (source === "discord") return false;
          return source === "manual" || source === "admin" || raid.manual;
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
      const membersResponse = await fetch("/api/admin/members", {
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

  /** Vérifier les doublons : même raider, même cible, même date/heure */
  function checkDuplicates() {
    if (!rawRaidsData?.raidsFaits?.length) {
      setDuplicatesList([]);
      setShowDuplicatesModal(true);
      return;
    }
    const raidsFaits = rawRaidsData.raidsFaits as Array<{ raider: string; target: string; date: string; raiderDisplayName?: string; targetDisplayName?: string; raiderTwitchLogin?: string; targetTwitchLogin?: string }>;
    const groupKey = (r: typeof raidsFaits[0]) => `${r.raider}|${r.target}|${r.date}`;
    const byKey = new Map<string, typeof raidsFaits>();
    raidsFaits.forEach((r) => {
      const key = groupKey(r);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(r);
    });
    const duplicates = Array.from(byKey.entries())
      .filter(([, items]) => items.length > 1)
      .map(([key, items]) => {
        const first = items[0];
        return {
          key,
          raider: first.raider,
          target: first.target,
          date: first.date,
          count: items.length,
          raiderDisplay: first.raiderDisplayName || first.raiderTwitchLogin || first.raider,
          targetDisplay: first.targetDisplayName || first.targetTwitchLogin || first.target,
        };
      });
    setDuplicatesList(duplicates);
    setShowDuplicatesModal(true);
  }

  async function removeDuplicates() {
    if (duplicatesList.length === 0) return;
    if (!confirm(`Supprimer les doublons pour ce mois ?\n\n${duplicatesList.length} groupe(s) de doublons seront réduits à une seule entrée (même personne, même date/heure).`)) return;
    setDeduplicating(true);
    try {
      const response = await fetch("/api/discord/raids/deduplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`✅ ${data.message || "Doublons supprimés."}\n\nEntrées supprimées : ${data.removed?.total ?? 0}`);
        setShowDuplicatesModal(false);
        setDuplicatesList([]);
        loadData(selectedMonth);
      } else {
        alert(`❌ ${data.error || "Erreur lors de la suppression des doublons."}`);
      }
    } catch (e) {
      alert(`❌ ${e instanceof Error ? e.message : "Erreur réseau"}`);
    } finally {
      setDeduplicating(false);
    }
  }

  /** Données quotidiennes pour le graphique (raids faits / reçus par jour du mois) */
  const dailyChartData = useMemo((): DailyRaidPoint[] => {
    if (!rawRaidsData || !selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return [];
    const [year, monthNum] = selectedMonth.split("-").map((n) => parseInt(n, 10));
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    const filterManualOnly = (raid: any) => {
      const source = raid.source || (raid.manual ? "admin" : "twitch-live");
      if (source === "discord") return false;
      return source === "manual" || source === "admin" || raid.manual;
    };
    const filteredFaits = (rawRaidsData.raidsFaits || []).filter(filterManualOnly);
    const filteredRecus = (rawRaidsData.raidsRecus || []).filter(filterManualOnly);

    const byDay = new Map<number, { raidsFaits: number; raidsRecus: number }>();
    for (let d = 1; d <= daysInMonth; d++) byDay.set(d, { raidsFaits: 0, raidsRecus: 0 });

    filteredFaits.forEach((raid: any) => {
      const date = new Date(raid.date);
      if (date.getFullYear() !== year || date.getMonth() + 1 !== monthNum) return;
      const day = date.getDate();
      const cur = byDay.get(day)!;
      cur.raidsFaits += raid.count || 1;
    });
    filteredRecus.forEach((raid: any) => {
      const date = new Date(raid.date);
      if (date.getFullYear() !== year || date.getMonth() + 1 !== monthNum) return;
      const day = date.getDate();
      const cur = byDay.get(day)!;
      cur.raidsRecus += 1;
    });

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const cur = byDay.get(day)!;
      return { day, raidsFaits: cur.raidsFaits, raidsRecus: cur.raidsRecus };
    });
  }, [rawRaidsData, selectedMonth]);

  const handleSort = (column: 'membre' | 'done' | 'received') => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouvelle colonne, trier par défaut en ordre décroissant pour les nombres, croissant pour membre
      setSortColumn(column);
      setSortDirection(column === 'membre' ? 'asc' : 'desc');
    }
  };

  const getSortedEntries = () => {
    const entries = Object.entries(raids);
    
    return entries.sort((a, b) => {
      const [loginA, statsA] = a;
      const [loginB, statsB] = b;
      
      let comparison = 0;
      
      switch (sortColumn) {
        case 'membre':
          const nameA = getMemberDisplayName(loginA).toLowerCase();
          const nameB = getMemberDisplayName(loginB).toLowerCase();
          comparison = nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
          break;
        case 'done':
          comparison = statsA.done - statsB.done;
          break;
        case 'received':
          comparison = statsA.received - statsB.received;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
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
      <h1 className="text-4xl font-bold text-white mb-8">Suivi des Raids (manuel)</h1>

      {/* En-tête avec sélecteur de mois et boutons */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              Raids TENF - mode manuel
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
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              title="Importer des raids manuellement depuis du texte (avec détection automatique des doublons)"
            >
              📥 Importer des raids manuellement
            </button>
            <button
              onClick={checkDuplicates}
              className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              title="Détecter les doublons : même personne, même date, même heure"
            >
              🔍 Vérifier les doublons
            </button>
            <Link
              href={`/admin/raids/review?month=${selectedMonth}`}
              className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              🔧 Vérifier les raids non reconnus
            </Link>
            {currentAdmin?.isFounder && (
              <button
                onClick={async () => {
                  const confirmMessage = `⚠️ ATTENTION : Cette action est irréversible !\n\nVoulez-vous supprimer TOUS les raids manuels pour le mois ${selectedMonth} ?`;
                  if (!confirm(confirmMessage)) {
                    return;
                  }
                  try {
                    const response = await fetch(`/api/discord/raids/delete-manual?month=${selectedMonth}`, {
                      method: "DELETE",
                    });
                    const data = await response.json();
                    if (response.ok) {
                      alert(`✅ ${data.message}\n\n- Raids faits supprimés: ${data.deleted.raidsFaits}\n- Raids reçus supprimés: ${data.deleted.raidsRecus}\n- Total: ${data.deleted.total}`);
                      loadData(selectedMonth);
                    } else {
                      alert(`❌ Erreur: ${data.error || 'Erreur inconnue'}`);
                    }
                  } catch (error) {
                    console.error("Erreur lors de la suppression:", error);
                    alert("❌ Erreur lors de la suppression des raids manuels");
                  }
                }}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-300 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                title="Supprimer tous les raids manuels du mois (Fondateurs uniquement)"
              >
                🗑️ Supprimer tous les raids manuels
              </button>
            )}
            
            {/* Bouton pour supprimer tous les raids non reconnus (Fondateurs uniquement) */}
            {currentAdmin?.isFounder && (
              <button
                onClick={async () => {
                  if (!confirm(`Êtes-vous sûr de vouloir supprimer TOUS les raids non reconnus du mois ${selectedMonth} ?\n\nCette action est irréversible.`)) {
                    return;
                  }
                  
                  try {
                    const response = await fetch(`/api/discord/raids/unmatched/delete-all?month=${selectedMonth}`, {
                      method: "DELETE",
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                      alert(`✅ ${data.deleted || 0} raid(s) non reconnu(s) supprimé(s) avec succès !`);
                      // Recharger les données
                      loadData(selectedMonth);
                    } else {
                      alert(`❌ Erreur : ${data.error || "Erreur inconnue"}`);
                    }
                  } catch (error) {
                    alert(`❌ Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                title="Supprimer tous les raids non reconnus du mois (Fondateurs uniquement)"
              >
                🗑️ Supprimer tous les raids non reconnus
              </button>
            )}
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

        {/* Bandeau : raids par jour (courbes faits / reçus) */}
        <RaidDailyChart month={selectedMonth} data={dailyChartData} />

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
                    <button
                      onClick={() => handleSort('membre')}
                      className="flex items-center gap-2 hover:text-[#9146ff] transition-colors cursor-pointer"
                    >
                      Membre
                      {sortColumn === 'membre' && (
                        <span className="text-[#9146ff]">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                    <button
                      onClick={() => handleSort('done')}
                      className="flex items-center gap-2 hover:text-[#9146ff] transition-colors cursor-pointer"
                    >
                      Raids faits
                      {sortColumn === 'done' && (
                        <span className="text-[#9146ff]">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                    <button
                      onClick={() => handleSort('received')}
                      className="flex items-center gap-2 hover:text-[#9146ff] transition-colors cursor-pointer"
                    >
                      Raids reçus
                      {sortColumn === 'received' && (
                        <span className="text-[#9146ff]">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
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
                  getSortedEntries().map(([twitchLogin, stats]) => {
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
                            <span className="text-white font-semibold">{stats.done}</span>
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

        {/* Modal d'import manuel */}
        <RaidImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          month={selectedMonth}
          onImportComplete={() => {
            loadData(selectedMonth);
          }}
          getMemberDisplayName={getMemberDisplayName}
        />

        {/* Modal vérification des doublons (même personne, même date, même heure) */}
        {showDuplicatesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Vérification des doublons</h2>
                <p className="text-gray-400 text-sm mt-1">Même raideur, même cible, même date/heure</p>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {duplicatesList.length === 0 ? (
                  <p className="text-gray-300">Aucun doublon trouvé pour ce mois.</p>
                ) : (
                  <>
                    <p className="text-gray-300 mb-4">
                      {duplicatesList.length} groupe(s) de doublons détecté(s). Vous pouvez les supprimer en conservant une seule entrée par groupe.
                    </p>
                    <ul className="space-y-2">
                      {duplicatesList.map((dup) => (
                        <li key={dup.key} className="flex items-center justify-between gap-4 py-2 px-3 bg-gray-800/50 rounded-lg text-sm">
                          <span className="text-white">
                            {getMemberDisplayName(dup.raiderDisplay ?? dup.raider)} → {getMemberDisplayName(dup.targetDisplay ?? dup.target)}
                          </span>
                          <span className="text-gray-400 shrink-0">{dup.date}</span>
                          <span className="text-amber-400 font-medium shrink-0">{dup.count} entrée(s)</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDuplicatesModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium"
                >
                  Fermer
                </button>
                {duplicatesList.length > 0 && (
                  <button
                    type="button"
                    onClick={removeDuplicates}
                    disabled={deduplicating}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium"
                  >
                    {deduplicating ? "Suppression…" : "Supprimer les doublons"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

