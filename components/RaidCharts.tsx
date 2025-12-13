"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface RaidStats {
  done: number;
  received: number;
  targets: Record<string, number>;
}

interface MonthlyRaids {
  [twitchLogin: string]: RaidStats;
}

interface RaidChartsProps {
  raids: MonthlyRaids;
  getMemberDisplayName: (twitchLogin: string) => string;
}

export default function RaidCharts({ raids, getMemberDisplayName }: RaidChartsProps) {
  // Préparer les données pour le graphique en barres (raids faits)
  const raidsFaitsData = Object.entries(raids)
    .map(([twitchLogin, stats]) => ({
      name: getMemberDisplayName(twitchLogin),
      twitchLogin,
      raids: stats.done,
    }))
    .filter((item) => item.raids > 0)
    .sort((a, b) => b.raids - a.raids)
    .slice(0, 15); // Top 15 pour la lisibilité (même nombre que raids reçus)

  // Préparer les données pour l'histogramme (raids reçus)
  const barData = Object.entries(raids)
    .map(([twitchLogin, stats]) => ({
      name: getMemberDisplayName(twitchLogin),
      twitchLogin,
      raids: stats.received,
    }))
    .filter((item) => item.raids > 0)
    .sort((a, b) => b.raids - a.raids)
    .slice(0, 15); // Top 15 pour la lisibilité

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Graphique Bar - Répartition des raids faits */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Répartition des raids faits
        </h3>
        {raidsFaitsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={raidsFaitsData}>
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1d",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number) => [`${value} raid${value > 1 ? "s" : ""}`, "Raids faits"]}
              />
              <Bar dataKey="raids" fill="#9146ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            Aucun raid enregistré
          </div>
        )}
      </div>

      {/* Graphique Bar - Raids reçus */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Nombre de raids reçus
        </h3>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1d",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number) => [`${value} raid${value > 1 ? "s" : ""}`, "Raids reçus"]}
              />
              <Bar dataKey="raids" fill="#9146ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            Aucun raid reçu
          </div>
        )}
      </div>
    </div>
  );
}

