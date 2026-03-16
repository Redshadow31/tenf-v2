"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  Area,
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
  previousData?: DailyRaidPoint[];
  onDaySelect?: (day: number | null) => void;
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

export default function RaidDailyChart({ month, data, previousData, onDaySelect }: RaidDailyChartProps) {
  const [seriesMode, setSeriesMode] = useState<"both" | "sent" | "received">("both");
  const [valueMode, setValueMode] = useState<"daily" | "cumulative">("daily");
  const [comparePrevious, setComparePrevious] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const previousByDay = useMemo(() => {
    const map = new Map<number, DailyRaidPoint>();
    for (const point of previousData || []) {
      map.set(point.day, point);
    }
    return map;
  }, [previousData]);

  const chartData = useMemo(() => {
    let cumSent = 0;
    let cumReceived = 0;
    let cumSentPrev = 0;
    let cumReceivedPrev = 0;
    return data.map((point) => {
      const prev = previousByDay.get(point.day);
      cumSent += point.raidsFaits;
      cumReceived += point.raidsRecus;
      cumSentPrev += prev?.raidsFaits || 0;
      cumReceivedPrev += prev?.raidsRecus || 0;
      return {
        day: point.day,
        sentDaily: point.raidsFaits,
        receivedDaily: point.raidsRecus,
        sentCum: cumSent,
        receivedCum: cumReceived,
        prevSentDaily: prev?.raidsFaits || 0,
        prevReceivedDaily: prev?.raidsRecus || 0,
        prevSentCum: cumSentPrev,
        prevReceivedCum: cumReceivedPrev,
      };
    });
  }, [data, previousByDay]);

  const hasData = chartData.some((d) => d.sentDaily > 0 || d.receivedDaily > 0);
  const mainSentKey = valueMode === "daily" ? "sentDaily" : "sentCum";
  const mainReceivedKey = valueMode === "daily" ? "receivedDaily" : "receivedCum";
  const prevSentKey = valueMode === "daily" ? "prevSentDaily" : "prevSentCum";
  const prevReceivedKey = valueMode === "daily" ? "prevReceivedDaily" : "prevReceivedCum";

  const selectedPoint = selectedDay ? chartData.find((point) => point.day === selectedDay) : null;

  const selectedSummary = selectedPoint
    ? {
        sent: valueMode === "daily" ? selectedPoint.sentDaily : selectedPoint.sentCum,
        received: valueMode === "daily" ? selectedPoint.receivedDaily : selectedPoint.receivedCum,
      }
    : null;

  const previousSummary = selectedPoint
    ? {
        sent: valueMode === "daily" ? selectedPoint.prevSentDaily : selectedPoint.prevSentCum,
        received: valueMode === "daily" ? selectedPoint.prevReceivedDaily : selectedPoint.prevReceivedCum,
      }
    : null;

  const onPointClick = (payload?: { day?: number }) => {
    const day = typeof payload?.day === "number" ? payload.day : null;
    setSelectedDay(day);
    onDaySelect?.(day);
  };

  return (
    <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">Raids par jour — {formatMonth(month)}</h3>
          <p className="text-gray-400 text-sm">Vue interactive : filtres, cumul et comparaison mensuelle.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-gray-700 bg-[#101014] p-1">
            <button
              type="button"
              onClick={() => setSeriesMode("both")}
              className="rounded px-2 py-1 text-xs"
              style={{ color: seriesMode === "both" ? "#fff" : "#94a3b8", backgroundColor: seriesMode === "both" ? "#374151" : "transparent" }}
            >
              Les 2
            </button>
            <button
              type="button"
              onClick={() => setSeriesMode("sent")}
              className="rounded px-2 py-1 text-xs"
              style={{ color: seriesMode === "sent" ? "#fff" : "#94a3b8", backgroundColor: seriesMode === "sent" ? "#5b21b6" : "transparent" }}
            >
              Faits
            </button>
            <button
              type="button"
              onClick={() => setSeriesMode("received")}
              className="rounded px-2 py-1 text-xs"
              style={{ color: seriesMode === "received" ? "#fff" : "#94a3b8", backgroundColor: seriesMode === "received" ? "#0f766e" : "transparent" }}
            >
              Recus
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-md border border-gray-700 bg-[#101014] p-1">
            <button
              type="button"
              onClick={() => setValueMode("daily")}
              className="rounded px-2 py-1 text-xs"
              style={{ color: valueMode === "daily" ? "#fff" : "#94a3b8", backgroundColor: valueMode === "daily" ? "#374151" : "transparent" }}
            >
              Journalier
            </button>
            <button
              type="button"
              onClick={() => setValueMode("cumulative")}
              className="rounded px-2 py-1 text-xs"
              style={{ color: valueMode === "cumulative" ? "#fff" : "#94a3b8", backgroundColor: valueMode === "cumulative" ? "#374151" : "transparent" }}
            >
              Cumul
            </button>
          </div>

          <button
            type="button"
            onClick={() => setComparePrevious((prev) => !prev)}
            className="rounded-md border px-2 py-1 text-xs"
            style={{
              borderColor: comparePrevious ? "rgba(148,163,184,0.6)" : "rgba(100,116,139,0.5)",
              color: comparePrevious ? "#e2e8f0" : "#94a3b8",
              backgroundColor: comparePrevious ? "rgba(148,163,184,0.15)" : "transparent",
            }}
          >
            M-1
          </button>
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            onClick={(event) => onPointClick(event?.activePayload?.[0]?.payload)}
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
              cursor={{ stroke: "#64748b", strokeDasharray: "4 4" }}
              contentStyle={{
                backgroundColor: "#1a1a1d",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#fff",
              }}
              labelFormatter={(day) => `Jour ${day}`}
              formatter={(value: number, name: string, item: { payload?: Record<string, number> }) => {
                const payload = item?.payload || {};
                const prevValue =
                  name === mainSentKey
                    ? (payload[prevSentKey] || 0)
                    : name === mainReceivedKey
                      ? (payload[prevReceivedKey] || 0)
                      : 0;
                const delta = value - prevValue;
                const deltaLabel = comparePrevious ? ` (${delta >= 0 ? "+" : ""}${delta} vs M-1)` : "";
                const seriesLabel = name === mainSentKey ? "Raids faits" : "Raids recus";
                return [`${value}${deltaLabel}`, seriesLabel];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
              formatter={(value: string) => {
                if (value === mainSentKey) return "Raids faits";
                if (value === mainReceivedKey) return "Raids recus";
                if (value === prevSentKey) return "Raids faits (M-1)";
                return "Raids recus (M-1)";
              }}
            />

            {(seriesMode === "both" || seriesMode === "sent") && (
              <>
                <Area type="monotone" dataKey={mainSentKey} fill="#9146ff" fillOpacity={0.12} strokeOpacity={0} />
                <Line
                  type="monotone"
                  dataKey={mainSentKey}
                  name={mainSentKey}
                  stroke="#9146ff"
                  strokeWidth={2}
                  dot={{ fill: "#9146ff", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                {comparePrevious && (
                  <Line
                    type="monotone"
                    dataKey={prevSentKey}
                    name={prevSentKey}
                    stroke="#a78bfa"
                    strokeWidth={1.8}
                    strokeDasharray="5 3"
                    dot={false}
                  />
                )}
              </>
            )}

            {(seriesMode === "both" || seriesMode === "received") && (
              <>
                <Area type="monotone" dataKey={mainReceivedKey} fill="#10b981" fillOpacity={0.12} strokeOpacity={0} />
                <Line
                  type="monotone"
                  dataKey={mainReceivedKey}
                  name={mainReceivedKey}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                {comparePrevious && (
                  <Line
                    type="monotone"
                    dataKey={prevReceivedKey}
                    name={prevReceivedKey}
                    stroke="#5eead4"
                    strokeWidth={1.8}
                    strokeDasharray="5 3"
                    dot={false}
                  />
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[320px] text-gray-400">
          Aucun raid enregistré pour ce mois
        </div>
      )}

      {selectedPoint ? (
        <div className="mt-3 rounded-lg border border-gray-700 bg-[#101014] px-3 py-2 text-xs text-gray-300">
          <p className="font-semibold text-white">Jour {selectedPoint.day}</p>
          <p>
            {valueMode === "daily" ? "Journalier" : "Cumul"} : <span className="text-[#c4b5fd]">{selectedSummary?.sent ?? 0} faits</span> /{" "}
            <span className="text-[#93c5fd]">{selectedSummary?.received ?? 0} recus</span>
          </p>
          {comparePrevious ? (
            <p className="text-gray-400">
              M-1 : <span className="text-[#c4b5fd]">{previousSummary?.sent ?? 0} faits</span> /{" "}
              <span className="text-[#93c5fd]">{previousSummary?.received ?? 0} recus</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
