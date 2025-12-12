"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

const COLORS = [
  "#9146ff",
  "#5a32b4",
  "#7c3aed",
  "#a855f7",
  "#c084fc",
  "#d8b4fe",
  "#e9d5ff",
  "#f3e8ff",
];

export default function RaidCharts({ raids, getMemberDisplayName }: RaidChartsProps) {
  // Préparer les données pour le graphique donut (raids faits)
  const donutData = Object.entries(raids)
    .map(([twitchLogin, stats]) => ({
      name: getMemberDisplayName(twitchLogin),
      value: stats.done,
      twitchLogin,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 seulement pour la lisibilité

  // Calculer le total pour les pourcentages
  const totalDone = donutData.reduce((sum, item) => sum + item.value, 0);

  // Ajouter les pourcentages
  const donutDataWithPercent = donutData.map((item) => ({
    ...item,
    percent: totalDone > 0 ? ((item.value / totalDone) * 100).toFixed(1) : "0",
  }));

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

  // Personnaliser le tooltip pour le donut
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-[#9146ff]">
            {data.value} raid{data.value > 1 ? "s" : ""} ({data.payload.percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Graphique Donut - Répartition des raids faits */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Répartition des raids faits
        </h3>
        {donutDataWithPercent.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donutDataWithPercent}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {donutDataWithPercent.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value, entry: any) => {
                  const data = donutDataWithPercent.find((d) => d.name === value);
                  return data ? `${value} (${data.percent}%)` : value;
                }}
              />
            </PieChart>
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

