"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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

type SuiviPayload = {
  timezone: string;
  referenceMonth: string;
  previousMonth: string;
  last3MonthKeys: string[];
  monthLabels: Record<string, string>;
  totalCurrentMonth: number;
  currentMonthByCategory: { category: string; count: number }[];
  prevMonthComparison: { category: string; current: number; previous: number }[];
  comparisonForChart: { category: string; values: Record<string, number> }[];
  last3ForChart: { category: string; values: Record<string, number> }[];
  eventCount: number;
};

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

  const pieData = useMemo(() => {
    const raw = data?.currentMonthByCategory ?? [];
    if (raw.length <= 8) return raw;
    const head = raw.slice(0, 7);
    const autres = raw.slice(7).reduce((sum, r) => sum + r.count, 0);
    return [...head, { category: "Autres", count: autres }];
  }, [data]);

  const barPrevData = useMemo(() => {
    if (!data) return [];
    return data.comparisonForChart.map((r) => ({
      category: r.category,
      "Mois en cours": r.values.current ?? 0,
      "Mois précédent": r.values.previous ?? 0,
    }));
  }, [data]);

  const barLast3Data = useMemo(() => {
    if (!data) return [];
    return data.last3ForChart.map((r) => {
      const row: Record<string, string | number> = { category: r.category };
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
            Suivi par type
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Répartition des événements par catégorie (date de l’événement, fuseau {data?.timezone ?? "Europe/Paris"}).
            Comparaison avec le mois précédent ou tendance sur les trois derniers mois civils.
          </p>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Mois de référence</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{data.monthLabels[data.referenceMonth]}</p>
              <p className="text-xs text-slate-500">{data.referenceMonth}</p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements ce mois-ci</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{data.totalCurrentMonth}</p>
              <p className="text-xs text-slate-500">Total par date d’événement</p>
            </article>
            <article className={`${sectionCardClass} p-4`}>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements fusionnés (sources)</p>
              <p className="mt-1 text-2xl font-semibold text-sky-300">{data.eventCount}</p>
              <p className="text-xs text-slate-500">community_events + legacy dédoublonnés</p>
            </article>
          </div>

          <section className={`${sectionCardClass} p-5`}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-indigo-300" />
              <h2 className="text-lg font-semibold text-slate-100">Ce mois-ci par type</h2>
            </div>
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun événement sur le mois de référence.</p>
            ) : (
              <div className="h-80 w-full min-h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={(props) => {
                        const pct = typeof props.percent === "number" ? Math.round(props.percent * 100) : 0;
                        return `${pct}%`;
                      }}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#0b1020" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Événements"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {pieData.length > 0 && data && data.currentMonthByCategory.length > 8 ? (
              <p className="mt-2 text-xs text-slate-500">
                Plus de huit types ce mois-ci : les types les moins fréquents sont regroupés sous « Autres » dans ce graphique.
              </p>
            ) : null}
          </section>

          <section className={`${sectionCardClass} p-5`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold text-slate-100">Comparaison</h2>
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
                    <YAxis stroke="#9ca3af" tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="Mois en cours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Mois précédent" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={barLast3Data} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#32323a" />
                    <XAxis dataKey="category" stroke="#9ca3af" tickLine={false} interval={0} angle={-28} textAnchor="end" height={72} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    {last3BarKeys.map((name, i) => (
                      <Bar key={name} dataKey={name} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Les graphiques en barres regroupent au plus dix types explicites ; le reste est agrégé sous « Autres ».
            </p>
          </section>

          <section className={`${sectionCardClass} overflow-hidden`}>
            <div className="border-b border-[#2f3244] px-5 py-3">
              <h2 className="text-base font-semibold text-slate-100">Tableau mois en cours vs précédent</h2>
            </div>
            <div className="overflow-x-auto p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#353a50] text-left text-xs uppercase tracking-[0.08em] text-slate-400">
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">{data.monthLabels[data.referenceMonth]}</th>
                    <th className="px-2 py-2">{data.monthLabels[data.previousMonth]}</th>
                    <th className="px-2 py-2">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {data.prevMonthComparison.map((row) => {
                    const delta = row.current - row.previous;
                    return (
                      <tr key={row.category} className="border-b border-white/5">
                        <td className="px-2 py-2 text-slate-200">{row.category}</td>
                        <td className="px-2 py-2 text-slate-300">{row.current}</td>
                        <td className="px-2 py-2 text-slate-300">{row.previous}</td>
                        <td className={`px-2 py-2 font-medium ${delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          {delta >= 0 ? `+${delta}` : delta}
                        </td>
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
