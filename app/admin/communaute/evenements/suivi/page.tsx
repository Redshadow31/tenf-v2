"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Percent } from "lucide-react";
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
  rate: number | null;
};

type SuiviPayload = {
  timezone: string;
  referenceMonth: string;
  previousMonth: string;
  last3MonthKeys: string[];
  monthLabels: Record<string, string>;
  metricDescription: string;
  globalCurrentMonth: { rate: number | null; eventCount: number };
  currentMonthByCategory: CatMonthRow[];
  prevMonthComparison: {
    category: string;
    currentRate: number | null;
    previousRate: number | null;
    currentEventCount: number;
    previousEventCount: number;
  }[];
  comparisonForChart: { category: string; values: { current: number | null; previous: number | null } }[];
  last3ForChart: { category: string; values: Record<string, number | null> }[];
  eventCount: number;
  eventsInWindow: number;
  eventsReferenceMonth: number;
  eventsReferenceMonthWithRate: number;
};

/** Regroupe les types les moins représentés : moyenne pondérée par le nombre d’événements dans « Autres ». */
function collapseCurrentByEvents(rows: CatMonthRow[], max: number): CatMonthRow[] {
  if (rows.length <= max) return rows;
  const head = rows.slice(0, max - 1);
  const tail = rows.slice(max - 1);
  const valid = tail.filter((r) => r.rate !== null && r.eventCount > 0);
  const nTotal = valid.reduce((s, r) => s + r.eventCount, 0);
  const rate =
    nTotal > 0 ? Math.round(valid.reduce((s, r) => s + (r.rate as number) * r.eventCount, 0) / nTotal) : null;
  const eventCount = tail.reduce((s, r) => s + r.eventCount, 0);
  return [...head, { category: "Autres", eventCount, rate }];
}

function fmtRate(v: number | null): string {
  if (v === null) return "—";
  return `${v} %`;
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
      rate: r.rate ?? 0,
      rateDisplay: r.rate,
      eventCount: r.eventCount,
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

  const rateTooltip = (label: string, payload: any[]) => {
    if (!payload?.length) return null;
    const p = payload[0]?.payload;
    if (p?.eventCount != null) {
      return (
        <div className="rounded-md border border-[#2a2a2d] bg-[#121218] px-3 py-2 text-xs text-slate-200">
          <div className="font-medium text-slate-100">{label}</div>
          <div>Taux moyen : {fmtRate(p.rateDisplay)}</div>
          <div className="text-slate-400">Moyenne sur {p.eventCount} événement{p.eventCount > 1 ? "s" : ""} (≥1 inscription)</div>
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
            Moyenne des taux de présence par événement (présents / inscriptions sur chaque événement avec au moins une
            inscription), puis moyenne arithmétique par type et par mois civil (fuseau{" "}
            {data?.timezone ?? "Europe/Paris"}). Comparaison au mois précédent ou sur les trois derniers mois.
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
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{fmtRate(data.globalCurrentMonth.rate)}</p>
              <p className="text-xs text-slate-500">
                Moyenne sur {data.globalCurrentMonth.eventCount} événement
                {data.globalCurrentMonth.eventCount > 1 ? "s" : ""} (≥1 inscription)
              </p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements (mois ref.)</p>
              <p className="mt-1 text-2xl font-semibold text-sky-300">{data.eventsReferenceMonth}</p>
              <p className="text-xs text-slate-500">
                dont {data.eventsReferenceMonthWithRate} pris en compte dans la moyenne (≥1 inscription)
              </p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements analysés (fenêtre)</p>
              <p className="mt-1 text-2xl font-semibold text-indigo-200">{data.eventsInWindow}</p>
              <p className="text-xs text-slate-500">{data.eventCount} événements fusionnés au total (sources)</p>
            </article>
          </div>

          <section className={`${sectionCardClass} p-5`}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Percent className="h-5 w-5 text-indigo-300" />
              <h2 className="text-lg font-semibold text-slate-100">Moyenne par type — mois en cours</h2>
            </div>
            {currentBarData.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune inscription sur le mois de référence (taux non calculable).</p>
            ) : (
              <div
                className="w-full min-h-[280px]"
                style={{ height: Math.min(640, 140 + currentBarData.length * 44) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={currentBarData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#32323a" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" tickLine={false} unit=" %" />
                    <YAxis type="category" dataKey="category" stroke="#9ca3af" tickLine={false} width={120} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ label, payload }) => rateTooltip(String(label ?? ""), payload || [])}
                      cursor={{ fill: "rgba(99,102,241,0.08)" }}
                    />
                    <Bar dataKey="rate" name="Taux (%)" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {data.currentMonthByCategory.length > 7 ? (
              <p className="mt-2 text-xs text-slate-500">
                Plus de sept types avec événements pris en compte : les types les moins représentés sont regroupés sous «
                Autres ».
              </p>
            ) : null}
          </section>

          <section className={`${sectionCardClass} p-5`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold text-slate-100">Comparaison des taux (%)</h2>
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
                    <YAxis stroke="#9ca3af" tickLine={false} domain={[0, 100]} allowDecimals={false} unit=" %" />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string, item: { payload?: Record<string, unknown> }) => {
                        const row = item?.payload;
                        const raw = name === "Mois en cours" ? row?._c : row?._p;
                        const suffix = raw === null ? " (aucun événement avec inscription)" : "";
                        return [`${value} %${suffix}`, name];
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
                    <YAxis stroke="#9ca3af" tickLine={false} domain={[0, 100]} allowDecimals={false} unit=" %" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} %`, ""]} />
                    <Legend />
                    {last3BarKeys.map((name, i) => (
                      <Bar key={name} dataKey={name} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Barres : au plus dix types (nombre d’événements pris en compte sur la période) ; le reste sous « Autres ».
              0 % peut indiquer aucun événement avec inscription sur ce mois pour ce type.
            </p>
          </section>

          <section className={`${sectionCardClass} overflow-hidden`}>
            <div className="border-b border-[#2f3244] px-5 py-3">
              <h2 className="text-base font-semibold text-slate-100">Tableau — moyennes et effectifs</h2>
            </div>
            <div className="overflow-x-auto p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#353a50] text-left text-xs uppercase tracking-[0.08em] text-slate-400">
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Taux {data.monthLabels[data.referenceMonth]}</th>
                    <th className="px-2 py-2">Taux {data.monthLabels[data.previousMonth]}</th>
                    <th className="px-2 py-2">Écart (points)</th>
                    <th className="px-2 py-2">Événements dans la moyenne (mois ref.)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.prevMonthComparison.map((row) => {
                    const c = row.currentRate;
                    const p = row.previousRate;
                    const delta =
                      c !== null && p !== null ? c - p : c !== null ? c : p !== null ? -p : null;
                    return (
                      <tr key={row.category} className="border-b border-white/5">
                        <td className="px-2 py-2 text-slate-200">{row.category}</td>
                        <td className="px-2 py-2 text-slate-300">{fmtRate(c)}</td>
                        <td className="px-2 py-2 text-slate-300">{fmtRate(p)}</td>
                        <td className={`px-2 py-2 font-medium ${delta === null ? "text-slate-500" : delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          {delta === null ? "—" : delta >= 0 ? `+${delta}` : delta}
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
