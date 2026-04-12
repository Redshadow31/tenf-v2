"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

type ChartPrefs = {
  seriesMode: "both" | "sent" | "received";
  valueMode: "daily" | "cumulative";
  compareSent: boolean;
  compareReceived: boolean;
  showTrend: boolean;
};

const PREFS_STORAGE_KEY = "raid-daily-chart-prefs-v2";

function formatMonth(monthStr: string): string {
  const [year, monthNum] = monthStr.split("-");
  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
  const monthName = monthNames[parseInt(monthNum, 10) - 1];
  return `${monthName} ${year}`;
}

export default function RaidDailyChart({ month, data, previousData, onDaySelect }: RaidDailyChartProps) {
  const [seriesMode, setSeriesMode] = useState<"both" | "sent" | "received">("both");
  const [valueMode, setValueMode] = useState<"daily" | "cumulative">("daily");
  const [compareSent, setCompareSent] = useState(false);
  const [compareReceived, setCompareReceived] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ChartPrefs>;
      if (parsed.seriesMode === "both" || parsed.seriesMode === "sent" || parsed.seriesMode === "received") setSeriesMode(parsed.seriesMode);
      if (parsed.valueMode === "daily" || parsed.valueMode === "cumulative") setValueMode(parsed.valueMode);
      if (typeof parsed.compareSent === "boolean") setCompareSent(parsed.compareSent);
      if (typeof parsed.compareReceived === "boolean") setCompareReceived(parsed.compareReceived);
      if (typeof parsed.showTrend === "boolean") setShowTrend(parsed.showTrend);
    } catch {}
  }, []);

  useEffect(() => {
    const prefs: ChartPrefs = { seriesMode, valueMode, compareSent, compareReceived, showTrend };
    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }, [seriesMode, valueMode, compareSent, compareReceived, showTrend]);

  const previousByDay = useMemo(() => {
    const map = new Map<number, DailyRaidPoint>();
    for (const point of previousData || []) map.set(point.day, point);
    return map;
  }, [previousData]);

  const chartData = useMemo(() => {
    let cumSent = 0;
    let cumReceived = 0;
    let cumSentPrev = 0;
    let cumReceivedPrev = 0;

    const rows = data.map((point) => {
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

    return rows.map((point, index) => {
      const start = Math.max(0, index - 6);
      const slice = rows.slice(start, index + 1);
      const trendSent = slice.reduce((sum, item) => sum + Number(item.sentDaily || 0), 0) / Math.max(slice.length, 1);
      const trendReceived = slice.reduce((sum, item) => sum + Number(item.receivedDaily || 0), 0) / Math.max(slice.length, 1);
      return { ...point, trendSent: Math.round(trendSent * 10) / 10, trendReceived: Math.round(trendReceived * 10) / 10 };
    });
  }, [data, previousByDay]);

  const hasData = chartData.some((d) => d.sentDaily > 0 || d.receivedDaily > 0);
  const isSentVisible = seriesMode === "both" || seriesMode === "sent";
  const isReceivedVisible = seriesMode === "both" || seriesMode === "received";
  const mainSentKey = valueMode === "daily" ? "sentDaily" : "sentCum";
  const mainReceivedKey = valueMode === "daily" ? "receivedDaily" : "receivedCum";
  const prevSentKey = valueMode === "daily" ? "prevSentDaily" : "prevSentCum";
  const prevReceivedKey = valueMode === "daily" ? "prevReceivedDaily" : "prevReceivedCum";

  const totals = useMemo(() => {
    const currentSentTotal = chartData.reduce((sum, row) => sum + Number(row.sentDaily || 0), 0);
    const currentReceivedTotal = chartData.reduce((sum, row) => sum + Number(row.receivedDaily || 0), 0);
    const previousSentTotal = chartData.reduce((sum, row) => sum + Number(row.prevSentDaily || 0), 0);
    const previousReceivedTotal = chartData.reduce((sum, row) => sum + Number(row.prevReceivedDaily || 0), 0);
    const currentCombined = currentSentTotal + currentReceivedTotal;
    const previousCombined = previousSentTotal + previousReceivedTotal;
    const deltaPct = previousCombined > 0 ? ((currentCombined - previousCombined) / previousCombined) * 100 : null;
    return { currentSentTotal, currentReceivedTotal, deltaPct };
  }, [chartData]);

  const selectedPoint = selectedDay ? chartData.find((point) => point.day === selectedDay) : null;

  return (
    <div className="mb-6 rounded-2xl border border-[#2d334a] bg-[linear-gradient(145deg,rgba(67,56,202,0.10),rgba(12,15,24,0.94)_45%,rgba(6,182,212,0.08))] p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">Raids par jour - {formatMonth(month)}</h3>
          <p className="text-sm text-slate-400">
            Vue pilotage : séries, cumul, tendance 7 jours et comparaison M-1. Les jours suivent le calendrier{" "}
            <span className="text-slate-200">Europe/Paris</span>. Les totaux « Faits » et « Reçus » comptent le même raid sous
            deux angles (ne pas les additionner pour le nombre d&apos;événements).
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[#3a4059] bg-[#101523]/75 px-3 py-2"><p className="text-[11px] text-slate-400">Faits</p><p className="text-lg font-semibold text-violet-200">{totals.currentSentTotal}</p></div>
          <div className="rounded-xl border border-[#3a4059] bg-[#101523]/75 px-3 py-2"><p className="text-[11px] text-slate-400">Recus</p><p className="text-lg font-semibold text-emerald-200">{totals.currentReceivedTotal}</p></div>
          <div className="rounded-xl border border-[#3a4059] bg-[#101523]/75 px-3 py-2"><p className="text-[11px] text-slate-400">Delta</p><p className="text-lg font-semibold" style={{ color: totals.deltaPct == null ? "#cbd5e1" : totals.deltaPct >= 0 ? "#6ee7b7" : "#fca5a5" }}>{totals.deltaPct == null ? "N/A" : `${totals.deltaPct >= 0 ? "+" : ""}${totals.deltaPct.toFixed(1)}%`}</p></div>
        </div>
        <p className="mt-2 max-w-3xl text-[11px] leading-snug text-slate-500">
          Somme du mois : « Faits » + « Reçus » n&apos;est pas le nombre de raids (souvent proche du double). Utilisez le détail
          d&apos;un jour sur la page stats pour voir le nombre d&apos;événements distincts.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#3a4059] bg-[#101523]/60 p-2">
        <button type="button" onClick={() => setSeriesMode("both")} className="rounded px-2 py-1 text-xs" style={{ color: seriesMode === "both" ? "#e5e7eb" : "#94a3b8" }}>Les 2</button>
        <button type="button" onClick={() => setSeriesMode("sent")} className="rounded px-2 py-1 text-xs" style={{ color: seriesMode === "sent" ? "#f5f3ff" : "#94a3b8" }}>Faits</button>
        <button type="button" onClick={() => setSeriesMode("received")} className="rounded px-2 py-1 text-xs" style={{ color: seriesMode === "received" ? "#ecfeff" : "#94a3b8" }}>Recus</button>
        <button type="button" onClick={() => setValueMode("daily")} className="rounded px-2 py-1 text-xs" style={{ color: valueMode === "daily" ? "#fff" : "#94a3b8" }}>Journalier</button>
        <button type="button" onClick={() => setValueMode("cumulative")} className="rounded px-2 py-1 text-xs" style={{ color: valueMode === "cumulative" ? "#fff" : "#94a3b8" }}>Cumul</button>
        <button type="button" onClick={() => setCompareSent((prev) => !prev)} className="rounded px-2 py-1 text-xs" style={{ color: compareSent ? "#ddd6fe" : "#94a3b8" }}>M-1 Faits</button>
        <button type="button" onClick={() => setCompareReceived((prev) => !prev)} className="rounded px-2 py-1 text-xs" style={{ color: compareReceived ? "#bbf7d0" : "#94a3b8" }}>M-1 Recus</button>
        <button type="button" onClick={() => setShowTrend((prev) => !prev)} className="rounded px-2 py-1 text-xs" style={{ color: showTrend ? "#bae6fd" : "#94a3b8" }}>Tendance 7j</button>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} onClick={(event) => {
            const day = event?.activePayload?.[0]?.payload?.day;
            const next = typeof day === "number" ? day : null;
            setSelectedDay(next);
            onDaySelect?.(next);
          }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.16)" />
            <XAxis dataKey="day" type="number" domain={[1, "dataMax"]} tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <Tooltip cursor={{ stroke: "#60a5fa", strokeDasharray: "4 4" }} />

            {isSentVisible ? (
              <>
                <Area type="monotone" dataKey={mainSentKey} fill="#8b5cf6" fillOpacity={0.12} strokeOpacity={0} />
                <Line type="monotone" dataKey={mainSentKey} stroke="#8b5cf6" strokeWidth={2.2} dot={false} />
                {compareSent ? <Line type="monotone" dataKey={prevSentKey} stroke="#c4b5fd" strokeWidth={1.8} strokeDasharray="6 4" dot={false} /> : null}
                {showTrend && valueMode === "daily" ? <Line type="monotone" dataKey="trendSent" stroke="#a78bfa" strokeWidth={1.4} dot={false} strokeDasharray="2 5" /> : null}
              </>
            ) : null}

            {isReceivedVisible ? (
              <>
                <Area type="monotone" dataKey={mainReceivedKey} fill="#10b981" fillOpacity={0.12} strokeOpacity={0} />
                <Line type="monotone" dataKey={mainReceivedKey} stroke="#10b981" strokeWidth={2.2} dot={false} />
                {compareReceived ? <Line type="monotone" dataKey={prevReceivedKey} stroke="#5eead4" strokeWidth={1.8} strokeDasharray="6 4" dot={false} /> : null}
                {showTrend && valueMode === "daily" ? <Line type="monotone" dataKey="trendReceived" stroke="#34d399" strokeWidth={1.4} dot={false} strokeDasharray="2 5" /> : null}
              </>
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-[#475569] bg-[#0b1220]/55 text-slate-300">
          <p className="text-sm font-semibold">Aucun raid enregistre pour ce mois</p>
        </div>
      )}

      {selectedPoint ? (
        <div className="mt-3 rounded-xl border border-[#3a4059] bg-[#0d1220]/80 px-3 py-2 text-xs text-slate-300">
          <p className="font-semibold text-white">Jour {selectedPoint.day}</p>
          <p>
            {valueMode === "daily" ? "Journalier" : "Cumul"} : <span className="text-violet-200">{selectedPoint[mainSentKey as keyof typeof selectedPoint] as number} faits</span> / <span className="text-emerald-200">{selectedPoint[mainReceivedKey as keyof typeof selectedPoint] as number} recus</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
