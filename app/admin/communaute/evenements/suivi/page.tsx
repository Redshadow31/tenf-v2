"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Users } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";

const CHART_COLORS = [
  "#6366f1",
  "#22d3ee",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#fb7185",
  "#38bdf8",
  "#4ade80",
  "#fcd34d",
  "#94a3b8",
];

const tooltipStyle = {
  backgroundColor: "#121218",
  border: "1px solid #2a2a2d",
  borderRadius: 8,
};

type CatMonthRow = {
  category: string;
  eventCount: number;
  totalPresent: number;
  avgPresent: number | null;
};

type SuiviPayload = {
  timezone: string;
  referenceMonth: string;
  previousMonth: string;
  last3MonthKeys: string[];
  monthLabels: Record<string, string>;
  metricDescription: string;
  globalCurrentMonth: { avgPresent: number | null; eventCount: number; totalPresent: number };
  currentMonthByCategory: CatMonthRow[];
  prevMonthComparison: {
    category: string;
    currentAvg: number | null;
    previousAvg: number | null;
    currentEventCount: number;
    previousEventCount: number;
  }[];
  comparisonForChart: { category: string; values: { current: number | null; previous: number | null } }[];
  last3ForChart: { category: string; values: Record<string, number | null> }[];
  eventCount: number;
  eventsInWindow: number;
  eventsReferenceMonth: number;
};

/** Regroupe les types les moins représentés : moyenne = total présents / total événements. */
function collapseCurrentByEvents(rows: CatMonthRow[], max: number): CatMonthRow[] {
  if (rows.length <= max) return rows;
  const head = rows.slice(0, max - 1);
  const tail = rows.slice(max - 1);
  const eventCount = tail.reduce((s, r) => s + r.eventCount, 0);
  const totalPresent = tail.reduce((s, r) => s + r.totalPresent, 0);
  const avgPresent = eventCount > 0 ? Math.round((totalPresent * 10) / eventCount) / 10 : null;
  return [...head, { category: "Autres", eventCount, totalPresent, avgPresent }];
}

function fmtAvg(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

function maxChartValue(...candidates: (number | null | undefined)[]): number {
  let m = 0;
  for (const n of candidates) {
    if (typeof n === "number" && !Number.isNaN(n)) m = Math.max(m, n);
  }
  return Math.max(4, Math.ceil(m * 1.12 + 0.4));
}

export default function CommunauteEvenementsSuiviPage() {
  const [data, setData] = useState<SuiviPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<"prev" | "last3">("prev");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events/suivi-stats", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(typeof j?.error === "string" ? j.error : "Impossible de charger les statistiques.");
        setData(null);
        return;
      }
      setData(await res.json());
    } catch {
      setError("Erreur réseau.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const currentBarData = useMemo(() => {
    const raw = data?.currentMonthByCategory ?? [];
    return collapseCurrentByEvents(raw, 8).map((r) => ({
      category: r.category,
      avg: r.avgPresent ?? 0,
      avgDisplay: r.avgPresent,
      eventCount: r.eventCount,
      totalPresent: r.totalPresent,
    }));
  }, [data]);

  const barPrevData = useMemo(() => {
    if (!data) return [];
    return data.comparisonForChart.map((r) => ({
      category: r.category,
      "Mois en cours": r.values.current ?? 0,
      "Mois précédent": r.values.previous ?? 0,
      _c: r.values.current,
      _p: r.values.previous,
    }));
  }, [data]);

  const barLast3Data = useMemo(() => {
    if (!data) return [];
    return data.last3ForChart.map((r) => {
      const row: Record<string, string | number | null> = { category: r.category };
      for (const mk of data.last3MonthKeys) {
        row[data.monthLabels[mk] || mk] = r.values[mk] ?? 0;
      }
      return row;
    });
  }, [data]);

  const last3BarKeys = useMemo(() => {
    if (!data) return [] as string[];
    return data.last3MonthKeys.map((mk) => data.monthLabels[mk] || mk);
  }, [data]);

  const yMaxCurrent = useMemo(() => {
    if (!data) return 10;
    return maxChartValue(...currentBarData.map((r) => r.avgDisplay));
  }, [data, currentBarData]);

  const yMaxCompare = useMemo(() => {
    if (!data) return 10;
    if (compareMode === "prev") {
      return maxChartValue(
        ...data.comparisonForChart.flatMap((r) => [r.values.current, r.values.previous])
      );
    }
    const nums: number[] = [];
    for (const row of data.last3ForChart) {
      for (const mk of data.last3MonthKeys) {
        const v = row.values[mk];
        if (v != null) nums.push(v);
      }
    }
    return maxChartValue(...nums);
  }, [data, compareMode]);

  const avgTooltip = (label: string, payload: any[]) => {
    if (!payload?.length) return null;
    const p = payload[0]?.payload;
    if (p?.eventCount != null) {
      return (
        <div className="rounded-md border border-[#2a2a2d] bg-[#121218] px-3 py-2 text-xs text-slate-200">
          <div className="font-medium text-slate-100">{label}</div>
          <div>
            Moyenne : <span className="text-indigo-200">{fmtAvg(p.avgDisplay)}</span> présents / événement
          </div>
          <div className="text-slate-400">
            {p.totalPresent} présent{p.totalPresent > 1 ? "s" : ""} sur {p.eventCount} événement{p.eventCount > 1 ? "s" : ""}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/communaute/evenements"
            className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-indigo-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au pilotage événements
          </Link>
          <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Communauté · Événements</p>
          <h1 className="mt-1 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
            Suivi présence par type
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Nombre moyen de présents par événement : total des présents (lignes validées « présent ») divisé par le
            nombre d’événements de chaque type sur le mois civil (fuseau {data?.timezone ?? "Europe/Paris"}). Valeur
            affichée en nombre de personnes, pas en pourcentage.
          </p>
          {data?.metricDescription ? <p className="mt-1 text-xs text-slate-500">{data.metricDescription}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-indigo-300/25 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/20"
        >
          Actualiser
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Mois de référence</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{data.monthLabels[data.referenceMonth]}</p>
              <p className="text-xs text-slate-500">{data.referenceMonth}</p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Moyenne globale ce mois-ci</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{fmtAvg(data.globalCurrentMonth.avgPresent)}</p>
              <p className="text-xs text-slate-500">
                présents / événement · {data.globalCurrentMonth.totalPresent} présent
                {data.globalCurrentMonth.totalPresent > 1 ? "s" : ""} sur {data.globalCurrentMonth.eventCount}{" "}
                événement{data.globalCurrentMonth.eventCount > 1 ? "s" : ""}
              </p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements (mois ref.)</p>
              <p className="mt-1 text-2xl font-semibold text-sky-300">{data.eventsReferenceMonth}</p>
              <p className="text-xs text-slate-500">Tous types, d’après la date d’événement</p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements analysés (fenêtre)</p>
              <p className="mt-1 text-2xl font-semibold text-indigo-200">{data.eventsInWindow}</p>
              <p className="text-xs text-slate-500">{data.eventCount} événements fusionnés au total (sources)</p>
            </article>
          </div>

          <section className={`${sectionCardClass} p-5`}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Users className="h-5 w-5 text-indigo-300" />
              <h2 className="text-lg font-semibold text-slate-100">Moyenne présents / événement — mois en cours</h2>
            </div>
            {currentBarData.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun événement sur le mois de référence.</p>
            ) : (
              <div
                className="w-full min-h-[280px]"
                style={{ height: Math.min(640, 140 + currentBarData.length * 44) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={currentBarData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#32323a" horizontal={false} />
                    <XAxis type="number" domain={[0, yMaxCurrent]} stroke="#9ca3af" tickLine={false} allowDecimals />
                    <YAxis type="category" dataKey="category" stroke="#9ca3af" tickLine={false} width={120} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ label, payload }) => avgTooltip(String(label ?? ""), payload || [])}
                      cursor={{ fill: "rgba(99,102,241,0.08)" }}
                    />
                    <Bar dataKey="avg" name="Présents / événement" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {data.currentMonthByCategory.length > 7 ? (
              <p className="mt-2 text-xs text-slate-500">
                Plus de sept types sur le mois : les types avec le moins d’événements sont regroupés sous « Autres ».
              </p>
            ) : null}
          </section>

          <section className={`${sectionCardClass} p-5`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold text-slate-100">Comparaison (présents / événement)</h2>
              </div>
              <div className="flex rounded-lg border border-[#353a50] bg-[#121623]/80 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCompareMode("prev")}
                  className={`rounded-md px-3 py-1.5 transition ${
                    compareMode === "prev" ? "bg-indigo-500/30 text-indigo-100" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Mois précédent
                </button>
                <button
                  type="button"
                  onClick={() => setCompareMode("last3")}
                  className={`rounded-md px-3 py-1.5 transition ${
                    compareMode === "last3" ? "bg-indigo-500/30 text-indigo-100" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  3 derniers mois
                </button>
              </div>
            </div>

            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {compareMode === "prev" ? (
                  <BarChart data={barPrevData} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#32323a" />
                    <XAxis dataKey="category" stroke="#9ca3af" tickLine={false} interval={0} angle={-28} textAnchor="end" height={72} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tickLine={false} domain={[0, yMaxCompare]} allowDecimals />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string, item: { payload?: Record<string, unknown> }) => {
                        const row = item?.payload;
                        const raw = name === "Mois en cours" ? row?._c : row?._p;
                        const suffix = raw === null ? " (aucun événement)" : "";
                        return [`${fmtAvg(typeof value === "number" ? value : Number(value))}${suffix}`, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Mois en cours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Mois précédent" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={barLast3Data} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#32323a" />
                    <XAxis dataKey="category" stroke="#9ca3af" tickLine={false} interval={0} angle={-28} textAnchor="end" height={72} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tickLine={false} domain={[0, yMaxCompare]} allowDecimals />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number | string) => [fmtAvg(typeof v === "number" ? v : Number(v)), ""]}
                    />
                    <Legend />
                    {last3BarKeys.map((name, i) => (
                      <Bar key={name} dataKey={name} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Barres : au plus dix types (nombre d’événements sur la période) ; le reste sous « Autres ». Une moyenne à 0
              indique qu’il n’y a pas eu de présent enregistré sur ce mois pour ce type.
            </p>
          </section>

          <section className={`${sectionCardClass} overflow-hidden`}>
            <div className="border-b border-[#2f3244] px-5 py-3">
              <h2 className="text-base font-semibold text-slate-100">Tableau — moyenne et effectifs</h2>
            </div>
            <div className="overflow-x-auto p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#353a50] text-left text-xs uppercase tracking-[0.08em] text-slate-400">
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Moyenne {data.monthLabels[data.referenceMonth]}</th>
                    <th className="px-2 py-2">Moyenne {data.monthLabels[data.previousMonth]}</th>
                    <th className="px-2 py-2">Écart</th>
                    <th className="px-2 py-2">Événements (mois ref.)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.prevMonthComparison.map((row) => {
                    const c = row.currentAvg;
                    const p = row.previousAvg;
                    const delta = c !== null && p !== null ? Math.round((c - p) * 10) / 10 : null;
                    return (
                      <tr key={row.category} className="border-b border-white/5">
                        <td className="px-2 py-2 text-slate-200">{row.category}</td>
                        <td className="px-2 py-2 text-slate-300">{fmtAvg(c)}</td>
                        <td className="px-2 py-2 text-slate-300">{fmtAvg(p)}</td>
                        <td className={`px-2 py-2 font-medium ${delta === null ? "text-slate-500" : delta > 0 ? "text-emerald-300" : delta < 0 ? "text-rose-300" : "text-slate-300"}`}>
                          {delta === null ? "—" : delta > 0 ? `+${fmtAvg(delta)}` : fmtAvg(delta)}
                        </td>
                        <td className="px-2 py-2 text-slate-400">{row.currentEventCount > 0 ? row.currentEventCount : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
