"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface DailyRaidPoint {
  day: number;
  raidsFaits: number;
  raidsRecus: number;
}

interface RaidDailyChartProps {
  month: string;
  data: DailyRaidPoint[];
}

function formatMonth(monthStr: string): string {
  const [year, monthNum] = monthStr.split("-");
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  const monthName = monthNames[parseInt(monthNum, 10) - 1];
  return `${monthName} ${year}`;
}

export default function RaidDailyChart({ month, data }: RaidDailyChartProps) {
  const hasData = data.some((d) => d.raidsFaits > 0 || d.raidsRecus > 0);

  return (
    <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-white mb-4">
        Raids par jour — {formatMonth(month)}
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Axe vertical : nombre de raids. Axe horizontal : jour du mois.
      </p>
      {hasData ? (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, "dataMax"]}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickLine={{ stroke: "#4b5563" }}
              label={{
                value: "Jour du mois",
                position: "insideBottom",
                offset: -4,
                fill: "#9ca3af",
                fontSize: 12,
              }}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickLine={{ stroke: "#4b5563" }}
              label={{
                value: "Nombre de raids",
                angle: -90,
                position: "insideLeft",
                fill: "#9ca3af",
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1d",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#fff",
              }}
              labelFormatter={(day) => `Jour ${day}`}
              formatter={(value: number, name: string) => [
                value,
                name === "raidsFaits" ? "Raids faits" : "Raids reçus",
              ]}
            />
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
              formatter={(value: string) => (value === "raidsFaits" ? "Raids faits" : "Raids reçus")}
            />
            <Line
              type="monotone"
              dataKey="raidsFaits"
              name="raidsFaits"
              stroke="#9146ff"
              strokeWidth={2}
              dot={{ fill: "#9146ff", r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="raidsRecus"
              name="raidsRecus"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[320px] text-gray-400">
          Aucun raid enregistré pour ce mois
        </div>
      )}
    </div>
  );
}
