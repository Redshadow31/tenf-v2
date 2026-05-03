"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ChevronLeft,
  ExternalLink,
  Film,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  Minus,
  PartyPopper,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wine,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { LucideIcon } from "lucide-react";

const glassHeroClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";

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

function categoryIcon(category: string): { icon: LucideIcon; gradient: string } {
  if (category === "Spotlight") return { icon: Sparkles, gradient: "from-violet-500 to-fuchsia-600" };
  if (category === "Soirée Film") return { icon: Film, gradient: "from-fuchsia-500 to-pink-600" };
  if (category === "Formation") return { icon: GraduationCap, gradient: "from-cyan-500 to-sky-600" };
  if (category === "Jeux communautaire") return { icon: Gamepad2, gradient: "from-emerald-500 to-teal-600" };
  if (category === "Apero" || category === "Apéro") return { icon: Wine, gradient: "from-amber-500 to-orange-600" };
  return { icon: PartyPopper, gradient: "from-indigo-500 to-sky-600" };
}

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
  const [focusedCategory, setFocusedCategory] = useState<string | null>(null);

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
      return maxChartValue(...data.comparisonForChart.flatMap((r) => [r.values.current, r.values.previous]));
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

  const comparisonInsights = useMemo(() => {
    if (!data?.prevMonthComparison?.length) return null;
    let best: { cat: string; delta: number } | null = null;
    let worst: { cat: string; delta: number } | null = null;
    for (const row of data.prevMonthComparison) {
      const c = row.currentAvg;
      const p = row.previousAvg;
      if (c === null || p === null) continue;
      const delta = Math.round((c - p) * 10) / 10;
      if (best === null || delta > best.delta) best = { cat: row.category, delta };
      if (worst === null || delta < worst.delta) worst = { cat: row.category, delta };
    }
    if (!best || !worst || best.cat === worst.cat) return null;
    return { best, worst };
  }, [data]);

  const avgTooltip = (label: string, payload: { payload?: Record<string, unknown> }[]) => {
    if (!payload?.length) return null;
    const p = payload[0]?.payload as { avgDisplay?: number | null; eventCount?: number; totalPresent?: number } | undefined;
    if (p?.eventCount != null) {
      return (
        <div className="rounded-md border border-[#2a2a2d] bg-[#121218] px-3 py-2 text-xs text-slate-200">
          <div className="font-medium text-slate-100">{label}</div>
          <div>
            Moyenne : <span className="text-indigo-200">{fmtAvg(p.avgDisplay ?? null)}</span> présents / événement
          </div>
          <div className="text-slate-400">
            {p.totalPresent} présent{(p.totalPresent ?? 0) > 1 ? "s" : ""} sur {p.eventCount} événement
            {(p.eventCount ?? 0) > 1 ? "s" : ""}
          </div>
          <p className="mt-1 border-t border-white/10 pt-1 text-[10px] text-slate-500">Clic sur la barre : surligner dans le tableau</p>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (payload: { category?: string } | undefined) => {
    const cat = payload?.category;
    if (!cat || typeof cat !== "string") return;
    setFocusedCategory((prev) => (prev === cat ? null : cat));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] scroll-smooth bg-[linear-gradient(165deg,#0a0a0f_0%,#12101c_48%,#0d1118_100%)] pb-12 text-white selection:bg-indigo-500/35">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <section className={`${glassHeroClass} p-6 md:p-8`}>
          <div className="pointer-events-none absolute -right-24 top-0 h-52 w-52 rounded-full bg-violet-600/16 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-cyan-500/12 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Link
                href="/admin/communaute/evenements"
                className={`inline-flex items-center gap-1 text-sm text-indigo-200/90 transition hover:text-white ${focusRingClass} rounded-lg`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Retour pilotage événements
              </Link>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-100/90">
                  Impact côté membres
                </span>
                <span className="rounded-full border border-emerald-400/28 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100/90">
                  Pilotage staff
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Suivi par type de créneau</p>
                <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                  Présences : où ça rassemble le plus ?
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-[15px]">
                  Ces chiffres traduisent l’<strong className="text-slate-100">expérience réelle</strong> des membres sur les
                  vocaux et événements : moyenne de personnes présentes <em>par événement</em>, par type (Spotlight, film,
                  formation…). Utilisez-les pour équilibrer l’agenda public et les annonces Discord — pas comme un simple
                  tableau interne.
                </p>
                {data?.metricDescription ? (
                  <p className="mt-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs leading-relaxed text-slate-400">
                    {data.metricDescription}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void load()} className={`${subtleButtonClass} ${focusRingClass}`}>
                  <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                  Actualiser les données
                </button>
                <Link href="/admin/communaute/evenements/calendrier" className={`${subtleButtonClass} ${focusRingClass}`}>
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                  Calendrier créneaux
                </Link>
                <Link
                  href="/admin/communaute/evenements/participation"
                  className={`${subtleButtonClass} ${focusRingClass} border-sky-400/25 bg-sky-500/10 text-sky-100`}
                >
                  Feuilles de présence
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
                <Link href="/events2" target="_blank" rel="noopener noreferrer" className={`${subtleButtonClass} ${focusRingClass}`}>
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                  Aperçu agenda public
                </Link>
              </div>
            </div>
            <div className="w-full max-w-sm shrink-0 space-y-3 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                <Lightbulb className="h-4 w-4 text-amber-300" aria-hidden />
                Lecture rapide
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Une moyenne qui baisse peut signifier moins de monde dans le vocal <em>ou</em> plus d’événements plus courts :
                croisez avec le nombre d’événements du mois avant de conclure.
              </p>
              <p className="text-xs text-slate-500">
                Fuseau : <span className="text-slate-300">{data?.timezone ?? "Europe/Paris"}</span> · mois civil.
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`${sectionCardClass} h-28 animate-pulse bg-slate-800/40`} />
              ))}
            </div>
            <div className={`${sectionCardClass} h-72 animate-pulse bg-slate-800/30`} />
            <div className={`${sectionCardClass} h-96 animate-pulse bg-slate-800/30`} />
            <p className="text-center text-sm text-slate-500">Chargement des statistiques de présence…</p>
          </div>
        ) : error ? (
          <section className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-5 text-sm text-rose-100">{error}</section>
        ) : data ? (
          <>
            {focusedCategory ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-400/35 bg-indigo-500/15 px-4 py-3 text-sm text-indigo-100">
                <span>
                  Filtre visuel : <strong className="text-white">{focusedCategory}</strong> — ligne surlignée dans le tableau
                  ci-dessous.
                </span>
                <button
                  type="button"
                  onClick={() => setFocusedCategory(null)}
                  className={`inline-flex items-center gap-1 rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs font-medium text-white transition hover:bg-white/10 ${focusRingClass}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Réinitialiser
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className={`${sectionCardClass} group p-5 transition hover:border-indigo-400/30`}>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Mois de référence</p>
                <p className="mt-2 text-lg font-bold text-white">{data.monthLabels[data.referenceMonth]}</p>
                <p className="text-xs text-slate-500">{data.referenceMonth}</p>
              </article>
              <article className={`${sectionCardClass} group border-emerald-500/15 p-5 transition hover:border-emerald-400/30`}>
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-slate-400">
                  <Users className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                  Moyenne globale
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-300 transition group-hover:text-emerald-200">
                  {fmtAvg(data.globalCurrentMonth.avgPresent)}
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-500">
                  présents / événement · {data.globalCurrentMonth.totalPresent} présence(s) sur{" "}
                  {data.globalCurrentMonth.eventCount} événement(s)
                </p>
              </article>
              <article className={`${sectionCardClass} group border-sky-500/15 p-5 transition hover:border-sky-400/30`}>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Événements (mois ref.)</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-sky-300">{data.eventsReferenceMonth}</p>
                <p className="mt-1 text-xs text-slate-500">Tous types — date de l’événement</p>
              </article>
              <article className={`${sectionCardClass} group border-violet-500/15 p-5 transition hover:border-violet-400/30`}>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Fenêtre d’analyse</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-violet-200">{data.eventsInWindow}</p>
                <p className="mt-1 text-xs text-slate-500">{data.eventCount} événements fusionnés (sources)</p>
              </article>
            </div>

            {comparisonInsights ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div
                  className={`rounded-2xl border p-4 ${
                    comparisonInsights.best.delta >= 0
                      ? "border-emerald-400/25 bg-emerald-500/10"
                      : "border-slate-500/30 bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
                    <TrendingUp className="h-4 w-4" aria-hidden />
                    Écart le plus favorable (vs mois précédent)
                  </div>
                  <p className="mt-2 text-lg font-bold text-white">{comparisonInsights.best.cat}</p>
                  <p className="text-sm text-slate-200">
                    {comparisonInsights.best.delta > 0 ? "+" : ""}
                    {fmtAvg(comparisonInsights.best.delta)} sur la moyenne présents / événement
                  </p>
                </div>
                <div
                  className={`rounded-2xl border p-4 ${
                    comparisonInsights.worst.delta < 0
                      ? "border-rose-400/25 bg-rose-500/10"
                      : "border-slate-500/30 bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-200/90">
                    <TrendingDown className="h-4 w-4" aria-hidden />
                    Écart le moins favorable (vs mois précédent)
                  </div>
                  <p className="mt-2 text-lg font-bold text-white">{comparisonInsights.worst.cat}</p>
                  <p className="text-sm text-slate-200">
                    {comparisonInsights.worst.delta > 0 ? "+" : ""}
                    {fmtAvg(comparisonInsights.worst.delta)} sur la moyenne présents / événement
                  </p>
                </div>
              </div>
            ) : null}

            <section className={`${sectionCardClass} p-5 sm:p-6`}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/25 text-indigo-200">
                    <Users className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-white">Moyenne de présents par événement</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Mois affiché : <strong className="text-slate-200">{data.monthLabels[data.referenceMonth]}</strong> — cliquez une
                      barre pour surligner le type dans le tableau.
                    </p>
                  </div>
                </div>
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
                        content={({ label, payload }) => avgTooltip(String(label ?? ""), (payload || []) as { payload?: Record<string, unknown> }[])}
                        cursor={{ fill: "rgba(99,102,241,0.08)" }}
                      />
                      <Bar dataKey="avg" name="Présents / événement" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={24}>
                        {currentBarData.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.category}-${index}`}
                            fill="#6366f1"
                            opacity={focusedCategory && entry.category !== focusedCategory ? 0.38 : 1}
                            cursor="pointer"
                            onClick={() => handleBarClick(entry)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {data.currentMonthByCategory.length > 7 ? (
                <p className="mt-3 text-xs text-slate-500">
                  Plus de sept types sur le mois : les types les moins représentés sont regroupés sous « Autres ».
                </p>
              ) : null}
            </section>

            <section className={`${sectionCardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-200">
                    <BarChart3 className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-white">Comparer dans le temps</h2>
                    <p className="mt-1 text-sm text-slate-400">Même métrique (présents / événement), autre échelle temporelle.</p>
                  </div>
                </div>
                <div className="flex w-full rounded-2xl border border-[#353a50] bg-[#0f1424] p-1 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setCompareMode("prev")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${focusRingClass} ${
                      compareMode === "prev" ? "bg-indigo-500/35 text-white shadow-inner" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Calendar className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    Mois précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareMode("last3")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${focusRingClass} ${
                      compareMode === "last3" ? "bg-indigo-500/35 text-white shadow-inner" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
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
              <p className="mt-4 rounded-xl border border-white/8 bg-black/25 px-3 py-2 text-xs leading-relaxed text-slate-500">
                Au plus dix types par graphique ; le reste sous « Autres ». Une barre à <strong className="text-slate-400">0</strong> signifie
                qu’aucune présence validée n’a été enregistrée sur la période pour ce type — à recouper avec les feuilles de présence.
              </p>
            </section>

            <section className={`${sectionCardClass} overflow-hidden`}>
              <div className="flex flex-col gap-1 border-b border-[#2f3244] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-bold text-white">Tableau détaillé</h2>
                <p className="text-xs text-slate-500">Cliquez une ligne pour la mettre en avant (ou recliquez pour tout afficher)</p>
              </div>
              <div className="overflow-x-auto p-4 sm:p-5">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-[#353a50] text-left text-xs uppercase tracking-[0.08em] text-slate-400">
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Moyenne {data.monthLabels[data.referenceMonth]}</th>
                      <th className="px-3 py-3">Moyenne {data.monthLabels[data.previousMonth]}</th>
                      <th className="px-3 py-3">Écart</th>
                      <th className="px-3 py-3">Événements (mois ref.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.prevMonthComparison.map((row) => {
                      const c = row.currentAvg;
                      const p = row.previousAvg;
                      const delta = c !== null && p !== null ? Math.round((c - p) * 10) / 10 : null;
                      const { icon: Icon, gradient } = categoryIcon(row.category);
                      const isFocused = focusedCategory === row.category;
                      return (
                        <tr
                          key={row.category}
                          onClick={() => setFocusedCategory((prev) => (prev === row.category ? null : row.category))}
                          className={`cursor-pointer border-b border-white/5 transition hover:bg-white/[0.04] ${
                            isFocused ? "bg-indigo-500/15 ring-1 ring-inset ring-indigo-400/40" : ""
                          }`}
                        >
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-2 font-medium text-slate-100">
                              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}>
                                <Icon className="h-4 w-4 text-white" aria-hidden />
                              </span>
                              {row.category}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-300">{fmtAvg(c)}</td>
                          <td className="px-3 py-3 text-slate-300">{fmtAvg(p)}</td>
                          <td className="px-3 py-3">
                            {delta === null ? (
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <Minus className="h-3.5 w-3.5" aria-hidden />
                                —
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 font-semibold ${
                                  delta > 0 ? "text-emerald-300" : delta < 0 ? "text-rose-300" : "text-slate-300"
                                }`}
                              >
                                {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : null}
                                {delta < 0 ? <TrendingDown className="h-3.5 w-3.5" aria-hidden /> : null}
                                {delta === 0 ? <Minus className="h-3.5 w-3.5" aria-hidden /> : null}
                                {delta > 0 ? `+${fmtAvg(delta)}` : fmtAvg(delta)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-slate-400">{row.currentEventCount > 0 ? row.currentEventCount : "—"}</td>
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
    </div>
  );
}
