"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import RaidHistoryHero from "@/components/member/raids/RaidHistoryHero";
import { buildRaidHistoryHeroModel } from "@/components/member/raids/raidHistoryModel";
import RaidHistorySubNav from "@/components/member/raids/RaidHistorySubNav";
import RaidHistoryMonthPanel from "@/components/member/raids/RaidHistoryMonthPanel";
import RaidHistoryPilotagePanel from "@/components/member/raids/RaidHistoryPilotagePanel";
import RaidHistoryTrendPanel from "@/components/member/raids/RaidHistoryTrendPanel";
import RaidHistoryTimelinePanel from "@/components/member/raids/RaidHistoryTimelinePanel";
import RaidHistoryGratitudePanel from "@/components/member/raids/RaidHistoryGratitudePanel";
import RaidHistoryCulturePanel from "@/components/member/raids/RaidHistoryCulturePanel";
import {
  computeTargetBreakdown,
  getPreviousMonthKey,
  type RaidHubSummary,
} from "@/components/member/raids/raidHubStatsUtils";
import { useRaidHubStats } from "@/components/member/raids/useRaidHubStats";
import { MemberAlert } from "@/components/member/dashboard/dashboardUi";
import {
  getCurrentMonthKey,
  normalizeRaidSearch,
  RAID_HISTORY_ACCENT,
  type RaidEntry,
  type RaidFilter,
  type RaidHistoryResponse,
  type ReturnPendingMeta,
  type ReturnPendingSuggestion,
} from "@/components/member/raids/raidHistoryUtils";

export default function MemberRaidHistoryPage() {
  const { data: overview } = useMemberOverview();
  const { history: hubHistory, loading: hubLoading } = useRaidHubStats(overview?.member.twitchLogin);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [months, setMonths] = useState<string[]>([]);
  const [raids, setRaids] = useState<RaidEntry[]>([]);
  const [summary, setSummary] = useState<RaidHistoryResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [raidFilter, setRaidFilter] = useState<RaidFilter>("all");
  const [expandedRaidId, setExpandedRaidId] = useState<string | null>(null);
  const [returnSuggestions, setReturnSuggestions] = useState<ReturnPendingSuggestion[]>([]);
  const [returnMeta, setReturnMeta] = useState<ReturnPendingMeta | null>(null);
  const [returnLoading, setReturnLoading] = useState(true);
  const [returnError, setReturnError] = useState("");
  const [timelineQuery, setTimelineQuery] = useState("");

  const loadReturnSuggestions = useCallback(async () => {
    setReturnLoading(true);
    setReturnError("");
    try {
      const res = await fetch("/api/members/me/raid-suggestions/return-pending", {
        cache: "no-store",
        credentials: "include",
      });
      const body = (await res.json()) as {
        suggestions?: ReturnPendingSuggestion[];
        meta?: ReturnPendingMeta;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error || "Impossible de charger les suggestions.");
      setReturnSuggestions(body.suggestions || []);
      setReturnMeta(body.meta || null);
    } catch (e) {
      setReturnError(e instanceof Error ? e.message : "Erreur réseau.");
      setReturnSuggestions([]);
      setReturnMeta(null);
    } finally {
      setReturnLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReturnSuggestions();
  }, [loadReturnSuggestions]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash !== "raid-pilotage" && hash !== "raid-trends") return;
    window.requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    (async () => {
      setLoading(true);
      try {
        setError("");
        const response = await fetch(`/api/members/me/raids-history?month=${encodeURIComponent(selectedMonth)}`, {
          cache: "no-store",
          credentials: "include",
        });
        const body = (await response.json()) as RaidHistoryResponse & { error?: string };
        if (!response.ok) {
          if (response.status === 401) throw new Error("Tu dois être connecté pour voir ton historique.");
          if (response.status === 404) throw new Error("Profil membre introuvable. Contacte un admin TENF.");
          throw new Error(body.error || "Impossible de charger l'historique.");
        }
        setRaids(body.entries || []);
        setSummary(body.summary || null);
        setMonths(body.months || []);
        setExpandedRaidId(null);
        setRaidFilter("all");
        setTimelineQuery("");
      } finally {
        setLoading(false);
      }
    })().catch((e) => {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
      setRaids([]);
      setSummary(null);
      setMonths([]);
      setLoading(false);
    });
  }, [selectedMonth]);

  const monthOptions = months.length > 0 ? months : [selectedMonth];

  const filteredRaids = useMemo(() => {
    let list = raidFilter === "all" ? raids : raids.filter((r) => r.raidStatus === raidFilter);
    const q = normalizeRaidSearch(timelineQuery);
    if (q) {
      list = list.filter(
        (r) =>
          normalizeRaidSearch(r.targetLabel).includes(q) ||
          normalizeRaidSearch(r.targetLogin || "").includes(q),
      );
    }
    return list;
  }, [raids, raidFilter, timelineQuery]);

  const validationRate = useMemo(() => {
    const t = summary?.total ?? 0;
    const v = summary?.validated ?? 0;
    if (t <= 0) return 0;
    return Math.round((v / t) * 100);
  }, [summary]);

  const filterButtons = useMemo(
    () => [
      { id: "all" as const, label: "Tout", count: summary?.total ?? raids.length },
      { id: "validated" as const, label: "Validés", count: summary?.validated ?? 0 },
      { id: "pending" as const, label: "En cours", count: summary?.pending ?? 0 },
      { id: "rejected" as const, label: "Non retenus", count: summary?.rejected ?? 0 },
    ],
    [summary, raids.length],
  );

  const heroModel = useMemo(
    () =>
      buildRaidHistoryHeroModel({
        displayName: overview?.member.displayName,
        twitchLogin: overview?.member.twitchLogin,
        selectedMonth,
        totalMonth: summary?.total ?? 0,
        validatedMonth: summary?.validated ?? 0,
        pendingMonth: summary?.pending ?? 0,
        rejectedMonth: summary?.rejected ?? 0,
        validationRate,
        raidsTotalAllTime: overview?.stats.raidsTotal,
      }),
    [overview, selectedMonth, summary, validationRate],
  );

  const hubSummary = useMemo<RaidHubSummary>(() => {
    return hubHistory.find((entry) => entry.monthKey === selectedMonth)?.summary ?? {
      sent: 0,
      uniqueTargets: 0,
      topTarget: null,
    };
  }, [hubHistory, selectedMonth]);

  const previousMonthSent = useMemo(() => {
    return hubHistory.find((entry) => entry.monthKey === getPreviousMonthKey(selectedMonth))?.summary.sent ?? 0;
  }, [hubHistory, selectedMonth]);

  const targetBreakdown = useMemo(() => {
    const sentRaids = hubHistory.find((entry) => entry.monthKey === selectedMonth)?.sentRaids ?? [];
    return computeTargetBreakdown(sentRaids);
  }, [hubHistory, selectedMonth]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRaidId((prev) => (prev === id ? null : id));
  }, []);

  if (loading && !summary && raids.length === 0 && !error) {
    return (
      <MemberBentoShell accentHex={RAID_HISTORY_ACCENT}>
        <RaidHistorySkeleton />
      </MemberBentoShell>
    );
  }

  return (
    <MemberBentoShell accentHex={RAID_HISTORY_ACCENT}>
      {error ? <MemberAlert variant="error">{error}</MemberAlert> : null}

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <RaidHistoryHero
            model={heroModel}
            totalMonth={summary?.total ?? 0}
            validatedMonth={summary?.validated ?? 0}
            validationRate={validationRate}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <RaidHistorySubNav />

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <RaidHistoryMonthPanel
            selectedMonth={selectedMonth}
            monthOptions={monthOptions}
            onMonthChange={setSelectedMonth}
            summary={summary}
            validationRate={validationRate}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <RaidHistoryPilotagePanel
            selectedMonth={selectedMonth}
            hubSummary={hubSummary}
            previousMonthSent={previousMonthSent}
            hubLoading={hubLoading}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <RaidHistoryTrendPanel
            selectedMonth={selectedMonth}
            onMonthSelect={setSelectedMonth}
            history={hubHistory}
            loading={hubLoading}
            targetBreakdown={targetBreakdown}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={8}>
          <RaidHistoryTimelinePanel
            loading={loading}
            raids={raids}
            filteredRaids={filteredRaids}
            raidFilter={raidFilter}
            onFilterChange={setRaidFilter}
            filterButtons={filterButtons}
            timelineQuery={timelineQuery}
            onQueryChange={setTimelineQuery}
            expandedRaidId={expandedRaidId}
            onToggleExpand={toggleExpand}
          />
        </MemberBentoCell>
        <MemberBentoCell span={4}>
          <RaidHistoryGratitudePanel
            suggestions={returnSuggestions}
            meta={returnMeta}
            loading={returnLoading}
            error={returnError}
            onRefresh={() => void loadReturnSuggestions()}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <RaidHistoryCulturePanel />
        </MemberBentoCell>
      </MemberBentoRow>
    </MemberBentoShell>
  );
}

function RaidHistorySkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-3">
      <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-11 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-36 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-52 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-64 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-80 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-8" />
        <div className="h-80 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-4" />
      </div>
      <div className="h-40 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
    </div>
  );
}
