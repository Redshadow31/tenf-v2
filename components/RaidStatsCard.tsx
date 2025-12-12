"use client";

import { ComputedRaidStats } from "@/lib/computeRaidStats";

interface RaidStatsCardProps {
  stats: ComputedRaidStats;
  month: string;
  getMemberDisplayName: (twitchLogin: string) => string;
}

export default function RaidStatsCard({
  stats,
  month,
  getMemberDisplayName,
}: RaidStatsCardProps) {
  // Formater le nom du mois
  const formatMonth = (monthStr: string): string => {
    const [year, monthNum] = monthStr.split("-");
    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    const monthName = monthNames[parseInt(monthNum) - 1];
    return `${monthName} ${year}`;
  };

  return (
    <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-white mb-4">
        Statistiques des raids — {formatMonth(month)}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total raids faits */}
        <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Total raids faits</div>
          <div className="text-2xl font-bold text-[#9146ff]">{stats.totalDone}</div>
        </div>

        {/* Total raids reçus */}
        <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Total raids reçus</div>
          <div className="text-2xl font-bold text-[#9146ff]">{stats.totalReceived}</div>
        </div>

        {/* Raids non reconnus */}
        <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Raids non reconnus</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.unmatchedCount}</div>
        </div>

        {/* Raideurs actifs */}
        <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Raideurs actifs</div>
          <div className="text-2xl font-bold text-white">{stats.activeRaidersCount}</div>
        </div>

        {/* Cibles uniques */}
        <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Cibles uniques</div>
          <div className="text-2xl font-bold text-white">{stats.uniqueTargetsCount}</div>
        </div>

        {/* Top raideur */}
        <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Top raideur</div>
          {stats.topRaider ? (
            <div>
              <div className="text-lg font-semibold text-white">
                {getMemberDisplayName(stats.topRaider.name)}
              </div>
              <div className="text-sm text-gray-400">{stats.topRaider.count} raids</div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Aucun</div>
          )}
        </div>

        {/* Top cible */}
        <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Top cible</div>
          {stats.topTarget ? (
            <div>
              <div className="text-lg font-semibold text-white">
                {getMemberDisplayName(stats.topTarget.name)}
              </div>
              <div className="text-sm text-gray-400">{stats.topTarget.count} raids</div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Aucun</div>
          )}
        </div>

        {/* Alertes */}
        <div className="bg-[#0e0e10] border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Alertes</div>
          <div className="text-2xl font-bold text-red-400">{stats.alerts.length}</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.alerts.length > 0
              ? `${stats.alerts.length} raid(s) répété(s)`
              : "Aucune alerte"}
          </div>
        </div>
      </div>
    </div>
  );
}

