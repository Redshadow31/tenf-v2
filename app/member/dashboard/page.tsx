"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  History,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberBreadcrumbs from "@/components/member/ui/MemberBreadcrumbs";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

import {
  buildMemberDashboardModel,
  formatDateTime,
  hexToRgba,
  type FollowStats,
} from "@/components/member/dashboard/memberDashboardModel";
import DashboardHero from "@/components/member/dashboard/DashboardHero";
import NextActionCard from "@/components/member/dashboard/NextActionCard";
import MonthlyOverviewCards from "@/components/member/dashboard/MonthlyOverviewCards";
import LiveNetworkCard from "@/components/member/dashboard/LiveNetworkCard";
import EventsPreviewCard from "@/components/member/dashboard/EventsPreviewCard";
import RecognitionCard from "@/components/member/dashboard/RecognitionCard";
import QuickAccessCard from "@/components/member/dashboard/QuickAccessCard";

// ============================================================
// Types locaux des fetchs annexes
// ============================================================
type FollowState = "followed" | "not_followed" | "unknown";
type FollowStatusesResponse = {
  authenticated?: boolean;
  linked?: boolean;
  reason?: string;
  statuses?: Record<string, { state?: FollowState }>;
};

type SecondaryTab = "month-detail" | "history";

// ============================================================
// Page
// ============================================================
export default function MemberDashboardPage() {
  const router = useRouter();
  const { data, loading, error } = useMemberOverview();
  const { goals: memberGoals } = useMemberMonthlyGoals(data?.monthKey || "");

  const [secondaryTab, setSecondaryTab] = useState<SecondaryTab>("month-detail");
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);
  const [raidsForMonth, setRaidsForMonth] = useState(0);
  const [floatingCtaDismissed, setFloatingCtaDismissed] = useState(false);
  const [followStats, setFollowStats] = useState<FollowStats>({
    loading: true,
    authenticated: false,
    linked: false,
    total: 0,
    followed: 0,
    score: 0,
  });

  // --- Récupération du score de soutien réseau ---------------
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/members/follow-status", { cache: "no-store" });
        const body = (await response.json()) as FollowStatusesResponse;
        if (!active) return;

        const statuses = body?.statuses || {};
        const values = Object.values(statuses).map((entry) => entry?.state || "unknown");
        const total = values.length;
        const followed = values.filter((state) => state === "followed").length;
        const score = total > 0 ? Math.round((followed / total) * 100) : 0;

        setFollowStats({
          loading: false,
          authenticated: body?.authenticated === true,
          linked: body?.linked === true,
          total,
          followed,
          score,
        });
      } catch {
        if (!active) return;
        setFollowStats((prev) => ({ ...prev, loading: false }));
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // --- Récupération des raids data-v2 ------------------------
  // Source secondaire (data-v2) : combinée avec `overview.stats.raidsThisMonth` via
  // `resolveMonthlyRaidCount` à l'intérieur de `buildMemberDashboardModel`.
  useEffect(() => {
    const monthKey = data?.monthKey;
    const twitch = data?.member?.twitchLogin;
    if (!monthKey || !twitch) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/discord/raids/data-v2?month=${monthKey}`, {
          cache: "no-store",
        });
        const body = await response.json();
        const mine = (body.raidsFaits || []).filter(
          (raid: { raiderTwitchLogin?: string }) =>
            String(raid.raiderTwitchLogin || "").toLowerCase() === twitch.toLowerCase()
        );
        const total = mine.reduce(
          (sum: number, raid: { count?: number }) => sum + (raid.count || 1),
          0
        );
        if (!cancelled) setRaidsForMonth(total);
      } catch {
        if (!cancelled) setRaidsForMonth(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data?.monthKey, data?.member?.twitchLogin]);

  // --- Restaure l'état "CTA flottant masqué" pour le mois courant -------
  useEffect(() => {
    const monthKey = data?.monthKey;
    if (!monthKey) return;
    try {
      const dismissed = window.localStorage.getItem(
        `tenf:dashboard:floating-cta-dismissed:${monthKey}`
      );
      setFloatingCtaDismissed(dismissed === "1");
    } catch {
      /* silent */
    }
  }, [data?.monthKey]);

  // --- Redirect onboarding si profil placeholder/incomplet ---
  useEffect(() => {
    if (loading || !data?.member) return;
    const onboardingStatus = String(data.member.onboardingStatus || "").toLowerCase();
    const login = String(data.member.twitchLogin || "").toLowerCase();
    const role = String(data.member.role || "").toLowerCase();
    const profileValidationStatus = String(
      data.member.profileValidationStatus || ""
    ).toLowerCase();
    const isPlaceholder = login.startsWith("nouveau_") || login.startsWith("nouveau-");
    const isNewUnvalidated = role.includes("nouveau") && profileValidationStatus === "non_soumis";
    if (onboardingStatus === "a_faire" || isPlaceholder || isNewUnvalidated) {
      router.replace("/member/profil/completer?onboarding=1");
    }
  }, [data, loading, router]);

  // --- Modèle de vue ------------------------------------------
  const model = useMemo(() => {
    if (!data) return null;
    return buildMemberDashboardModel({
      data,
      goals: memberGoals,
      followStats,
      dataV2RaidsThisMonth: raidsForMonth,
    });
  }, [data, memberGoals, followStats, raidsForMonth]);

  // --- Loading -------------------------------------------------
  if (loading) {
    return (
      <MemberSurface layout="fluid">
        <DashboardSkeleton />
      </MemberSurface>
    );
  }

  // --- Error ---------------------------------------------------
  if (error || !data || !model) {
    return (
      <MemberSurface layout="fluid">
        <MemberBreadcrumbs />
        <section
          className="rounded-2xl border border-red-500/35 bg-red-950/30 p-6 text-center text-sm text-red-100"
          role="alert"
        >
          <p className="font-semibold">Impossible de charger ton tableau de bord</p>
          <p className="mt-2 opacity-90">{error || "Données membre indisponibles."}</p>
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-950"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Réessayer
          </button>
        </section>
      </MemberSurface>
    );
  }

  // --- Render --------------------------------------------------
  return (
    <MemberSurface layout="fluid">
      <MemberBreadcrumbs />

      {/* 1. Bienvenue (épuré) */}
      <DashboardHero model={model} />

      {/* 2. Ma prochaine étape */}
      <NextActionCard model={model} />

      {/* 3. Ce mois en un coup d'œil */}
      <MonthlyOverviewCards model={model} />

      {/* 4. Lives & réseau Twitch */}
      <LiveNetworkCard model={model} />

      {/* 5/6. Réunions + Agenda */}
      <EventsPreviewCard model={model} />

      {/* 7. Reconnaissance */}
      <RecognitionCard model={model} />

      {/* 8. Accès rapides */}
      <QuickAccessCard model={model} />

      {/* Zone secondaire — onglets minimes */}
      <section
        aria-labelledby="dashboard-secondary-title"
        className="rounded-3xl border p-4 md:p-6"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          backgroundColor: "rgba(20,20,26,0.7)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="dashboard-secondary-title"
            className="text-base font-bold md:text-lg"
            style={{ color: "var(--color-text)" }}
          >
            Pour aller plus loin
          </h2>
          <div
            className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/30 p-1"
            role="tablist"
            aria-label="Onglets secondaires du tableau de bord"
          >
            {(
              [
                { id: "month-detail" as const, label: "Détail du mois", Icon: CalendarDays },
                { id: "history" as const, label: "Historique", Icon: History },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={secondaryTab === id}
                onClick={() => setSecondaryTab(id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  secondaryTab === id
                    ? "bg-white/15 text-white shadow-inner"
                    : "text-white/65 hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {secondaryTab === "month-detail" ? (
            <MonthDetailPanel model={model} />
          ) : (
            <HistoryPanel
              model={model}
              expandedId={expandedTimelineId}
              setExpandedId={setExpandedTimelineId}
            />
          )}
        </div>
      </section>

      {/* Bouton flottant mobile uniquement si action principale réelle et ciblée */}
      {model.showFloatingCta && !floatingCtaDismissed ? (
        <div className="pointer-events-none fixed bottom-4 left-3 right-3 z-40 md:hidden">
          <div
            className="pointer-events-auto flex items-stretch gap-2 rounded-full p-1 shadow-lg"
            style={{
              backgroundColor: hexToRgba(model.accent, 0.96),
              boxShadow: "0 14px 28px rgba(0, 0, 0, 0.35)",
            }}
          >
            <Link
              href={model.primaryAction.href}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ color: "#1f1a12" }}
            >
              <Sparkles size={14} aria-hidden />
              <span className="line-clamp-1">{model.primaryAction.label}</span>
              <ArrowUpRight size={14} aria-hidden />
            </Link>
            <button
              type="button"
              onClick={() => {
                setFloatingCtaDismissed(true);
                try {
                  window.localStorage.setItem(
                    `tenf:dashboard:floating-cta-dismissed:${model.monthKey}`,
                    "1"
                  );
                } catch {
                  /* silent */
                }
              }}
              aria-label="Masquer le rappel d'action principale"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1f1a12] transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </MemberSurface>
  );
}

// ============================================================
// Sous-composants des onglets secondaires
// ============================================================
function MonthDetailPanel({
  model,
}: {
  model: ReturnType<typeof buildMemberDashboardModel>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <article
        className="rounded-2xl border p-4 md:p-5"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          backgroundColor: "rgba(255,255,255,0.03)",
        }}
      >
        <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
          Tes repères ce mois
        </h3>
        <p className="mt-1 text-xs text-white/55">{model.progressBreakdown}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {model.monthIndicators.map((indicator) => (
            <li
              key={indicator.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {indicator.label}
                </p>
                <p className="text-xs text-white/55">{indicator.microHint}</p>
              </div>
              <span
                className="rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums"
                style={{
                  borderColor: hexToRgba(model.accent, 0.4),
                  backgroundColor: hexToRgba(model.accent, 0.1),
                  color: hexToRgba(model.accent, 0.96),
                }}
              >
                {indicator.current}/{indicator.target}
              </span>
            </li>
          ))}
        </ul>
      </article>

      <article
        className="rounded-2xl border p-4 md:p-5"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          backgroundColor: "rgba(255,255,255,0.03)",
        }}
      >
        <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
          Petits rappels
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-white/75">
          <li
            className="rounded-xl border px-3 py-2"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            Tu peux modifier tes repères du mois côté{" "}
            <Link
              href="/member/objectifs"
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: hexToRgba(model.accent, 0.95) }}
            >
              Objectifs
            </Link>
            . Ce sont des valeurs personnelles, pas des règles imposées.
          </li>
          <li
            className="rounded-xl border px-3 py-2"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            La progression globale ({model.globalProgress}%) est la moyenne des trois
            premiers repères. Les follows réseau restent indicatifs et n&apos;y pèsent pas.
          </li>
          {model.meetings.nextCommunityEvent ? (
            <li
              className="rounded-xl border px-3 py-2"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
            >
              Prochain rendez-vous communautaire :{" "}
              <strong style={{ color: "var(--color-text)" }}>
                {model.meetings.nextCommunityEvent.title}
              </strong>{" "}
              ({formatDateTime(model.meetings.nextCommunityEvent.date)}).
            </li>
          ) : null}
        </ul>
      </article>
    </div>
  );
}

function HistoryPanel({
  model,
  expandedId,
  setExpandedId,
}: {
  model: ReturnType<typeof buildMemberDashboardModel>;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  if (model.recentTimeline.length === 0) {
    return (
      <div
        className="rounded-2xl border p-5 text-sm text-white/65"
        style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }}
      >
        <p className="font-bold" style={{ color: "var(--color-text)" }}>
          Rien à afficher pour l&apos;instant
        </p>
        <p className="mt-1 leading-relaxed">
          Dès qu&apos;une formation ou une présence sera enregistrée, elle apparaîtra ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/55">
        Formations et présences enregistrées récemment — touche une ligne pour le détail.
      </p>
      {model.recentTimeline.map((entry) => {
        const open = expandedId === entry.id;
        return (
          <div
            key={entry.id}
            className="overflow-hidden rounded-xl border bg-black/15"
            style={{ borderColor: entry.color }}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-white/5"
              onClick={() => setExpandedId(open ? null : entry.id)}
              aria-expanded={open}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-white">{entry.title}</span>
                <span className="text-xs text-slate-400">{entry.type}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {open ? (
              <div className="border-t border-white/10 px-3 py-2 text-xs text-slate-400">
                {formatDateTime(entry.date)}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Skeleton
// ============================================================
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-56 rounded-3xl bg-white/5 md:h-64" />
      <div className="h-32 rounded-3xl bg-white/5" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="h-48 rounded-3xl bg-white/5" />
    </div>
  );
}
