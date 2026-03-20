"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCw, Sparkles, Users } from "lucide-react";

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

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

const onboardingLinks = [
  {
    href: "/admin/onboarding/sessions",
    label: "Sessions",
    description: "Planifier, publier et suivre les sessions onboarding.",
    icon: Sparkles,
  },
  {
    href: "/admin/onboarding/inscriptions",
    label: "Inscriptions membres",
    description: "Piloter les inscriptions à la prochaine réunion.",
    icon: Users,
  },
  {
    href: "/admin/onboarding/staff",
    label: "Staff onboarding",
    description: "Coordonner les rôles staff (règle: minimum 2 modérateurs par session).",
    icon: Users,
  },
];

const quickAccessLinks = [
  {
    href: "/admin/onboarding/presences",
    label: "Présences",
    description: "Valider les présences et retours post-session.",
  },
  {
    href: "/admin/onboarding/activation",
    label: "Activation membres",
    description: "Réassigner et activer les membres présents.",
  },
  {
    href: "/admin/onboarding/kpi",
    label: "KPI onboarding",
    description: "Analyser la performance du parcours onboarding.",
  },
  {
    href: "/admin/onboarding/contenus",
    label: "Contenus onboarding",
    description: "Mettre à jour présentation et trame des discours.",
  },
  {
    href: "/admin/onboarding/discours2",
    label: "Discours (direct)",
    description: "Accéder rapidement aux parties de discours.",
  },
];

export default function OnboardingDashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
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
        tone: "border-rose-400/35 bg-rose-400/10 text-rose-100",
      });
    }
    if (data.draftSessions > 0) {
      alerts.push({
        id: "drafts",
        href: "/admin/onboarding/sessions",
        label: `${data.draftSessions} session(s) en brouillon à publier`,
        tone: "border-amber-300/35 bg-amber-300/10 text-amber-100",
      });
    }
    if (data.reassignableCount > 0) {
      alerts.push({
        id: "activation",
        href: "/admin/onboarding/activation",
        label: `${data.reassignableCount} membre(s) éligible(s) à la réassignation automatique`,
        tone: "border-cyan-300/35 bg-cyan-300/10 text-cyan-100",
      });
    }
    return alerts;
  }, [data.draftSessions, data.pendingEventValidations, data.reassignableCount]);

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Onboarding membres</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Centre onboarding opérationnel
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Pilotage central des sessions, inscriptions et validations pour fluidifier le parcours des nouveaux membres.
            </p>
          </div>
          <button type="button" onClick={() => setRefreshKey((prev) => prev + 1)} className={subtleButtonClass}>
            <RefreshCw className="h-4 w-4" />
            Actualiser les données
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-300/35 bg-amber-500/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-amber-200">Info capitale staff onboarding</p>
            <p className="mt-1 text-sm text-amber-100">
              Règle opérationnelle: minimum <strong>2 modérateurs</strong> par session. Toute session en dessous doit être complétée avant validation finale.
            </p>
          </div>
          <Link
            href="/admin/onboarding/staff"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/25"
          >
            Ouvrir staffing sessions
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {data.error ? (
        <section className="rounded-2xl border border-rose-400/35 bg-rose-400/10 p-4 text-sm text-rose-100">{data.error}</section>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions total</p>
          <p className="mt-2 text-3xl font-semibold">{data.totalSessions}</p>
          <p className="mt-1 text-xs text-slate-400">Historique onboarding</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Sessions publiées</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{data.publishedSessions}</p>
          <p className="mt-1 text-xs text-slate-400">Disponibles côté membre</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Brouillons</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{data.draftSessions}</p>
          <p className="mt-1 text-xs text-slate-400">À finaliser et publier</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Taux publication</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{data.publicationRate}%</p>
          <p className="mt-1 text-xs text-slate-400">Sessions publiées / total</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-100">Points de vigilance</h2>
            {data.loading ? <p className="text-xs text-slate-400">Chargement...</p> : null}
          </div>
          {priorityAlerts.length === 0 ? (
            <p className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm text-emerald-100">
              Aucun blocage prioritaire détecté sur le parcours onboarding.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {priorityAlerts.map((alert) => (
                <Link key={alert.id} href={alert.href} className={`block rounded-xl border px-3 py-2 text-sm transition hover:brightness-110 ${alert.tone}`}>
                  {alert.label}
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Opérations immédiates</h2>
          <p className="mt-1 text-sm text-slate-400">Volumes à traiter pour la prochaine session.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Inscriptions réunion</p>
              <p className="mt-1 text-2xl font-semibold">{data.nextMeetingRegistrations}</p>
            </div>
            <div className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Inscriptions événement</p>
              <p className="mt-1 text-2xl font-semibold">{data.nextEventRegistrations}</p>
            </div>
            <div className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Présences à valider</p>
              <p className="mt-1 text-2xl font-semibold">{data.pendingEventValidations}</p>
            </div>
            <div className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Membres intégrés</p>
              <p className="mt-1 text-2xl font-semibold">{data.integratedMembersCount}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {onboardingLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-indigo-300/20 bg-[linear-gradient(135deg,rgba(79,70,229,0.17),rgba(15,23,42,0.66))] p-5 transition hover:-translate-y-[2px] hover:border-indigo-200/45 hover:shadow-[0_16px_34px_rgba(67,56,202,0.35)]"
            >
              <div className="inline-flex rounded-xl border border-indigo-200/35 bg-indigo-500/18 p-2.5 text-indigo-100">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-100">{item.label}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-200 transition group-hover:translate-x-0.5">
                Ouvrir
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className={sectionCardClass}>
        <div className="border-b border-[#2f3244] px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">Accès rapides onboarding</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
          {quickAccessLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-[#353a50] bg-[#121623]/80 px-4 py-3 text-sm text-slate-200 transition hover:border-indigo-300/45 hover:bg-[#171d2f]"
            >
              <p className="font-medium">{item.label}</p>
              <p className="mt-1 text-xs text-slate-400">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

