"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import { MemberAlert } from "@/components/member/dashboard/dashboardUi";
import ActivityHero from "@/components/member/activity/ActivityHero";
import ActivitySubNav from "@/components/member/activity/ActivitySubNav";
import ActivityStatsPanel from "@/components/member/activity/ActivityStatsPanel";
import ActivityCategoriesPanel from "@/components/member/activity/ActivityCategoriesPanel";
import ActivityMonthEventsPanel from "@/components/member/activity/ActivityMonthEventsPanel";
import ActivityTrendPanel from "@/components/member/activity/ActivityTrendPanel";
import ActivityUpcomingPanel from "@/components/member/activity/ActivityUpcomingPanel";
import ActivityGuidancePanel from "@/components/member/activity/ActivityGuidancePanel";
import {
  buildActivityGuidanceModel,
  buildActivityHeroModel,
  resolveActivityRhythmProfile,
} from "@/components/member/activity/activityModel";
import { ACTIVITY_ACCENT } from "@/components/member/activity/activityUtils";
import { useMemberActivityPage } from "@/components/member/activity/useMemberActivityPage";

export default function MemberMonthlyActivityPage() {
  const { data, loading, error: overviewError } = useMemberOverview();
  const { metrics } = useMemberActivityPage(data);

  const heroModel = useMemo(() => {
    if (!data || !metrics) return null;
    return buildActivityHeroModel({
      overview: data,
      intensityScore: metrics.intensityScore,
      raidsLive: metrics.raidsLive,
      attendedThisMonth: metrics.attendedThisMonth,
      trackedThisMonth: metrics.trackedThisMonth,
    });
  }, [data, metrics]);

  const guidanceModel = useMemo(() => {
    if (!data || !metrics || !heroModel) return null;
    const profile = resolveActivityRhythmProfile({
      intensityScore: metrics.intensityScore,
      raidsLive: metrics.raidsLive,
      eventPresences: metrics.stats.eventPresencesThisMonth ?? 0,
      participation: metrics.stats.participationThisMonth ?? 0,
      attendedThisMonth: metrics.attendedThisMonth,
    });
    return buildActivityGuidanceModel({
      firstName: heroModel.firstName,
      profile,
      upcomingCount: metrics.upcoming.length,
    });
  }, [data, metrics, heroModel]);

  function scrollToEvents() {
    document.getElementById("activity-events")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!loading && overviewError) {
    return (
      <MemberBentoShell accentHex={ACTIVITY_ACCENT}>
        <MemberAlert variant="error">
          {overviewError}{" "}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-1 inline-flex items-center gap-1 underline underline-offset-2"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Réessayer
          </button>
        </MemberAlert>
      </MemberBentoShell>
    );
  }

  if (loading || !data || !metrics || !heroModel || !guidanceModel) {
    return (
      <MemberBentoShell accentHex={ACTIVITY_ACCENT}>
        <ActivityPageSkeleton />
      </MemberBentoShell>
    );
  }

  return (
    <MemberBentoShell accentHex={ACTIVITY_ACCENT}>
      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <ActivityHero
            model={heroModel}
            monthKey={metrics.monthKey}
            intensityScore={metrics.intensityScore}
            raidsTotal={metrics.stats.raidsTotal ?? 0}
            attendedThisMonth={metrics.attendedThisMonth}
            trackedThisMonth={metrics.trackedThisMonth}
            vipActive={Boolean(data.vip?.activeThisMonth)}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <ActivitySubNav />

      <MemberBentoRow>
        <MemberBentoCell span={8}>
          <ActivityStatsPanel
            raidsLive={metrics.raidsLive}
            eventPresences={metrics.stats.eventPresencesThisMonth ?? 0}
            participation={metrics.stats.participationThisMonth ?? 0}
            formationsThisMonth={metrics.formationsThisMonth}
            formationsTotal={metrics.stats.formationsValidated ?? 0}
          />
          <ActivityCategoriesPanel rows={metrics.categoryBreakdown} onScrollToEvents={scrollToEvents} />
          <ActivityMonthEventsPanel
            monthKey={metrics.monthKey}
            events={metrics.monthEvents}
            discordPointsAvailable={metrics.discordPointsAvailable}
          />
          <ActivityTrendPanel monthlyHistory={metrics.monthlyHistory} />
          <ActivityUpcomingPanel upcoming={metrics.upcoming} />
        </MemberBentoCell>
        <MemberBentoCell span={4}>
          <ActivityGuidancePanel model={guidanceModel} />
        </MemberBentoCell>
      </MemberBentoRow>
    </MemberBentoShell>
  );
}

function ActivityPageSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-3">
      <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-11 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-[32rem] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-8" />
        <div className="h-[32rem] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-4" />
      </div>
    </div>
  );
}
