"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from "react";
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
  Compass,
  Filter,
  Flame,
  Heart,
  PartyPopper,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
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
        title="Ta récompense d’animation (+300) est bien validée pour ce créneau."
      >
        <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
        Récompense validée
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-amber-500/45 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200"
        title="Ta présence est notée ; le bonus communautaire peut prendre encore un peu de temps avant d’apparaître comme validé."
      >
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
        Bonus en cours
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
  const { delta, remainingToTarget, totalEvents, targetEvents, attendedEvents } = input;
  if (totalEvents === 0)
    return "Ce mois-ci, rien n’est encore listé pour toi dans l’agenda communautaire. Dès qu’un créneau te concerne, tu le verras ici sans rien paramétrer.";
  if (attendedEvents >= targetEvents)
    return delta >= 0
      ? "Bravo : tu tiens (ou dépasses) l’objectif que tu t’es fixé. Continue sur cette lancée, la communauté adore te voir."
      : "Objectif atteint pour ce mois. Garde ce rythme : chaque venue compte pour tout le monde.";
  if (remainingToTarget <= 0)
    return "Tu es tout près du palier : encore un petit coup de collier pour finir le mois en beauté.";
  if (delta > 0)
    return `Tu es en hausse par rapport au mois dernier — super signe. Il te manque environ ${remainingToTarget} animation(s) pour rejoindre ton objectif perso.`;
  if (delta < 0)
    return `Un mois un peu plus calme que le précédent, et c’est normal. ${remainingToTarget} venue(s) de plus suffisent souvent à te rapprocher de ton objectif.`;
  return `Tu es sur une ligne stable. Encore environ ${remainingToTarget} animation(s) et tu touches l’objectif défini dans « Mes objectifs ».`;
}

function getRemainingToTarget(attendedEvents: number, targetEvents: number): number {
  return Math.max(0, targetEvents - attendedEvents);
}

function isSpotlightCategory(category: string): boolean {
  return category.toLowerCase().includes("spotlight");
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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
        <div className="h-44 rounded-2xl bg-white/[0.07]" />
        <div className="h-16 rounded-2xl bg-white/[0.05]" />
        <div className="h-56 rounded-3xl bg-white/[0.06]" />
        <div className="h-14 rounded-2xl bg-white/[0.05]" />
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="h-56 rounded-3xl bg-white/[0.06]" />
          <div className="h-56 rounded-3xl bg-white/[0.06]" />
        </div>
        <div className="h-72 rounded-3xl bg-white/[0.06]" />
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
  icon: ReactNode;
  gradient: string;
}) {
  return (
    <article
      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} to-black/50 p-4 transition hover:border-white/18 hover:shadow-[0_12px_30px_rgba(0,0,0,0.25)]`}
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
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [eventQuery, setEventQuery] = useState("");

  const scrollToPresSection = useCallback((id: string) => {
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const focusGeneralAndScroll = useCallback(
    (id: string) => {
      setActiveTab("general");
      requestAnimationFrame(() => scrollToPresSection(id));
    },
    [scrollToPresSection]
  );

  const focusSpotlightTab = useCallback(() => {
    setActiveTab("spotlight");
    requestAnimationFrame(() => scrollToPresSection("pres-spotlight-panel"));
  }, [scrollToPresSection]);

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

  const baseForTimeline = useMemo(() => {
    if (categoryFilter === "all") return selectedMonthEvents;
    return selectedMonthEvents.filter((e) => e.category === categoryFilter);
  }, [selectedMonthEvents, categoryFilter]);

  const filteredTimelineEvents = useMemo(() => {
    let list = baseForTimeline;
    if (timelineFilter === "present") list = list.filter((e) => e.attended);
    else if (timelineFilter === "absent") list = list.filter((e) => !e.attended);
    const q = normalizeText(eventQuery);
    if (q) {
      list = list.filter(
        (e) => normalizeText(e.title).includes(q) || normalizeText(e.category).includes(q)
      );
    }
    return list;
  }, [baseForTimeline, timelineFilter, eventQuery]);

  useEffect(() => {
    setTimelineFilter("all");
    setExpandedEventKey(null);
    setCategoryFilter("all");
    setEventQuery("");
  }, [selectedAttendance?.monthKey]);

  if (loading) return <PresencesSkeleton />;

  if (error || !data) {
    return (
      <MemberSurface>
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-[#15131a] to-violet-950/20 px-5 py-8 sm:px-8">
          <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-400/35 bg-red-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-red-100">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />À toi, en toute transparence
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">On n’a pas pu afficher tes présences</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300">
              Ce n’est pas de ton côté : rafraîchis la page dans un instant, ou reviens plus tard. Tes infos ne sont pas perdues.
            </p>
            <p className="mt-4 text-sm text-red-200/95">{error || "Connexion momentanément indisponible."}</p>
          </div>
        </section>
      </MemberSurface>
    );
  }

  if (!selectedAttendance) {
    return (
      <MemberSurface>
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-violet-500/25 px-5 py-10 text-center sm:px-8 sm:py-14">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-md">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/35 bg-violet-500/15 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
              <CalendarDays className="h-8 w-8 text-violet-200" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Ton tableau de bord arrive bientôt</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
              Dès que l’agenda communautaire contiendra des animations qui te concernent, tu verras ici ton implication, mois par mois, sans rien configurer.
            </p>
            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/member/evenements"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
              >
                Parcourir l’agenda <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/member/evenements/inscriptions"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                <ClipboardList className="h-4 w-4" aria-hidden />
                Mes inscriptions
              </Link>
            </div>
          </div>
        </section>
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

  const bonusTrackingChips =
    data.attendance?.discordPointsTrackingAvailable === true ? (
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          Bonus validés : {discordPointsMonthCounts.awarded}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Bonus en cours : {discordPointsMonthCounts.pending}
        </span>
      </div>
    ) : null;

  return (
    <MemberSurface>
      <section
        id="pres-hero"
        className="relative mb-6 overflow-hidden rounded-2xl border px-5 py-6 shadow-[0_18px_45px_rgba(0,0,0,0.22)] sm:px-7 sm:py-7"
        style={{
          borderColor: "rgba(212,175,55,0.28)",
          background:
            "linear-gradient(145deg, rgba(212,175,55,0.16) 0%, rgba(22,18,35,0.92) 42%, rgba(10,12,18,0.96) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -left-16 -top-12 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 -right-10 h-40 w-40 rounded-full bg-violet-500/22 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.11em] text-amber-100/95">
                <Heart className="h-3.5 w-3.5" aria-hidden />
                Animations TENF
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/90"
                style={{ borderColor: `${tier.color}55`, backgroundColor: "rgba(0,0,0,0.35)" }}
              >
                <Zap className="h-3.5 w-3.5" style={{ color: tier.color }} aria-hidden />
                {tier.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-500/15 text-amber-50">
                <CalendarDays className="h-5 w-5" aria-hidden />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Tes présences aux événements</h1>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200 sm:text-[15px]">
              Un seul endroit pour voir où tu en es : ton rythme sur le mois, tes objectifs personnels, et la liste des créneaux —{" "}
              <span className="text-amber-100/95">écrit pour toi</span>, sans jargon.
            </p>
            <p className="mt-2 text-sm text-violet-100/90">
              <Compass className="mr-1.5 inline-block h-3.5 w-3.5 align-[-0.12em] text-violet-300" aria-hidden />
              Astuce : choisis un mois plus bas, puis ouvre le détail pour relire chaque animation.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/18 bg-black/30 px-3 py-1.5 text-xs font-semibold tabular-nums text-zinc-100">
                {rate}% sur {formatMonthLabel(selectedAttendance.monthKey)}
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold tabular-nums text-emerald-100">
                {attended}/{total} animations comptées
              </span>
            </div>
            {bonusTrackingChips ? <div className="mt-4">{bonusTrackingChips}</div> : null}
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:max-w-md lg:flex-col">
            <Link
              href="/member/evenements"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-50 transition hover:border-violet-300/50 hover:bg-violet-500/22"
            >
              <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
              Voir l’agenda
            </Link>
            <Link
              href="/member/evenements/inscriptions"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/12 px-4 py-3 text-sm font-semibold text-fuchsia-50 transition hover:border-fuchsia-300/45 hover:bg-fuchsia-500/18"
            >
              <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
              Mes inscriptions
            </Link>
            <Link
              href="/member/objectifs"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white/22 hover:bg-white/[0.1]"
            >
              <Target className="h-4 w-4 shrink-0" aria-hidden />
              Mes objectifs
              <ArrowRight className="h-4 w-4 opacity-80" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <nav
        aria-label="Accès rapide"
        className="sticky top-14 z-20 mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-[#0c0e14]/80 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-[#0c0e14]/65"
      >
        <button
          type="button"
          onClick={() => scrollToPresSection("pres-month")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-amber-400/25 hover:bg-amber-500/10 hover:text-white sm:flex-none sm:px-4"
        >
          <CalendarDays className="h-3.5 w-3.5 text-amber-300" aria-hidden />
          Choisir le mois
        </button>
        <button
          type="button"
          onClick={() => focusGeneralAndScroll("pres-synth")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-400/25 hover:bg-violet-500/12 hover:text-white sm:flex-none sm:px-4"
        >
          <TrendingUp className="h-3.5 w-3.5 text-violet-300" aria-hidden />
          Synthèse
        </button>
        <button
          type="button"
          onClick={() => focusGeneralAndScroll("pres-insights")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-sky-400/20 hover:bg-sky-500/10 hover:text-white sm:flex-none sm:px-4"
        >
          <Sparkles className="h-3.5 w-3.5 text-sky-300" aria-hidden />
          Tendance
        </button>
        <button
          type="button"
          onClick={() => focusGeneralAndScroll("pres-detail")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-fuchsia-400/20 hover:bg-fuchsia-500/10 hover:text-white sm:flex-none sm:px-4"
        >
          <Search className="h-3.5 w-3.5 text-fuchsia-300" aria-hidden />
          Détail & recherche
        </button>
        <button
          type="button"
          onClick={focusSpotlightTab}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-amber-400/30 hover:bg-amber-500/12 hover:text-white sm:flex-none sm:px-4"
        >
          <Star className="h-3.5 w-3.5 text-amber-300" aria-hidden />
          Spotlight
        </button>
      </nav>

      <section
        id="pres-month"
        className="relative mb-8 scroll-mt-[5.5rem] overflow-hidden rounded-3xl border p-5 shadow-2xl sm:p-8"
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
            <h2 className="mt-2 text-balance text-2xl font-black text-white sm:text-3xl">Quel mois veux-tu revoir ?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Passe d’un mois à l’autre en un clic : ton historique reste lisible pour que tu te félicites (ou pour planifier tes prochains coups de cœur
              communautaires).
            </p>
            <div
              className="mt-4 inline-flex items-start gap-3 rounded-2xl border px-4 py-3"
              style={{ borderColor: `${tier.color}44`, backgroundColor: "rgba(0,0,0,0.35)" }}
            >
              <Sparkles className="mt-0.5 h-6 w-6 shrink-0" style={{ color: tier.color }} aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Ton niveau ce mois-ci</p>
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

      <div
        id="pres-tabs"
        className="mb-8 flex scroll-mt-[5.5rem] flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/25 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        role="tablist"
        aria-label="Type de vue"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "general"}
          onClick={() => setActiveTab("general")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition sm:flex-none sm:min-w-[160px] ${
            activeTab === "general"
              ? "bg-gradient-to-r from-violet-600/90 to-violet-800/80 text-white shadow-lg shadow-violet-900/20"
              : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" aria-hidden />
          Vue d’ensemble
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "spotlight"}
          onClick={() => setActiveTab("spotlight")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition sm:flex-none sm:min-w-[160px] ${
            activeTab === "spotlight"
              ? "bg-gradient-to-r from-amber-600/90 to-orange-700/80 text-white shadow-lg shadow-amber-900/20"
              : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Star className="h-4 w-4" aria-hidden />
          Soirées Spotlight
        </button>
      </div>

      {data.attendance?.discordPointsTrackingAvailable ? (
        <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/25 to-black/20 p-4 text-sm leading-relaxed text-zinc-300">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
          <p>
            <strong className="text-emerald-100">Petit bonus quand tu es là (+300)</strong> : ouvre une ligne marquée « présent·e » pour voir si ta
            récompense est déjà validée ou encore « en cours ». Rien à faire de ton côté — c’est juste un suivi clair pour toi.
          </p>
        </div>
      ) : null}

      {activeTab === "general" ? (
        <>
          <section
            id="pres-synth"
            className="mb-8 scroll-mt-[5.5rem] rounded-3xl border border-white/10 bg-gradient-to-b from-[#151822]/95 to-black/50 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.2)] sm:p-7"
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <ProgressRing rate={rate} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200/85">Synthèse du mois</p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {attended}/{total}{" "}
                    <span className="text-lg font-semibold text-zinc-500">animations · {formatMonthLabel(selectedAttendance.monthKey)}</span>
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">{encouragement}</p>
                </div>
              </div>

              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:max-w-lg">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Ton objectif du mois</p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-white">{goals.events}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Tu l’ajustes quand tu veux dans{" "}
                    <Link href="/member/objectifs" className="font-semibold text-violet-300 hover:underline">
                      Mes objectifs
                    </Link>
                    .
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {remainingToTarget > 0
                      ? `Encore environ ${remainingToTarget} animation(s) pour l’atteindre.`
                      : "Bravo — objectif atteint pour ce mois."}
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

          <section id="pres-insights" className="mb-8 scroll-mt-[5.5rem] grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <TrendingUp className="h-5 w-5 text-amber-400" aria-hidden />
                  Tendance récente
                </h3>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Clique une barre pour afficher ce mois</span>
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
                Par style d’animation
              </h3>
              {selectedCategoryBreakdown.length === 0 ? (
                <p className="text-sm text-zinc-500">Pas encore de répartition pour ce mois.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedCategoryBreakdown.map((item) => {
                    const selectedCat = categoryFilter === item.category;
                    return (
                      <li key={item.category}>
                        <button
                          type="button"
                          title={selectedCat ? "Cliquer pour tout afficher" : "Voir seulement ce type dans le détail"}
                          onClick={() => {
                            setCategoryFilter((c) => (c === item.category ? "all" : item.category));
                            focusGeneralAndScroll("pres-detail");
                          }}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                            selectedCat
                              ? "border-violet-400/45 bg-violet-500/12 ring-2 ring-violet-400/25"
                              : "border-white/[0.07] bg-white/[0.03] hover:border-violet-500/35 hover:bg-white/[0.06]"
                          }`}
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
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          </section>

          <section
            id="pres-detail"
            className="scroll-mt-[5.5rem] rounded-3xl border border-white/10 bg-gradient-to-b from-[#12141c]/90 to-black/40 p-5 shadow-[0_14px_42px_rgba(0,0,0,0.22)] sm:p-7"
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <CalendarDays className="h-5 w-5 text-sky-400" aria-hidden />
                  Chaque créneau, en clair
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {filteredTimelineEvents.length} créneau
                  {filteredTimelineEvents.length !== 1 ? "x" : ""}{" "}
                  {categoryFilter !== "all" || eventQuery.trim() || timelineFilter !== "all"
                    ? "avec tes filtres actuels"
                    : "pour ce mois"}
                  · {formatMonthLabel(selectedAttendance.monthKey)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <Filter className="h-3.5 w-3.5" aria-hidden />
                  Affiner
                </span>
                {(
                  [
                    ["all", `Tout voir (${baseForTimeline.length})`],
                    ["present", `J’y étais (${baseForTimeline.filter((e) => e.attended).length})`],
                    ["absent", `Absents (${baseForTimeline.filter((e) => !e.attended).length})`],
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

            {selectedMonthEvents.length > 0 ? (
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
                  <input
                    type="search"
                    value={eventQuery}
                    onChange={(e) => setEventQuery(e.target.value)}
                    placeholder="Rechercher une animation ou un type…"
                    className="w-full rounded-xl border border-white/12 bg-black/40 py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/35 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
                    autoComplete="off"
                  />
                </div>
                {categoryFilter !== "all" || eventQuery.trim() || timelineFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter("all");
                      setEventQuery("");
                      setTimelineFilter("all");
                    }}
                    className="shrink-0 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.09]"
                  >
                    Tout réinitialiser
                  </button>
                ) : null}
              </div>
            ) : null}

            {categoryFilter !== "all" ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Filtre activé</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-100">
                  {categoryFilter}
                  <button
                    type="button"
                    className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[11px] font-bold text-zinc-200 hover:bg-black/45"
                    onClick={() => setCategoryFilter("all")}
                  >
                    Retirer
                  </button>
                </span>
                <p className="w-full text-xs text-zinc-500 sm:w-auto">Tu as choisi cette catégorie depuis « Par style d’animation » — clique encore la même pour tout montrer.</p>
              </div>
            ) : null}

            {selectedMonthEvents.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Rien n’est listé pour ce mois pour l’instant : dès que ton agenda se remplit, les lignes apparaîtront ici.
              </p>
            ) : filteredTimelineEvents.length === 0 ? (
              <p className="text-sm text-zinc-400">
                Aucun créneau ne correspond à ta recherche ou à tes filtres.{" "}
                <button
                  type="button"
                  className="font-semibold text-violet-300 underline decoration-violet-500/40 underline-offset-2 hover:text-violet-200"
                  onClick={() => {
                    setCategoryFilter("all");
                    setEventQuery("");
                    setTimelineFilter("all");
                  }}
                >
                  Tout réafficher
                </button>
              </p>
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
                                Moment fort
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
                              <span className="font-semibold text-zinc-400">À savoir : </span>
                              le vert confirme ta présence sur ce créneau. Le badge « bonus », quand il apparaît, te dit simplement si ta récompense +300
                              est déjà validée ou encore en traitement.
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
        <section
          id="pres-spotlight-panel"
          className="scroll-mt-[5.5rem] rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/35 via-black/50 to-violet-950/25 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.28)] sm:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-black text-white">
                <Star className="h-6 w-6 text-amber-400" aria-hidden />
                Tes grandes soirées Spotlight
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Ici on met en avant les moments forts de la communauté : regarde où tu brilles ce mois-ci, jusqu’où tu voulais aller avec ton objectif dédié,
                et ta belle série de présences récentes.
              </p>
            </div>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-100">
              Section à part
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
              sub="Défini dans Mes objectifs"
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
                        {event.attended ? "J’y étais" : "Absent·e"}
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
