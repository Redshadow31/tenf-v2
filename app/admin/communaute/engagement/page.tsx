"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Bell, RefreshCw, Settings, Users } from "lucide-react";

type FollowSummaryItem = {
  staffSlug: string;
  staffName: string;
  status: "obsolete" | "up_to_date" | "not_validated";
};

type FollowSummaryResponse = {
  month: string;
  dataSourceMonth: string;
  globalStats: {
    averageFollowRate: number;
    totalFollowed: number;
    totalMembers: number;
    validPagesCount: number;
    obsoletePagesCount: number;
  };
  summary: FollowSummaryItem[];
};

type AggregateResponse = {
  success?: boolean;
  data?: {
    ops?: {
      raidsPendingCount?: number;
      discordPointsPendingCount?: number;
      raidsIgnoredToProcessCount?: number;
      followOverdueStaffNames?: string[];
    };
  };
};

type DashboardData = {
  loading: boolean;
  error: string | null;
  month: string;
  dataSourceMonth: string | null;
  followStats: {
    averageFollowRate: number;
    totalFollowed: number;
    totalMembers: number;
    validPagesCount: number;
    obsoletePagesCount: number;
  };
  followSummary: FollowSummaryItem[];
  raidsPendingCount: number;
  discordPointsPendingCount: number;
  raidsIgnoredToProcessCount: number;
  aggregateOverdueCount: number;
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

const followLinks = [
  {
    href: "/admin/communaute/engagement/follow",
    label: "Follow global",
    description: "Pilotage consolidé avec snapshots et comparaison du taux de follow.",
    icon: Activity,
  },
  {
    href: "/admin/communaute/engagement/feuilles-follow",
    label: "Feuilles de follow",
    description: "Contrôle détaillé page par page, par staff et par mois.",
    icon: Users,
  },
  {
    href: "/admin/communaute/engagement/config-follow",
    label: "Configuration follow staff",
    description: "Activation des profils staff suivis et réglages de gestion.",
    icon: Settings,
  },
];

const raidsLinks = [
  {
    href: "/admin/communaute/engagement/raids-eventsub",
    label: "Raids EventSub",
    description: "Pipeline principal des raids entrants/sortants.",
  },
  {
    href: "/admin/communaute/engagement/signalements-raids",
    label: "Signalements raid",
    description: "Fallback manuel en cas de bug EventSub.",
  },
  {
    href: "/admin/communaute/engagement/historique-raids",
    label: "Historique raids",
    description: "Audit et suivi chronologique des flux raids.",
  },
  {
    href: "/admin/communaute/engagement/points-discord",
    label: "Points Discord raids",
    description: "Attribution et validation opérationnelle des points.",
  },
];

function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function CommunauteEngagementPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<DashboardData>({
    loading: true,
    error: null,
    month: currentMonthKey(),
    dataSourceMonth: null,
    followStats: {
      averageFollowRate: 0,
      totalFollowed: 0,
      totalMembers: 0,
      validPagesCount: 0,
      obsoletePagesCount: 0,
    },
    followSummary: [],
    raidsPendingCount: 0,
    discordPointsPendingCount: 0,
    raidsIgnoredToProcessCount: 0,
    aggregateOverdueCount: 0,
  });

  const loadDashboard = useCallback(async () => {
    const month = currentMonthKey();
    setData((prev) => ({ ...prev, loading: true, error: null, month }));
    try {
      const [followRes, aggregateRes] = await Promise.all([
        fetch(`/api/follow/summary/${encodeURIComponent(month)}`, { cache: "no-store" }),
        fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
      ]);

      if (!followRes.ok) {
        throw new Error(`Erreur follow summary (${followRes.status})`);
      }

      const followJson = (await followRes.json()) as FollowSummaryResponse;
      const aggregateJson = aggregateRes.ok ? ((await aggregateRes.json()) as AggregateResponse) : null;
      const ops = aggregateJson?.data?.ops;

      setData({
        loading: false,
        error: null,
        month,
        dataSourceMonth: followJson.dataSourceMonth || null,
        followStats: {
          averageFollowRate: Number(followJson.globalStats?.averageFollowRate || 0),
          totalFollowed: Number(followJson.globalStats?.totalFollowed || 0),
          totalMembers: Number(followJson.globalStats?.totalMembers || 0),
          validPagesCount: Number(followJson.globalStats?.validPagesCount || 0),
          obsoletePagesCount: Number(followJson.globalStats?.obsoletePagesCount || 0),
        },
        followSummary: Array.isArray(followJson.summary) ? followJson.summary : [],
        raidsPendingCount: Number(ops?.raidsPendingCount || 0),
        discordPointsPendingCount: Number(ops?.discordPointsPendingCount || 0),
        raidsIgnoredToProcessCount: Number(ops?.raidsIgnoredToProcessCount || 0),
        aggregateOverdueCount: Array.isArray(ops?.followOverdueStaffNames) ? ops.followOverdueStaffNames.length : 0,
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
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  const followMetrics = useMemo(() => {
    const obsolete = data.followSummary.filter((item) => item.status === "obsolete");
    const upToDate = data.followSummary.filter((item) => item.status === "up_to_date");
    const notValidated = data.followSummary.filter((item) => item.status === "not_validated");
    return {
      obsolete,
      obsoleteCount: obsolete.length,
      upToDateCount: upToDate.length,
      notValidatedCount: notValidated.length,
      staffCount: data.followSummary.length,
    };
  }, [data.followSummary]);

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Engagement Follow</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Centre engagement communautaire
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Dashboard de pilotage des follows staff: retards, progression du mois et accès direct aux modules de suivi.
            </p>
          </div>
          <button type="button" onClick={() => setRefreshKey((prev) => prev + 1)} className={subtleButtonClass}>
            <RefreshCw className="h-4 w-4" />
            Actualiser les données
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Staff follow</p>
          <p className="mt-2 text-3xl font-semibold">{followMetrics.staffCount}</p>
          <p className="mt-1 text-xs text-slate-400">Équipe configurée pour le suivi</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Pages à jour</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{followMetrics.upToDateCount}</p>
          <p className="mt-1 text-xs text-slate-400">Validation récente</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Retards &gt; 30 jours</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{followMetrics.obsoleteCount}</p>
          <p className="mt-1 text-xs text-slate-400">Priorités à relancer côté staff</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Taux moyen follow</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{data.followStats.averageFollowRate}%</p>
          <p className="mt-1 text-xs text-slate-400">
            {data.followStats.totalFollowed}/{data.followStats.totalMembers} retours follow
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-100">Priorités Follow</h2>
            <p className="text-xs text-slate-400">
              Mois affiché: <span className="text-slate-200">{data.month}</span>
              {data.dataSourceMonth && data.dataSourceMonth !== data.month ? (
                <span> · Source: {data.dataSourceMonth}</span>
              ) : null}
            </p>
          </div>

          {data.loading ? (
            <p className="mt-4 text-sm text-slate-400">Chargement des indicateurs...</p>
          ) : data.error ? (
            <p className="mt-4 text-sm text-rose-300">{data.error}</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-[#3a4059] bg-[#121622]/85 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                  <Bell className="h-4 w-4" />
                  Staff en retard de validation
                </div>
                {followMetrics.obsolete.length === 0 ? (
                  <p className="mt-2 text-sm text-emerald-300">Aucun retard détecté, suivi propre.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {followMetrics.obsolete.map((item) => (
                      <span
                        key={item.staffSlug}
                        className="rounded-full border border-amber-300/35 bg-amber-300/10 px-2.5 py-1 text-xs text-amber-100"
                      >
                        {item.staffName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#2f3f3f] bg-[#111a1a]/80 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-slate-400">À jour API</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-300">{data.followStats.validPagesCount}</p>
                </div>
                <div className="rounded-xl border border-[#4a3b2a] bg-[#1b1711]/80 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Obsolètes API</p>
                  <p className="mt-1 text-xl font-semibold text-amber-300">{data.followStats.obsoletePagesCount}</p>
                </div>
                <div className="rounded-xl border border-[#453156] bg-[#181121]/80 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Non validées</p>
                  <p className="mt-1 text-xl font-semibold text-fuchsia-300">{followMetrics.notValidatedCount}</p>
                </div>
              </div>
            </div>
          )}
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Opérations raids liées</h2>
          <p className="mt-1 text-sm text-slate-400">
            Vision rapide des files opérationnelles engagement.
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Raids à traiter</p>
              <p className="mt-1 text-2xl font-semibold">{data.raidsPendingCount}</p>
            </div>
            <div className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Points Discord en attente</p>
              <p className="mt-1 text-2xl font-semibold">{data.discordPointsPendingCount}</p>
            </div>
            <div className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Raids ignorés à revoir</p>
              <p className="mt-1 text-2xl font-semibold">{data.raidsIgnoredToProcessCount}</p>
            </div>
            <div className="rounded-xl border border-[#2f3244] bg-[#10131f]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Retards follow (agrégé)</p>
              <p className="mt-1 text-2xl font-semibold">{data.aggregateOverdueCount}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {followLinks.map((item) => {
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
          <h2 className="text-base font-semibold text-slate-100">Accès rapides raids & engagement</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
          {raidsLinks.map((item) => (
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

