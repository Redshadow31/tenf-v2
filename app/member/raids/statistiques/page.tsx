"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Flame,
  History,
  Medal,
  PlusCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

type RaidApiItem = {
  date: string;
  count?: number;
  source?: string;
  raiderTwitchLogin?: string;
  targetTwitchLogin?: string;
  raiderDisplayName?: string;
  targetDisplayName?: string;
};

type MonthRaidHistory = {
  monthKey: string;
  sent: number;
  uniqueTargets: number;
};

type RaidSummary = {
  sent: number;
  uniqueTargets: number;
  topTarget: { key: string; label: string; count: number } | null;
};

const TIER_THRESHOLDS = [
  { min: 20, label: "Titan des raids", hint: "Tu rayonnées sur la communauté.", ring: "from-amber-400 to-yellow-600" },
  { min: 12, label: "Pilier", hint: "Rythme solide, continue comme ça.", ring: "from-sky-400 to-indigo-500" },
  { min: 7, label: "Actif", hint: "Bel engagement mensuel.", ring: "from-emerald-400 to-teal-600" },
  { min: 3, label: "En route", hint: "Chaque raid compte.", ring: "from-amber-500 to-orange-600" },
  { min: 0, label: "Démarrage", hint: "Fixe-toi un objectif et enchaîne.", ring: "from-rose-400 to-red-500" },
] as const;

function formatMonthLabel(key: string): string {
  const [, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const year = key.split("-")[0];
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function normalizeLogin(value?: string): string {
  return String(value || "").toLowerCase().trim();
}

function getTier(score: number): { label: string; color: string } {
  if (score >= 20) return { label: "Titan des raids", color: "#d4af37" };
  if (score >= 12) return { label: "Pilier", color: "#60a5fa" };
  if (score >= 7) return { label: "Actif", color: "#34d399" };
  if (score >= 3) return { label: "En route", color: "#f59e0b" };
  return { label: "Démarrage", color: "#f87171" };
}

function getTierDetail(score: number) {
  return TIER_THRESHOLDS.find((t) => score >= t.min) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
}

function nextTierThreshold(score: number): number | null {
  const ordered = [3, 7, 12, 20];
  for (const t of ordered) {
    if (score < t) return t;
  }
  return null;
}

function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const date = new Date(year, month - 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLast12Months(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const date = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }).reverse();
}

function computeSummary(sentRaids: RaidApiItem[]): RaidSummary {
  const sent = sentRaids.reduce((sum, raid) => sum + (raid.count || 1), 0);

  const targetsCount = new Map<string, { label: string; count: number }>();
  for (const raid of sentRaids) {
    const key = normalizeLogin(raid.targetTwitchLogin || raid.targetDisplayName);
    if (!key) continue;
    const current = targetsCount.get(key) || { label: raid.targetDisplayName || raid.targetTwitchLogin || "Cible", count: 0 };
    current.count += raid.count || 1;
    targetsCount.set(key, current);
  }

  const topTargetEntry = Array.from(targetsCount.entries()).sort((a, b) => b[1].count - a[1].count)[0];

  return {
    sent,
    uniqueTargets: targetsCount.size,
    topTarget: topTargetEntry ? { key: topTargetEntry[0], label: topTargetEntry[1].label, count: topTargetEntry[1].count } : null,
  };
}

function twitchChannelUrl(login: string): string | null {
  const clean = normalizeLogin(login);
  if (!clean) return null;
  return `https://www.twitch.tv/${clean}`;
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const gradientId = useId().replace(/:/g, "");
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90" aria-hidden>
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth="12" fill="transparent" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke={`url(#raid-ring-gradient-${gradientId})`}
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id={`raid-ring-gradient-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f0c96b" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-black tabular-nums text-white">{clamped}%</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

function StatsPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-36 rounded-3xl bg-white/[0.06]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/[0.06]" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-white/[0.06]" />
    </div>
  );
}

export default function MemberRaidStatsPage() {
  const { data: overview, loading: loadingOverview, error } = useMemberOverview();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [sentRaids, setSentRaids] = useState<RaidApiItem[]>([]);
  const [history, setHistory] = useState<MonthRaidHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [targetsExpanded, setTargetsExpanded] = useState(false);

  const { goals } = useMemberMonthlyGoals(selectedMonth);

  const monthsChrono = useMemo(() => getLast12Months(), []);
  const monthsRecentFirst = useMemo(() => [...monthsChrono].reverse(), [monthsChrono]);

  useEffect(() => {
    const currentMonth = monthsChrono.slice(-1)[0] || "";
    setSelectedMonth(currentMonth);
  }, [monthsChrono]);

  useEffect(() => {
    if (!overview?.member?.twitchLogin || !selectedMonth) return;
    (async () => {
      setLoadingMonth(true);
      try {
        const response = await fetch(`/api/discord/raids/data-v2?month=${selectedMonth}`, { cache: "no-store" });
        const body = await response.json();
        const login = normalizeLogin(overview.member.twitchLogin);
        const mineSent = (body.raidsFaits || [])
          .filter((raid: RaidApiItem) => normalizeLogin(raid.raiderTwitchLogin) === login)
          .sort((a: RaidApiItem, b: RaidApiItem) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSentRaids(mineSent);
      } catch {
        setSentRaids([]);
      } finally {
        setLoadingMonth(false);
      }
    })();
  }, [overview?.member?.twitchLogin, selectedMonth]);

  useEffect(() => {
    if (!overview?.member?.twitchLogin) return;
    (async () => {
      setHistoryLoading(true);
      try {
        const login = normalizeLogin(overview.member.twitchLogin);
        const historyRows = await Promise.all(
          monthsChrono.map(async (monthKey) => {
            const response = await fetch(`/api/discord/raids/data-v2?month=${monthKey}`, { cache: "no-store" });
            const body = await response.json();
            const mineSent = (body.raidsFaits || []).filter((raid: RaidApiItem) => normalizeLogin(raid.raiderTwitchLogin) === login);
            const summaryRow = computeSummary(mineSent);
            return {
              monthKey,
              sent: summaryRow.sent,
              uniqueTargets: summaryRow.uniqueTargets,
            };
          })
        );
        setHistory(historyRows);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [overview?.member?.twitchLogin, monthsChrono]);

  const summary = useMemo(() => computeSummary(sentRaids), [sentRaids]);
  const selectedHistory = useMemo(() => history.find((entry) => entry.monthKey === selectedMonth) || null, [history, selectedMonth]);
  const previousHistory = useMemo(
    () => history.find((entry) => entry.monthKey === getPreviousMonthKey(selectedMonth)) || null,
    [history, selectedMonth]
  );
  const delta = (selectedHistory?.sent || 0) - (previousHistory?.sent || 0);
  const completionRate = goals.raids > 0 ? (summary.sent / goals.raids) * 100 : 0;
  const remainingToTarget = Math.max(0, goals.raids - summary.sent);
  const tier = getTier(summary.sent);
  const tierDetail = getTierDetail(summary.sent);
  const nextThreshold = nextTierThreshold(summary.sent);
  const raidsToNextTier = nextThreshold !== null ? Math.max(0, nextThreshold - summary.sent) : 0;

  const targetBreakdown = useMemo(() => {
    const map = new Map<string, { label: string; count: number; login: string }>();
    for (const raid of sentRaids) {
      const key = normalizeLogin(raid.targetTwitchLogin || raid.targetDisplayName);
      if (!key) continue;
      const item = map.get(key) || {
        label: raid.targetDisplayName || raid.targetTwitchLogin || "Cible",
        count: 0,
        login: raid.targetTwitchLogin || key,
      };
      item.count += raid.count || 1;
      map.set(key, item);
    }
    const max = Math.max(1, ...Array.from(map.values()).map((item) => item.count));
    return Array.from(map.entries())
      .map(([key, value]) => ({
        key,
        label: value.label,
        login: value.login,
        count: value.count,
        rate: Math.round((value.count / max) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [sentRaids]);

  const maxHistorySent = Math.max(1, ...history.map((entry) => entry.sent));

  const visibleTargets = targetsExpanded ? targetBreakdown : targetBreakdown.slice(0, 6);

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Statistiques de raids"
        description="Visualise ton rythme sur 12 mois, ton objectif mensuel synchronisé avec la page Objectifs, tes cibles les plus soutenues et le détail des envois. Les données proviennent du hub raids TENF — pour les validations staff et les points, voir aussi l’historique dédié."
        badge={tier.label}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/member/raids/historique"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-400/45 hover:bg-violet-500/15"
        >
          <History className="h-4 w-4 shrink-0" aria-hidden />
          Historique & statuts
        </Link>
        <Link
          href="/member/raids/declarer"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-400/50 hover:bg-amber-500/15"
        >
          <PlusCircle className="h-4 w-4 shrink-0" aria-hidden />
          Déclarer un raid
        </Link>
        <Link
          href="/member/objectifs"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-emerald-400/30 hover:text-white"
        >
          <Target className="h-4 w-4 shrink-0" aria-hidden />
          Ajuster mon objectif
          <ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
        </Link>
      </div>

      {loadingOverview ? <StatsPageSkeleton /> : null}
      {!loadingOverview && (error || !overview) ? (
        <EmptyFeatureCard title="Statistiques de raids" description={error || "Données indisponibles."} />
      ) : null}

      {overview ? (
        <>
          <section
            className="relative mb-8 overflow-hidden rounded-3xl border p-5 shadow-2xl sm:p-8"
            style={{
              borderColor: "rgba(212, 175, 55, 0.38)",
              background:
                "radial-gradient(ellipse 80% 55% at 0% -15%, rgba(212,175,55,0.22), transparent 48%), radial-gradient(ellipse 45% 40% at 100% 0%, rgba(139,92,246,0.15), transparent 42%), linear-gradient(165deg, rgba(22,23,30,0.96), rgba(8,10,14,0.99))",
              boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
            }}
          >
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200/90">
                  <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                  Pilotage mensuel
                </p>
                <h2 className="mt-2 text-balance text-2xl font-black text-white sm:text-3xl">Où en es-tu ce mois-ci ?</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                  Compare ton volume d’envois à ton objectif personnel et à ton mois précédent. Clique un mois dans le graphique plus bas pour
                  recharger le détail.
                </p>
                <div
                  className="mt-4 inline-flex items-center gap-3 rounded-2xl border px-4 py-3"
                  style={{ borderColor: `${tier.color}44`, backgroundColor: "rgba(0,0,0,0.35)" }}
                >
                  <Medal className="h-8 w-8 shrink-0" style={{ color: tier.color }} aria-hidden />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Palier actuel (mois affiché)</p>
                    <p className="text-lg font-bold text-white">{tierDetail.label}</p>
                    <p className="text-xs text-zinc-500">{tierDetail.hint}</p>
                    {nextThreshold !== null ? (
                      <p className="mt-1 text-xs text-amber-200/80">
                        Encore {raidsToNextTier} raid{raidsToNextTier !== 1 ? "s" : ""} pour viser le palier suivant ({nextThreshold}+ ce mois).
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-amber-200/80">Tu es au sommet des paliers affichés — impressionnant.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full shrink-0 lg:max-w-md">
                <label htmlFor="stats-month-select" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Mois analysé
                </label>
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {monthsRecentFirst.map((m) => {
                    const active = m === selectedMonth;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMonth(m)}
                        className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                          active
                            ? "border-amber-400/50 bg-amber-500/20 text-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.12)]"
                            : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                        }`}
                      >
                        {formatMonthLabel(m).split(" ")[0]?.slice(0, 3)}. {m.split("-")[0]}
                      </button>
                    );
                  })}
                </div>
                <select
                  id="stats-month-select"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/12 bg-[#0a0c12]/95 px-3.5 py-3 text-sm text-zinc-100 transition focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/15"
                >
                  {monthsRecentFirst.map((month) => (
                    <option key={month} value={month}>
                      {formatMonthLabel(month)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section
            className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-b from-[#151822]/95 to-black/50 p-5 sm:p-7"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <ProgressRing value={completionRate} label="Objectif" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200/85">Synthèse</p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {summary.sent} raid{summary.sent !== 1 ? "s" : ""}{" "}
                    <span className="text-lg font-semibold text-zinc-500">· {formatMonthLabel(selectedMonth)}</span>
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                    {goals.raids <= 0 ? (
                      <>
                        Aucun objectif raids défini pour ce mois.{" "}
                        <Link href="/member/objectifs" className="font-semibold text-violet-300 underline-offset-2 hover:underline">
                          Configure-le sur la page Objectifs
                        </Link>{" "}
                        pour activer la jauge.
                      </>
                    ) : remainingToTarget > 0 ? (
                      <>Encore {remainingToTarget} raid{remainingToTarget !== 1 ? "s" : ""} pour atteindre ton objectif ({goals.raids}).</>
                    ) : (
                      <>Objectif mensuel atteint. Tu peux poursuivre pour solidifier ton habitude de soutien.</>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Objectif raids</p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-white">{goals.raids}</p>
                  <p className="mt-2 text-xs text-zinc-500">Valeur partagée avec /member/objectifs pour ce mois.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">vs mois précédent</p>
                  <p className={`mt-1 text-2xl font-black tabular-nums ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {delta >= 0 ? "+" : ""}
                    {delta}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">Nombre de raids enregistrés (données hub), pas les points staff.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Cibles distinctes</p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-white">{summary.uniqueTargets}</p>
                </div>
                <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/80">Top cible du mois</p>
                  <p className="mt-1 truncate text-lg font-bold text-white">{summary.topTarget?.label || "—"}</p>
                  {summary.topTarget ? (
                    <p className="mt-1 text-xs text-violet-300/70">×{summary.topTarget.count}</p>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-500">Envoie un raid pour remplir cette case.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <TrendingUp className="h-5 w-5 text-amber-400" aria-hidden />
                  Activité sur 12 mois
                </h3>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Clique une barre pour sélectionner</span>
              </div>

              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded-xl bg-white/[0.06]" />
                  ))}
                </div>
              ) : (
                <div className="flex h-48 items-end justify-between gap-1 sm:gap-2 md:h-56">
                  {history.map((entry) => {
                    const h = Math.max(6, (entry.sent / maxHistorySent) * 100);
                    const active = entry.monthKey === selectedMonth;
                    return (
                      <button
                        key={entry.monthKey}
                        type="button"
                        onClick={() => setSelectedMonth(entry.monthKey)}
                        title={`${formatMonthLabel(entry.monthKey)} — ${entry.sent} raid(s)`}
                        className={`group flex min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-t-lg transition ${
                          active ? "opacity-100" : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        <span className="text-[10px] font-bold tabular-nums text-zinc-500 group-hover:text-zinc-300 sm:text-xs">
                          {entry.sent}
                        </span>
                        <span
                          className={`w-full max-w-[36px] rounded-t-md transition-all ${
                            active
                              ? "bg-gradient-to-t from-violet-600 to-amber-400 shadow-[0_0_16px_rgba(139,92,246,0.35)]"
                              : "bg-gradient-to-t from-violet-900/80 to-amber-900/40 group-hover:from-violet-700 group-hover:to-amber-600/60"
                          }`}
                          style={{ height: `${h}%` }}
                        />
                        <span className={`hidden text-[9px] font-medium sm:block ${active ? "text-amber-200" : "text-zinc-600"}`}>
                          {entry.monthKey.slice(5)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="mt-4 text-center text-xs text-zinc-500">Abréviation : numéro du mois (MM). Données agrégées hub raids.</p>
            </article>

            <article className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                <Target className="h-5 w-5 text-fuchsia-400" aria-hidden />
                Cibles du mois
              </h3>
              {targetBreakdown.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/12 px-4 py-10 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-zinc-600" aria-hidden />
                  <p className="mt-3 text-sm text-zinc-400">Aucune cible enregistrée sur ce mois.</p>
                  <Link
                    href="/member/raids/declarer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:underline"
                  >
                    Déclarer un raid <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="space-y-2">
                    {visibleTargets.map((item) => {
                      const barColor =
                        item.count >= 3 ? "bg-emerald-500" : item.count >= 2 ? "bg-amber-500" : "bg-rose-500/90";
                      const url = twitchChannelUrl(item.login);
                      return (
                        <li
                          key={item.key}
                          className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-3 transition hover:border-violet-500/25"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate font-medium text-zinc-100">{item.label}</span>
                            <span className="shrink-0 tabular-nums text-sm font-bold text-zinc-400">×{item.count}</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${item.rate}%` }} />
                          </div>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200"
                            >
                              Twitch <ExternalLink className="h-3 w-3" aria-hidden />
                            </a>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  {targetBreakdown.length > 6 ? (
                    <button
                      type="button"
                      onClick={() => setTargetsExpanded((v) => !v)}
                      className="mt-4 w-full rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      {targetsExpanded ? "Voir moins" : `Voir tout (${targetBreakdown.length})`}
                    </button>
                  ) : null}
                </>
              )}
            </article>
          </section>

          <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#12141c]/90 to-black/40 p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <CalendarDays className="h-5 w-5 text-sky-400" aria-hidden />
                Détail des envois
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-950/30 px-3 py-1 text-xs font-medium text-orange-200/90">
                <Flame className="h-3.5 w-3.5" aria-hidden />
                Hub raids TENF
              </span>
            </div>
            {loadingMonth ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.06]" />
                ))}
              </div>
            ) : sentRaids.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/12 px-6 py-12 text-center">
                <p className="text-sm text-zinc-400">Aucun raid enregistré pour {formatMonthLabel(selectedMonth)} dans cette source.</p>
                <p className="mt-2 text-xs text-zinc-600">
                  L’historique membre peut afficher d’autres entrées (validation, points) sur la page dédiée.
                </p>
                <Link
                  href="/member/raids/historique"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Voir l’historique <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {sentRaids.map((raid, index) => {
                  const url = twitchChannelUrl(raid.targetTwitchLogin || "");
                  return (
                    <li
                      key={`${raid.date}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 transition hover:border-violet-500/30"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{raid.targetDisplayName || raid.targetTwitchLogin || "Cible TENF"}</p>
                        <p className="text-xs text-zinc-500">{new Date(raid.date).toLocaleString("fr-FR")}</p>
                        {raid.source ? (
                          <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-600">Source : {raid.source}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 px-2.5 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/15"
                          >
                            Chaîne <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        ) : null}
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-100">
                          ×{raid.count || 1}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </MemberSurface>
  );
}
