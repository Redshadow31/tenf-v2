"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import DiscordMessagesImportModal from "@/components/admin/DiscordMessagesImportModal";
import DiscordVocalsImportModal from "@/components/admin/DiscordVocalsImportModal";
import ChartCard from "@/components/admin/ChartCard";

// Données par défaut (fallback)
const defaultDiscordGrowthData = [
  { month: "Janv", value: 160 },
  { month: "Fév", value: 180 },
  { month: "Mar", value: 200 },
  { month: "Avr", value: 220 },
  { month: "Mai", value: 250 },
  { month: "Juin", value: 280 },
  { month: "Juil", value: 300 },
  { month: "Août", value: 320 },
  { month: "Sept", value: 350 },
  { month: "Oct", value: 380 },
  { month: "Nov", value: 400 },
  { month: "Déc", value: 420 },
];

// Données par défaut pour fallback
const defaultTwitchActivity = [
  { month: "Janv", value: 45 },
  { month: "Fév", value: 52 },
  { month: "Mar", value: 68 },
  { month: "Avr", value: 75 },
  { month: "Mai", value: 95 },
  { month: "Juin", value: 88 },
  { month: "Juil", value: 72 },
  { month: "Août", value: 80 },
  { month: "Sept", value: 85 },
  { month: "Oct", value: 90 },
  { month: "Nov", value: 100 },
  { month: "Déc", value: 115 },
];

const defaultSpotlightProgression = [
  { month: "Mai", value: 45 },
  { month: "Juin", value: 52 },
  { month: "Juil", value: 60 },
  { month: "Août", value: 68 },
  { month: "Sept", value: 75 },
  { month: "Oct", value: 82 },
  { month: "Nov", value: 88 },
  { month: "Déc", value: 95 },
];

const defaultVocalRanking = [
  { id: 1, name: "Jenny", avatar: "https://placehold.co/40x40?text=J", value: 58 },
  { id: 2, name: "Clara", avatar: "https://placehold.co/40x40?text=C", value: 71 },
  { id: 3, name: "NeXou", avatar: "https://placehold.co/40x40?text=N", value: 1271 },
  { id: 4, name: "Red", avatar: "https://placehold.co/40x40?text=R", value: 834 },
];

const defaultTextRanking = [
  { id: 1, name: "Jenny", avatar: "https://placehold.co/40x40?text=J", value: 151000, progression: "+3" },
  { id: 2, name: "Clara", avatar: "https://placehold.co/40x40?text=C", value: 1872, progression: "-2" },
  { id: 3, name: "NeXou", avatar: "https://placehold.co/40x40?text=N", value: 1763, progression: "-4" },
  { id: 4, name: "Red", avatar: "https://placehold.co/40x40?text=R", value: 1238, progression: "+1" },
];

export default function DashboardPage() {
  const [discordGrowthData, setDiscordGrowthData] = useState(defaultDiscordGrowthData);
  const [loadingDiscordData, setLoadingDiscordData] = useState(true);
  const [discordStats, setDiscordStats] = useState<{
    totalMessages: number;
    totalVoiceHours: number;
    topMessages: Array<{ displayName: string; messages: number; rank: number }>;
    topVocals: Array<{ displayName: string; display: string; hoursDecimal: number; rank: number }>;
  } | null>(null);
  const [loadingDiscordStats, setLoadingDiscordStats] = useState(true);
  const [showMessagesImport, setShowMessagesImport] = useState(false);
  const [showVocalsImport, setShowVocalsImport] = useState(false);
  const [discordActivityData, setDiscordActivityData] = useState<Array<{ date: string; messages: number; vocals: number }>>([]);
  const [loadingDiscordActivity, setLoadingDiscordActivity] = useState(true);
  const [spotlightProgressionData, setSpotlightProgressionData] = useState(defaultSpotlightProgression);
  const [vocalRanking, setVocalRanking] = useState(defaultVocalRanking);
  const [textRanking, setTextRanking] = useState(defaultTextRanking);
  const [loadingDashboardData, setLoadingDashboardData] = useState(true);
  const [raidStats, setRaidStats] = useState<{
    totalRaidsReceived: number;
    totalRaidsSent: number;
    topRaiders: Array<{ rank: number; displayName: string; count: number }>;
    topTargets: Array<{ rank: number; displayName: string; count: number }>;
    dailySent: Array<{ day: number; count: number }>;
    dailyReceived: Array<{ day: number; count: number }>;
  } | null>(null);
  const [loadingRaidStats, setLoadingRaidStats] = useState(true);

  // Fonctions utilitaires pour les sparklines
  function getLastRecordedDay(series: Array<{ day: number; count: number }>): number {
    if (series.length === 0) return 0;
    return Math.max(...series.map(item => item.day));
  }

  function toSparklineData(
    series: Array<{ day: number; count: number }>,
    lastRecordedDay: number
  ): Array<{ day: number; count: number | null }> {
    if (series.length === 0 || lastRecordedDay === 0) return [];
    
    // Filtrer jusqu'au dernier jour enregistré
    const filtered = series.filter(item => item.day <= lastRecordedDay);
    
    // Créer un tableau avec tous les jours jusqu'à lastRecordedDay
    const dataMap = new Map<number, number>();
    filtered.forEach(item => {
      dataMap.set(item.day, item.count);
    });
    
    // Construire le tableau avec null pour les jours manquants
    const result: Array<{ day: number; count: number | null }> = [];
    for (let day = 1; day <= lastRecordedDay; day++) {
      result.push({
        day,
        count: dataMap.has(day) ? dataMap.get(day)! : null,
      });
    }
    
    return result;
  }

  // Fonction pour agréger les données quotidiennes par mois
  const aggregateDailyDataByMonth = (dailyData: Array<{ date: string; messages: number; vocals: number }>) => {
    const monthMap = new Map<string, { messages: number; vocals: number }>();
    
    dailyData.forEach((day) => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { messages: 0, vocals: 0 });
      }
      
      const monthData = monthMap.get(monthKey)!;
      monthData.messages += day.messages || 0;
      monthData.vocals += day.vocals || 0;
    });
    
    // Convertir en tableau et trier par date
    const aggregated = Array.from(monthMap.entries())
      .map(([monthKey, data]) => ({
        monthKey,
        date: new Date(monthKey + '-01'),
        messages: data.messages,
        vocals: data.vocals,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Prendre les 12 derniers mois
    const last12Months = aggregated.slice(-12);
    
    // Formater pour le graphique
    const monthNames = ["Janv", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    return last12Months.map((item) => ({
      month: monthNames[item.date.getMonth()] + ' ' + item.date.getFullYear().toString().slice(-2),
      messages: item.messages,
      vocals: item.vocals,
    }));
  };

  // Charger les données du dashboard depuis l'API
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const response = await fetch('/api/dashboard/data', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setDiscordActivityData(result.data.discordDailyActivity || []);
            setDiscordGrowthData(result.data.discordGrowth || defaultDiscordGrowthData);
            setVocalRanking(result.data.vocalRanking || defaultVocalRanking);
            setTextRanking(result.data.textRanking || defaultTextRanking);
          }
        }

        // Charger les données de progression Spotlight depuis la nouvelle API
        const spotlightProgressionResponse = await fetch('/api/spotlight/progression', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (spotlightProgressionResponse.ok) {
          const spotlightResult = await spotlightProgressionResponse.json();
          if (spotlightResult.success && spotlightResult.data) {
            setSpotlightProgressionData(spotlightResult.data);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du dashboard:', error);
      } finally {
        setLoadingDashboardData(false);
        setLoadingDiscordData(false);
        setLoadingDiscordActivity(false);
      }
    }
    
    loadDashboardData();
  }, []);

  // Charger les statistiques Discord du mois (depuis le stockage)
  useEffect(() => {
    async function loadDiscordStats() {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const response = await fetch(`/api/admin/discord-activity/data?month=${currentMonth}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setDiscordStats({
              totalMessages: result.data.totalMessages || 0,
              totalVoiceHours: result.data.totalVoiceHours || 0,
              topMessages: result.data.topMessages || [],
              topVocals: result.data.topVocals || [],
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des stats Discord:', error);
      } finally {
        setLoadingDiscordStats(false);
      }
    }
    
    loadDiscordStats();
  }, []);

  // Charger les statistiques de raids
  useEffect(() => {
    async function loadRaidStats() {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const response = await fetch(`/api/discord/raids/data-v2?month=${currentMonth}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.stats) {
            setRaidStats({
              totalRaidsReceived: result.stats.totalRaidsRecus || 0,
              totalRaidsSent: result.stats.totalRaidsFaits || 0,
              topRaiders: (result.stats.topRaiders || []).map((r: any) => ({
                rank: r.rank,
                displayName: r.displayName,
                count: r.count,
              })),
              topTargets: (result.stats.topTargets || []).map((r: any) => ({
                rank: r.rank,
                displayName: r.displayName,
                count: r.count,
              })),
              dailySent: result.stats.dailySent || [],
              dailyReceived: result.stats.dailyReceived || [],
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des stats de raids:', error);
      } finally {
        setLoadingRaidStats(false);
      }
    }
    
    loadRaidStats();
  }, []);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Agréger les données quotidiennes par mois pour le graphique
  const monthlyActivityData = useMemo(() => aggregateDailyDataByMonth(discordActivityData), [discordActivityData]);

  const handleMessagesImport = async (data: Record<string, number>) => {
    try {
      const response = await fetch('/api/admin/discord-activity/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month: currentMonth, type: 'messages', data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'import');
      }

      // Recharger les stats
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'import');
    }
  };

  const handleVocalsImport = async (data: Record<string, { hoursDecimal: number; totalMinutes: number; display: string }>) => {
    try {
      const response = await fetch('/api/admin/discord-activity/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month: currentMonth, type: 'vocals', data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'import');
      }

      // Recharger les stats
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'import');
    }
  };

  return (
    <>
      <div className="text-white">
      <h1 className="text-4xl font-bold text-white mb-8">Dashboard Général</h1>

      {/* Ligne 1 (TOP) — KPI et Activité Discord du mois (3 cartes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6" style={{ gridAutoRows: '1fr' }}>
        {/* Raids envoyés */}
        <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6 flex flex-col min-h-0">
          <h3 className="text-lg font-semibold text-white mb-4 flex-shrink-0 text-center">Raids envoyés</h3>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="text-center mb-4 flex-shrink-0">
              {loadingRaidStats ? (
                <div className="flex items-center justify-center h-16 mb-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#10b981]"></div>
                </div>
              ) : (
                <div className="text-4xl font-bold text-white mb-2">
                  {raidStats?.totalRaidsSent ?? 0}
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto mb-2">
              {loadingRaidStats ? (
                <div className="text-sm text-gray-500 text-center">Chargement...</div>
              ) : raidStats?.topRaiders && raidStats.topRaiders.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 mb-2">Top 5 streamers</div>
                  {raidStats.topRaiders.map((raider) => (
                    <div key={raider.rank} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">#{raider.rank}</span>
                        <span className="text-white">{raider.displayName}</span>
                      </div>
                      <div className="text-gray-400">
                        <span>{raider.count} raid{raider.count > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-2">
                  Aucune donnée disponible
                </div>
              )}
            </div>
            {/* Sparkline */}
            {!loadingRaidStats && raidStats?.dailySent && raidStats.dailySent.length > 0 && (() => {
              const lastDay = getLastRecordedDay(raidStats.dailySent);
              const sparklineData = toSparklineData(raidStats.dailySent, lastDay);
              return (
                <div className="flex-shrink-0 h-14 -mb-2">
                  <ResponsiveContainer width="100%" height={56}>
                    <LineChart data={sparklineData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                      <XAxis hide />
                      <YAxis hide />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={false}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Raids reçus */}
        <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6 flex flex-col min-h-0">
          <h3 className="text-lg font-semibold text-white mb-4 flex-shrink-0 text-center">Raids reçus</h3>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="text-center mb-4 flex-shrink-0">
              {loadingRaidStats ? (
                <div className="flex items-center justify-center h-16 mb-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9146ff]"></div>
                </div>
              ) : (
                <div className="text-4xl font-bold text-white mb-2">
                  {raidStats?.totalRaidsReceived ?? 0}
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto mb-2">
              {loadingRaidStats ? (
                <div className="text-sm text-gray-500 text-center">Chargement...</div>
              ) : raidStats?.topTargets && raidStats.topTargets.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 mb-2">Top 5 streamers</div>
                  {raidStats.topTargets.map((target) => (
                    <div key={target.rank} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">#{target.rank}</span>
                        <span className="text-white">{target.displayName}</span>
                      </div>
                      <div className="text-gray-400">
                        <span>{target.count} raid{target.count > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-2">
                  Aucune donnée disponible
                </div>
              )}
            </div>
            {/* Sparkline */}
            {!loadingRaidStats && raidStats?.dailyReceived && raidStats.dailyReceived.length > 0 && (() => {
              const lastDay = getLastRecordedDay(raidStats.dailyReceived);
              const sparklineData = toSparklineData(raidStats.dailyReceived, lastDay);
              return (
                <div className="flex-shrink-0 h-14 -mb-2">
                  <ResponsiveContainer width="100%" height={56}>
                    <LineChart data={sparklineData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#9146ff"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={false}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Activité Discord du mois */}
        <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6 flex flex-col min-h-0">
          <h3 className="text-lg font-semibold text-white mb-4 flex-shrink-0">
            Activité Discord du mois
          </h3>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loadingDiscordStats ? (
              <div className="flex items-center justify-center w-full h-full min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865F2]"></div>
              </div>
            ) : discordStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#0e0e10] rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Messages</div>
                    <div className="text-2xl font-bold text-[#5865F2]">
                      {discordStats.totalMessages.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#0e0e10] rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Heures vocales</div>
                    <div className="text-2xl font-bold text-[#5865F2]">
                      {discordStats.totalVoiceHours.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">Top 5 membres actifs (Messages)</div>
                  <div className="space-y-2 mb-4">
                    {discordStats.topMessages.length > 0 ? (
                      discordStats.topMessages.map((member) => (
                        <div key={member.rank} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">#{member.rank}</span>
                            <span className="text-white">{member.displayName}</span>
                          </div>
                          <div className="text-gray-400">
                            <span>{member.messages.toLocaleString()} msgs</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-2">
                        Aucune donnée disponible
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">Top 5 membres actifs (Vocaux)</div>
                  <div className="space-y-2">
                    {discordStats.topVocals.length > 0 ? (
                      discordStats.topVocals.map((member) => (
                        <div key={member.rank} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">#{member.rank}</span>
                            <span className="text-white">{member.displayName}</span>
                          </div>
                          <div className="text-gray-400">
                            <span>{member.display}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-2">
                        Aucune donnée disponible
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-700 space-y-2">
                  <button
                    onClick={() => setShowMessagesImport(true)}
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    📥 Import messages (copier-coller)
                  </button>
                  <button
                    onClick={() => setShowVocalsImport(true)}
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    📥 Import vocaux (copier-coller)
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">
                Aucune donnée disponible pour ce mois
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ligne 2 (BOTTOM) — Graphiques (3 cartes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Activité Discord */}
        <ChartCard title="Activité Discord" loading={loadingDiscordActivity}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12} 
                tickLine={false} 
                yAxisId="left"
                label={{ value: 'Messages', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12} 
                tickLine={false} 
                orientation="right" 
                yAxisId="right"
                label={{ value: 'Heures vocales', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1d",
                  border: "1px solid #2a2a2d",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Vocaux (h)') {
                    return [value.toFixed(2) + ' h', name];
                  }
                  return [value.toLocaleString(), name];
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="messages"
                stroke="#5865F2"
                strokeWidth={2}
                dot={{ fill: "#5865F2", r: 4 }}
                activeDot={{ r: 6 }}
                name="Messages"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="vocals"
                stroke="#57F287"
                strokeWidth={2}
                dot={{ fill: "#57F287", r: 4 }}
                activeDot={{ r: 6 }}
                name="Vocaux (h)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Croissance Discord */}
        <ChartCard title="Croissance Discord" loading={loadingDiscordData}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={discordGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1d",
                  border: "1px solid #2a2a2d",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: any) => [value, 'Membres']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Progression Spotlight */}
        <ChartCard title="Progression Spotlight" loading={loadingDashboardData}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={spotlightProgressionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1d",
                  border: "1px solid #2a2a2d",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#9146ff"
                strokeWidth={2}
                dot={{ fill: "#9146ff", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

        {/* Section 3 — Classements Discord (2 cartes) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Classement vocal Discord */}
          <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Classement vocal Discord
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2d]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Pseudo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Heures vocales
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vocalRanking.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-[#2a2a2d] hover:bg-[#0e0e10] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-white font-medium">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {member.value >= 1000
                          ? `${(member.value / 1000).toFixed(1)}k`
                          : member.value}{" "}
                        h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Classement texte Discord */}
          <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Classement texte Discord
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2d]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Pseudo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Messages
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Progression
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {textRanking.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-[#2a2a2d] hover:bg-[#0e0e10] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-white font-medium">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {member.value >= 1000
                          ? `${(member.value / 1000).toFixed(1)}k`
                          : member.value}
                      </td>
                      <td className="py-3 px-4">
                        {member.progression && (
                          <span
                            className={`text-sm font-semibold ${
                              member.progression.startsWith("+")
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {member.progression}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <DiscordMessagesImportModal
        isOpen={showMessagesImport}
        onClose={() => setShowMessagesImport(false)}
        onImport={handleMessagesImport}
        month={currentMonth}
      />

      <DiscordVocalsImportModal
        isOpen={showVocalsImport}
        onClose={() => setShowVocalsImport(false)}
        onImport={handleVocalsImport}
        month={currentMonth}
      />
    </>
  );
}
