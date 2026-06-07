"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RefreshCw, Sparkles, X } from "lucide-react";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

import {
  buildMemberDashboardModel,
  hexToRgba,
  type FollowStats,
  type RecentRaidEntry,
} from "@/components/member/dashboard/memberDashboardModel";
import DashboardHero from "@/components/member/dashboard/DashboardHero";
import DashboardNotificationsStrip from "@/components/member/dashboard/DashboardNotificationsStrip";
import NextActionCard from "@/components/member/dashboard/NextActionCard";
import MonthlyOverviewCards from "@/components/member/dashboard/MonthlyOverviewCards";
import LiveNetworkCard from "@/components/member/dashboard/LiveNetworkCard";
import EventsPreviewCard from "@/components/member/dashboard/EventsPreviewCard";
import RecognitionCard from "@/components/member/dashboard/RecognitionCard";
import DashboardRecentActivity from "@/components/member/dashboard/DashboardRecentActivity";
import DashboardQuickLinks from "@/components/member/dashboard/DashboardQuickLinks";

type FollowState = "followed" | "not_followed" | "unknown";
type FollowStatusesResponse = {
  authenticated?: boolean;
  linked?: boolean;
  reason?: string;
  statuses?: Record<string, { state?: FollowState }>;
};

type RaidFaitRow = {
  raiderTwitchLogin?: string;
  targetTwitchLogin?: string;
  target?: string;
  targetDisplayName?: string;
  date?: string;
  count?: number;
};

export default function MemberDashboardPage() {
  const router = useRouter();
  const { data, loading, error } = useMemberOverview();
  const { goals: memberGoals } = useMemberMonthlyGoals(data?.monthKey || "");

  const [raidsForMonth, setRaidsForMonth] = useState(0);
  const [recentRaids, setRecentRaids] = useState<RecentRaidEntry[]>([]);
  const [floatingCtaDismissed, setFloatingCtaDismissed] = useState(false);
  const [followStats, setFollowStats] = useState<FollowStats>({
    loading: true,
    authenticated: false,
    linked: false,
    total: 0,
    followed: 0,
    score: 0,
  });

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
          (raid: RaidFaitRow) =>
            String(raid.raiderTwitchLogin || "").toLowerCase() === twitch.toLowerCase(),
        ) as RaidFaitRow[];
        const total = mine.reduce((sum, raid) => sum + (raid.count || 1), 0);
        const sorted = [...mine].sort(
          (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
        );
        const raids = sorted.slice(0, 12).map((raid) => ({
          targetLogin: String(raid.targetTwitchLogin || raid.target || "").toLowerCase(),
          targetDisplayName: raid.targetDisplayName,
          date: raid.date || new Date().toISOString(),
          count: raid.count || 1,
        }));
        if (!cancelled) {
          setRaidsForMonth(total);
          setRecentRaids(raids);
        }
      } catch {
        if (!cancelled) {
          setRaidsForMonth(0);
          setRecentRaids([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data?.monthKey, data?.member?.twitchLogin]);

  useEffect(() => {
    const monthKey = data?.monthKey;
    if (!monthKey) return;
    try {
      const dismissed = window.localStorage.getItem(
        `tenf:dashboard:floating-cta-dismissed:${monthKey}`,
      );
      setFloatingCtaDismissed(dismissed === "1");
    } catch {
      /* silent */
    }
  }, [data?.monthKey]);

  useEffect(() => {
    if (loading || !data?.member) return;
    const onboardingStatus = String(data.member.onboardingStatus || "").toLowerCase();
    const login = String(data.member.twitchLogin || "").toLowerCase();
    const role = String(data.member.role || "").toLowerCase();
    const profileValidationStatus = String(
      data.member.profileValidationStatus || "",
    ).toLowerCase();
    const isPlaceholder = login.startsWith("nouveau_") || login.startsWith("nouveau-");
    const isNewUnvalidated = role.includes("nouveau") && profileValidationStatus === "non_soumis";
    if (onboardingStatus === "a_faire" || isPlaceholder || isNewUnvalidated) {
      router.replace("/member/profil/completer?onboarding=1");
    }
  }, [data, loading, router]);

  const model = useMemo(() => {
    if (!data) return null;
    return buildMemberDashboardModel({
      data,
      goals: memberGoals,
      followStats,
      dataV2RaidsThisMonth: raidsForMonth,
      recentRaids,
    });
  }, [data, memberGoals, followStats, raidsForMonth, recentRaids]);

  if (loading) {
    return (
      <DashboardSkeleton />
    );
  }

  if (error || !data || !model) {
    return (
      <MemberBentoShell>
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
      </MemberBentoShell>
    );
  }

  return (
    <MemberBentoShell accentHex={model.accent}>
      <DashboardNotificationsStrip />

      <MemberBentoRow>
        <MemberBentoCell span={8}>
          <DashboardHero model={model} />
        </MemberBentoCell>
        <MemberBentoCell span={4}>
          <MonthlyOverviewCards model={model} variant="sidebar" />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={7}>
          <NextActionCard model={model} />
        </MemberBentoCell>
        <MemberBentoCell span={5}>
          <LiveNetworkCard model={model} variant="compact" />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={5}>
          <DashboardRecentActivity model={model} />
        </MemberBentoCell>
        <MemberBentoCell span={4}>
          <EventsPreviewCard model={model} variant="compact" />
        </MemberBentoCell>
        <MemberBentoCell span={3}>
          {model.showRecognitionStats ? (
            <RecognitionCard model={model} variant="compact" />
          ) : (
            <DashboardQuickLinks model={model} />
          )}
        </MemberBentoCell>
      </MemberBentoRow>

      {model.showFloatingCta && !floatingCtaDismissed ? (
        <div className="pointer-events-none fixed bottom-4 left-3 right-3 z-40 md:hidden">
          <div
            className="pointer-events-auto flex items-stretch gap-2 rounded-full border border-white/15 p-1 shadow-2xl backdrop-blur-md"
            style={{
              backgroundColor: hexToRgba(model.accent, 0.92),
              boxShadow: `0 16px 40px rgba(0,0,0,0.4), 0 0 24px ${hexToRgba(model.accent, 0.25)}`,
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
                    "1",
                  );
                } catch {
                  /* silent */
                }
              }}
              aria-label="Masquer le rappel d'action principale"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1f1a12] transition hover:bg-black/10"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </MemberBentoShell>
  );
}

function DashboardSkeleton() {
  return (
    <MemberBentoShell>
    <div className="w-full animate-pulse flex-col gap-[clamp(0.65rem,1.1vw,1.25rem)] flex">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent lg:col-span-8" />
        <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent lg:col-span-4" />
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-48 rounded-[1.35rem] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent lg:col-span-7" />
        <div className="h-48 rounded-[1.35rem] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent lg:col-span-5" />
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-52 rounded-[1.35rem] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent lg:col-span-5" />
        <div className="h-52 rounded-[1.35rem] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent lg:col-span-4" />
        <div className="h-52 rounded-[1.35rem] border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent lg:col-span-3" />
      </div>
    </div>
    </MemberBentoShell>
  );
}
