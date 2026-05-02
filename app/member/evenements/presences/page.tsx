"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  Clock,
  ClipboardList,
  Filter,
  Flame,
  PartyPopper,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

type AttendanceEntry = {
  monthKey: string;
  totalEvents: number;
  attendedEvents: number;
  attendanceRate: number;
};

type MonthEventRow = {
  id: string;
  title: string;
  date: string;
  category: string;
  attended: boolean;
  isKeyEvent: boolean;
  discordPointsStatus?: "awarded" | "pending" | null;
};

type TimelineFilter = "all" | "present" | "absent";

function DiscordPointsStatusBadge({ status }: { status?: MonthEventRow["discordPointsStatus"] }) {
  if (status === "awarded") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200"
        title="Les points Discord événement ont bien été enregistrés par l’équipe."
      >
        <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
        Points OK
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-amber-500/45 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200"
        title="Ta présence est notée ; l’attribution des points Discord (+300) peut encore être en cours côté staff."
      >
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
        Points en attente
      </span>
    );
  }
  return null;
}

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

function getTier(rate: number): { label: string; color: string; hint: string } {
  if (rate >= 90) return { label: "Pilier", color: "#d4af37", hint: "Tu portes la communauté sur tes épaules." };
  if (rate >= 75) return { label: "Engagé·e", color: "#60a5fa", hint: "Rythme très sérieux, continue comme ça." };
  if (rate >= 50) return { label: "Régulier·ère", color: "#34d399", hint: "Tu es présent·e sur la durée." };
  if (rate >= 25) return { label: "En découverte", color: "#f59e0b", hint: "Chaque participation compte." };
  return { label: "Premiers pas", color: "#f87171", hint: "L’agenda t’attente quand tu es prêt·e." };
}

function getEncouragement(input: {
  rate: number;
  delta: number;
  remainingToTarget: number;
  totalEvents: number;
  targetEvents: number;
  attendedEvents: number;
}): string {
  const { rate, delta, remainingToTarget, totalEvents, targetEvents, attendedEvents } = input;
  if (totalEvents === 0)
    return "Pour ce mois, aucun événement du calendrier TENF ne correspond encore à ton suivi. Dès que l’agenda se remplit, tes présences apparaîtront ici automatiquement.";
  if (attendedEvents >= targetEvents)
    return delta >= 0
      ? "Bravo : tu dépasses ou tiens ton objectif avec un beau rythme. Profite des prochains lives communautaires."
      : "Objectif atteint ce mois-ci. Garde cette habitude : la communauté le ressent.";
  if (remainingToTarget <= 0)
    return "Tu es tout proche du palier — encore un petit effort pour boucler le mois en beauté.";
  if (delta > 0)
    return `Belle dynamique : tu progresses de ${delta}% par rapport au mois dernier. Il te reste environ ${remainingToTarget} événement(s) pour viser ton objectif personnel.`;
  if (delta < 0)
    return `Un léger recul par rapport au mois précédent (${delta}%). Rien d’grave : ${remainingToTarget} présence(s) de plus peuvent remettre le curseur au vert.`;
  return `Tu es stable. Vise encore ${remainingToTarget} présence(s) pour atteindre l’objectif que tu t’es fixé·e dans Objectifs.`;
}

function getRemainingToTarget(attendedEvents: number, targetEvents: number): number {
  return Math.max(0, targetEvents - attendedEvents);
}

function isSpotlightCategory(category: string): boolean {
  return category.toLowerCase().includes("spotlight");
}

function ProgressRing({ rate }: { rate: number }) {
  const gid = useId().replace(/:/g, "");
  const clamped = Math.max(0, Math.min(100, rate));
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
          stroke={`url(#presence-ring-gradient-${gid})`}
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id={`presence-ring-gradient-${gid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f0c96b" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-black tabular-nums text-white">{clamped}%</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Présence</p>
      </div>
    </div>
  );
}

function PresencesSkeleton() {
  return (
    <MemberSurface>
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-72 rounded-xl bg-white/10" />
        <div className="h-40 rounded-3xl bg-white/[0.06]" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white/[0.06]" />
      </div>
    </MemberSurface>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  gradient,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <article
      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} to-black/50 p-4 transition hover:border-white/18`}
    >
      <div className="mb-2 flex items-center gap-2 text-zinc-500">
        <span className="rounded-lg border border-white/10 bg-black/30 p-1.5">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-black tabular-nums text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-zinc-500">{sub}</p> : null}
    </article>
  );
}

export default function MemberEventPresencesPage() {
  const { data, loading, error } = useMemberOverview();
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"general" | "spotlight">("general");
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [expandedEventKey, setExpandedEventKey] = useState<string | null>(null);

  const history = data?.attendance?.monthlyHistory || [];
  const currentMonthKey = data?.attendance?.currentMonthKey || data?.monthKey || "";
  const { goals } = useMemberMonthlyGoals(selectedMonth || currentMonthKey);

  useEffect(() => {
    if (!selectedMonth && currentMonthKey) setSelectedMonth(currentMonthKey);
  }, [currentMonthKey, selectedMonth]);

  const selectedAttendance = useMemo<AttendanceEntry | null>(() => {
    if (!history.length) return null;
    return history.find((entry) => entry.monthKey === selectedMonth) || history[history.length - 1] || null;
  }, [history, selectedMonth]);

  const previousAttendance = useMemo<AttendanceEntry | null>(() => {
    if (!selectedAttendance) return null;
    const idx = history.findIndex((entry) => entry.monthKey === selectedAttendance.monthKey);
    if (idx <= 0) return null;
    return history[idx - 1];
  }, [history, selectedAttendance]);

  const selectedMonthEvents: MonthEventRow[] =
    data?.attendance?.monthEventsByMonth.find((entry) => entry.monthKey === selectedAttendance?.monthKey)?.events || [];

  const discordPointsMonthCounts = useMemo(() => {
    let awarded = 0;
    let pending = 0;
    for (const event of selectedMonthEvents) {
      if (!event.attended) continue;
      if (event.discordPointsStatus === "awarded") awarded += 1;
      else if (event.discordPointsStatus === "pending") pending += 1;
    }
    return { awarded, pending };
  }, [selectedMonthEvents]);

  const selectedCategoryBreakdown = useMemo(() => {
    const byCategory = new Map<string, { totalEvents: number; attendedEvents: number }>();
    for (const event of selectedMonthEvents) {
      const stats = byCategory.get(event.category) || { totalEvents: 0, attendedEvents: 0 };
      stats.totalEvents += 1;
      if (event.attended) stats.attendedEvents += 1;
      byCategory.set(event.category, stats);
    }
    return Array.from(byCategory.entries())
      .map(([category, value]) => ({
        category,
        totalEvents: value.totalEvents,
        attendedEvents: value.attendedEvents,
        attendanceRate: value.totalEvents > 0 ? Math.round((value.attendedEvents / value.totalEvents) * 100) : 0,
      }))
      .sort((a, b) => b.totalEvents - a.totalEvents || b.attendanceRate - a.attendanceRate);
  }, [selectedMonthEvents]);

  const spotlightEventHistory = useMemo(
    () =>
      (data?.attendance?.monthEventsByMonth || [])
        .flatMap((monthEntry) =>
          monthEntry.events
            .filter((event) => isSpotlightCategory(event.category))
            .map((event) => ({ ...event, monthKey: monthEntry.monthKey }))
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [data?.attendance?.monthEventsByMonth]
  );

  const monthsRecentFirst = useMemo(() => [...history].reverse(), [history]);

  const filteredTimelineEvents = useMemo(() => {
    if (timelineFilter === "all") return selectedMonthEvents;
    if (timelineFilter === "present") return selectedMonthEvents.filter((e) => e.attended);
    return selectedMonthEvents.filter((e) => !e.attended);
  }, [selectedMonthEvents, timelineFilter]);

  useEffect(() => {
    setTimelineFilter("all");
    setExpandedEventKey(null);
  }, [selectedAttendance?.monthKey]);

  if (loading) return <PresencesSkeleton />;

  if (error || !data) {
    return (
      <MemberSurface>
        <MemberPageHeader
          title="Mes présences"
          description="Visualise où tu en es sur les événements TENF : taux de présence, objectifs et détail mois par mois."
        />
        <section className="rounded-2xl border border-red-500/35 bg-red-950/25 p-5">
          <p className="text-sm text-red-200">{error || "Impossible de charger tes données de présence pour le moment."}</p>
        </section>
      </MemberSurface>
    );
  }

  if (!selectedAttendance) {
    return (
      <MemberSurface>
        <MemberPageHeader
          title="Mes présences"
          description="Dès que des événements seront suivis sur ton compte, tu verras ici ton engagement au fil des mois."
        />
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-violet-500/50" aria-hidden />
          <p className="mt-4 text-sm text-zinc-400">
            Ton espace se remplira automatiquement quand le calendrier communautaire contiendra des créneaux qui te concernent.
          </p>
          <Link
            href="/member/evenements"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:brightness-110"
          >
            Voir l’agenda <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </MemberSurface>
    );
  }

  const attended = selectedAttendance.attendedEvents;
  const total = selectedAttendance.totalEvents;
  const rate = selectedAttendance.attendanceRate;
  const previousRate = previousAttendance?.attendanceRate ?? 0;
  const delta = rate - previousRate;
  const tier = getTier(rate);
  const remainingToTarget = getRemainingToTarget(attended, goals.events);
  const encouragement = getEncouragement({
    rate,
    delta,
    remainingToTarget,
    totalEvents: total,
    targetEvents: goals.events,
    attendedEvents: attended,
  });

  const sparklineData = history.filter((entry) => entry.totalEvents > 0 || entry.attendedEvents > 0).slice(-6);
  const maxRate = Math.max(1, ...sparklineData.map((entry) => entry.attendanceRate));
  const spotlightMonthEvents = selectedMonthEvents.filter((event) => isSpotlightCategory(event.category));
  const spotlightAttended = spotlightMonthEvents.filter((event) => event.attended).length;
  const spotlightTotal = spotlightMonthEvents.length;
  const spotlightRate = spotlightTotal > 0 ? Math.round((spotlightAttended / spotlightTotal) * 100) : 0;
  const previousSpotlightMonthEvents =
    data.attendance?.monthEventsByMonth
      .find((entry) => entry.monthKey === previousAttendance?.monthKey)
      ?.events.filter((event) => isSpotlightCategory(event.category)) || [];
  const previousSpotlightRate =
    previousSpotlightMonthEvents.length > 0
      ? Math.round((previousSpotlightMonthEvents.filter((event) => event.attended).length / previousSpotlightMonthEvents.length) * 100)
      : 0;
  const spotlightDelta = spotlightRate - previousSpotlightRate;

  let spotlightStreak = 0;
  for (const event of spotlightEventHistory) {
    if (event.attended) spotlightStreak += 1;
    else break;
  }

  const discordExtras =
    data.attendance?.discordPointsTrackingAvailable === true ? (
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          +300 OK : {discordPointsMonthCounts.awarded}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          +300 attente : {discordPointsMonthCounts.pending}
        </span>
      </div>
    ) : null;

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mes présences TENF"
        description="Retrouve ton taux de participation aux événements communautaires, mois par mois, avec le détail par créneau et le suivi des points Discord (+300) lorsque le staff les active. Un onglet dédié met en avant les soirées Spotlight. Tes objectifs restent synchronisés avec la page Objectifs."
        badge={tier.label}
        extras={discordExtras}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/member/evenements"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-400/45 hover:bg-violet-500/15"
        >
          <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
          Agenda & inscriptions
        </Link>
        <Link
          href="/member/evenements/inscriptions"
          className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-semibold text-fuchsia-100 transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/15"
        >
          <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
          Mes inscriptions
        </Link>
        <Link
          href="/member/objectifs"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-emerald-400/30 hover:text-white"
        >
          <Target className="h-4 w-4 shrink-0" aria-hidden />
          Ajuster mes objectifs
          <ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
        </Link>
      </div>

      <section
        className="relative mb-8 overflow-hidden rounded-3xl border p-5 shadow-2xl sm:p-8"
        style={{
          borderColor: "rgba(212, 175, 55, 0.38)",
          background:
            "radial-gradient(ellipse 80% 55% at 0% -15%, rgba(212,175,55,0.22), transparent 48%), radial-gradient(ellipse 45% 40% at 100% 0%, rgba(139,92,246,0.14), transparent 42%), linear-gradient(165deg, rgba(22,23,30,0.96), rgba(8,10,14,0.99))",
        }}
      >
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200/90">
              <PartyPopper className="h-3.5 w-3.5" aria-hidden />
              Vie communautaire
            </p>
            <h2 className="mt-2 text-balance text-2xl font-black text-white sm:text-3xl">Où en es-tu ce mois-ci ?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Les présences reflètent ta régularité sur le calendrier officiel TENF. Choisis un mois ci-dessous ou clique une barre dans « Tendance »
              pour explorer le détail.
            </p>
            <div
              className="mt-4 inline-flex items-start gap-3 rounded-2xl border px-4 py-3"
              style={{ borderColor: `${tier.color}44`, backgroundColor: "rgba(0,0,0,0.35)" }}
            >
              <Sparkles className="mt-0.5 h-6 w-6 shrink-0" style={{ color: tier.color }} aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Palier du mois affiché</p>
                <p className="text-lg font-bold text-white">{tier.label}</p>
                <p className="text-xs text-zinc-500">{tier.hint}</p>
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 lg:max-w-md">
            <label htmlFor="presence-month-select" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Mois affiché
            </label>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {monthsRecentFirst.map((entry) => {
                const active = entry.monthKey === selectedAttendance.monthKey;
                return (
                  <button
                    key={entry.monthKey}
                    type="button"
                    onClick={() => setSelectedMonth(entry.monthKey)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-amber-400/50 bg-amber-500/20 text-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.12)]"
                        : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    {formatMonthLabel(entry.monthKey)}
                  </button>
                );
              })}
            </div>
            <select
              id="presence-month-select"
              value={selectedAttendance.monthKey}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-white/12 bg-[#0a0c12]/95 px-3.5 py-3 text-sm text-zinc-100 transition focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/15"
            >
              {monthsRecentFirst.map((entry) => (
                <option key={entry.monthKey} value={entry.monthKey}>
                  {formatMonthLabel(entry.monthKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/25 p-2">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition sm:flex-none sm:min-w-[160px] ${
            activeTab === "general"
              ? "bg-gradient-to-r from-violet-600/90 to-violet-800/80 text-white shadow-lg shadow-violet-900/20"
              : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" aria-hidden />
          Vue générale
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("spotlight")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition sm:flex-none sm:min-w-[160px] ${
            activeTab === "spotlight"
              ? "bg-gradient-to-r from-amber-600/90 to-orange-700/80 text-white shadow-lg shadow-amber-900/20"
              : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Star className="h-4 w-4" aria-hidden />
          Spotlight
        </button>
      </div>

      {data.attendance?.discordPointsTrackingAvailable ? (
        <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 text-sm text-zinc-300">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
          <p>
            <strong className="text-emerald-100">Points Discord (+300)</strong> : sur chaque ligne où tu es marqué·e présent·e, un badge indique si
            l’équipe a déjà validé l’attribution dans l’outil admin, ou si c’est encore en cours de traitement.
          </p>
        </div>
      ) : null}

      {activeTab === "general" ? (
        <>
          <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-b from-[#151822]/95 to-black/50 p-5 sm:p-7">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <ProgressRing rate={rate} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200/85">Synthèse</p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {attended}/{total}{" "}
                    <span className="text-lg font-semibold text-zinc-500">événements · {formatMonthLabel(selectedAttendance.monthKey)}</span>
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">{encouragement}</p>
                </div>
              </div>

              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:max-w-lg">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Objectif présences</p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-white">{goals.events}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Défini dans{" "}
                    <Link href="/member/objectifs" className="font-semibold text-violet-300 hover:underline">
                      Objectifs
                    </Link>{" "}
                    pour ce mois.
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {remainingToTarget > 0 ? `Encore environ ${remainingToTarget} événement(s) pour l’atteindre.` : "Objectif atteint sur ce mois."}
                  </p>
                </div>
                <StatCard
                  label="vs mois précédent"
                  value={`${delta >= 0 ? "+" : ""}${delta}%`}
                  sub="Taux de présence"
                  icon={<TrendingUp className={`h-4 w-4 ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`} />}
                  gradient={delta >= 0 ? "from-emerald-500/15" : "from-red-500/12"}
                />
                <StatCard
                  label="Mois dans l’historique"
                  value={history.length}
                  sub="Périodes suivies"
                  icon={<CalendarDays className="h-4 w-4 text-sky-400" />}
                  gradient="from-sky-500/15"
                />
              </div>
            </div>
          </section>

          <section className="mb-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <TrendingUp className="h-5 w-5 text-amber-400" aria-hidden />
                  Tendance récente
                </h3>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Clique une barre pour changer de mois</span>
              </div>
              <div className="space-y-3">
                {sparklineData.length === 0 ? (
                  <p className="text-sm text-zinc-500">Pas encore assez de mois avec des données pour dessiner une tendance.</p>
                ) : (
                  sparklineData.map((entry) => {
                    const w = Math.max(8, (entry.attendanceRate / maxRate) * 100);
                    const active = entry.monthKey === selectedAttendance.monthKey;
                    return (
                      <button
                        key={entry.monthKey}
                        type="button"
                        onClick={() => setSelectedMonth(entry.monthKey)}
                        className="w-full text-left transition hover:opacity-95"
                      >
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className={active ? "font-semibold text-white" : "text-zinc-300"}>{formatMonthLabel(entry.monthKey)}</span>
                          <span className="tabular-nums text-zinc-500">
                            {entry.attendedEvents}/{entry.totalEvents} ({entry.attendanceRate}%)
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all ${
                              active ? "bg-gradient-to-r from-amber-400 to-violet-500 shadow-[0_0_12px_rgba(251,191,36,0.25)]" : "bg-gradient-to-r from-amber-700/80 to-violet-800/60"
                            }`}
                            style={{ width: `${w}%` }}
                          />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                <Target className="h-5 w-5 text-fuchsia-400" aria-hidden />
                Par catégorie
              </h3>
              {selectedCategoryBreakdown.length === 0 ? (
                <p className="text-sm text-zinc-500">Pas encore de répartition pour ce mois.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedCategoryBreakdown.map((item) => (
                    <li
                      key={item.category}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-3 transition hover:border-violet-500/25"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-100">{item.category}</span>
                        <span className="tabular-nums text-zinc-400">
                          {item.attendedEvents}/{item.totalEvents}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${
                            item.attendanceRate >= 70 ? "bg-emerald-500" : item.attendanceRate >= 40 ? "bg-amber-500" : "bg-rose-500/90"
                          }`}
                          style={{ width: `${item.attendanceRate}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#12141c]/90 to-black/40 p-5 sm:p-7">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <CalendarDays className="h-5 w-5 text-sky-400" aria-hidden />
                  Détail du mois
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {filteredTimelineEvents.length} ligne{filteredTimelineEvents.length !== 1 ? "s" : ""} ·{" "}
                  {formatMonthLabel(selectedAttendance.monthKey)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <Filter className="h-3.5 w-3.5" aria-hidden />
                  Filtrer
                </span>
                {(
                  [
                    ["all", `Tous (${selectedMonthEvents.length})`],
                    ["present", `Présent·e (${selectedMonthEvents.filter((e) => e.attended).length})`],
                    ["absent", `Absent·e (${selectedMonthEvents.filter((e) => !e.attended).length})`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTimelineFilter(id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      timelineFilter === id
                        ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                        : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/18"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {selectedMonthEvents.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun événement listé pour ce mois dans ton suivi.</p>
            ) : filteredTimelineEvents.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun résultat pour ce filtre.</p>
            ) : (
              <ul className="space-y-2">
                {filteredTimelineEvents.map((event) => {
                  const key = `${event.id}-${event.date}`;
                  const expanded = expandedEventKey === key;
                  return (
                    <li key={key}>
                      <article
                        className={`overflow-hidden rounded-2xl border transition ${
                          event.attended
                            ? "border-emerald-500/25 bg-emerald-950/15 hover:border-emerald-400/35"
                            : "border-white/10 bg-black/25 hover:border-white/18"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedEventKey((k) => (k === key ? null : key))}
                          className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-white">{event.title}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {new Date(event.date).toLocaleString("fr-FR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              · {event.category}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                            {event.isKeyEvent ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-100">
                                <Award className="h-3 w-3" aria-hidden />
                                Clé
                              </span>
                            ) : null}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                                event.attended
                                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
                                  : "border-white/12 bg-black/30 text-zinc-500"
                              }`}
                            >
                              {event.attended ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Présent·e
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3.5 w-3.5" aria-hidden /> Absent·e
                                </>
                              )}
                            </span>
                            <ChevronDown className={`h-5 w-5 text-zinc-500 transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
                          </div>
                        </button>
                        {expanded ? (
                          <div className="border-t border-white/10 px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <DiscordPointsStatusBadge status={event.discordPointsStatus} />
                            </div>
                            <p className="mt-3 text-xs text-zinc-500">
                              <span className="font-semibold text-zinc-400">Astuce : </span>
                              vert = présence enregistrée pour ce créneau ; les badges points Discord dépendent du traitement staff.
                            </p>
                          </div>
                        ) : null}
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/35 via-black/50 to-violet-950/20 p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-black text-white">
                <Star className="h-6 w-6 text-amber-400" aria-hidden />
                Soirées Spotlight
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Les événements phares de la communauté : suis ton assiduité, ton objectif dédié et ta série de présences récentes.
              </p>
            </div>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-100">
              Catégorie Spotlight
            </span>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Taux du mois"
              value={`${spotlightRate}%`}
              sub={`${spotlightAttended}/${spotlightTotal || "—"} présences`}
              icon={<Star className="h-4 w-4 text-amber-400" />}
              gradient="from-amber-500/20"
            />
            <StatCard
              label="Objectif Spotlight"
              value={`${spotlightAttended}/${goals.spotlight}`}
              sub="Depuis Objectifs"
              icon={<Target className="h-4 w-4 text-violet-400" />}
              gradient="from-violet-500/15"
            />
            <StatCard
              label="vs mois précédent"
              value={`${spotlightDelta >= 0 ? "+" : ""}${spotlightDelta}%`}
              sub="Taux Spotlight"
              icon={<TrendingUp className={`h-4 w-4 ${spotlightDelta >= 0 ? "text-emerald-400" : "text-red-400"}`} />}
              gradient={spotlightDelta >= 0 ? "from-emerald-500/15" : "from-red-500/12"}
            />
            <StatCard
              label="Série actuelle"
              value={spotlightStreak}
              sub="Spotlights présents d’affilée (récent)"
              icon={<Flame className="h-4 w-4 text-orange-400" />}
              gradient="from-orange-500/15"
            />
          </div>

          <div className="mb-8">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Ce mois-ci</h4>
            {spotlightMonthEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/12 px-4 py-8 text-center text-sm text-zinc-500">
                Aucun Spotlight planifié ou suivi sur {formatMonthLabel(selectedAttendance.monthKey)}.
              </p>
            ) : (
              <ul className="space-y-2">
                {spotlightMonthEvents.map((event) => (
                  <li
                    key={`${event.id}-${event.date}`}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                      event.attended
                        ? "border-amber-500/30 bg-amber-950/20"
                        : "border-white/10 bg-black/30"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-white">{event.title}</p>
                      <p className="text-xs text-zinc-500">{new Date(event.date).toLocaleString("fr-FR")}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <DiscordPointsStatusBadge status={event.discordPointsStatus} />
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          event.attended ? "border-amber-400/50 bg-amber-500/15 text-amber-100" : "border-white/12 text-zinc-500"
                        }`}
                      >
                        {event.attended ? "Présent·e" : "Absent·e"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Historique Spotlight récent</h4>
            {spotlightEventHistory.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun événement Spotlight encore enregistré dans ton historique.</p>
            ) : (
              <ul className="space-y-2">
                {spotlightEventHistory.slice(0, 8).map((event) => (
                  <li
                    key={`${event.id}-${event.date}-history`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/35 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-zinc-100">{event.title}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(event.date).toLocaleString("fr-FR")} · {formatMonthLabel(event.monthKey)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <DiscordPointsStatusBadge status={event.discordPointsStatus} />
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                          event.attended ? "border-amber-400/40 text-amber-200" : "border-white/10 text-zinc-500"
                        }`}
                      >
                        {event.attended ? "OK" : "Manqué"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </MemberSurface>
  );
}
