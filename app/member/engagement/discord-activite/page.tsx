"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import { MemberAlert } from "@/components/member/dashboard/dashboardUi";
import DiscordActivityHero from "@/components/member/engagement/discord-activity/DiscordActivityHero";
import DiscordActivitySubNav from "@/components/member/engagement/discord-activity/DiscordActivitySubNav";
import DiscordActivityStatsPanel from "@/components/member/engagement/discord-activity/DiscordActivityStatsPanel";
import DiscordActivityChartsPanel from "@/components/member/engagement/discord-activity/DiscordActivityChartsPanel";
import DiscordActivityTimelinePanel from "@/components/member/engagement/discord-activity/DiscordActivityTimelinePanel";
import DiscordActivityGuidancePanel, {
  DiscordActivityFaqPanel,
} from "@/components/member/engagement/discord-activity/DiscordActivityGuidancePanel";
import DiscordActivityEmptyPanel from "@/components/member/engagement/discord-activity/DiscordActivityEmptyPanel";
import {
  buildDiscordActivityGuidanceModel,
  buildDiscordActivityHeroModel,
  resolveProfileFromData,
} from "@/components/member/engagement/discord-activity/discordActivityModel";
import {
  computeDiscordTotals,
  DISCORD_ACTIVITY_ACCENT,
  filterAndSortMonths,
  resolveLoadState,
  type DiscordActivitySortMode,
  type DiscordMonthRow,
} from "@/components/member/engagement/discord-activity/discordActivityUtils";

export default function MemberDiscordActivitePage() {
  const { data: overview } = useMemberOverview();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [twitchLogin, setTwitchLogin] = useState("");
  const [months, setMonths] = useState<DiscordMonthRow[]>([]);
  const [onlyActiveMonths, setOnlyActiveMonths] = useState(false);
  const [sortMode, setSortMode] = useState<DiscordActivitySortMode>("recent");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/members/me/discord-activity", {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Chargement impossible");
      }
      setDisplayName(typeof json.displayName === "string" ? json.displayName : "");
      setTwitchLogin(typeof json.twitchLogin === "string" ? json.twitchLogin : "");
      setMonths(Array.isArray(json.months) ? json.months : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setMonths([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => computeDiscordTotals(months), [months]);
  const loadState = useMemo(
    () => resolveLoadState({ loading, error, months }),
    [loading, error, months],
  );
  const filteredMonths = useMemo(
    () => filterAndSortMonths(months, onlyActiveMonths, sortMode),
    [months, onlyActiveMonths, sortMode],
  );
  const maxMessages = useMemo(() => Math.max(1, ...months.map((row) => row.messages)), [months]);
  const maxVocalMinutes = useMemo(() => Math.max(1, ...months.map((row) => row.vocalMinutes)), [months]);

  const heroModel = useMemo(
    () =>
      buildDiscordActivityHeroModel({
        overview,
        displayName: displayName || overview?.member.displayName || "",
        twitchLogin: twitchLogin || overview?.member.twitchLogin || "",
        loadState,
        totals,
        months,
      }),
    [overview, displayName, twitchLogin, loadState, totals, months],
  );

  const profile = useMemo(() => resolveProfileFromData(totals, months), [totals, months]);

  const guidanceModel = useMemo(
    () => buildDiscordActivityGuidanceModel({ profile, loadState, firstName: heroModel.firstName }),
    [profile, loadState, heroModel.firstName],
  );

  const showDataPanels = loadState === "ready";

  if (loading && months.length === 0 && !error) {
    return (
      <MemberBentoShell accentHex={DISCORD_ACTIVITY_ACCENT}>
        <DiscordActivitySkeleton />
      </MemberBentoShell>
    );
  }

  return (
    <MemberBentoShell accentHex={DISCORD_ACTIVITY_ACCENT}>
      {error ? (
        <MemberAlert variant="error">
          {error}{" "}
          <button type="button" onClick={() => void load()} className="ml-1 underline underline-offset-2">
            Réessayer
          </button>
        </MemberAlert>
      ) : null}

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <DiscordActivityHero
            model={heroModel}
            displayName={displayName || overview?.member.displayName || ""}
            twitchLogin={twitchLogin || overview?.member.twitchLogin || ""}
            totalMessages={totals.totalMessages}
            totalVocalHours={totals.totalVocalHours}
            activeMonthCount={totals.activeMonthCount}
            loading={loading}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <DiscordActivitySubNav />

      <MemberBentoRow>
        <MemberBentoCell span={8}>
          {showDataPanels ? (
            <>
              <DiscordActivityStatsPanel
                totals={totals}
                sortMode={sortMode}
                onSortModeChange={setSortMode}
                onlyActiveMonths={onlyActiveMonths}
                onOnlyActiveMonthsChange={setOnlyActiveMonths}
                filteredCount={filteredMonths.length}
              />
              <DiscordActivityChartsPanel months={months} onlyActiveMonths={onlyActiveMonths} />
              <DiscordActivityTimelinePanel
                rows={filteredMonths}
                maxMessages={maxMessages}
                maxVocalMinutes={maxVocalMinutes}
              />
              <DiscordActivityFaqPanel />
            </>
          ) : loadState === "empty" || loadState === "unmatched" ? (
            <DiscordActivityEmptyPanel variant={loadState === "unmatched" ? "unmatched" : "empty"} />
          ) : null}
        </MemberBentoCell>
        <MemberBentoCell span={4}>
          <DiscordActivityGuidancePanel model={guidanceModel} />
        </MemberBentoCell>
      </MemberBentoRow>
    </MemberBentoShell>
  );
}

function DiscordActivitySkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-3">
      <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-11 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-96 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-8" />
        <div className="h-96 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-4" />
      </div>
    </div>
  );
}
