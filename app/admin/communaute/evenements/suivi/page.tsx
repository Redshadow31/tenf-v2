"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarCheck2,
  ChevronLeft,
  Compass,
  ExternalLink,
  Film,
  Gamepad2,
  GraduationCap,
  ListOrdered,
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

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const heroVisualClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const subtleButtonClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

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
  backgroundColor: "rgba(9,9,11,0.94)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
};

const lectureSteps = [
  {
    n: "1",
    title: "Vérifier le volume",
    body: "Un écart peut venir du nombre d’événements, pas seulement de l’ambiance vocal.",
  },
  {
    n: "2",
    title: "Croiser les sources",
    body: "Quand une moyenne chute ou un bar est à zéro, ouvrir les feuilles de présence pour le détail réel.",
  },
  {
    n: "3",
    title: "Prioriser les types faibles",
    body: "Concentrez l’animation publique sur les créneaux qui tirent peu la communauté, sans extrapoler sur un mois trop court.",
  },
];

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
        <div className="rounded-md border border-zinc-700/90 bg-zinc-950 px-3 py-2 text-[length:clamp(0.6875rem,0.625rem+0.28vw,0.8125rem)] text-zinc-200">
          <div className="font-medium text-zinc-50">{label}</div>
          <div>
            Moyenne : <span className="text-violet-200">{fmtAvg(p.avgDisplay ?? null)}</span> présents / événement
          </div>
          <div className="text-zinc-400">
            {p.totalPresent} présent{(p.totalPresent ?? 0) > 1 ? "s" : ""} sur {p.eventCount} événement
            {(p.eventCount ?? 0) > 1 ? "s" : ""}
          </div>
          <p className="mt-1 border-t border-white/10 pt-1 text-[10px] text-zinc-500">Clic sur la barre : surligner dans le tableau</p>
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
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-10 text-white selection:bg-violet-500/35 [--suivi-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-2.5rem] -z-10 h-[clamp(240px,32vw,440px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_-8%,rgba(167,139,250,0.28),transparent_54%),radial-gradient(ellipse_at_88%_18%,rgba(56,189,248,0.14),transparent_48%),radial-gradient(ellipse_at_52%_100%,rgba(244,114,182,0.08),transparent_52%)]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-20 h-[min(820px,100vh)] max-h-none"
        style={{
          backgroundImage:
            "linear-gradient(104deg,rgba(255,255,255,0.035) 0px,rgba(255,255,255,0.035) 1px,transparent 1px,transparent 74px)",
          backgroundSize: "clamp(54px,4.2vw,72px) 100%",
          opacity: 0.22,
          maskImage: "linear-gradient(180deg,black 0%,transparent 78%)",
        }}
      />

      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pt-2 pb-6 sm:pt-3 md:pb-10">
        <div className="grid min-w-0 grid-cols-1 gap-6 [--sidebar:min(100%,clamp(17rem,24vw,25rem))] xl:grid-cols-[minmax(0,1fr)_var(--sidebar)] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 xl:space-y-[var(--suivi-gap)] sm:space-y-8">
            <header
              className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] lg:gap-8 lg:grid-cols-[minmax(0,1.42fr)_minmax(260px,min(100%,0.94fr))] ${panelClass}`}
            >
              <div className="min-w-0 space-y-4">
                <Link
                  href="/admin/communaute/evenements"
                  className={`inline-flex items-center gap-1 text-[length:clamp(0.8rem,0.74rem+0.32vw,0.9375rem)] text-zinc-400 transition hover:text-white ${focusRingClass} rounded-lg`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Retour pilotage événements
                </Link>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-[0.625em] py-[0.35em] text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.1em] text-violet-100/92">
                    Impact côté membres
                  </span>
                  <span className="rounded-full border border-emerald-400/26 bg-emerald-500/[0.08] px-[0.625em] py-[0.35em] text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.1em] text-emerald-100/90">
                    Pilotage staff
                  </span>
                </div>
                <div>
                  <p className="text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95">
                    Suivi par type de créneau
                  </p>
                  <h1 className="mt-2 text-[clamp(1.45rem,1.05rem+1.05vw,2.35rem)] font-semibold tracking-tight text-white">
                    Présences : où ça rassemble le plus ?
                  </h1>
                  <p className="mt-3 max-w-3xl text-[length:clamp(0.8125rem,0.75rem+0.32vw,0.9625rem)] leading-[1.65] text-zinc-400">
                    Ces graphiques reflètent l’expérience réelle sur les créneaux : moyenne de personnes présentes{" "}
                    <strong className="font-semibold text-zinc-100">par événement</strong>, segmentée par type. Idéal pour
                    équilibrer l’agenda et les annonces — les grilles et la typo suivent votre zoom comme sur le hub
                    événements.
                  </p>
                  {data?.metricDescription ? (
                    <p className="mt-3 rounded-xl border border-white/[0.08] bg-zinc-900/55 px-[clamp(0.65rem,1.25vw,0.875rem)] py-[0.625rem] text-[length:clamp(0.6875rem,0.625rem+0.22vw,0.8125rem)] leading-relaxed text-zinc-500">
                      {data.metricDescription}
                    </p>
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-wrap gap-[clamp(0.4rem,0.85vw,0.625rem)]">
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
                    className={`${subtleButtonClass} ${focusRingClass} border-sky-400/28 bg-sky-950/[0.35] text-sky-100`}
                  >
                    Feuilles de présence
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                  <Link
                    href="/evenements"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${subtleButtonClass} ${focusRingClass}`}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    Aperçu agenda public
                  </Link>
                </div>
              </div>
              <div className={`relative min-h-[10.75rem] p-[clamp(0.875rem,1.5vw,1.2rem)] sm:min-h-[12rem] ${heroVisualClass}`}>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[conic-gradient(from_195deg_at_72%_-12%,rgba(167,139,250,0.16),transparent_40%,transparent_60%,rgba(56,189,248,0.1))]"
                />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),transparent_40%,transparent_65%,rgba(0,0,0,0.32))]" />
                <div className="relative flex h-full min-h-[9.75rem] flex-col justify-between gap-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-violet-400/26 bg-violet-500/[0.11] px-3 py-1.5 text-[length:clamp(0.65rem,0.55rem+0.35vw,0.7rem)] font-semibold uppercase tracking-[0.08em] text-violet-50/96">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-200/92" aria-hidden />
                    Synthèse live
                  </span>
                  {data ? (
                    <dl className="grid min-w-0 grid-cols-2 gap-[clamp(0.5rem,1vw,0.875rem)] text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8rem)]">
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-[clamp(0.5rem,1vw,0.65rem)]">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Moyenne globale</dt>
                        <dd className="mt-1 text-[clamp(1.15rem,0.92rem+0.55vw,1.65rem)] font-semibold tabular-nums text-emerald-300/95">
                          {fmtAvg(data.globalCurrentMonth.avgPresent)}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-[clamp(0.5rem,1vw,0.65rem)]">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Créneaux (mois ref.)</dt>
                        <dd className="mt-1 text-[clamp(1.15rem,0.92rem+0.55vw,1.65rem)] font-semibold tabular-nums text-sky-200/96">
                          {data.eventsReferenceMonth}
                        </dd>
                      </div>
                      <div className="col-span-2 rounded-xl border border-white/[0.08] bg-zinc-900/45 p-[clamp(0.45rem,0.9vw,0.55rem)] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] leading-snug text-zinc-500">
                        Fuseau&nbsp;: <span className="text-zinc-300">{data.timezone}</span> · étiquette mois&nbsp;{" "}
                        <span className="tabular-nums text-zinc-300">{data.referenceMonth}</span>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-[length:clamp(0.75rem,0.68rem+0.25vw,0.875rem)] leading-snug text-zinc-500">
                      {loading
                        ? "Chargement des agrégats de présence…"
                        : "Les indicateurs synthétiques s’affichent dès réception du serveur."}
                    </p>
                  )}
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:clamp(0.65rem,0.56rem+0.28vw,0.775rem)] text-zinc-500">
                    <Compass className="h-3.5 w-3.5 shrink-0 text-violet-400/72" aria-hidden />
                    Défilement du graphique : min-hauteur en <span className="tabular-nums">rem</span> pour rester lisible au
                    zoom.
                  </p>
                </div>
              </div>
            </header>

            {loading ? (
              <div className="space-y-[var(--suivi-gap)]">
                <div className="grid min-w-0 grid-cols-1 gap-[var(--suivi-gap)] sm:grid-cols-2 xl:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`${panelClass} h-[clamp(7rem,9vw,7.75rem)] animate-pulse bg-zinc-800/35`} />
                  ))}
                </div>
                <div className={`${panelClass} h-[clamp(16rem,32vw,20rem)] animate-pulse bg-zinc-800/30`} />
                <div className={`${panelClass} h-[clamp(22rem,40vw,28rem)] animate-pulse bg-zinc-800/28`} />
                <p className="text-center text-[length:clamp(0.8125rem,0.75rem+0.25vw,0.9375rem)] text-zinc-500">
                  Chargement des statistiques de présence…
                </p>
              </div>
            ) : error ? (
              <section className="rounded-2xl border border-rose-400/32 bg-rose-500/[0.12] px-[clamp(1rem,2vw,1.35rem)] py-5 text-[length:clamp(0.8125rem,0.75rem+0.28vw,0.9375rem)] text-rose-100">
                {error}
              </section>
            ) : data ? (
              <>
                {focusedCategory ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-400/34 bg-violet-500/[0.12] px-[clamp(0.85rem,1.6vw,1.1rem)] py-3 text-[length:clamp(0.8125rem,0.75rem+0.25vw,0.9375rem)] text-violet-50">
                    <span>
                      Filtre visuel : <strong className="text-white">{focusedCategory}</strong> — ligne surlignée dans le
                      tableau ci-dessous.
                    </span>
                    <button
                      type="button"
                      onClick={() => setFocusedCategory(null)}
                      className={`inline-flex min-h-[2.25rem] items-center gap-1 rounded-lg border border-white/[0.12] bg-zinc-950/60 px-[0.55rem] py-1 text-xs font-medium text-white transition hover:bg-zinc-900/85 ${focusRingClass}`}
                    >
                      <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Réinitialiser
                    </button>
                  </div>
                ) : null}

                <div className="grid min-w-0 grid-cols-1 gap-[var(--suivi-gap)] sm:grid-cols-2 2xl:grid-cols-4">
                  <article className={`${panelClass} group min-w-0 p-[clamp(1rem,1.9vw,1.35rem)] transition hover:border-violet-400/22`}>
                    <p className="text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] uppercase tracking-[0.1em] text-zinc-500">
                      Mois de référence
                    </p>
                    <p className="mt-2 text-[length:clamp(1.0625rem,0.92rem+0.45vw,1.3125rem)] font-semibold text-white">
                      {data.monthLabels[data.referenceMonth]}
                    </p>
                    <p className="text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] tabular-nums text-zinc-600">{data.referenceMonth}</p>
                  </article>
                  <article className={`${panelClass} group min-w-0 border-emerald-500/18 p-[clamp(1rem,1.9vw,1.35rem)] transition hover:border-emerald-400/32`}>
                    <p className="flex flex-wrap items-center gap-2 text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] uppercase tracking-[0.1em] text-zinc-500">
                      <Users className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                      Moyenne globale
                    </p>
                    <p className="mt-2 text-[clamp(1.65rem,1.35rem+0.95vw,2.125rem)] font-semibold tabular-nums text-emerald-300/98 transition group-hover:text-emerald-200">
                      {fmtAvg(data.globalCurrentMonth.avgPresent)}
                    </p>
                    <p className="mt-1 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.7875rem)] leading-snug text-zinc-500">
                      présents / événement · {data.globalCurrentMonth.totalPresent} présence(s) sur{" "}
                      {data.globalCurrentMonth.eventCount} événement(s)
                    </p>
                  </article>
                  <article className={`${panelClass} group min-w-0 border-sky-500/18 p-[clamp(1rem,1.9vw,1.35rem)] transition hover:border-sky-400/32`}>
                    <p className="text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] uppercase tracking-[0.1em] text-zinc-500">
                      Événements (mois ref.)
                    </p>
                    <p className="mt-2 text-[clamp(1.65rem,1.35rem+0.95vw,2.125rem)] font-semibold tabular-nums text-sky-200/96">
                      {data.eventsReferenceMonth}
                    </p>
                    <p className="mt-1 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.7875rem)] text-zinc-500">Tous types — date de l’événement</p>
                  </article>
                  <article className={`${panelClass} group min-w-0 border-violet-500/18 p-[clamp(1rem,1.9vw,1.35rem)] transition hover:border-violet-400/32`}>
                    <p className="text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] uppercase tracking-[0.1em] text-zinc-500">
                      Fenêtre d’analyse
                    </p>
                    <p className="mt-2 text-[clamp(1.65rem,1.35rem+0.95vw,2.125rem)] font-semibold tabular-nums text-violet-200/98">
                      {data.eventsInWindow}
                    </p>
                    <p className="mt-1 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.7875rem)] text-zinc-500">
                      {data.eventCount} événements fusionnés (sources)
                    </p>
                  </article>
                </div>

                {comparisonInsights ? (
                  <div className="grid min-w-0 grid-cols-1 gap-[var(--suivi-gap)] md:grid-cols-2">
                    <div
                      className={`rounded-2xl border p-[clamp(1rem,1.85vw,1.25rem)] ${
                        comparisonInsights.best.delta >= 0 ? "border-emerald-400/26 bg-emerald-500/[0.1]" : "border-zinc-600/55 bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.78rem)] font-semibold uppercase tracking-wide text-emerald-100/94">
                        <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
                        Écart le plus favorable (vs mois précédent)
                      </div>
                      <p className="mt-2 text-[length:clamp(1.0625rem,0.95rem+0.35vw,1.25rem)] font-semibold text-white">
                        {comparisonInsights.best.cat}
                      </p>
                      <p className="text-[length:clamp(0.8125rem,0.75rem+0.28vw,0.9375rem)] text-zinc-200">
                        {comparisonInsights.best.delta > 0 ? "+" : ""}
                        {fmtAvg(comparisonInsights.best.delta)} sur la moyenne présents / événement
                      </p>
                    </div>
                    <div
                      className={`rounded-2xl border p-[clamp(1rem,1.85vw,1.25rem)] ${
                        comparisonInsights.worst.delta < 0 ? "border-rose-400/26 bg-rose-500/[0.1]" : "border-zinc-600/55 bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.78rem)] font-semibold uppercase tracking-wide text-rose-100/93">
                        <TrendingDown className="h-4 w-4 shrink-0" aria-hidden />
                        Écart le moins favorable (vs mois précédent)
                      </div>
                      <p className="mt-2 text-[length:clamp(1.0625rem,0.95rem+0.35vw,1.25rem)] font-semibold text-white">
                        {comparisonInsights.worst.cat}
                      </p>
                      <p className="text-[length:clamp(0.8125rem,0.75rem+0.28vw,0.9375rem)] text-zinc-200">
                        {comparisonInsights.worst.delta > 0 ? "+" : ""}
                        {fmtAvg(comparisonInsights.worst.delta)} sur la moyenne présents / événement
                      </p>
                    </div>
                  </div>
                ) : null}

                <section className={`${panelClass} min-w-0 p-[clamp(1.1rem,2vw,1.6rem)]`}>
                  <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-[2.5rem] w-[2.5rem] shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-violet-500/18 text-violet-100">
                        <Users className="h-[1.15rem] w-[1.15rem]" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-[length:clamp(1rem,0.875rem+0.45vw,1.175rem)] font-semibold text-white">
                          Moyenne de présents par événement
                        </h2>
                        <p className="mt-1 text-[length:clamp(0.8125rem,0.75rem+0.22vw,0.9rem)] text-zinc-500">
                          Mois affiché : <strong className="font-medium text-zinc-300">{data.monthLabels[data.referenceMonth]}</strong>{" "}
                          — cliquez une barre pour surligner le type dans le tableau.
                        </p>
                      </div>
                    </div>
                  </div>
                  {currentBarData.length === 0 ? (
                    <p className="text-[length:clamp(0.8125rem,0.75rem+0.25vw,0.9375rem)] text-zinc-500">Aucun événement sur le mois de référence.</p>
                  ) : (
                    <div className="w-full min-h-[clamp(280px,35vw,640px)] min-w-0" style={{ height: Math.min(640, 140 + currentBarData.length * 44) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={currentBarData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#32323a" horizontal={false} />
                          <XAxis type="number" domain={[0, yMaxCurrent]} stroke="#9ca3af" tickLine={false} allowDecimals />
                          <YAxis type="category" dataKey="category" stroke="#9ca3af" tickLine={false} width={120} tick={{ fontSize: 11 }} />
                          <Tooltip
                            content={({ label, payload }) =>
                              avgTooltip(String(label ?? ""), (payload || []) as { payload?: Record<string, unknown> }[])
                            }
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
                    <p className="mt-3 text-[length:clamp(0.6875rem,0.625rem+0.18vw,0.78rem)] text-zinc-600">
                      Plus de sept types sur le mois : les types les moins représentés sont regroupés sous « Autres ».
                    </p>
                  ) : null}
                </section>

                <section className={`${panelClass} min-w-0 p-[clamp(1.1rem,2vw,1.6rem)] sm:p-[clamp(1.125rem,2.2vw,1.75rem)]`}>
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-cyan-500/14 text-cyan-200">
                    <BarChart3 className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[length:clamp(1rem,0.875rem+0.45vw,1.175rem)] font-semibold text-white">Comparer dans le temps</h2>
                    <p className="mt-1 text-[length:clamp(0.8125rem,0.75rem+0.22vw,0.905rem)] text-zinc-500">
                      Même métrique (présents / événement), autre échelle temporelle.
                    </p>
                  </div>
                </div>
                <div className="flex w-full rounded-2xl border border-white/[0.09] bg-zinc-950/85 p-[0.1875rem] shadow-inner shadow-black/20 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setCompareMode("prev")}
                    aria-pressed={compareMode === "prev"}
                    className={`flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-[0.8rem] px-4 py-2 text-[length:clamp(0.8125rem,0.74rem+0.28vw,0.9375rem)] font-medium transition ${focusRingClass} ${
                      compareMode === "prev"
                        ? "bg-violet-500/[0.34] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Calendar className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    Mois précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareMode("last3")}
                    aria-pressed={compareMode === "last3"}
                    className={`flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-[0.8rem] px-4 py-2 text-[length:clamp(0.8125rem,0.74rem+0.28vw,0.9375rem)] font-medium transition ${focusRingClass} ${
                      compareMode === "last3"
                        ? "bg-violet-500/[0.34] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    3 derniers mois
                  </button>
                </div>
              </div>

              <div className="h-[clamp(22rem,min(72vw),32.5rem)] w-full min-w-0">
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
              <p className="mt-4 rounded-xl border border-white/[0.07] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.6875rem,0.625rem+0.18vw,0.8rem)] leading-relaxed text-zinc-500">
                Au plus dix types par graphique ; le reste sous « Autres ». Une barre à <strong className="font-semibold text-zinc-400">0</strong> signifie
                qu’aucune présence validée n’a été enregistrée sur la période pour ce type — à recouper avec les feuilles de présence.
              </p>
            </section>

            <section className={`${panelClass} overflow-hidden min-w-0`}>
              <div className="flex flex-col gap-1 border-b border-white/[0.07] px-[clamp(1rem,2vw,1.35rem)] py-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-[length:clamp(0.9625rem,0.865rem+0.35vw,1.1rem)] font-semibold text-white">Tableau détaillé</h2>
                <p className="text-[length:clamp(0.6875rem,0.625rem+0.18vw,0.78rem)] text-zinc-500">
                  Cliquez une ligne pour la mettre en avant (ou recliquez pour tout afficher)
                </p>
              </div>
              <div className="overflow-x-auto p-4 sm:p-[clamp(1rem,2vw,1.35rem)]">
                <table className="w-full min-w-[min(640px,100%)] text-[length:clamp(0.8125rem,0.75rem+0.22vw,0.9375rem)]">
                  <thead>
                    <tr className="border-b border-zinc-700/85 text-left text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] uppercase tracking-[0.08em] text-zinc-500">
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
                          className={`cursor-pointer border-b border-white/[0.05] transition hover:bg-white/[0.04] ${
                            isFocused ? "bg-violet-500/12 ring-1 ring-inset ring-violet-400/45" : ""
                          }`}
                        >
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-2 font-medium text-zinc-100">
                              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}>
                                <Icon className="h-4 w-4 text-white" aria-hidden />
                              </span>
                              {row.category}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-zinc-400">{fmtAvg(c)}</td>
                          <td className="px-3 py-3 text-zinc-400">{fmtAvg(p)}</td>
                          <td className="px-3 py-3">
                            {delta === null ? (
                              <span className="inline-flex items-center gap-1 text-zinc-600">
                                <Minus className="h-3.5 w-3.5" aria-hidden />
                                —
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 font-semibold ${
                                  delta > 0 ? "text-emerald-300" : delta < 0 ? "text-rose-300" : "text-zinc-400"
                                }`}
                              >
                                {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : null}
                                {delta < 0 ? <TrendingDown className="h-3.5 w-3.5" aria-hidden /> : null}
                                {delta === 0 ? <Minus className="h-3.5 w-3.5" aria-hidden /> : null}
                                {delta > 0 ? `+${fmtAvg(delta)}` : fmtAvg(delta)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-zinc-500">{row.currentEventCount > 0 ? row.currentEventCount : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
              </>
            ) : null}
          </main>

          <aside
            aria-label="Aide lecture suivi événements"
            className="min-w-0 space-y-4 xl:sticky xl:top-5 xl:self-start"
          >
            <div className={`${panelClass} space-y-3 p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                <Sparkles className="h-4 w-4 text-amber-200/85" aria-hidden />
                Lecture rapide
              </p>
              <p className="text-[length:clamp(0.75rem,0.68rem+0.28vw,0.8625rem)] leading-[1.6] text-zinc-400">
                Une moyenne qui baisse peut refléter moins de monde dans le vocal <em className="not-italic text-zinc-300">ou</em>{" "}
                davantage de créneaux plus courts : croisez avec le volume d’événements avant de tirer une conclusion forte.
              </p>
              <p className="text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8rem)] text-zinc-500">
                Fuseau : <span className="tabular-nums text-zinc-300">{data?.timezone ?? "Europe/Paris"}</span>
                {!loading ? " · mois civil" : null}.
              </p>
            </div>

            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="flex items-center gap-2 text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                <ListOrdered className="h-4 w-4 shrink-0 text-violet-300/85" aria-hidden />
                Lire ce tableau comme le staff
              </p>
              <ol className="mt-4 space-y-[0.65rem]">
                {lectureSteps.map((step) => (
                  <li key={step.n} className="flex min-w-0 gap-3">
                    <span
                      aria-hidden
                      className="flex h-[2.125em] min-w-[2.125em] items-center justify-center rounded-lg border border-violet-500/28 bg-violet-500/[0.09] text-[length:clamp(0.65rem,0.58rem+0.22vw,0.75rem)] font-bold tabular-nums text-violet-50"
                    >
                      {step.n}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-semibold text-zinc-100">{step.title}</p>
                      <p className="mt-1 text-[length:clamp(0.6875rem,0.62rem+0.2vw,0.8rem)] leading-[1.55] text-zinc-500">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className={`${panelClass} p-[clamp(0.875rem,1.75vw,1.25rem)]`}>
              <p className="text-[length:clamp(0.6875rem,0.625rem+0.2vw,0.8125rem)] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Actions liées
              </p>
              <nav className="mt-3 flex flex-col gap-2" aria-label="Raccourcis suivi">
                <Link
                  href="/admin/communaute/evenements/participation"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-sky-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Feuilles de présence
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/evenements/liste"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-violet-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Liste des événements
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/evenements/recap"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-emerald-400/26 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  Récapitulatifs
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
                <Link
                  href="/admin/communaute/evenements/calendrier"
                  className={`flex min-h-[2.85rem] min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/45 px-3 py-2 text-[length:clamp(0.78rem,0.72rem+0.22vw,0.9rem)] font-medium text-zinc-100 transition hover:border-white/15 hover:bg-zinc-900/72 ${focusRingClass}`}
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <CalendarCheck2 className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
                    Calendrier staff
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                </Link>
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
