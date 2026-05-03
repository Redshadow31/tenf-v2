"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  Mic,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

type IntegrationItem = {
  id: string;
  title?: string;
  date: string;
  isPublished?: boolean;
};

type AggregateResponse = {
  data?: {
    recap?: {
      upcomingKpis?: {
        nextMeetingRegistrations?: number;
        nextEventRegistrations?: number;
        pendingEventValidations?: number;
      };
    };
  };
};

type AttendanceResponse = {
  data?: {
    integratedMembersCount?: number;
    reassignableCandidates?: Array<{
      twitchLogin: string;
      displayName: string;
      attendanceCount: number;
    }>;
  };
};

type DashboardData = {
  loading: boolean;
  error: string | null;
  totalSessions: number;
  publishedSessions: number;
  draftSessions: number;
  publicationRate: number;
  nextMeetingRegistrations: number;
  nextEventRegistrations: number;
  pendingEventValidations: number;
  integratedMembersCount: number;
  reassignableCount: number;
};

const heroShellClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b10]";

type JourneyStep = {
  href: string;
  title: string;
  hint: string;
  icon: LucideIcon;
  forMember: boolean;
};

const journeySteps: JourneyStep[] = [
  {
    href: "/admin/onboarding/sessions",
    title: "Sessions",
    hint: "Créneaux visibles dans l’espace membre",
    icon: Calendar,
    forMember: true,
  },
  {
    href: "/admin/onboarding/inscriptions",
    title: "Inscriptions",
    hint: "Identifier qui participe à la prochaine réunion",
    icon: UserPlus,
    forMember: true,
  },
  {
    href: "/admin/onboarding/staff",
    title: "Équipe",
    hint: "Modérateurs et renforts sur la session",
    icon: ShieldCheck,
    forMember: false,
  },
  {
    href: "/admin/onboarding/presences",
    title: "Présences",
    hint: "À traiter après l’événement",
    icon: ClipboardCheck,
    forMember: false,
  },
  {
    href: "/admin/onboarding/activation",
    title: "Activation",
    hint: "Rôles et passage « membre actif »",
    icon: Zap,
    forMember: false,
  },
  {
    href: "/admin/onboarding/kpi",
    title: "Indicateurs",
    hint: "Volumes, publication, suivi d’impact",
    icon: BarChart3,
    forMember: false,
  },
  {
    href: "/admin/onboarding/contenus",
    title: "Supports",
    hint: "Slides, trames, scripts d’animateur",
    icon: BookOpen,
    forMember: true,
  },
  {
    href: "/admin/onboarding/discours2",
    title: "Discours live",
    hint: "Pendant la session vocale",
    icon: Mic,
    forMember: false,
  },
];

type PillarLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  ringHover: string;
};

const pillarLinks: PillarLink[] = [
  {
    href: "/admin/onboarding/sessions",
    label: "Sessions",
    description:
      "Planifiez, publiez et suivez les créneaux : première information visible côté membres.",
    icon: Sparkles,
    gradient: "from-violet-500/25 via-indigo-500/10 to-transparent",
    ringHover: "hover:ring-violet-400/40",
  },
  {
    href: "/admin/onboarding/inscriptions",
    label: "Inscriptions",
    description:
      "Vue sur la prochaine réunion : file d’attente, confirmations et messages — à tenir à jour avant le live.",
    icon: Users,
    gradient: "from-sky-500/25 via-cyan-500/10 to-transparent",
    ringHover: "hover:ring-sky-400/40",
  },
  {
    href: "/admin/onboarding/staff",
    label: "Équipe sur session",
    description:
      "Répartition des rôles : la charte TENF impose au moins deux modérateurs avant de valider une session.",
    icon: ShieldCheck,
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    ringHover: "hover:ring-amber-400/35",
  },
];

type QuickTile = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const quickTiles: QuickTile[] = [
  {
    href: "/admin/onboarding/presences",
    label: "Présences",
    description: "Retours post-session et validations.",
    icon: ClipboardCheck,
  },
  {
    href: "/admin/onboarding/activation",
    label: "Activation",
    description: "Réassignations et membres prêts à animer.",
    icon: Zap,
  },
  {
    href: "/admin/onboarding/kpi",
    label: "Indicateurs",
    description: "Volumes, publication, tendances.",
    icon: BarChart3,
  },
  {
    href: "/admin/onboarding/contenus",
    label: "Supports",
    description: "Présentation et discours.",
    icon: BookOpen,
  },
  {
    href: "/admin/onboarding/presentation-anime",
    label: "Présentation animée",
    description: "Version dynamique pour la salle / le live.",
    icon: Sparkles,
  },
  {
    href: "/admin/onboarding/discours2",
    label: "Discours (direct)",
    description: "Accès rapide aux parties live.",
    icon: Mic,
  },
];

export default function OnboardingDashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [journeyHover, setJourneyHover] = useState<number | null>(null);
  const [data, setData] = useState<DashboardData>({
    loading: true,
    error: null,
    totalSessions: 0,
    publishedSessions: 0,
    draftSessions: 0,
    publicationRate: 0,
    nextMeetingRegistrations: 0,
    nextEventRegistrations: 0,
    pendingEventValidations: 0,
    integratedMembersCount: 0,
    reassignableCount: 0,
  });

  const loadDashboard = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [aggregateRes, integrationsRes, attendanceRes] = await Promise.all([
        fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
        fetch("/api/integrations?admin=true", { cache: "no-store" }),
        fetch("/api/admin/integrations/attendance-correlation", { cache: "no-store" }),
      ]);

      const aggregateJson = aggregateRes.ok ? ((await aggregateRes.json()) as AggregateResponse) : null;
      const integrationsJson = integrationsRes.ok ? await integrationsRes.json() : null;
      const attendanceJson = attendanceRes.ok ? ((await attendanceRes.json()) as AttendanceResponse) : null;

      const integrations = Array.isArray(integrationsJson?.integrations)
        ? (integrationsJson.integrations as IntegrationItem[])
        : [];
      const totalSessions = integrations.length;
      const publishedSessions = integrations.filter((item) => item.isPublished).length;
      const draftSessions = totalSessions - publishedSessions;
      const publicationRate = totalSessions > 0 ? Math.round((publishedSessions / totalSessions) * 100) : 0;

      const kpis = aggregateJson?.data?.recap?.upcomingKpis;
      const reassignableCandidates = attendanceJson?.data?.reassignableCandidates;
      setData({
        loading: false,
        error: null,
        totalSessions,
        publishedSessions,
        draftSessions,
        publicationRate,
        nextMeetingRegistrations: Number(kpis?.nextMeetingRegistrations || 0),
        nextEventRegistrations: Number(kpis?.nextEventRegistrations || 0),
        pendingEventValidations: Number(kpis?.pendingEventValidations || 0),
        integratedMembersCount: Number(attendanceJson?.data?.integratedMembersCount || 0),
        reassignableCount: Array.isArray(reassignableCandidates) ? reassignableCandidates.length : 0,
      });
    } catch (error) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }));
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard, refreshKey]);

  const priorityAlerts = useMemo(() => {
    const alerts: Array<{ id: string; href: string; label: string; tone: string }> = [];
    if (data.pendingEventValidations > 0) {
      alerts.push({
        id: "presences",
        href: "/admin/onboarding/presences",
        label: `${data.pendingEventValidations} événement(s) passé(s) sans validation de présence`,
        tone: "border-rose-400/35 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15",
      });
    }
    if (data.draftSessions > 0) {
      alerts.push({
        id: "drafts",
        href: "/admin/onboarding/sessions",
        label: `${data.draftSessions} session(s) en brouillon — les membres ne voient pas encore ces créneaux`,
        tone: "border-amber-300/35 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15",
      });
    }
    if (data.reassignableCount > 0) {
      alerts.push({
        id: "activation",
        href: "/admin/onboarding/activation",
        label: `${data.reassignableCount} membre(s) éligible(s) à la réassignation automatique`,
        tone: "border-cyan-300/35 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15",
      });
    }
    return alerts;
  }, [data.draftSessions, data.pendingEventValidations, data.reassignableCount]);

  const kpiPulse = data.loading ? "animate-pulse opacity-70" : "";

  return (
    <div className="space-y-8 text-white">
      {/* Hero */}
      <section className={`${heroShellClass} p-6 md:p-8`}>
        <div
          className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-100/90">
                Hub staff
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-100/90">
                Expérience membres TENF
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/85">Accueil & intégration</p>
              <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-white to-cyan-100 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                Accueillir, clarifier, embrayer
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-[15px]">
                Tableau de bord pour la modération et l&apos;administration : il relie ce que vivent les{" "}
                <strong className="font-semibold text-slate-100">nouveaux membres</strong> (réunions, contenus,
                sécurité) et ce que vous coordonnez en{" "}
                <strong className="font-semibold text-slate-100">équipe</strong>. Chaque action ici se reflète dans
                l&apos;espace membre : gardez la chaîne courte et lisible.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/member/dashboard"
                className={`${subtleButtonClass} ${focusRingClass} border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/45`}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                Vue membre (aperçu)
              </Link>
              <button
                type="button"
                onClick={() => setRefreshKey((prev) => prev + 1)}
                className={`${subtleButtonClass} ${focusRingClass}`}
              >
                <RefreshCw className={`h-4 w-4 shrink-0 ${data.loading ? "animate-spin" : ""}`} aria-hidden />
                Actualiser les données
              </button>
            </div>
          </div>

          <div className="w-full max-w-md shrink-0 space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              <Megaphone className="h-4 w-4 text-violet-300" aria-hidden />
              Lisibilité côté public
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              Les sessions <strong className="text-slate-100">publiées</strong> apparaissent aux membres ; les brouillons
              restent internes. Le staffing visible rassure ; les présences referment la boucle avec respect.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Taux de publication</span>
                <span className="font-semibold text-slate-200">{data.publicationRate}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-[width] duration-700 ease-out ${kpiPulse}`}
                  style={{ width: `${Math.min(100, Math.max(0, data.publicationRate))}%` }}
                  role="progressbar"
                  aria-valuenow={data.publicationRate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {data.publishedSessions} publiée(s) · {data.draftSessions} brouillon(s) · {data.totalSessions} au total
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Règle staff */}
      <section className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/15 via-amber-950/20 to-transparent p-5 md:p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-1/4 -translate-y-1/4 rounded-full bg-amber-400/10 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/35 bg-amber-500/15">
              <ShieldCheck className="h-6 w-6 text-amber-100" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-200/90">Engagement TENF</p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-amber-50/95">
                Minimum <strong className="text-white">deux modérateurs</strong> par session onboarding avant validation
                finale. C&apos;est une promesse de sérieux pour les membres comme pour le staff présent en vocal.
              </p>
            </div>
          </div>
          <Link
            href="/admin/onboarding/staff"
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300/45 bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-500/30 ${focusRingClass}`}
          >
            Composer le staffing
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {data.error ? (
        <section className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4 text-sm text-rose-100">{data.error}</section>
      ) : null}

      {/* KPI cliquables */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/onboarding/sessions"
          className={`group ${sectionCardClass} block p-5 transition hover:-translate-y-0.5 hover:border-indigo-400/35 hover:shadow-[0_12px_36px_rgba(79,70,229,0.2)] ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Sessions (total)</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-white ${kpiPulse}`}>{data.totalSessions}</p>
          <p className="mt-2 text-xs text-slate-400">Historique des créneaux onboarding</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-indigo-300 opacity-0 transition group-hover:opacity-100">
            Ouvrir les sessions <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </Link>
        <Link
          href="/admin/onboarding/sessions"
          className={`group ${sectionCardClass} block border-emerald-500/20 p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/35 hover:shadow-[0_12px_36px_rgba(16,185,129,0.15)] ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200/70">Visibles membres</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-emerald-300 ${kpiPulse}`}>{data.publishedSessions}</p>
          <p className="mt-2 text-xs text-slate-400">Sessions publiées dans le parcours membre</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-300/90 opacity-0 transition group-hover:opacity-100">
            Vérifier la publication <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </Link>
        <Link
          href="/admin/onboarding/sessions"
          className={`group ${sectionCardClass} block border-amber-500/15 p-5 transition hover:-translate-y-0.5 hover:border-amber-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200/70">Brouillons</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-amber-300 ${kpiPulse}`}>{data.draftSessions}</p>
          <p className="mt-2 text-xs text-slate-400">Encore invisibles pour les membres</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-amber-200/90 opacity-0 transition group-hover:opacity-100">
            Finaliser & publier <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </Link>
        <Link
          href="/admin/onboarding/kpi"
          className={`group ${sectionCardClass} block border-sky-500/15 p-5 transition hover:-translate-y-0.5 hover:border-sky-400/35 ${focusRingClass}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-200/70">Publication</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums text-sky-300 ${kpiPulse}`}>{data.publicationRate}%</p>
          <p className="mt-2 text-xs text-slate-400">Ratio publié / total — détail dans les KPI</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-sky-300/90 opacity-0 transition group-hover:opacity-100">
            Analyser <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </Link>
      </section>

      {/* Parcours interactif */}
      <section className={sectionCardClass}>
        <div className="border-b border-white/[0.06] px-5 py-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">De la séance au rôle membre</h2>
              <p className="mt-1 text-sm text-slate-400">
                Survolez une étape pour la mettre en avant ; cliquez pour ouvrir l&apos;outil correspondant.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-emerald-200/90">
                <HeartHandshake className="h-3 w-3" aria-hidden />
                Touche membre
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-violet-200/90">
                <Users className="h-3 w-3" aria-hidden />
                Staff
              </span>
            </div>
          </div>
        </div>
        <div className="relative p-4 md:p-6">
          <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              const active = journeyHover === index;
              return (
                <div key={step.href} className="flex items-stretch md:contents">
                  <Link
                    href={step.href}
                    onMouseEnter={() => setJourneyHover(index)}
                    onMouseLeave={() => setJourneyHover(null)}
                    onFocus={() => setJourneyHover(index)}
                    onBlur={() => setJourneyHover(null)}
                    className={`relative flex min-w-[148px] shrink-0 flex-col rounded-2xl border p-4 transition md:min-w-0 md:flex-1 ${focusRingClass} ${
                      active
                        ? "scale-[1.02] border-violet-400/50 bg-gradient-to-b from-violet-500/20 to-black/40 shadow-[0_12px_40px_rgba(124,58,237,0.25)]"
                        : "border-white/[0.08] bg-black/25 hover:border-white/15 hover:bg-black/35"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-lg border p-2 ${step.forMember ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-violet-400/30 bg-violet-500/10 text-violet-100"}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{index + 1}/8</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{step.title}</p>
                    <p className="mt-1 text-[11px] leading-snug text-slate-400">{step.hint}</p>
                  </Link>
                  {index < journeySteps.length - 1 ? (
                    <div className="hidden shrink-0 items-center px-0.5 md:flex" aria-hidden>
                      <ChevronRight className="h-5 w-5 text-slate-600" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5 md:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-100">Points de vigilance</h2>
            {data.loading ? <p className="text-xs text-slate-400">Synchronisation…</p> : null}
          </div>
          {priorityAlerts.length === 0 ? (
            <div className="mt-4 flex gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15">
                <Sparkles className="h-5 w-5 text-emerald-200" aria-hidden />
              </div>
              <p className="text-sm leading-relaxed text-emerald-100/95">
                Rien d&apos;urgent détecté sur la chaîne onboarding. Continue de garder sessions publiées et présences
                traitées pour que les membres ne restent jamais dans le flou.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {priorityAlerts.map((alert) => (
                <li key={alert.id}>
                  <Link
                    href={alert.href}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${alert.tone} ${focusRingClass}`}
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    <span>{alert.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <details className="group mt-6 rounded-2xl border border-white/[0.08] bg-black/20 p-4 open:border-indigo-400/25 open:bg-indigo-500/[0.06]">
            <summary className="cursor-pointer list-none text-sm font-semibold text-indigo-100 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-2">
                Parler du onboarding aux membres
                <ChevronRight className="h-4 w-4 shrink-0 transition group-open:rotate-90" aria-hidden />
              </span>
            </summary>
            <ul className="mt-3 space-y-2 border-t border-white/[0.06] pt-3 text-sm leading-relaxed text-slate-400">
              <li>
                · Annonce les <strong className="font-medium text-slate-200">dates publiées</strong> tôt : la prévisibilité
                réduit l&apos;angoisse du nouveau venu.
              </li>
              <li>
                · Rappelle le <strong className="font-medium text-slate-200">cadre bienveillant</strong> : onboarding =
                clarification des attentes, pas un interrogatoire.
              </li>
              <li>
                · Après la session, un <strong className="font-medium text-slate-200">retour court</strong> (présence /
                activation) referme la boucle et valorise le trajet.
              </li>
            </ul>
          </details>
        </article>

        <article className={`${sectionCardClass} p-5 md:p-6`}>
          <h2 className="text-lg font-semibold text-slate-100">Charges immédiates</h2>
          <p className="mt-1 text-sm text-slate-400">Volumes utiles pour la prochaine vague — chaque bloc ouvre l&apos;outil lié.</p>
          <div className="mt-4 grid gap-3">
            <Link
              href="/admin/onboarding/inscriptions"
              className={`rounded-xl border border-[#2f3244] bg-[#10131f]/90 p-4 transition hover:border-sky-400/35 hover:bg-[#141a2a] ${focusRingClass}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Inscriptions réunion</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums text-white ${kpiPulse}`}>{data.nextMeetingRegistrations}</p>
            </Link>
            <Link
              href="/admin/onboarding/inscriptions"
              className={`rounded-xl border border-[#2f3244] bg-[#10131f]/90 p-4 transition hover:border-violet-400/35 hover:bg-[#141a2a] ${focusRingClass}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Inscriptions événement</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums text-white ${kpiPulse}`}>{data.nextEventRegistrations}</p>
            </Link>
            <Link
              href="/admin/onboarding/presences"
              className={`rounded-xl border border-[#2f3244] bg-[#10131f]/90 p-4 transition hover:border-rose-400/35 hover:bg-[#141a2a] ${focusRingClass}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Présences à valider</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums text-rose-200 ${kpiPulse}`}>{data.pendingEventValidations}</p>
            </Link>
            <Link
              href="/admin/onboarding/activation"
              className={`rounded-xl border border-[#2f3244] bg-[#10131f]/90 p-4 transition hover:border-emerald-400/35 hover:bg-[#141a2a] ${focusRingClass}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Membres intégrés (suivi)</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums text-emerald-200 ${kpiPulse}`}>{data.integratedMembersCount}</p>
            </Link>
          </div>
        </article>
      </section>

      {/* Piliers */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Modules centraux</h2>
          <p className="mt-1 text-sm text-slate-400">Les trois leviers qui structurent le début de vie dans TENF.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {pillarLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0e111a] p-6 shadow-[0_18px_48px_rgba(2,6,23,0.5)] ring-1 ring-transparent transition hover:-translate-y-1 hover:shadow-[0_22px_56px_rgba(67,56,202,0.28)] ${item.ringHover} ${focusRingClass}`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 ${item.gradient}`}
                  aria-hidden
                />
                <div className="relative">
                  <div className="inline-flex rounded-2xl border border-white/15 bg-black/30 p-3 text-white backdrop-blur-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{item.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition group-hover:gap-3">
                    Ouvrir le module
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Accès rapides */}
      <section className={sectionCardClass}>
        <div className="border-b border-white/[0.06] px-5 py-4 md:px-6">
          <h2 className="text-base font-semibold text-slate-100">Raccourcis & contenus</h2>
          <p className="mt-1 text-sm text-slate-400">Accès directs sans refaire tout le parcours.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 md:p-6">
          {quickTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className={`group flex gap-4 rounded-2xl border border-[#353a50] bg-[#121623]/85 p-4 transition hover:border-indigo-400/40 hover:bg-[#171d2f] ${focusRingClass}`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/15 text-indigo-100 transition group-hover:border-indigo-300/45 group-hover:bg-indigo-500/25">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white">{tile.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{tile.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
