"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Compass,
  ExternalLink,
  Eye,
  FileText,
  Inbox,
  ListOrdered,
  MapPin,
  Mic,
  MonitorPlay,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------------- */
/*  Types                                                                    */
/* ------------------------------------------------------------------------- */

type IntegrationItem = {
  id: string;
  title?: string;
  date: string;
  isPublished?: boolean;
  locationName?: string;
  locationUrl?: string;
};

type CorrelationSession = {
  integrationId: string;
  title: string;
  date: string;
  attendedCount: number;
  registrationsCount: number;
};

type AttendanceSnapshot = {
  sessionsPastCount: number;
  totalAttendances: number;
  integratedMembersCount: number;
  sessions: CorrelationSession[];
  activationSummary: {
    toActivateCount: number;
    missingInMembersListCount: number;
    inMembersListCount: number;
    consideredActivatedCount: number;
  };
};

type DashboardData = {
  loading: boolean;
  error: string | null;
  totalSessions: number;
  draftSessions: number;
  nextSession: IntegrationItem | null;
  lastPastSession: IntegrationItem | null;
  lastPastStats: CorrelationSession | null;
  nextSessionModerators: number | null;
  nextSessionModeratorsLoading: boolean;
  nextMeetingRegistrations: number;
  profileValidationPending: number;
  correlation: AttendanceSnapshot;
};

/* ------------------------------------------------------------------------- */
/*  Styles                                                                   */
/* ------------------------------------------------------------------------- */

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const heroVisualClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubSubtleBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

const EMPTY_CORRELATION: AttendanceSnapshot = {
  sessionsPastCount: 0,
  totalAttendances: 0,
  integratedMembersCount: 0,
  sessions: [],
  activationSummary: {
    toActivateCount: 0,
    missingInMembersListCount: 0,
    inMembersListCount: 0,
    consideredActivatedCount: 0,
  },
};

/* ------------------------------------------------------------------------- */
/*  Helpers                                                                  */
/* ------------------------------------------------------------------------- */

function formatSessionDateTime(iso: string | null | undefined): { date: string; time: string; weekday: string } {
  if (!iso) return { date: "—", time: "", weekday: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "", weekday: "" };
  return {
    date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    weekday: d.toLocaleDateString("fr-FR", { weekday: "long" }),
  };
}

function formatRelativeDays(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "";
  const diffMs = ts - now;
  const dayMs = 86_400_000;
  if (diffMs < -dayMs) return "passée";
  if (diffMs < dayMs) return "aujourd'hui";
  if (diffMs < 2 * dayMs) return "demain";
  const days = Math.round(diffMs / dayMs);
  if (days < 7) return `dans ${days} j`;
  if (days < 30) return `dans ${Math.round(days / 7)} sem.`;
  return `dans ${Math.round(days / 30)} mois`;
}

const MIN_MODERATORS = 2;

type ToolTile = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const toolTiles: ToolTile[] = [
  {
    href: "/admin/onboarding/sessions",
    label: "Créneaux",
    description: "Planifier, publier et archiver les sessions d'accueil.",
    icon: Calendar,
  },
  {
    href: "/admin/onboarding/inscriptions",
    label: "Inscriptions",
    description: "Vérifier qui s'est inscrit au prochain créneau.",
    icon: UserPlus,
  },
  {
    href: "/admin/onboarding/staff",
    label: "Équipe session",
    description: "Composer l'équipe d'animation et confirmer les modérateurs.",
    icon: ShieldCheck,
  },
  {
    href: "/admin/onboarding/presences",
    label: "Présences",
    description: "Saisir et valider les présences après la session.",
    icon: ClipboardCheck,
  },
  {
    href: "/admin/onboarding/activation",
    label: "Activation",
    description: "Réassigner les membres présents et synchroniser les rôles.",
    icon: Zap,
  },
  {
    href: "/admin/onboarding/contenus",
    label: "Contenus & trame",
    description: "Slides, discours, checklist avant le live.",
    icon: BookOpen,
  },
  {
    href: "/admin/onboarding/kpi",
    label: "Indicateurs",
    description: "Volumes et suivi d'impact des sessions d'accueil.",
    icon: BarChart3,
  },
  {
    href: "/admin/onboarding/staff-mobile",
    label: "Vue mobile staff",
    description: "Vue tactile allégée pour les modérateurs en session.",
    icon: Smartphone,
  },
];

const supportLinks = [
  {
    href: "/admin/onboarding/contenus",
    label: "Contenus & checklist",
    description: "Point d'entrée : quelle trame l'équipe utilise.",
    primary: true,
    icon: BookOpen,
  },
  {
    href: "/admin/onboarding/discours2",
    label: "Discours & trame",
    description: "Script section par section pour le live.",
    primary: false,
    icon: Mic,
  },
  {
    href: "/admin/onboarding/presentation-anime",
    label: "Présentation animée",
    description: "Support visuel pendant la session.",
    primary: false,
    icon: MonitorPlay,
  },
  {
    href: "/admin/onboarding/presentation",
    label: "Présentation",
    description: "Slides d'accueil (variante statique).",
    primary: false,
    icon: MonitorPlay,
  },
  {
    href: "/admin/onboarding/discours-mai-2026",
    label: "Discours — mai 2026",
    description: "Variante saisonnière à annoncer en ouverture.",
    primary: false,
    icon: CalendarClock,
  },
];

const asideReminders = [
  {
    tone: "text-amber-200",
    dot: "bg-amber-300",
    text: (
      <>
        Règle TENF : au moins <strong className="text-white">{MIN_MODERATORS} modérateurs</strong> confirmés avant de
        valider une session.
      </>
    ),
  },
  {
    tone: "text-rose-200",
    dot: "bg-rose-300",
    text: "Ne pas activer un profil sans présence vérifiée sur la session concernée.",
  },
  {
    tone: "text-emerald-200",
    dot: "bg-emerald-300",
    text: (
      <>
        Publier le créneau dès qu'il est confirmé pour qu'il apparaisse sur le{" "}
        <Link href="/integration" className="text-violet-200 underline-offset-2 hover:underline">
          parcours public
        </Link>
        .
      </>
    ),
  },
];

/* ------------------------------------------------------------------------- */
/*  Page                                                                     */
/* ------------------------------------------------------------------------- */

export default function OnboardingHubPage() {
  const [data, setData] = useState<DashboardData>({
    loading: true,
    error: null,
    totalSessions: 0,
    draftSessions: 0,
    nextSession: null,
    lastPastSession: null,
    lastPastStats: null,
    nextSessionModerators: null,
    nextSessionModeratorsLoading: false,
    nextMeetingRegistrations: 0,
    profileValidationPending: 0,
    correlation: EMPTY_CORRELATION,
  });

  const loadDashboard = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [aggregateRes, integrationsRes, attendanceRes] = await Promise.all([
        fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
        fetch("/api/integrations?admin=true", { cache: "no-store" }),
        fetch("/api/admin/integrations/attendance-correlation", { cache: "no-store" }),
      ]);

      const aggregateJson = aggregateRes.ok ? await aggregateRes.json() : null;
      const integrationsJson = integrationsRes.ok ? await integrationsRes.json() : null;
      const attendanceJson = attendanceRes.ok ? await attendanceRes.json() : null;

      const integrations = Array.isArray(integrationsJson?.integrations)
        ? (integrationsJson.integrations as IntegrationItem[])
        : [];

      const correlation: AttendanceSnapshot = attendanceJson?.data
        ? {
            sessionsPastCount: Number(attendanceJson.data.sessionsPastCount ?? 0),
            totalAttendances: Number(attendanceJson.data.totalAttendances ?? 0),
            integratedMembersCount: Number(attendanceJson.data.integratedMembersCount ?? 0),
            sessions: Array.isArray(attendanceJson.data.sessions)
              ? (attendanceJson.data.sessions as CorrelationSession[])
              : [],
            activationSummary: {
              toActivateCount: Number(attendanceJson.data.activationSummary?.toActivateCount ?? 0),
              missingInMembersListCount: Number(attendanceJson.data.activationSummary?.missingInMembersListCount ?? 0),
              inMembersListCount: Number(attendanceJson.data.activationSummary?.inMembersListCount ?? 0),
              consideredActivatedCount: Number(attendanceJson.data.activationSummary?.consideredActivatedCount ?? 0),
            },
          }
        : EMPTY_CORRELATION;

      const now = Date.now();
      const pastSorted = integrations
        .filter((item) => {
          const ts = new Date(item.date).getTime();
          return Number.isFinite(ts) && ts < now;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const upcoming = integrations
        .filter((item) => {
          const ts = new Date(item.date).getTime();
          return Number.isFinite(ts) && ts >= now;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const nextSession = upcoming[0] || null;
      const lastPastSession = pastSorted[0] || null;
      const lastPastStats = lastPastSession
        ? correlation.sessions.find((s) => s.integrationId === lastPastSession.id) ?? null
        : null;

      const kpis = aggregateJson?.data?.recap?.upcomingKpis;
      const nextMeetingRegistrations = Number(kpis?.nextMeetingRegistrations || 0);
      const profileValidationPending = Number(aggregateJson?.data?.ops?.profileValidationPendingCount ?? 0);

      setData({
        loading: false,
        error: null,
        totalSessions: integrations.length,
        draftSessions: integrations.filter((item) => !item.isPublished).length,
        nextSession,
        lastPastSession,
        lastPastStats,
        nextSessionModerators: null,
        nextSessionModeratorsLoading: !!nextSession,
        nextMeetingRegistrations,
        profileValidationPending,
        correlation,
      });

      if (nextSession?.id) {
        try {
          const modRes = await fetch(`/api/integrations/${encodeURIComponent(nextSession.id)}/moderators`, {
            cache: "no-store",
          });
          if (modRes.ok) {
            const payload = await modRes.json();
            const registrations = Array.isArray(payload?.registrations) ? payload.registrations : [];
            setData((prev) =>
              prev.nextSession?.id === nextSession.id
                ? { ...prev, nextSessionModerators: registrations.length, nextSessionModeratorsLoading: false }
                : prev
            );
          } else {
            setData((prev) =>
              prev.nextSession?.id === nextSession.id
                ? { ...prev, nextSessionModerators: null, nextSessionModeratorsLoading: false }
                : prev
            );
          }
        } catch {
          setData((prev) =>
            prev.nextSession?.id === nextSession.id
              ? { ...prev, nextSessionModerators: null, nextSessionModeratorsLoading: false }
              : prev
          );
        }
      }
    } catch (error) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Erreur de chargement",
      }));
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const sessionsWithMissingAttendance = useMemo(
    () =>
      data.correlation.sessions.filter((s) => s.registrationsCount > 0 && s.attendedCount === 0),
    [data.correlation.sessions]
  );

  const sessionsWithMissingAttendanceCount = sessionsWithMissingAttendance.length;

  const lastSessionNeedsPresences = useMemo(() => {
    if (!data.lastPastStats) return false;
    return data.lastPastStats.registrationsCount > 0 && data.lastPastStats.attendedCount === 0;
  }, [data.lastPastStats]);

  const hasClosureWork = useMemo(
    () =>
      lastSessionNeedsPresences ||
      data.correlation.activationSummary.toActivateCount > 0 ||
      sessionsWithMissingAttendanceCount > 0,
    [lastSessionNeedsPresences, data.correlation.activationSummary.toActivateCount, sessionsWithMissingAttendanceCount]
  );

  const moderators = data.nextSessionModerators;
  const staffStatus: "ok" | "warning" | "unknown" = (() => {
    if (!data.nextSession) return "unknown";
    if (data.nextSessionModeratorsLoading) return "unknown";
    if (moderators === null) return "unknown";
    return moderators >= MIN_MODERATORS ? "ok" : "warning";
  })();

  const nextDate = formatSessionDateTime(data.nextSession?.date);
  const nextRelative = formatRelativeDays(data.nextSession?.date);
  const lastDate = formatSessionDateTime(data.lastPastSession?.date);

  const todoNow = useMemo(() => {
    const items: Array<{
      id: string;
      href: string;
      label: string;
      detail: string;
      count?: number;
      icon: LucideIcon;
      tone: string;
    }> = [];

    if (data.draftSessions > 0) {
      items.push({
        id: "drafts",
        href: "/admin/onboarding/sessions",
        label: "Créneaux en brouillon",
        detail: "Invisible côté membre tant que non publié.",
        count: data.draftSessions,
        icon: FileText,
        tone: "border-indigo-400/35 bg-indigo-500/8 text-indigo-100",
      });
    }

    if (data.nextSession && staffStatus === "warning") {
      items.push({
        id: "staff",
        href: "/admin/onboarding/staff",
        label: "Staff incomplet",
        detail: `Moins de ${MIN_MODERATORS} modérateurs sur la prochaine session.`,
        icon: ShieldCheck,
        tone: "border-amber-400/35 bg-amber-500/8 text-amber-100",
      });
    }

    if (sessionsWithMissingAttendanceCount > 0) {
      items.push({
        id: "integration-presences",
        href: "/admin/onboarding/presences",
        label: "Présences d'intégration à saisir",
        detail: "Sessions passées avec inscrits mais aucune présence enregistrée.",
        count: sessionsWithMissingAttendanceCount,
        icon: ClipboardCheck,
        tone: "border-rose-400/35 bg-rose-500/8 text-rose-100",
      });
    }

    if (data.correlation.activationSummary.toActivateCount > 0) {
      items.push({
        id: "activation",
        href: "/admin/onboarding/activation",
        label: "Profils à activer",
        detail: "Membres présents à l'annuaire mais pas encore activés.",
        count: data.correlation.activationSummary.toActivateCount,
        icon: Zap,
        tone: "border-amber-400/35 bg-amber-500/8 text-amber-100",
      });
    }

    if (data.profileValidationPending > 0) {
      items.push({
        id: "profile-validation",
        href: "/admin/membres/validation-profil",
        label: "Profils à valider (staff)",
        detail: "Fiches en attente de validation côté administration.",
        count: data.profileValidationPending,
        icon: UserCheck,
        tone: "border-sky-400/35 bg-sky-500/8 text-sky-100",
      });
    }

    return items;
  }, [
    data.draftSessions,
    data.nextSession,
    data.correlation.activationSummary.toActivateCount,
    data.profileValidationPending,
    sessionsWithMissingAttendanceCount,
    staffStatus,
  ]);

  const funnelSteps = useMemo(() => {
    const steps: Array<{
      n: string;
      title: string;
      body: string;
      href: string;
      count: number | null;
      showCount: boolean;
    }> = [
      {
        n: "1",
        title: "Inscription au créneau",
        body: "Le membre réserve via le parcours public.",
        href: "/admin/onboarding/inscriptions",
        count: data.nextSession ? data.nextMeetingRegistrations : null,
        showCount: !!data.nextSession,
      },
      {
        n: "2",
        title: "Session vocale",
        body: "Animation staff avec trame et présentation.",
        href: "/admin/onboarding/contenus",
        count: null,
        showCount: false,
      },
      {
        n: "3",
        title: "Présences saisies",
        body: "Comptage des présents après la session.",
        href: "/admin/onboarding/presences",
        count: data.correlation.totalAttendances,
        showCount: data.correlation.sessionsPastCount > 0,
      },
      {
        n: "4",
        title: "Activation",
        body: "Rôles et statut membre dans l'annuaire.",
        href: "/admin/onboarding/activation",
        count: data.correlation.activationSummary.toActivateCount,
        showCount: data.correlation.activationSummary.toActivateCount > 0,
      },
      {
        n: "5",
        title: "Profil & validation",
        body: "Complétion membre et contrôle staff si besoin.",
        href: "/admin/membres/validation-profil",
        count: data.profileValidationPending,
        showCount: data.profileValidationPending > 0,
      },
      {
        n: "6",
        title: "Membre actif TENF",
        body: "Intégration reconnue dans la communauté.",
        href: "/admin/onboarding/kpi",
        count: data.correlation.integratedMembersCount,
        showCount: data.correlation.integratedMembersCount > 0,
      },
    ];
    return steps;
  }, [data]);

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--onb-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-3rem] -z-10 h-[clamp(260px,35vw,480px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-10%,rgba(167,139,250,0.28),transparent_54%),radial-gradient(ellipse_at_86%_22%,rgba(99,102,241,0.12),transparent_48%)]" />
      </div>

      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 [--onb-sidebar:min(100%,clamp(17rem,24vw,25rem))] xl:grid-cols-[minmax(0,1fr)_var(--onb-sidebar)] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 sm:space-y-8 xl:space-y-[var(--onb-gap)]">
            {/* Header */}
            <header
              className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.6rem)] lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,min(100%,0.94fr))] lg:gap-8 ${panelClass}`}
            >
              <div className="min-w-0 space-y-4">
                <Link
                  href="/admin/pilotage"
                  className={`inline-flex items-center gap-1 text-[length:clamp(0.8rem,0.74rem+0.32vw,0.9375rem)] text-zinc-400 transition hover:text-white ${focusRingClass} rounded-lg`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Administration
                </Link>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-zinc-200/90">
                    <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Accueil & intégration
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/26 bg-violet-500/[0.1] px-3 py-1 text-[length:clamp(0.65rem,0.58rem+0.25vw,0.6875rem)] font-semibold uppercase tracking-[0.11em] text-violet-100/92">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Cockpit staff
                  </span>
                </div>
                <div>
                  <p className="text-[length:clamp(0.6875rem,0.625rem+0.25vw,0.8125rem)] uppercase tracking-[0.12em] text-violet-200/95">
                    Parcours nouveau membre
                  </p>
                  <h1 className="mt-2 text-[clamp(1.45rem,1.05rem+1.05vw,2.35rem)] font-semibold tracking-tight text-white">
                    Accueil & intégration
                  </h1>
                  <p className="mt-3 max-w-3xl text-[length:clamp(0.8125rem,0.75rem+0.32vw,0.9625rem)] leading-[1.65] text-zinc-400">
                    Préparer les sessions d&apos;accueil, suivre les présences et accompagner les nouveaux jusqu&apos;au statut
                    actif TENF. Les compteurs proviennent des sessions d&apos;intégration — pas des événements communautaires.
                  </p>
                </div>
                <div className="flex min-w-0 flex-wrap gap-[clamp(0.4rem,0.85vw,0.625rem)]">
                  <Link href="/integration" target="_blank" rel="noopener noreferrer" className={`${hubSubtleBtnClass} ${focusRingClass}`}>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    Parcours public
                  </Link>
                  <button
                    type="button"
                    onClick={() => void loadDashboard()}
                    disabled={data.loading}
                    className={`${hubSubtleBtnClass} ${focusRingClass} border-white/10 bg-white/[0.04] text-zinc-200`}
                    aria-label="Actualiser le cockpit intégration"
                  >
                    <RefreshCw className={`h-4 w-4 shrink-0 ${data.loading ? "animate-spin" : ""}`} aria-hidden />
                    Actualiser
                  </button>
                  <Link href="/admin/onboarding/contenus" className={`${hubSubtleBtnClass} ${focusRingClass} border-emerald-500/25 bg-emerald-950/25 text-emerald-100`}>
                    <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                    Contenus & trame
                  </Link>
                </div>
              </div>
              <div className={`relative min-h-[11rem] p-[clamp(0.875rem,1.5vw,1.2rem)] sm:min-h-[12rem] ${heroVisualClass}`}>
                <div aria-hidden className="absolute inset-0 bg-[conic-gradient(from_200deg_at_72%_-10%,rgba(167,139,250,0.14),transparent_42%)]" />
                <div className="relative flex h-full min-h-[10rem] flex-col justify-between gap-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-violet-400/26 bg-violet-500/[0.11] px-3 py-1.5 text-[length:clamp(0.65rem,0.55rem+0.35vw,0.7rem)] font-semibold uppercase tracking-[0.08em] text-violet-50/96">
                    <ListOrdered className="h-3.5 w-3.5 shrink-0 text-violet-200/92" aria-hidden />
                    Synthèse intégration
                  </span>
                  {data.loading ? (
                    <p className="text-sm text-zinc-500" role="status" aria-live="polite">
                      Chargement…
                    </p>
                  ) : data.error ? (
                    <p className="text-sm text-rose-200/90" role="status" aria-live="polite">
                      {data.error}
                    </p>
                  ) : (
                    <dl className="grid min-w-0 grid-cols-2 gap-[clamp(0.45rem,0.9vw,0.65rem)] sm:grid-cols-4 text-[length:clamp(0.65rem,0.58rem+0.22vw,0.775rem)]">
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Créneaux</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-zinc-50">
                          {data.totalSessions}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Inscrits (prochain)</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-sky-200/95">
                          {data.nextSession ? data.nextMeetingRegistrations : "—"}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">Présences à saisir</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-rose-200/95">
                          {sessionsWithMissingAttendanceCount > 0 ? sessionsWithMissingAttendanceCount : "0"}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/52 p-[clamp(0.45rem,0.85vw,0.55rem)] text-center">
                        <dt className="font-medium uppercase tracking-wide text-zinc-500">À activer</dt>
                        <dd className="mt-1 text-[clamp(1.05rem,0.88rem+0.45vw,1.45rem)] font-semibold tabular-nums text-amber-200/95">
                          {data.correlation.activationSummary.toActivateCount}
                        </dd>
                      </div>
                    </dl>
                  )}
                  <p className="text-[length:clamp(0.65rem,0.58rem+0.2vw,0.75rem)] leading-snug text-zinc-500">
                    Sessions passées suivies :{" "}
                    <span className="font-semibold tabular-nums text-zinc-200">{data.correlation.sessionsPastCount}</span>
                    <span className="mx-1.5 text-zinc-600">·</span>
                    Membres intégrés :{" "}
                    <span className="font-semibold tabular-nums text-emerald-200/90">
                      {data.correlation.integratedMembersCount}
                    </span>
                  </p>
                </div>
              </div>
            </header>

            {/* Prochaine session */}
            <section className={`${panelClass} min-w-0 p-[clamp(1rem,2vw,1.35rem)]`} aria-labelledby="onb-next-session-heading">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="onb-next-session-heading" className="flex flex-wrap items-center gap-2 text-lg font-semibold text-zinc-100">
                    <Calendar className="h-5 w-5 shrink-0 text-violet-300" aria-hidden />
                    Prochaine session
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">Créneau le plus proche dans le calendrier d&apos;accueil.</p>
                </div>
                {data.nextSession && !data.nextSession.isPublished ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/35 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    Brouillon
                  </span>
                ) : data.nextSession ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    Publié
                  </span>
                ) : null}
              </div>

              {data.loading ? (
                <p className="mt-4 text-sm text-zinc-500" role="status">
                  Chargement du calendrier…
                </p>
              ) : !data.nextSession ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5">
                  <p className="text-sm text-zinc-400">Aucun créneau à venir planifié.</p>
                  <Link href="/admin/onboarding/sessions" className={`mt-3 inline-flex items-center gap-2 text-sm font-medium text-violet-200 hover:text-white ${focusRingClass} rounded-lg`}>
                    Planifier un créneau
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              ) : (
                <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0 space-y-3">
                    <p className="text-[clamp(1.1rem,0.95rem+0.5vw,1.35rem)] font-semibold text-white">
                      {data.nextSession.title || "Session d'accueil"}
                    </p>
                    <p className="text-sm capitalize text-zinc-300">
                      {nextDate.weekday} {nextDate.date}
                      {nextDate.time ? ` · ${nextDate.time}` : ""}
                      {nextRelative ? (
                        <span className="ml-2 rounded-md bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-200">
                          {nextRelative}
                        </span>
                      ) : null}
                    </p>
                    <ul className="flex flex-wrap gap-2 text-sm text-zinc-400">
                      <li className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/40 px-2.5 py-1">
                        <Users className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                        <span>
                          <strong className="font-semibold text-zinc-200 tabular-nums">{data.nextMeetingRegistrations}</strong>{" "}
                          inscrit{data.nextMeetingRegistrations > 1 ? "s" : ""}
                        </span>
                      </li>
                      <li className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/40 px-2.5 py-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                        {data.nextSessionModeratorsLoading ? (
                          <span>Staff…</span>
                        ) : moderators !== null ? (
                          <span>
                            <strong className="font-semibold text-zinc-200 tabular-nums">{moderators}</strong> modérateur
                            {moderators > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span>Staff non chargé</span>
                        )}
                      </li>
                      {data.nextSession.locationName || data.nextSession.locationUrl ? (
                        <li className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/40 px-2.5 py-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
                          {data.nextSession.locationUrl ? (
                            <a
                              href={data.nextSession.locationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`truncate underline-offset-2 hover:underline ${focusRingClass}`}
                            >
                              {data.nextSession.locationName || "Lieu vocal"}
                            </a>
                          ) : (
                            <span className="truncate">{data.nextSession.locationName}</span>
                          )}
                        </li>
                      ) : null}
                    </ul>
                    {staffStatus === "warning" ? (
                      <p className="inline-flex items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                        <span>
                          <strong>Staff incomplet</strong> — au moins {MIN_MODERATORS} modérateurs requis.
                        </span>
                      </p>
                    ) : staffStatus === "ok" ? (
                      <p className="inline-flex items-center gap-2 text-sm text-emerald-200/90">
                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                        Équipe suffisante pour la session.
                      </p>
                    ) : null}
                    {!data.nextSession.isPublished ? (
                      <p className="text-sm text-indigo-200/90">
                        Ce créneau n&apos;est pas visible sur le parcours public tant qu&apos;il n&apos;est pas publié.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
                    <Link href="/admin/onboarding/sessions" className={`${hubSubtleBtnClass} ${focusRingClass} justify-center`}>
                      Voir les créneaux
                    </Link>
                    <Link href="/admin/onboarding/inscriptions" className={`${hubSubtleBtnClass} ${focusRingClass} justify-center`}>
                      Gérer les inscriptions
                    </Link>
                    <Link href="/admin/onboarding/staff" className={`${hubSubtleBtnClass} ${focusRingClass} justify-center`}>
                      Préparer le staff
                    </Link>
                    <Link href="/admin/onboarding/contenus" className={`${hubSubtleBtnClass} ${focusRingClass} justify-center border-emerald-500/25 bg-emerald-950/25 text-emerald-100`}>
                      Ouvrir la trame
                    </Link>
                    {!data.nextSession.isPublished ? (
                      <Link
                        href="/admin/onboarding/sessions"
                        className={`${hubSubtleBtnClass} ${focusRingClass} justify-center border-indigo-400/35 bg-indigo-500/10 text-indigo-100`}
                      >
                        Publier / finaliser le créneau
                      </Link>
                    ) : null}
                  </div>
                </div>
              )}
            </section>

            {/* Dernière session à traiter */}
            <section className={`${panelClass} min-w-0 p-[clamp(1rem,2vw,1.35rem)]`} aria-labelledby="onb-last-session-heading">
              <h2 id="onb-last-session-heading" className="flex flex-wrap items-center gap-2 text-lg font-semibold text-zinc-100">
                <Inbox className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                À clôturer après la dernière session
              </h2>
              <p className="mt-1 text-sm text-zinc-500">Dernière session passée dans le calendrier d&apos;accueil.</p>

              {data.loading ? (
                <p className="mt-4 text-sm text-zinc-500" role="status">
                  Chargement…
                </p>
              ) : !data.lastPastSession ? (
                <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100/95" role="status">
                  <CheckCircle2 className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
                  Rien à clôturer pour le moment — aucune session passée enregistrée.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{data.lastPastSession.title || "Session d'accueil"}</p>
                    <p className="mt-1 text-sm capitalize text-zinc-400">
                      {lastDate.weekday} {lastDate.date}
                      {lastDate.time ? ` · ${lastDate.time}` : ""}
                    </p>
                  </div>
                  <ul className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                    <li className="rounded-xl border border-white/[0.08] bg-zinc-900/40 px-3 py-2">
                      <span className="text-zinc-500">Inscrits</span>
                      <p className="mt-0.5 font-semibold tabular-nums text-zinc-100">
                        {data.lastPastStats?.registrationsCount ?? "—"}
                      </p>
                    </li>
                    <li className="rounded-xl border border-white/[0.08] bg-zinc-900/40 px-3 py-2">
                      <span className="text-zinc-500">Présents saisis</span>
                      <p className="mt-0.5 font-semibold tabular-nums text-zinc-100">
                        {data.lastPastStats ? data.lastPastStats.attendedCount : "—"}
                      </p>
                    </li>
                    <li className="rounded-xl border border-white/[0.08] bg-zinc-900/40 px-3 py-2">
                      <span className="text-zinc-500">Présences</span>
                      <p className="mt-0.5 font-medium">
                        {lastSessionNeedsPresences ? (
                          <span className="text-rose-200">Non saisies</span>
                        ) : data.lastPastStats && data.lastPastStats.registrationsCount > 0 ? (
                          <span className="text-emerald-200">Saisies</span>
                        ) : (
                          <span className="text-zinc-400">Aucun inscrit</span>
                        )}
                      </p>
                    </li>
                    <li className="rounded-xl border border-white/[0.08] bg-zinc-900/40 px-3 py-2">
                      <span className="text-zinc-500">À activer (global)</span>
                      <p className="mt-0.5 font-semibold tabular-nums text-amber-200/95">
                        {data.correlation.activationSummary.toActivateCount}
                      </p>
                    </li>
                  </ul>
                  {data.correlation.activationSummary.missingInMembersListCount > 0 ? (
                    <p className="text-sm text-sky-200/90">
                      {data.correlation.activationSummary.missingInMembersListCount} présence
                      {data.correlation.activationSummary.missingInMembersListCount > 1 ? "s" : ""} sans fiche annuaire
                      — à vérifier dans l&apos;activation.
                    </p>
                  ) : null}
                  {!hasClosureWork ? (
                    <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100/95" role="status">
                      <CheckCircle2 className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
                      Rien de prioritaire à clôturer sur cette session.
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/admin/onboarding/presences"
                      className={`${hubSubtleBtnClass} ${focusRingClass} ${lastSessionNeedsPresences ? "border-rose-400/35 bg-rose-500/10 text-rose-100" : ""}`}
                    >
                      Saisir les présences
                    </Link>
                    <Link href="/admin/onboarding/activation" className={`${hubSubtleBtnClass} ${focusRingClass}`}>
                      Réviser les activations
                    </Link>
                    <Link href="/admin/onboarding/inscriptions" className={`${hubSubtleBtnClass} ${focusRingClass}`}>
                      Voir les inscriptions
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* Tunnel */}
            <section className={`${panelClass} min-w-0 p-[clamp(1rem,2vw,1.35rem)]`} aria-labelledby="onb-funnel-heading">
              <h2 id="onb-funnel-heading" className="text-lg font-semibold text-zinc-100">
                Du créneau au membre actif
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
                Ce tunnel aide le staff à voir où un nouveau membre peut rester bloqué après son inscription. Les
                chiffres affichés sont réels ; les étapes sans compteur restent des repères de parcours.
              </p>
              <ol className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {funnelSteps.map((step) => (
                  <li key={step.n} className="min-w-0">
                    <Link
                      href={step.href}
                      className={`flex h-full min-w-0 flex-col rounded-xl border border-white/[0.08] bg-zinc-900/35 p-4 transition hover:border-violet-400/30 hover:bg-zinc-900/55 ${focusRingClass}`}
                      aria-label={`${step.title}${step.showCount && step.count !== null ? ` : ${step.count}` : ""}`}
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-xs font-bold text-violet-200">
                        {step.n}
                      </span>
                      <span className="mt-2 font-semibold text-zinc-100">{step.title}</span>
                      <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{step.body}</span>
                      {step.showCount && step.count !== null ? (
                        <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-200">
                          {step.count}
                        </span>
                      ) : (
                        <span className="mt-3 text-xs text-zinc-600">Repère parcours</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            {/* À faire maintenant */}
            <section className={`${panelClass} min-w-0 p-[clamp(1rem,2vw,1.35rem)]`} aria-labelledby="onb-todo-heading">
              <h2 id="onb-todo-heading" className="text-lg font-semibold text-zinc-100">
                À faire maintenant
              </h2>
              <p className="mt-1 text-sm text-zinc-500">Actions détectées à partir des données d&apos;intégration et du calendrier.</p>
              {data.loading ? (
                <p className="mt-4 text-sm text-zinc-500" role="status" aria-live="polite">
                  Analyse en cours…
                </p>
              ) : todoNow.length === 0 ? (
                <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100/95" role="status">
                  <CheckCircle2 className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
                  Aucune action prioritaire détectée pour l&apos;instant.
                </p>
              ) : (
                <ul className="mt-4 grid min-w-0 gap-3">
                  {todoNow.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 transition hover:brightness-110 ${item.tone} ${focusRingClass}`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-90" aria-hidden />
                            <div className="min-w-0">
                              <p className="font-semibold">{item.label}</p>
                              <p className="mt-0.5 text-sm opacity-90">{item.detail}</p>
                            </div>
                          </div>
                          {item.count !== undefined ? (
                            <span className="shrink-0 rounded-lg bg-black/20 px-3 py-1 text-lg font-bold tabular-nums">
                              {item.count}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              {sessionsWithMissingAttendanceCount === 0 && !data.loading && data.correlation.sessionsPastCount > 0 ? (
                <p className="mt-3 text-xs text-zinc-600">
                  Toutes les sessions passées connues ont des présences saisies lorsqu&apos;il y avait des inscrits.
                </p>
              ) : null}
            </section>

            {/* Supports */}
            <section className={`${panelClass} min-w-0 p-[clamp(1rem,2vw,1.35rem)]`} aria-labelledby="onb-supports-heading">
              <h2 id="onb-supports-heading" className="text-lg font-semibold text-zinc-100">
                Supports de session
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Vérifie dans <strong className="font-medium text-zinc-300">Contenus</strong> quelle version de trame
                l&apos;équipe utilise actuellement avant le live.
              </p>
              <ul className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
                {supportLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.href} className={link.primary ? "sm:col-span-2" : ""}>
                      <Link
                        href={link.href}
                        className={`flex min-w-0 items-start gap-3 rounded-xl border p-3 transition ${focusRingClass} ${
                          link.primary
                            ? "border-violet-400/30 bg-violet-500/10 hover:border-violet-400/45"
                            : "border-white/[0.08] bg-zinc-900/30 hover:border-white/15"
                        }`}
                      >
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" aria-hidden />
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-100">
                            {link.label}
                            {link.primary ? (
                              <span className="ml-2 rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-100">
                                Entrée principale
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">{link.description}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Après la session */}
            <section className={`${panelClass} min-w-0 p-[clamp(1rem,2vw,1.35rem)]`} aria-labelledby="onb-after-heading">
              <h2 id="onb-after-heading" className="text-lg font-semibold text-zinc-100">
                Après la session
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Une fois les présences saisies : activer les rôles, laisser le membre compléter son profil, valider côté
                staff si nécessaire.
              </p>
              <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
                <Link
                  href="/admin/onboarding/activation"
                  className={`flex items-center gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/35 p-3 transition hover:border-amber-400/30 ${focusRingClass}`}
                >
                  <Zap className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                  <span className="text-sm font-medium text-zinc-100">Activation des rôles</span>
                </Link>
                <Link
                  href="/admin/membres"
                  className={`flex items-center gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/35 p-3 transition hover:border-violet-400/30 ${focusRingClass}`}
                >
                  <Users className="h-5 w-5 shrink-0 text-violet-300" aria-hidden />
                  <span className="text-sm font-medium text-zinc-100">Annuaire membres</span>
                </Link>
                <Link
                  href="/admin/membres/validation-profil"
                  className={`flex items-center gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/35 p-3 transition hover:border-sky-400/30 ${focusRingClass}`}
                >
                  <UserCheck className="h-5 w-5 shrink-0 text-sky-300" aria-hidden />
                  <span className="text-sm font-medium text-zinc-100">Validation profils (staff)</span>
                </Link>
                <Link
                  href="/member/profil/completer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 rounded-xl border border-white/[0.08] bg-zinc-900/35 p-3 transition hover:border-emerald-400/30 ${focusRingClass}`}
                >
                  <Eye className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
                  <span className="text-sm font-medium text-zinc-100">Aperçu complétion membre</span>
                </Link>
              </div>
            </section>

            {/* Outils staff */}
            <section className={`${panelClass} min-w-0 p-[clamp(1rem,2vw,1.35rem)]`} aria-labelledby="onb-tools-heading">
              <h2 id="onb-tools-heading" className="text-lg font-semibold text-zinc-100">
                Outils staff
              </h2>
              <p className="mt-1 text-sm text-zinc-500">Accès directs aux écrans du parcours d&apos;intégration.</p>
              <ul className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {toolTiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <li key={tile.href} className="min-w-0">
                      <Link
                        href={tile.href}
                        className={`flex h-full min-w-0 flex-col rounded-xl border border-white/[0.08] bg-zinc-900/35 p-4 transition hover:border-violet-400/28 hover:bg-zinc-900/50 ${focusRingClass}`}
                        aria-label={`${tile.label} — ${tile.description}`}
                      >
                        <Icon className="h-5 w-5 text-violet-300" aria-hidden />
                        <span className="mt-2 font-semibold text-zinc-100">{tile.label}</span>
                        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{tile.description}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          </main>

          <aside
            className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto xl:overscroll-contain"
            aria-label="Rappels et raccourcis intégration"
          >
            <div className={`${panelClass} p-4 sm:p-5`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Rappels staff</h2>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed">
                {asideReminders.map((item, i) => (
                  <li key={i} className={`flex gap-2.5 ${item.tone}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.dot}`} aria-hidden />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${panelClass} p-4 sm:p-5`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Liens utiles</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/integration" className={`text-violet-200 hover:text-white ${focusRingClass} rounded`}>
                    Parcours public /integration
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/membres/validation-profil"
                    className={`text-violet-200 hover:text-white ${focusRingClass} rounded`}
                  >
                    Validation profils
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/onboarding/presences"
                    className={`text-violet-200 hover:text-white ${focusRingClass} rounded`}
                  >
                    Saisie des présences
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/evaluations"
                    className={`text-zinc-500 hover:text-zinc-300 ${focusRingClass} rounded text-xs`}
                  >
                    Ancienne file opérationnelle (évaluations)
                  </Link>
                </li>
              </ul>
            </div>

            <div className={`${panelClass} p-4 sm:p-5`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Parcours conseillé</h2>
              <ol className="mt-3 space-y-2 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <span className="font-bold text-violet-300">1.</span>
                  <span>Publier le créneau et confirmer le staff</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-violet-300">2.</span>
                  <span>Animer avec la trame depuis Contenus</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-violet-300">3.</span>
                  <span>Saisir les présences puis activer</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-violet-300">4.</span>
                  <span>Laisser compléter le profil et valider si besoin</span>
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}