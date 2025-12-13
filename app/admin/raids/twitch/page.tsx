"use client";

import { useState, useEffect } from "react";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";
import Link from "next/link";
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

export default function TwitchRaidsPage() {
  const [raids, setRaids] = useState<MonthlyRaids>({});
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [computedStats, setComputedStats] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    checked: boolean;
    hasError: boolean;
    errorMessage?: string;
    isActive?: boolean;
    subscription?: {
      id?: string;
      monitor?: { login?: string; twitchId?: string };
    };
    totalMembers?: number;
  }>({ checked: false, hasError: false });

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        setCurrentAdmin({ id: user.id, username: user.username });
      }
    }
    loadAdmin();

    // Vérifier le statut de la souscription globale EventSub
    async function checkSubscriptionStatus() {
      try {
        const response = await fetch("/api/twitch/eventsub/subscribe");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus({
            checked: true,
            hasError: false,
            isActive: data.isActive || false,
            subscription: data.subscription || undefined,
            totalMembers: data.totalMembers || 0,
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          setSubscriptionStatus({
            checked: true,
            hasError: true,
            errorMessage: errorData.error || "Impossible de vérifier le statut de la souscription globale",
          });
        }
      } catch (error) {
        console.error("[Twitch Raids] Erreur vérification subscription:", error);
        setSubscriptionStatus({
          checked: true,
          hasError: true,
          errorMessage: "Erreur lors de la vérification de la souscription globale EventSub",
        });
      }
    }
    checkSubscriptionStatus();

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
      const monthToLoad = month || selectedMonth || '';
      
      if (!monthToLoad) {
        console.warn("[Twitch Raids] Aucun mois sélectionné");
        setRaids({});
        setComputedStats(null);
        setLoading(false);
        return;
      }
      
      // Charger uniquement les raids Twitch depuis l'API
      let data: any = null;
      try {
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
          try {
            data = await dataResponse.json();
          } catch (jsonError) {
            console.error("[Twitch Raids] Erreur parsing JSON:", jsonError);
            data = null;
          }
        } else {
          // Si l'API retourne une erreur, on continue avec des données vides
          console.warn("[Twitch Raids] API retourne une erreur:", dataResponse.status);
          try {
            const errorData = await dataResponse.json().catch(() => ({}));
            console.warn("[Twitch Raids] Détails erreur:", errorData);
          } catch (e) {
            // Ignorer les erreurs de parsing
          }
        }
      } catch (fetchError) {
        console.error("[Twitch Raids] Erreur fetch:", fetchError);
        data = null;
      }
      
      // Convertir les données au format attendu par le dashboard
      const raidsByMember: Record<string, any> = {};
      
      // Grouper les raids faits par membre (uniquement Twitch)
      if (data?.raidsFaits && Array.isArray(data.raidsFaits)) {
        data.raidsFaits.forEach((raid: any) => {
          if (!raid || typeof raid !== 'object') return;
          
          // Utiliser raider (qui peut être un Discord ID ou Twitch Login)
          const memberKey = raid.raider?.toLowerCase?.() || '';
          if (!memberKey) return;
          
          if (!raidsByMember[memberKey]) {
            raidsByMember[memberKey] = {
              done: 0,
              received: 0,
              targets: {},
            };
          }
          raidsByMember[memberKey].done += Number(raid.count) || 1;
          
          // Utiliser target (qui peut être un Discord ID ou Twitch Login)
          const targetKey = raid.target?.toLowerCase?.() || '';
          if (targetKey) {
            if (!raidsByMember[memberKey].targets) {
              raidsByMember[memberKey].targets = {};
            }
            if (!raidsByMember[memberKey].targets[targetKey]) {
              raidsByMember[memberKey].targets[targetKey] = 0;
            }
            raidsByMember[memberKey].targets[targetKey] += Number(raid.count) || 1;
          }
        });
      }
      
      // Grouper les raids reçus par membre (uniquement Twitch)
      if (data?.raidsRecus && Array.isArray(data.raidsRecus)) {
        data.raidsRecus.forEach((raid: any) => {
          if (!raid || typeof raid !== 'object') return;
          
          // Utiliser target (qui peut être un Discord ID ou Twitch Login)
          const memberKey = raid.target?.toLowerCase?.() || '';
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
      }
      
      setRaids(raidsByMember);
      
      // Calculer les stats avec vérifications défensives
      const totalRaidsFaits = Number(data?.totalRaidsFaits) || 0;
      const totalRaidsRecus = Number(data?.totalRaidsRecus) || 0;
      
      const raidsFaitsArray = Array.isArray(data?.raidsFaits) ? data.raidsFaits : [];
      const raidsRecusArray = Array.isArray(data?.raidsRecus) ? data.raidsRecus : [];
      
      const raidersSet = new Set(
        raidsFaitsArray
          .map((r: any) => (r?.raider || '').toLowerCase?.())
          .filter((key: string) => key && typeof key === 'string')
      );
      const targetsSet = new Set(
        raidsRecusArray
          .map((r: any) => (r?.target || '').toLowerCase?.())
          .filter((key: string) => key && typeof key === 'string')
      );
      
      // Top raideur
      const raiderCounts: Record<string, number> = {};
      raidsFaitsArray.forEach((r: any) => {
        if (!r || typeof r !== 'object') return;
        const key = (r.raider || '').toLowerCase?.();
        if (key && typeof key === 'string') {
          raiderCounts[key] = (raiderCounts[key] || 0) + (Number(r.count) || 1);
        }
      });
      const topRaider = Object.entries(raiderCounts).sort(([, a], [, b]) => b - a)[0] || null;
      
      // Top cible
      const targetCounts: Record<string, number> = {};
      raidsRecusArray.forEach((r: any) => {
        if (!r || typeof r !== 'object') return;
        const key = (r.target || '').toLowerCase?.();
        if (key && typeof key === 'string') {
          targetCounts[key] = (targetCounts[key] || 0) + 1;
        }
      });
      const topTarget = Object.entries(targetCounts).sort(([, a], [, b]) => b - a)[0] || null;
      
      setComputedStats({
        totalDone: totalRaidsFaits,
        totalReceived: totalRaidsRecus,
        unmatchedCount: 0,
        activeRaidersCount: raidersSet.size,
        uniqueTargetsCount: targetsSet.size,
        topRaider: topRaider ? {
          name: String(topRaider[0] || ''),
          count: Number(topRaider[1]) || 0,
        } : null,
        topTarget: topTarget ? {
          name: String(topTarget[0] || ''),
          count: Number(topTarget[1]) || 0,
        } : null,
        alerts: [], // Les alertes seront calculées depuis les données
      });
      
      // Charger les membres pour avoir les noms d'affichage
      try {
        const membersResponse = await fetch("/api/members/public", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (membersResponse.ok) {
          try {
            const membersData = await membersResponse.json();
            setMembers(Array.isArray(membersData?.members) ? membersData.members : []);
          } catch (jsonError) {
            console.error("[Twitch Raids] Erreur parsing membres JSON:", jsonError);
            setMembers([]);
          }
        } else {
          console.warn("[Twitch Raids] Erreur chargement membres:", membersResponse.status);
          setMembers([]);
        }
      } catch (membersError) {
        console.error("[Twitch Raids] Erreur fetch membres:", membersError);
        setMembers([]);
      }
    } catch (error) {
      console.error("[Twitch Raids] Erreur générale lors du chargement:", error);
      // En cas d'erreur, on initialise avec des valeurs vides
      setRaids({});
      setComputedStats(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }
  
  function handleMonthChange(newMonth: string) {
    setSelectedMonth(newMonth);
    loadData(newMonth);
  }

  const getMemberDisplayName = (twitchLogin: string): string => {
    if (!twitchLogin || typeof twitchLogin !== 'string') {
      return 'Membre inconnu';
    }
    
    try {
      const member = Array.isArray(members) 
        ? members.find(m => m?.twitchLogin?.toLowerCase?.() === twitchLogin.toLowerCase())
        : null;
      return member?.displayName || twitchLogin;
    } catch (error) {
      console.error("[Twitch Raids] Erreur getMemberDisplayName:", error);
      return twitchLogin;
    }
  };

  const hasExcessiveRaids = (stats: RaidStats | null | undefined): boolean => {
    if (!stats || typeof stats !== 'object') {
      return false;
    }
    
    if (!stats.targets || typeof stats.targets !== 'object') {
      return false;
    }
    
    try {
      for (const count of Object.values(stats.targets)) {
        if (Number(count) > 3) {
          return true;
        }
      }
    } catch (error) {
      console.error("[Twitch Raids] Erreur hasExcessiveRaids:", error);
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
    <div className="text-white">
      <h1 className="text-4xl font-bold text-white mb-8">Suivi des Raids Twitch</h1>

        {/* Alerte si EventSub non configuré */}
        {subscriptionStatus.checked && subscriptionStatus.hasError && (
          <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-400 mb-1">
                  EventSub non configuré
                </h3>
                <p className="text-red-300 text-sm mb-2">
                  {subscriptionStatus.errorMessage || "Les subscriptions Twitch EventSub ne sont pas configurées."}
                </p>
                <p className="text-gray-400 text-xs mb-3">
                  Vérifiez que les variables d'environnement suivantes sont configurées dans Netlify :
                </p>
                <ul className="list-disc list-inside text-gray-400 text-xs space-y-1 mb-3">
                  <li><code className="bg-gray-800 px-1 rounded">TWITCH_EVENTSUB_SECRET</code></li>
                  <li><code className="bg-gray-800 px-1 rounded">TWITCH_APP_CLIENT_ID</code> ou <code className="bg-gray-800 px-1 rounded">TWITCH_CLIENT_ID</code></li>
                  <li><code className="bg-gray-800 px-1 rounded">TWITCH_CLIENT_SECRET</code></li>
                </ul>
                <p className="text-gray-400 text-xs">
                  Cliquez sur "🟣 Synchroniser EventSub" pour créer la souscription globale automatiquement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info si subscriptions actives */}
        {subscriptionStatus.checked && !subscriptionStatus.hasError && subscriptionStatus.isActive !== undefined && (
          <div className={`mb-6 border rounded-lg p-4 ${
            !subscriptionStatus.isActive
              ? "bg-yellow-900/20 border-yellow-700" 
              : "bg-green-900/20 border-green-700"
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{!subscriptionStatus.isActive ? "⚠️" : "✅"}</span>
              <div className="flex-1">
                <p className={`font-semibold mb-1 ${
                  !subscriptionStatus.isActive ? "text-yellow-400" : "text-green-400"
                }`}>
                  {!subscriptionStatus.isActive 
                    ? "Souscription globale EventSub inactive" 
                    : "Souscription globale EventSub active"
                  }
                </p>
                {subscriptionStatus.subscription?.monitor && (
                  <p className="text-gray-400 text-sm mb-1">
                    Monitor: <code className="bg-gray-800 px-1 rounded">{subscriptionStatus.subscription.monitor.login}</code>
                  </p>
                )}
                {subscriptionStatus.totalMembers !== undefined && (
                  <p className="text-gray-400 text-sm">
                    {subscriptionStatus.totalMembers} membre(s) actif(s) avec login Twitch
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Tous les raids entre membres TENF sont automatiquement détectés et enregistrés.
                </p>
              </div>
            </div>
          </div>
        )}

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
                value={selectedMonth || ''}
                onChange={(e) => {
                  const newMonth = e.target.value;
                  if (newMonth) {
                    handleMonthChange(newMonth);
                  }
                }}
                className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
              >
                {Array.isArray(availableMonths) && availableMonths.length > 0 ? (
                  availableMonths.map((month) => {
                    if (!month || typeof month !== 'string') return null;
                    
                    try {
                      const parts = month.split('-');
                      if (parts.length !== 2) return null;
                      
                      const year = parts[0] || '';
                      const monthNum = parts[1] || '';
                      const monthIndex = parseInt(monthNum, 10);
                      
                      if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12) {
                        return null;
                      }
                      
                      const monthNames = [
                        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                      ];
                      const monthName = monthNames[monthIndex - 1] || month;
                      
                      return (
                        <option key={month} value={month}>
                          {monthName} {year}
                        </option>
                      );
                    } catch (error) {
                      console.error("[Twitch Raids] Erreur formatage mois:", error);
                      return (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      );
                    }
                  }).filter(Boolean)
                ) : (
                  <option value="">Aucun mois disponible</option>
                )}
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
                if (!confirm("Voulez-vous créer la souscription globale Twitch EventSub ?\n\nCela va créer UNE SEULE souscription globale qui écoute tous les raids entre membres TENF.\n\nNote: Les anciennes souscriptions per-member seront automatiquement supprimées.")) {
                  return;
                }
                try {
                  const response = await fetch("/api/twitch/eventsub/subscribe", {
                    method: "POST",
                  });
                  const data = await response.json();
                  if (response.ok) {
                    const subscriptionInfo = data.subscription?.monitor 
                      ? `\n\nMonitor: ${data.subscription.monitor.login}`
                      : '';
                    alert(`✅ ${data.message}${subscriptionInfo}`);
                    // Recharger la page pour afficher le nouveau statut
                    window.location.reload();
                  } else {
                    const errorMsg = data.error || 'Erreur inconnue';
                    const detailsMsg = data.message ? `\n\n${data.message}` : '';
                    const configMsg = data.details ? `\n\n${data.details}` : '';
                    alert(`❌ Erreur: ${errorMsg}${detailsMsg}${configMsg}`);
                  }
                } catch (error) {
                  console.error("Erreur lors de la synchronisation:", error);
                  alert("Erreur lors de la création de la souscription globale Twitch EventSub\n\nVérifiez que les variables d'environnement sont configurées:\n- TWITCH_EVENTSUB_SECRET\n- TWITCH_APP_CLIENT_ID\n- TWITCH_APP_CLIENT_SECRET");
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              title="Créer les subscriptions Twitch EventSub"
            >
              🟣 Synchroniser EventSub
            </button>
          </div>
        </div>

        {/* Statistiques des raids */}
        {computedStats && selectedMonth ? (
          <RaidStatsCard
            stats={computedStats}
            month={selectedMonth}
            getMemberDisplayName={getMemberDisplayName}
          />
        ) : !loading && (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
            <p className="text-gray-400 text-center">
              Aucune statistique disponible pour ce mois
            </p>
          </div>
        )}

        {/* Graphiques */}
        {!loading && raids && typeof raids === 'object' && Object.keys(raids).length > 0 ? (
          <RaidCharts raids={raids} getMemberDisplayName={getMemberDisplayName} />
        ) : !loading && (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
            <p className="text-gray-400 text-center">
              Aucun graphique disponible (pas de données)
            </p>
          </div>
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
                {!raids || typeof raids !== 'object' || Object.keys(raids).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      {loading ? 'Chargement...' : 'Aucun raid Twitch enregistré pour ce mois'}
                    </td>
                  </tr>
                ) : (
                  Object.entries(raids)
                    .filter(([key, value]) => key && value && typeof value === 'object')
                    .sort((a, b) => {
                      try {
                        const aDone = Number(a[1]?.done) || 0;
                        const bDone = Number(b[1]?.done) || 0;
                        return bDone - aDone;
                      } catch (error) {
                        console.error("[Twitch Raids] Erreur tri:", error);
                        return 0;
                      }
                    })
                    .map(([twitchLogin, stats]) => {
                      if (!twitchLogin || !stats || typeof stats !== 'object') {
                        return null;
                      }
                      
                      try {
                        const excessive = hasExcessiveRaids(stats);
                        const done = Number(stats.done) || 0;
                        const received = Number(stats.received) || 0;
                        const targets = stats.targets && typeof stats.targets === 'object' ? stats.targets : {};
                        
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
                                {done}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-white font-semibold">
                                {received}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {excessive && targets ? (
                                <RaidAlertBadge
                                  alerts={Object.entries(targets)
                                    .filter(([, count]) => Number(count) > 3)
                                    .map(([target, count]) => ({
                                      raider: String(twitchLogin || ''),
                                      target: String(target || ''),
                                      count: Number(count) || 0,
                                    }))}
                                  getMemberDisplayName={getMemberDisplayName}
                                />
                              ) : (
                                <span className="text-gray-500 text-sm">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      } catch (error) {
                        console.error("[Twitch Raids] Erreur rendu ligne:", error);
                        return null;
                      }
                    })
                    .filter(Boolean)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

