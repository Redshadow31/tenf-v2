"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  calculateTotalAvecBonus,
  calculateTotalHorsBonus,
  FINAL_SCORE_MAX,
  calculateSeniority,
  resolveVipThresholdForMember,
  SURVEILLER_FINAL_SCORE_THRESHOLD,
} from "@/lib/evaluationSynthesisHelpers";
import {
  calculateEngagementAverageBonusWithFollowPolicy,
  FOLLOW_NEUTRAL_POINTS,
  FOLLOW_POLICY_SUMMARY,
} from "@/lib/evaluationFollowPolicy";
import {
  buildCommunityEventPresenceIndex,
  COMMUNITY_EVENT_MAX_POINTS,
  ENTRAIDE_SCORE_MAX,
  getCommunityEventPointsForLogin,
} from "@/lib/evaluationCommunityEvents";
import { calculateBonusTotal, TIMEZONE_BONUS_POINTS, type MemberBonus } from "@/lib/evaluationBonusHelpers";
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";
import EvaluationDPageHeader from "@/components/admin/evaluation-d/EvaluationDPageHeader";
import EvaluationDPageAside from "@/components/admin/evaluation-d/EvaluationDPageAside";
import EvaluationDKpiStrip, { type EvaluationDKpiAction } from "@/components/admin/evaluation-d/EvaluationDKpiStrip";
import EvaluationDStaffGuide from "@/components/admin/evaluation-d/EvaluationDStaffGuide";
import EvaluationDToolbar from "@/components/admin/evaluation-d/EvaluationDToolbar";
import EvaluationDTabNav from "@/components/admin/evaluation-d/EvaluationDTabNav";
import EvaluationDPilotageView from "@/components/admin/evaluation-d/EvaluationDPilotageView";
import EvaluationDBaremePanel from "@/components/admin/evaluation-d/EvaluationDBaremePanel";
import EvaluationDHistoryPanel from "@/components/admin/evaluation-d/EvaluationDHistoryPanel";
import { EvaluationDPanel } from "@/components/admin/evaluation-d/EvaluationDPanel";
import EvaluationDTableFitContainer from "@/components/admin/evaluation-d/EvaluationDTableFitContainer";
import EvaluationDLegend from "@/components/admin/evaluation-d/EvaluationDLegend";
import EvaluationDSortableTh from "@/components/admin/evaluation-d/EvaluationDSortableTh";
import EvaluationDTrendCell from "@/components/admin/evaluation-d/EvaluationDTrendCell";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import { buildEvaluationDCopyModel, EVAL_D_LOADING_COPY } from "@/lib/admin/evaluation-d/evaluationDCopyModel";
import {
  computeThreeMonthTrend,
  computeTrendDelta,
  fetchTrendBaselinesMaps,
  resolveRetainedFinalScore,
  resolveSavedManualFinalNote,
  type MonthFinalScoreEntry,
} from "@/lib/admin/evaluation-d/evaluationDMonthScores";
import {
  formatCommunityPassageHint,
  resolveCommunityPassage,
  resolveEvaluationAutoSignal,
  type EvaluationAutoSignal,
} from "@/lib/admin/evaluation-d/evaluationDCommunityPassage";
import {
  getDefaultSortDirection,
  sortEvaluationDMembers,
  type EvaluationDSortColumn,
  type EvaluationDSortDirection,
} from "@/lib/admin/evaluation-d/evaluationDTableSort";
import { EVAL_D_TABLE_GROUPS as G } from "@/lib/admin/evaluation-d/evaluationDTableGroups";
import {
  evalDBtnPrimaryClass,
  evalDBtnSuccessClass,
  evalDFocusRing,
  evalDTableCheckboxClass,
  evalDTableGroupClass,
  evalDTableHeadClass,
  evalDTableInputCompactClass,
  evalDTableShellClass,
  evalDTableTdClass,
  evalDTableTdMutedClass,
} from "@/lib/admin/evaluation-d/evaluationDStyles";
import type {
  EvaluationDPreset,
  EvaluationDTab,
  FinalNoteRecord,
  GeneralStats,
  MemberEvaluationData,
  OverrideLog,
} from "@/lib/admin/evaluation-d/evaluationDTypes";

type TrendBaselinesState = {
  m1: Record<string, MonthFinalScoreEntry>;
  m2: Record<string, MonthFinalScoreEntry>;
  m3: Record<string, MonthFinalScoreEntry>;
};

/** Limite la taille d’un POST (snapshots) pour limiter 413 / timeouts sur l’hébergeur. */
const SYNTHESIS_SNAPSHOT_CHUNK_SIZE = 350;

function synthesisSaveErrorMessage(
  status: number,
  bodyText: string,
  parsed: Record<string, unknown>
): string {
  const e = parsed.error;
  const m = parsed.message;
  const d = parsed.details;
  if (typeof e === "string" && e.trim()) return e;
  if (typeof m === "string" && m.trim()) return m;
  if (typeof d === "string" && d.trim()) return d;
  const snippet = bodyText.replace(/\s+/g, " ").trim().slice(0, 180);
  if (snippet) return `HTTP ${status}: ${snippet}`;
  return `HTTP ${status}`;
}

// ============================================
// PAGE
// ============================================

export default function EvaluationDPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  
  const [membersData, setMembersData] = useState<MemberEvaluationData[]>([]);
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const trendsRequestRef = useRef(0);
  const overridesRequestRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<EvaluationDPreset>("all");
  const [sortColumn, setSortColumn] = useState<EvaluationDSortColumn>("membre");
  const [sortDirection, setSortDirection] = useState<EvaluationDSortDirection>("asc");
  const [activeTab, setActiveTab] = useState<EvaluationDTab>("pilotage");
  const [compactMode, setCompactMode] = useState(false);
  const [showAdvancedColumns, setShowAdvancedColumns] = useState(false);
  
  // États pour les bonus (édition en ligne)
  const [editingBonuses, setEditingBonuses] = useState<Record<string, { timezone: boolean; moderation: number }>>({});
  
  // États pour les notes finales manuelles et statuts (édition en ligne)
  const [editingFinalNotes, setEditingFinalNotes] = useState<Record<string, number | null>>({});
  const [editingFinalNoteReasons, setEditingFinalNoteReasons] = useState<Record<string, string>>({});
  const [editingStatuses, setEditingStatuses] = useState<Record<string, boolean>>({});
  const [editingRoles, setEditingRoles] = useState<Record<string, string>>({}); // Pour forcer Communauté/VIP
  const [editingVips, setEditingVips] = useState<Record<string, boolean>>({}); // Pour forcer VIP (isVip)
  /** Empêche le passage auto Communauté (3 mois < 5) à l'enregistrement. */
  const [followUnknownCount, setFollowUnknownCount] = useState(0);
  const [editingKeepActive, setEditingKeepActive] = useState<Record<string, boolean>>({});
  const [currentMonthFinalNotes, setCurrentMonthFinalNotes] = useState<Record<string, FinalNoteRecord>>({});
  const [trendBaselines, setTrendBaselines] = useState<TrendBaselinesState>({ m1: {}, m2: {}, m3: {} });
  const [overrideLogs, setOverrideLogs] = useState<OverrideLog[]>([]);
  const [staffDisplayName, setStaffDisplayName] = useState("Staff TENF");
  const [staffRawRole, setStaffRawRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const [roleResponse, selfResponse] = await Promise.all([
          fetch("/api/user/role"),
          fetch("/api/admin/access/self", { cache: "no-store" }).catch(() => null),
        ]);
        if (selfResponse?.ok) {
          const self = await selfResponse.json();
          if (typeof self.displayName === "string" && self.displayName.trim()) {
            setStaffDisplayName(self.displayName.trim());
          }
          if (self.rawRole || self.role) {
            setStaffRawRole(String(self.rawRole || self.role));
          }
        }
        if (roleResponse.ok) {
          const data = await roleResponse.json();
          setHasAccess(data.hasAdminAccess === true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Erreur vérification accès:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess && selectedMonth) {
      loadAllData();
    }
  }, [hasAccess, selectedMonth]);

  useEffect(() => {
    if (!hasAccess || activeTab !== "historique" || !selectedMonth) return;
    void loadOverrideLogs(selectedMonth);
  }, [hasAccess, activeTab, selectedMonth]);

  async function loadOverrideLogs(monthKey: string) {
    const requestId = ++overridesRequestRef.current;
    try {
      const response = await fetch(
        `/api/evaluations/synthesis/overrides?month=${monthKey}&limit=200`,
        { cache: "no-store" }
      );
      if (!response.ok || requestId !== overridesRequestRef.current) return;
      const data = await response.json();
      setOverrideLogs(data.logs || []);
    } catch (error) {
      console.error("Erreur chargement historique overrides:", error);
    }
  }

  async function loadTrendBaselinesInBackground(
    monthKey: string,
    allMembers: Array<{ twitchLogin?: string }>,
    evaluationSnapshot: MemberEvaluationData[]
  ) {
    const requestId = ++trendsRequestRef.current;
    setTrendsLoading(true);
    setTrendBaselines({ m1: {}, m2: {}, m3: {} });
    try {
      const baselines = await fetchTrendBaselinesMaps(monthKey, allMembers);
      if (requestId !== trendsRequestRef.current) return;
      setTrendBaselines(baselines);

      const spotlightTotal = evaluationSnapshot[0]?.spotlightTotal ?? 0;
      const eventsTotal = evaluationSnapshot[0]?.eventsTotal ?? 0;
      calculateGeneralStats(
        evaluationSnapshot,
        eventsTotal,
        spotlightTotal,
        monthKey,
        baselines
      );
      setMembersData((prev) =>
        prev.map((member) => {
          const login = member.twitchLogin?.toLowerCase() || "";
          const autoSignal = resolveEvaluationAutoSignal(
            member.finalScore,
            member.createdAt,
            monthKey,
            login,
            baselines
          );
          const autoStatus =
            autoSignal === "vip"
              ? "vip"
              : autoSignal === "surveiller" || autoSignal === "passage_communaute"
                ? "surveiller"
                : "neutre";
          return { ...member, autoSignal, autoStatus };
        })
      );
    } catch (error) {
      console.error("Erreur chargement tendances M-1/M-2/M-3:", error);
    } finally {
      if (requestId === trendsRequestRef.current) {
        setTrendsLoading(false);
      }
    }
  }

  async function loadAllData() {
    if (!selectedMonth) return;
    
    setLoadingData(true);
    setOverrideLogs([]);
    try {
      const [
        membersResponse,
        raidsPointsResponse,
        discordPointsResponse,
        eventsResponse,
        followResponse,
        bonusesResponse,
        currentFinalNotesResponse,
      ] = await Promise.all([
        fetch("/api/admin/members", { cache: 'no-store' }),
        fetch(`/api/evaluations/raids/points?month=${selectedMonth}`, { cache: 'no-store' }),
        fetch(`/api/evaluations/discord/points?month=${selectedMonth}`, { cache: 'no-store' }),
        fetch(`/api/admin/events/presence?month=${selectedMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ events: [] }) })),
        fetch(`/api/evaluations/follow/points?month=${selectedMonth}`, { cache: 'no-store' }).catch(() => ({ ok: false, json: () => ({ points: {} }) })),
        fetch(`/api/evaluations/bonus?month=${selectedMonth}`, { cache: 'no-store' }),
        fetch(`/api/evaluations/synthesis/save?month=${selectedMonth}`, { cache: "no-store" }).catch(() => ({ ok: false, json: () => ({ finalNotes: {} }) })),
      ]);

      // Parser les réponses
      const membersData: any[] = membersResponse.ok ? (await membersResponse.json()).members || [] : [];
      const raidsPayload = raidsPointsResponse.ok ? await raidsPointsResponse.json() : {};
      const raidsPointsData = raidsPayload.points || {};
      const raidsStatsByLogin: Record<string, { done: number; received: number }> =
        raidsPayload.statsByLogin && typeof raidsPayload.statsByLogin === "object"
          ? raidsPayload.statsByLogin
          : {};
      const discordPointsData = discordPointsResponse.ok ? (await discordPointsResponse.json()).points || {} : {};
      const eventsData = eventsResponse.ok ? await eventsResponse.json() : { events: [] };
      const followPayload = followResponse.ok ? await followResponse.json() : {};
      const followPointsData = followPayload.points || {};
      const followStatusByLogin: Record<string, "measured" | "unknown"> =
        followPayload.statusByLogin && typeof followPayload.statusByLogin === "object"
          ? followPayload.statusByLogin
          : {};
      const followRawPointsData: Record<string, number> =
        followPayload.rawPoints && typeof followPayload.rawPoints === "object"
          ? followPayload.rawPoints
          : {};
      setFollowUnknownCount(
        typeof followPayload.followPolicy?.unknownCount === "number"
          ? followPayload.followPolicy.unknownCount
          : Object.values(followStatusByLogin).filter((s) => s === "unknown").length
      );
      const bonusesData = bonusesResponse.ok ? (await bonusesResponse.json()).bonuses || {} : {};
      const currentFinalNotesData = currentFinalNotesResponse.ok ? await currentFinalNotesResponse.json() : { finalNotes: {} };
      const normalizedCurrentFinalNotes: Record<string, FinalNoteRecord> = {};
      for (const [key, record] of Object.entries(currentFinalNotesData.finalNotes || {})) {
        if (!record || typeof record !== "object") continue;
        normalizedCurrentFinalNotes[key.toLowerCase()] = record as FinalNoteRecord;
      }
      setCurrentMonthFinalNotes(normalizedCurrentFinalNotes);

      // Construire les données d'évaluation pour tous les membres (actifs ET inactifs/Communauté)
      const evaluationData: MemberEvaluationData[] = [];
      
      // Inclure TOUS les membres (actifs et inactifs/Communauté)
      const allMembers = membersData.filter((m: any) => m.twitchLogin);

      // Créer des maps pour accès rapide
      const spotlightPointsMap = new Map<string, number>();
      const raidsPointsMap = new Map<string, number>();
      const raidsStatsMap = new Map<string, { done: number; received: number }>();
      Object.entries(raidsStatsByLogin).forEach(([login, stats]) => {
        if (login && stats && typeof stats.done === "number") {
          raidsStatsMap.set(login.toLowerCase(), {
            done: stats.done,
            received: stats.received ?? 0,
          });
        }
      });

      const discordPointsMap = new Map<string, number>();
      const followPointsMap = new Map<string, number>();
      const followRawPointsMap = new Map<string, number>();
      const followStatusMap = new Map<string, "measured" | "unknown">();

      const spotlightEvents = (eventsData.events || []).filter((e: any) => (e.category || "") === "Spotlight");
      const spotlightTotalCount = spotlightEvents.length;
      const spotlightPresencesMap = new Map<string, number>();
      if (spotlightEvents.length > 0) {
        for (const event of spotlightEvents) {
          for (const presence of event.presences || []) {
            const login = presence.twitchLogin?.toLowerCase();
            if (login && presence.present) {
              spotlightPresencesMap.set(login, (spotlightPresencesMap.get(login) || 0) + 1);
            }
          }
        }
        spotlightPresencesMap.forEach((count, login) => {
          const points = Math.round((5 * count / spotlightTotalCount) * 100) / 100;
          spotlightPointsMap.set(login, points);
        });
      }

      if (raidsPointsData && typeof raidsPointsData === "object") {
        Object.entries(raidsPointsData).forEach(([login, points]) => {
          if (login && typeof points === "number") {
            raidsPointsMap.set(login.toLowerCase(), points);
          }
        });
      }

      if (discordPointsData && typeof discordPointsData === "object") {
        Object.entries(discordPointsData).forEach(([login, points]) => {
          if (login && typeof points === "number") {
            discordPointsMap.set(login.toLowerCase(), points);
          }
        });
      }

      if (followPointsData && typeof followPointsData === "object") {
        Object.entries(followPointsData).forEach(([login, points]) => {
          if (login && typeof points === "number") {
            followPointsMap.set(login.toLowerCase(), points);
          }
        });
      }
      if (followRawPointsData && typeof followRawPointsData === "object") {
        Object.entries(followRawPointsData).forEach(([login, points]) => {
          if (login && typeof points === "number") {
            followRawPointsMap.set(login.toLowerCase(), points);
          }
        });
      }
      Object.entries(followStatusByLogin).forEach(([login, status]) => {
        followStatusMap.set(login.toLowerCase(), status);
      });

      const { totalEligibleEvents, presencesByLogin: communityEventPresencesMap } =
        buildCommunityEventPresenceIndex(eventsData.events || []);

      const emptyBaselines: TrendBaselinesState = { m1: {}, m2: {}, m3: {} };

      for (const member of allMembers) {
        const login = member.twitchLogin?.toLowerCase();
        if (!login) continue;

        const spotlightPoints = spotlightPointsMap.get(login) || 0;
        const raidsPoints = raidsPointsMap.get(login) || 0;
        const raidsInfo = raidsStatsMap.get(login) || { done: 0, received: 0 };
        const discordPoints = discordPointsMap.get(login) || 0;
        const eventsPresences = communityEventPresencesMap.get(login) || 0;
        const eventsPoints = getCommunityEventPointsForLogin(login, communityEventPresencesMap, totalEligibleEvents);
        const followPoints = followPointsMap.get(login) || 0;
        const followRawPoints = followRawPointsMap.get(login) ?? followPoints;
        const followEvalStatus = followStatusMap.get(login) ?? "measured";

        const bonusInfo: MemberBonus | null = bonusesData[login] || null;
        const manualBonus = calculateBonusTotal(bonusInfo);
        const engagementAverageBonus = calculateEngagementAverageBonusWithFollowPolicy(
          spotlightPoints,
          discordPoints,
          eventsPoints,
          followPoints,
          followEvalStatus
        );
        const bonusTotal = manualBonus.total + engagementAverageBonus;

        const { total: totalHorsBonus } = calculateTotalHorsBonus(
          spotlightPoints,
          raidsPoints,
          discordPoints,
          eventsPoints,
          followPoints
        );
        const { total: calculatedFinalScore } = calculateTotalAvecBonus(
          totalHorsBonus,
          manualBonus.timezoneBonus,
          manualBonus.moderationBonus,
          engagementAverageBonus
        );
        const manualFinalScore = resolveSavedManualFinalNote(normalizedCurrentFinalNotes, login);
        const finalScore = manualFinalScore ?? calculatedFinalScore;
        const autoSignal = resolveEvaluationAutoSignal(
          finalScore,
          member.createdAt,
          selectedMonth,
          login,
          emptyBaselines
        );
        const autoStatus =
          autoSignal === "vip"
            ? "vip"
            : autoSignal === "surveiller" || autoSignal === "passage_communaute"
              ? "surveiller"
              : "neutre";

        evaluationData.push({
          twitchLogin: member.twitchLogin,
          displayName: member.displayName || member.twitchLogin,
          role: member.role || "Affilié",
          avatar: member.avatar,
          createdAt: member.createdAt,
          isActive: member.isActive !== false,
          isVip: member.isVip || false,
          spotlightPoints,
          raidsPoints,
          discordPoints,
          eventsPoints,
          followPoints,
          followRawPoints,
          followEvalStatus,
          timezoneBonusEnabled: bonusInfo?.timezoneBonusEnabled || false,
          moderationBonus: bonusInfo?.moderationBonus || 0,
          totalHorsBonus,
          bonusTotal,
          finalScore,
          manualFinalNote: manualFinalScore,
          autoStatus,
          autoSignal,
          spotlightPresences: spotlightPresencesMap.get(login) || 0,
          spotlightTotal: spotlightTotalCount,
          raidsDone: raidsInfo.done,
          raidsReceived: raidsInfo.received,
          discordNbMessages: 0,
          discordNbVocalMinutes: 0,
          eventsPresences,
          eventsTotal: totalEligibleEvents,
          followScore: followRawPoints,
        });
      }

      setMembersData(evaluationData);
      calculateGeneralStats(
        evaluationData,
        totalEligibleEvents,
        spotlightTotalCount,
        selectedMonth,
        emptyBaselines
      );
      void loadTrendBaselinesInBackground(selectedMonth, allMembers, evaluationData);

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoadingData(false);
    }
  }

  function calculateGeneralStats(
    data: MemberEvaluationData[],
    eventsTotal: number,
    spotlightTotal: number,
    monthKey: string,
    baselines: TrendBaselinesState
  ) {
    if (data.length === 0) {
      setGeneralStats({
        avgSpotlight: 0,
        avgRaids: 0,
        avgDiscord: 0,
        avgEvents: 0,
        avgFollow: 0,
        avgGeneral: 0,
        scoreGlobalHorsBonus: 0,
        scoreGlobalAvecBonus: 0,
        eventsPresenceRate: 0,
        eventsParticipants: 0,
        spotlightPresenceRate: 0,
        spotlightParticipants: 0,
        vipCount: 0,
        surveillerCount: 0,
      });
      return;
    }
    
    const avgSpotlight = data.reduce((sum, m) => sum + m.spotlightPoints, 0) / data.length;
    const avgRaids = data.reduce((sum, m) => sum + m.raidsPoints, 0) / data.length;
    const avgDiscord = data.reduce((sum, m) => sum + m.discordPoints, 0) / data.length;
    const avgEvents = data.reduce((sum, m) => sum + m.eventsPoints, 0) / data.length;
    const avgFollow = data.reduce((sum, m) => sum + m.followPoints, 0) / data.length;
    const avgGeneral = data.reduce((sum, m) => sum + m.totalHorsBonus, 0) / data.length;
    
    const scoreGlobalHorsBonus = data.reduce((sum, m) => sum + m.totalHorsBonus, 0);
    const scoreGlobalAvecBonus = data.reduce((sum, m) => sum + m.finalScore, 0);
    
    // Présences Events
    const eventsParticipants = new Set(data.filter(m => (m.eventsPresences || 0) > 0).map(m => m.twitchLogin)).size;
    const eventsPresenceRate = data.length > 0 ? (eventsParticipants / data.length) * 100 : 0;
    
    // Présences Spotlight
    const spotlightParticipants = new Set(data.filter(m => (m.spotlightPresences || 0) > 0).map(m => m.twitchLogin)).size;
    const spotlightPresenceRate = data.length > 0 ? (spotlightParticipants / data.length) * 100 : 0;
    
    // VIP / À surveiller (multi-mois + passage Communauté)
    const vipCount = data.filter((m) => {
      const login = m.twitchLogin?.toLowerCase() || "";
      return resolveEvaluationAutoSignal(m.finalScore, m.createdAt, monthKey, login, baselines) === "vip";
    }).length;
    const surveillerCount = data.filter((m) => {
      const login = m.twitchLogin?.toLowerCase() || "";
      const signal = resolveEvaluationAutoSignal(m.finalScore, m.createdAt, monthKey, login, baselines);
      return signal === "surveiller" || signal === "passage_communaute";
    }).length;
    
    setGeneralStats({
      avgSpotlight: Math.round(avgSpotlight * 100) / 100,
      avgRaids: Math.round(avgRaids * 100) / 100,
      avgDiscord: Math.round(avgDiscord * 100) / 100,
      avgEvents: Math.round(avgEvents * 100) / 100,
      avgFollow: Math.round(avgFollow * 100) / 100,
      avgGeneral: Math.round(avgGeneral * 100) / 100,
      scoreGlobalHorsBonus: Math.round(scoreGlobalHorsBonus * 100) / 100,
      scoreGlobalAvecBonus: Math.round(scoreGlobalAvecBonus * 100) / 100,
      eventsPresenceRate: Math.round(eventsPresenceRate * 100) / 100,
      eventsParticipants,
      spotlightPresenceRate: Math.round(spotlightPresenceRate * 100) / 100,
      spotlightParticipants,
      vipCount,
      surveillerCount,
    });
  }

  async function saveAll() {
    setSaving(true);
    try {
      // Sauvegarder les bonus
      if (Object.keys(editingBonuses).length > 0) {
        const bonusUpdates = Object.entries(editingBonuses).map(([login, bonus]) => ({
          month: selectedMonth,
          twitchLogin: login,
          timezoneBonusEnabled: bonus.timezone,
          moderationBonus: bonus.moderation,
        }));
        
        for (const update of bonusUpdates) {
          const response = await fetch('/api/evaluations/bonus', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          });
          
          if (!response.ok) {
            throw new Error(`Erreur lors de la sauvegarde du bonus pour ${update.twitchLogin}`);
          }
        }
      }
      
      // Sauvegarder les notes finales et statuts
      {
        const updates = [];
        
        const allLogins = new Set([
          ...Object.keys(editingFinalNotes),
          ...Object.keys(editingStatuses),
          ...Object.keys(editingRoles),
          ...Object.keys(editingVips),
          ...Object.keys(editingKeepActive),
        ]);

        for (const member of membersData) {
          const normalizedLogin = member.twitchLogin.toLowerCase();
          const keepActive =
            editingKeepActive[member.twitchLogin] || editingKeepActive[normalizedLogin];
          if (keepActive) {
            allLogins.add(member.twitchLogin);
            continue;
          }
          const bonusInEdit = editingBonuses[member.twitchLogin];
          const timezoneBonus = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
          const moderationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
          const finalNoteInEdit = editingFinalNotes[normalizedLogin];
          const finalScore = getMemberRetainedFinalScore(
            member,
            normalizedLogin,
            timezoneBonus,
            moderationBonus,
            finalNoteInEdit
          );
          const passage = resolveCommunityPassage(
            member.createdAt,
            selectedMonth,
            finalScore,
            normalizedLogin,
            trendBaselines
          );
          if (passage.autoCommunaute && member.role !== "Communauté") {
            allLogins.add(member.twitchLogin);
          }
        }
        
        for (const login of allLogins) {
          const normalizedLogin = login.toLowerCase();
          const member = membersData.find((m) => m.twitchLogin.toLowerCase() === normalizedLogin);
          const keepActive = editingKeepActive[login] || editingKeepActive[normalizedLogin];

          let isActive: boolean | undefined =
            editingStatuses[login] !== undefined ? editingStatuses[login] : undefined;
          let role: string | undefined =
            editingRoles[login] !== undefined ? editingRoles[login] : undefined;

          if (keepActive) {
            isActive = true;
            if (role === "Communauté" && editingRoles[login] === undefined) {
              role = undefined;
            }
          } else if (member) {
            const bonusInEdit = editingBonuses[member.twitchLogin];
            const timezoneBonus = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
            const moderationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
            const finalNoteInEdit = editingFinalNotes[normalizedLogin];
            const finalScore = getMemberRetainedFinalScore(
              member,
              normalizedLogin,
              timezoneBonus,
              moderationBonus,
              finalNoteInEdit
            );
            const passage = resolveCommunityPassage(
              member.createdAt,
              selectedMonth,
              finalScore,
              normalizedLogin,
              trendBaselines
            );
            if (passage.autoCommunaute && member.role !== "Communauté") {
              if (isActive === undefined) isActive = false;
              if (role === undefined) role = "Communauté";
            }
          }

          updates.push({
            twitchLogin: normalizedLogin,
            finalNote: editingFinalNotes[login] !== undefined ? editingFinalNotes[login] : undefined,
            finalNoteReason:
              editingFinalNoteReasons[login] ||
              editingFinalNoteReasons[normalizedLogin] ||
              keepActive
                ? "Maintien actif malgré 3 mois < 5 — décision staff synthèse"
                : "Override manuel depuis /admin/evaluation/synthese",
            isActive,
            role,
            isVip: editingVips[normalizedLogin] !== undefined ? editingVips[normalizedLogin] : undefined,
          });
        }
        
        const snapshots = membersData.map((member) => {
          const login = member.twitchLogin.toLowerCase();
          const bonusInEdit = editingBonuses[member.twitchLogin];
          const timezoneBonus = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
          const moderationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
          const bonusBreakdown = getMemberBonusBreakdown(member, timezoneBonus, moderationBonus);
          const sectionDBonuses = Math.round(bonusBreakdown.total);
          const sectionAPoints = Math.round(member.spotlightPoints + member.raidsPoints);
          const sectionBPoints = Math.round(member.discordPoints + member.eventsPoints);
          const sectionCPoints = Math.round(member.followPoints);
          const { total: totalPoints } = calculateTotalAvecBonus(
            member.totalHorsBonus,
            bonusBreakdown.timezoneBonus,
            bonusBreakdown.moderationBonus,
            bonusBreakdown.engagementAverageBonus
          );
          return {
            twitchLogin: login,
            sectionAPoints,
            sectionBPoints,
            sectionCPoints,
            sectionDBonuses: Math.round(sectionDBonuses),
            totalPoints: Math.round(totalPoints),
          };
        });

        const snapshotChunks: typeof snapshots[] = [];
        for (let i = 0; i < snapshots.length; i += SYNTHESIS_SNAPSHOT_CHUNK_SIZE) {
          snapshotChunks.push(snapshots.slice(i, i + SYNTHESIS_SNAPSHOT_CHUNK_SIZE));
        }
        const chunksToSend = snapshotChunks.length > 0 ? snapshotChunks : [[] as typeof snapshots];

        const synthesisWarnings: string[] = [];
        for (let i = 0; i < chunksToSend.length; i++) {
          const response = await fetch('/api/evaluations/synthesis/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              month: selectedMonth,
              updates: i === 0 ? updates : [],
              snapshots: chunksToSend[i],
            }),
          });
          const bodyText = await response.text();
          let parsed: Record<string, unknown> = {};
          try {
            parsed = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
          } catch {
            throw new Error(
              synthesisSaveErrorMessage(response.status, bodyText, {})
            );
          }
          if (!response.ok) {
            throw new Error(synthesisSaveErrorMessage(response.status, bodyText, parsed));
          }
          const batchErrors = (parsed.results as { errors?: string[] } | undefined)?.errors;
          if (Array.isArray(batchErrors) && batchErrors.length > 0) {
            synthesisWarnings.push(...batchErrors);
          }
        }
        if (synthesisWarnings.length > 0) {
          console.warn('[synthèse] Avertissements sauvegarde:', synthesisWarnings);
        }
      }
      
      // Recharger les données
      await loadAllData();
      setEditingBonuses({});
      setEditingFinalNotes({});
      setEditingFinalNoteReasons({});
      setEditingStatuses({});
      setEditingRoles({});
      setEditingVips({});
      setEditingKeepActive({});
      alert('✅ Toutes les modifications ont été enregistrées avec succès');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(`❌ Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  }
  
  // Fonction de compatibilité pour le bouton bonus (dépréciée)
  async function saveBonuses() {
    await saveAll();
  }

  function handleTimezoneToggle(login: string, enabled: boolean) {
    setEditingBonuses(prev => ({
      ...prev,
      [login]: {
        ...prev[login],
        timezone: enabled,
        moderation: prev[login]?.moderation ?? 0,
      },
    }));
  }

  function handleModerationChange(login: string, value: number) {
    setEditingBonuses(prev => ({
      ...prev,
      [login]: {
        ...prev[login],
        timezone: prev[login]?.timezone ?? false,
        moderation: Math.max(0, Math.min(5, value)),
      },
    }));
  }
  
  function handleFinalNoteChange(login: string, value: string) {
    const numValue = value === '' ? null : parseFloat(value);
    const normalizedLogin = login.toLowerCase(); // Normaliser en lowercase pour correspondre à l'API
    setEditingFinalNotes(prev => {
      if (numValue === null) {
        const { [normalizedLogin]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [normalizedLogin]: numValue,
      };
    });
  }

  function handleFinalNoteReasonChange(login: string, reason: string) {
    const normalizedLogin = login.toLowerCase();
    setEditingFinalNoteReasons((prev) => ({
      ...prev,
      [normalizedLogin]: reason,
    }));
  }
  
  function handleStatusChange(login: string, isActive: boolean) {
    setEditingStatuses(prev => ({
      ...prev,
      [login]: isActive,
    }));
  }
  
  function handleForceRole(login: string, role: 'Communauté' | 'VIP') {
    if (role === 'Communauté') {
      // Forcer Communauté = isActive = false, role = 'Communauté'
      setEditingStatuses(prev => ({
        ...prev,
        [login]: false,
      }));
      setEditingRoles(prev => ({
        ...prev,
        [login]: 'Communauté',
      }));
    } else if (role === 'VIP') {
      // Forcer VIP = isVip = true
      const normalizedLogin = login.toLowerCase();
      setEditingVips(prev => ({
        ...prev,
        [normalizedLogin]: true,
      }));
    }
  }
  
  function handleVipToggle(login: string, isVip: boolean) {
    const normalizedLogin = login.toLowerCase();
    setEditingVips(prev => ({
      ...prev,
      [normalizedLogin]: isVip,
    }));
  }

  function handleKeepActive(login: string) {
    const normalizedLogin = login.toLowerCase();
    setEditingKeepActive((prev) => ({
      ...prev,
      [login]: true,
      [normalizedLogin]: true,
    }));
    setEditingStatuses((prev) => ({
      ...prev,
      [login]: true,
    }));
    setEditingRoles((prev) => {
      const next = { ...prev };
      delete next[login];
      return next;
    });
  }
  
  // Fonction pour sauvegarder uniquement les modifications manuelles (notes finales)
  async function saveManualNotes() {
    setSaving(true);
    try {
      if (Object.keys(editingFinalNotes).length === 0) {
        alert('Aucune note finale manuelle à sauvegarder');
        return;
      }
      
      const updates = Object.keys(editingFinalNotes).map(login => ({
        twitchLogin: login.toLowerCase(), // Normaliser en lowercase pour correspondre à l'API
        finalNote: editingFinalNotes[login],
        finalNoteReason: editingFinalNoteReasons[login] || "Override manuel depuis /admin/evaluation/synthese",
      }));
      
      const response = await fetch('/api/evaluations/synthesis/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          updates,
        }),
      });
      const bodyText = await response.text();
      let parsed: Record<string, unknown> = {};
      try {
        parsed = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
      } catch {
        throw new Error(synthesisSaveErrorMessage(response.status, bodyText, {}));
      }
      if (!response.ok) {
        throw new Error(synthesisSaveErrorMessage(response.status, bodyText, parsed));
      }
      
      // Recharger les données
      await loadAllData();
      setEditingFinalNotes({});
      setEditingFinalNoteReasons({});
      alert('✅ Notes finales manuelles enregistrées avec succès');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des notes finales manuelles:", error);
      alert(`❌ Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  }
  
  // Fonction pour calculer le nombre total de modifications en attente
  function countAutoCommunautePending(): number {
    return membersData.filter((member) => {
      const normalizedLogin = member.twitchLogin.toLowerCase();
      const keepActive =
        editingKeepActive[member.twitchLogin] || editingKeepActive[normalizedLogin];
      if (keepActive || member.role === "Communauté") return false;
      const bonusInEdit = editingBonuses[member.twitchLogin];
      const timezoneBonus = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
      const moderationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
      const finalNoteInEdit = editingFinalNotes[normalizedLogin];
      const finalScore = getMemberRetainedFinalScore(
        member,
        normalizedLogin,
        timezoneBonus,
        moderationBonus,
        finalNoteInEdit
      );
      return resolveCommunityPassage(
        member.createdAt,
        selectedMonth,
        finalScore,
        normalizedLogin,
        trendBaselines
      ).autoCommunaute;
    }).length;
  }

  function getTotalPendingChanges(): number {
    return Object.keys(editingBonuses).length +
           Object.keys(editingFinalNotes).length +
           Object.keys(editingStatuses).length +
           Object.keys(editingRoles).length +
           Object.keys(editingVips).length +
           Object.keys(editingKeepActive).length +
           countAutoCommunautePending();
  }

  function getPendingChangesBreakdown() {
    return {
      bonuses: Object.keys(editingBonuses).length,
      notes: Object.keys(editingFinalNotes).length,
      statuts: Object.keys(editingStatuses).length,
      roles: Object.keys(editingRoles).length,
      vip: Object.keys(editingVips).length,
    };
  }

  function getDataReliabilityBadge(member: MemberEvaluationData): { label: string; color: string; bg: string } {
    const missingSources = [
      member.spotlightTotal === 0,
      member.eventsTotal === 0,
      member.followEvalStatus === "unknown",
    ].filter(Boolean).length;

    if (missingSources >= 2) {
      return { label: "Partielle", color: "#f59e0b", bg: "#f59e0b20" };
    }
    if (missingSources === 1) {
      return { label: "A surveiller", color: "#06b6d4", bg: "#06b6d420" };
    }
    return { label: "Complete", color: "#10b981", bg: "#10b98120" };
  }

  function getMemberBonusBreakdown(
    member: MemberEvaluationData,
    timezoneBonusEnabled: boolean,
    moderationBonus: number
  ) {
    const timezoneBonus = timezoneBonusEnabled ? TIMEZONE_BONUS_POINTS : 0;
    const followStatus = member.followEvalStatus ?? "measured";
    const engagementAverageBonus = calculateEngagementAverageBonusWithFollowPolicy(
      member.spotlightPoints,
      member.discordPoints,
      member.eventsPoints,
      member.followPoints,
      followStatus
    );
    return {
      timezoneBonus,
      moderationBonus,
      engagementAverageBonus,
      total: timezoneBonus + moderationBonus + engagementAverageBonus,
    };
  }

  function getEntraideScore(member: MemberEvaluationData): { value: number; max: number } {
    const value = member.raidsPoints + member.discordPoints + member.eventsPoints + member.followPoints;
    return { value, max: ENTRAIDE_SCORE_MAX };
  }

  function getMemberRetainedFinalScore(
    member: MemberEvaluationData,
    normalizedLogin: string,
    timezoneBonusEnabled: boolean,
    moderationBonus: number,
    editingFinalNote?: number | null
  ): number {
    const savedManual =
      resolveSavedManualFinalNote(currentMonthFinalNotes, normalizedLogin) ?? member.manualFinalNote ?? null;
    return resolveRetainedFinalScore({
      totalHorsBonus: member.totalHorsBonus,
      timezoneBonusEnabled,
      moderationBonus,
      editingFinalNote,
      savedManualFinal: savedManual,
      persistedManualFinal: member.manualFinalNote,
      spotlightPoints: member.spotlightPoints,
      discordPoints: member.discordPoints,
      eventsPoints: member.eventsPoints,
      followPoints: member.followPoints,
      followEvalStatus: member.followEvalStatus,
    });
  }

  function getTrendDeltaForMember(
    member: MemberEvaluationData,
    normalizedLogin: string,
    timezoneBonusEnabled: boolean,
    moderationBonus: number,
    editingFinalNote?: number | null
  ): number | null {
    const current = getMemberRetainedFinalScore(
      member,
      normalizedLogin,
      timezoneBonusEnabled,
      moderationBonus,
      editingFinalNote
    );
    const baseline = trendBaselines.m1[normalizedLogin];
    if (!baseline) return null;
    if (baseline.source !== "manual" && !baseline.hasActivity) return null;
    return computeTrendDelta(current, baseline.score);
  }

  function getThreeMonthTrendForMember(
    member: MemberEvaluationData,
    normalizedLogin: string,
    timezoneBonusEnabled: boolean,
    moderationBonus: number,
    editingFinalNote?: number | null
  ) {
    const current = getMemberRetainedFinalScore(
      member,
      normalizedLogin,
      timezoneBonusEnabled,
      moderationBonus,
      editingFinalNote
    );
    return computeThreeMonthTrend(
      current,
      trendBaselines.m1[normalizedLogin],
      trendBaselines.m2[normalizedLogin],
      trendBaselines.m3[normalizedLogin]
    );
  }

  function exportFilteredCsv() {
    const headers = [
      "Membre",
      "Twitch",
      "Role",
      "Actif",
      "Spotlight",
      "Raids",
      "Discord",
      "Events",
      "Follow",
      "Total_hors_bonus",
      "Bonus_total",
      "Note_finale",
      "Delta_M_1",
      "Delta_3M_moyenne",
      "Pente_3M",
      "Fiabilite",
    ];
    const rows = filteredMembers.map((member) => {
      const normalizedLogin = member.twitchLogin.toLowerCase();
      const bonusInEdit = editingBonuses[member.twitchLogin];
      const timezoneBonus = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
      const moderationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
      const bonusBreakdown = getMemberBonusBreakdown(member, timezoneBonus, moderationBonus);
      const bonusTotal = bonusBreakdown.total;
      const finalInEdit = editingFinalNotes[normalizedLogin];
      const finalScore = getMemberRetainedFinalScore(
        member,
        normalizedLogin,
        timezoneBonus,
        moderationBonus,
        finalInEdit
      );
      const delta = getTrendDeltaForMember(
        member,
        normalizedLogin,
        timezoneBonus,
        moderationBonus,
        finalInEdit
      );
      const trend3M = getThreeMonthTrendForMember(
        member,
        normalizedLogin,
        timezoneBonus,
        moderationBonus,
        finalInEdit
      );
      const reliability = getDataReliabilityBadge(member).label;
      return [
        member.displayName,
        member.twitchLogin,
        member.role,
        member.isActive ? "oui" : "non",
        member.spotlightPoints.toFixed(2),
        member.raidsPoints.toFixed(2),
        member.discordPoints.toFixed(2),
        member.eventsPoints.toFixed(2),
        member.followPoints.toFixed(2),
        member.totalHorsBonus.toFixed(2),
        bonusTotal.toFixed(2),
        finalScore.toFixed(2),
        delta !== null ? delta.toFixed(2) : "",
        trend3M.deltaVsAverage !== null ? trend3M.deltaVsAverage.toFixed(2) : "",
        trend3M.slopePerMonth !== null ? trend3M.slopePerMonth.toFixed(2) : "",
        reliability,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation-synthese-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getMonthOptions(): string[] {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options;
  }

  function formatMonthKey(key: string): string {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  function handleSort(column: EvaluationDSortColumn) {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection(getDefaultSortDirection(column));
  }

  const sortContext = useMemo(
    () => ({
      selectedMonth,
      editingBonuses,
      editingFinalNotes,
      currentMonthFinalNotes,
      trendBaselines,
      editingStatuses,
      editingRoles,
      editingKeepActive,
    }),
    [
      selectedMonth,
      editingBonuses,
      editingFinalNotes,
      currentMonthFinalNotes,
      trendBaselines,
      editingStatuses,
      editingRoles,
      editingKeepActive,
    ]
  );

  // Filtrage et tri
  const filteredMembers = useMemo(() => {
    let filtered = membersData;
    
    // Optionnel: filtrer uniquement les profils actifs
    if (showActiveOnly) {
      filtered = filtered.filter(m => m.isActive);
    }
    
    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.displayName.toLowerCase().includes(query) ||
        m.twitchLogin.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query)
      );
    }

    if (selectedPreset !== "all") {
      filtered = filtered.filter((m) => {
        const normalizedLogin = m.twitchLogin.toLowerCase();
        const bonusInEdit = editingBonuses[m.twitchLogin];
        const timezoneBonus = bonusInEdit?.timezone ?? m.timezoneBonusEnabled;
        const moderationBonus = bonusInEdit?.moderation ?? m.moderationBonus;
        const bonusTotal = getMemberBonusBreakdown(m, timezoneBonus, moderationBonus).total;
        const finalInEdit = editingFinalNotes[normalizedLogin];
        const displayedFinal = finalInEdit ?? (currentMonthFinalNotes[normalizedLogin]?.finalNote ?? m.finalScore);
        const keepActive =
          editingKeepActive[m.twitchLogin] || editingKeepActive[normalizedLogin];
        const status = resolveEvaluationAutoSignal(
          displayedFinal ?? 0,
          m.createdAt,
          selectedMonth,
          normalizedLogin,
          trendBaselines,
          { keepActive: !!keepActive }
        );

        if (selectedPreset === "surveiller") {
          return status === "surveiller" || status === "passage_communaute";
        }
        if (selectedPreset === "vip") return status === "vip";
        if (selectedPreset === "manual") return finalInEdit !== undefined;
        if (selectedPreset === "bonus") return bonusTotal > 0;
        return true;
      });
    }

    return sortEvaluationDMembers(filtered, sortColumn, sortDirection, sortContext);
  }, [
    membersData,
    showActiveOnly,
    searchQuery,
    selectedPreset,
    editingBonuses,
    editingFinalNotes,
    currentMonthFinalNotes,
    selectedMonth,
    sortColumn,
    sortDirection,
    sortContext,
    editingKeepActive,
    trendBaselines,
  ]);

  const pendingChanges = getPendingChangesBreakdown();
  const pendingBreakdownLabel = `Notes ${pendingChanges.notes} · Bonus ${pendingChanges.bonuses} · Statuts ${pendingChanges.statuts} · Rôles ${pendingChanges.roles} · VIP ${pendingChanges.vip}`;
  const pendingTotal = getTotalPendingChanges();
  const monthLabel = formatMonthKey(selectedMonth);

  const evaluationCopy = useMemo(
    () =>
      buildEvaluationDCopyModel({
        displayName: staffDisplayName,
        rawRole: staffRawRole,
        monthLabel,
        counts: {
          members: membersData.length,
          vip: generalStats?.vipCount ?? 0,
          surveiller: generalStats?.surveillerCount ?? 0,
          pendingEdits: pendingTotal,
          manualOverrides: Object.keys(editingFinalNotes).length,
          historyLogs: overrideLogs.length,
          finalNotesSaved: Object.keys(currentMonthFinalNotes).length,
        },
      }),
    [
      staffDisplayName,
      staffRawRole,
      monthLabel,
      membersData.length,
      generalStats?.vipCount,
      generalStats?.surveillerCount,
      pendingTotal,
      editingFinalNotes,
      overrideLogs.length,
      currentMonthFinalNotes,
    ]
  );

  function handleKpiAction(action: EvaluationDKpiAction) {
    if (action.type === "tab") {
      setActiveTab(action.tab);
      return;
    }
    if (action.preset) setSelectedPreset(action.preset);
    if (action.tab) setActiveTab(action.tab);
  }
  const entraideGlobal = useMemo(() => {
    if (membersData.length === 0) return { avg: 0, max: ENTRAIDE_SCORE_MAX };
    const total = membersData.reduce((sum, member) => sum + getEntraideScore(member).value, 0);
    return {
      avg: Math.round((total / membersData.length) * 100) / 100,
      max: ENTRAIDE_SCORE_MAX,
    };
  }, [membersData]);

  const pilotageBarData = useMemo(() => {
    if (!generalStats) return [];
    return [
      { key: "spotlight", label: "Spotlight", moy: generalStats.avgSpotlight, max: 5, fill: "#c084fc" },
      { key: "raids", label: "Raids", moy: generalStats.avgRaids, max: 5, fill: "#818cf8" },
      { key: "discord", label: "Discord", moy: generalStats.avgDiscord, max: 5, fill: "#5865F2" },
      { key: "events", label: "Events", moy: generalStats.avgEvents, max: COMMUNITY_EVENT_MAX_POINTS, fill: "#34d399" },
      { key: "follow", label: "Follow", moy: generalStats.avgFollow, max: 5, fill: "#f472b6" },
    ];
  }, [generalStats]);

  if (loading) {
    return (
      <MemberBentoShell accentHex={EVAL_D_LOADING_COPY.accent} className="-mx-4 md:-mx-6">
        <MemberBentoRow>
          <MemberBentoCell span={12}>
            <EvaluationDPanel tone="accent" title={EVAL_D_LOADING_COPY.title} intro={EVAL_D_LOADING_COPY.subtitle}>
              <div className="flex justify-center py-10">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            </EvaluationDPanel>
          </MemberBentoCell>
        </MemberBentoRow>
      </MemberBentoShell>
    );
  }

  if (!hasAccess) {
    return (
      <MemberBentoShell accentHex="#8b5cf6" className="-mx-4 md:-mx-6">
        <MemberBentoRow>
          <MemberBentoCell span={12}>
            <EvaluationDPanel
              tone="warning"
              title="Accès refusé"
              intro="Vous n'avez pas les permissions nécessaires pour consulter la synthèse évaluation D."
            />
          </MemberBentoCell>
        </MemberBentoRow>
      </MemberBentoShell>
    );
  }

  const kpiCounts = {
    members: membersData.length,
    vip: generalStats?.vipCount ?? 0,
    surveiller: generalStats?.surveillerCount ?? 0,
    pendingEdits: pendingTotal,
    manualOverrides: Object.keys(editingFinalNotes).length,
    historyLogs: overrideLogs.length,
    finalNotesSaved: Object.keys(currentMonthFinalNotes).length,
  };

  return (
    <MemberBentoShell accentHex={evaluationCopy.accent} className="-mx-4 md:-mx-6">
      <MemberBentoRow stretch>
        <MemberBentoCell span={7} stretch>
          <EvaluationDPageHeader
            copy={evaluationCopy}
            monthLabel={monthLabel}
            loadingData={loadingData}
            onRefresh={() => void loadAllData()}
          />
        </MemberBentoCell>
        <MemberBentoCell span={5} stretch>
          <EvaluationDPageAside
            copy={evaluationCopy}
            pendingEdits={pendingTotal}
            historyCount={overrideLogs.length}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow stretch>
        <MemberBentoCell span={12} stretch>
          <EvaluationDKpiStrip copy={evaluationCopy} counts={kpiCounts} onAction={handleKpiAction} />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow stretch>
        <MemberBentoCell span={12} stretch>
          <EvaluationDStaffGuide copy={evaluationCopy} />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <EvaluationDToolbar
            copy={evaluationCopy}
            selectedMonth={selectedMonth}
            monthOptions={getMonthOptions()}
            formatMonthKey={formatMonthKey}
            onMonthChange={setSelectedMonth}
            selectedPreset={selectedPreset}
            onPresetChange={setSelectedPreset}
            showActiveOnly={showActiveOnly}
            onShowActiveOnlyChange={setShowActiveOnly}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            compactMode={compactMode}
            onCompactModeToggle={() => setCompactMode((prev) => !prev)}
            showAdvancedColumns={showAdvancedColumns}
            onAdvancedColumnsToggle={() => setShowAdvancedColumns((prev) => !prev)}
            onExportCsv={exportFilteredCsv}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <EvaluationDTabNav copy={evaluationCopy} activeTab={activeTab} onTabChange={setActiveTab} />
        </MemberBentoCell>
      </MemberBentoRow>

      {activeTab === "pilotage" && generalStats ? (
        <MemberBentoRow>
          <MemberBentoCell span={12}>
            <EvaluationDPilotageView
              monthLabel={monthLabel}
              generalStats={generalStats}
              membersCount={membersData.length}
              pilotageBarData={pilotageBarData}
              entraideAvg={entraideGlobal.avg}
              entraideMax={entraideGlobal.max}
              pendingTotal={pendingTotal}
              pendingBreakdown={pendingBreakdownLabel}
            />
            <EvaluationDBaremePanel />
          </MemberBentoCell>
        </MemberBentoRow>
      ) : null}

      {activeTab === "tableau" ? (
        <MemberBentoRow>
          <MemberBentoCell span={12}>
            <EvaluationDPanel
              kicker={evaluationCopy.sections.tableau.kicker}
              title={`${evaluationCopy.sections.tableau.title} (${filteredMembers.length} membres)`}
              intro={
                followUnknownCount > 0
                  ? `${evaluationCopy.sections.tableau.intro} · ${followUnknownCount} profil(s) sans follow mesuré → neutre ${FOLLOW_NEUTRAL_POINTS}/5.`
                  : evaluationCopy.sections.tableau.intro
              }
              tone="accent"
              action={
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveManualNotes}
                    disabled={saving || Object.keys(editingFinalNotes).length === 0}
                    className={evalDBtnPrimaryClass}
                  >
                    {saving ? "Enregistrement…" : `Notes manuelles (${Object.keys(editingFinalNotes).length})`}
                  </button>
                  <button
                    type="button"
                    onClick={saveAll}
                    disabled={saving || pendingTotal === 0}
                    className={evalDBtnSuccessClass}
                  >
                    {saving ? "Enregistrement…" : `Tout enregistrer (${pendingTotal})`}
                  </button>
                </div>
              }
            >
        {loadingData ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">Aucun membre trouvé pour ces filtres.</p>
        ) : (
          <>
          <EvaluationDLegend />
          <div className={evalDTableShellClass}>
            <EvaluationDTableFitContainer
              measureKey={`${selectedMonth}-${compactMode}-${showAdvancedColumns}-${filteredMembers.length}`}
            >
            <table className={`w-max min-w-full max-w-none border-collapse ${compactMode ? "text-[11px]" : "text-xs sm:text-sm"}`}>
              <thead className="sticky top-0 z-30">
                <tr className={evalDTableGroupClass}>
                  <th colSpan={4} className={`px-2 py-1.5 text-left sm:px-3 sm:py-2 ${G.identite.headerClass}`}>{G.identite.label}</th>
                  <th colSpan={6} className={`px-2 py-1.5 text-left sm:px-3 sm:py-2 ${G.bareme.headerClass}`}>{G.bareme.label}</th>
                  {showAdvancedColumns ? (
                    <th colSpan={2} className={`px-2 py-1.5 text-left sm:px-3 sm:py-2 ${G.bonus.headerClass}`}>{G.bonus.label}</th>
                  ) : null}
                  <th colSpan={2} className={`px-2 py-1.5 text-left sm:px-3 sm:py-2 ${G.totaux.headerClass}`}>{G.totaux.label}</th>
                  <th colSpan={5} className={`px-2 py-1.5 text-left sm:px-3 sm:py-2 ${G.synthese.headerClass}`}>{G.synthese.label}</th>
                  <th colSpan={showAdvancedColumns ? 3 : 2} className={`px-2 py-1.5 text-left sm:px-3 sm:py-2 ${G.decisions.headerClass}`}>{G.decisions.label}</th>
                </tr>
                <tr className={evalDTableHeadClass}>
                  <EvaluationDSortableTh
                    column="membre"
                    label="Membre"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="bg-zinc-900/95 text-zinc-300"
                  />
                  <EvaluationDSortableTh
                    column="role"
                    label="Statut / Rôle"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <EvaluationDSortableTh
                    column="anciennete"
                    label="Ancienneté"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                    title="Trier par jours d'historique TENF"
                  />
                  <EvaluationDSortableTh
                    column="fiabilite"
                    label="Fiabilité"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="border-r border-white/[0.06]"
                  />
                  <EvaluationDSortableTh
                    column="entraide"
                    label="Entraide"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <EvaluationDSortableTh
                    column="spotlight"
                    label="Spotlight"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <EvaluationDSortableTh
                    column="raids"
                    label="Raids"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <EvaluationDSortableTh
                    column="discord"
                    label="Discord"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <EvaluationDSortableTh
                    column="events"
                    label="Events"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <EvaluationDSortableTh
                    column="follow"
                    label="Follow"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="border-r border-white/[0.06]"
                  />
                  {showAdvancedColumns && (
                    <th className="whitespace-nowrap px-2 py-2 text-center sm:px-3 sm:py-2.5">Décalage</th>
                  )}
                  {showAdvancedColumns && (
                    <th className="whitespace-nowrap border-r border-white/[0.06] px-2 py-2 text-center sm:px-3 sm:py-2.5">
                      Modération
                    </th>
                  )}
                  <EvaluationDSortableTh
                    column="horsBonus"
                    label="Hors bonus"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <EvaluationDSortableTh
                    column="bonus"
                    label="Bonus"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="border-r border-white/[0.06]"
                  />
                  <EvaluationDSortableTh
                    column="note"
                    label={`Note /${FINAL_SCORE_MAX}`}
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="bg-zinc-900/95 text-violet-200"
                  />
                  <EvaluationDSortableTh
                    column="retenue"
                    label="Retenue"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <EvaluationDSortableTh
                    column="deltaM1"
                    label="Δ M-1"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                    title={
                      trendsLoading
                        ? "Chargement des tendances M-1…"
                        : "Écart vs note retenue M-1 (override synthèse ou barème recalculé)"
                    }
                  />
                  <EvaluationDSortableTh
                    column="delta3M"
                    label="Δ 3M"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                    title={
                      trendsLoading
                        ? "Chargement des tendances 3 mois…"
                        : "Écart vs moyenne M-1, M-2 et M-3 (min. 2 mois disponibles)"
                    }
                  />
                  <th className="whitespace-nowrap border-r border-white/[0.06] px-2 py-2 text-center sm:px-3 sm:py-2.5">
                    Override
                  </th>
                  {showAdvancedColumns && (
                    <EvaluationDSortableTh
                      column="actif"
                      label="Actif"
                      align="center"
                      activeColumn={sortColumn}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  )}
                  <EvaluationDSortableTh
                    column="auto"
                    label="Auto"
                    align="center"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                    title="Statut automatique VIP / neutre / à surveiller"
                  />
                  <th className="whitespace-nowrap px-2 py-2 text-center sm:px-3 sm:py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const bonusInEdit = editingBonuses[member.twitchLogin];
                  const currentTimezoneBonus = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
                  const currentModerationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
                  const bonusBreakdown = getMemberBonusBreakdown(
                    member,
                    currentTimezoneBonus,
                    currentModerationBonus
                  );
                  const bonusTotal = bonusBreakdown.total;
                  
                  // Notes finales et statuts en cours d'édition
                  const normalizedLogin = member.twitchLogin?.toLowerCase() || '';
                  const finalNoteInEdit = editingFinalNotes[normalizedLogin];
                  const savedManualFinal =
                    resolveSavedManualFinalNote(currentMonthFinalNotes, normalizedLogin) ??
                    member.manualFinalNote ??
                    undefined;
                  const finalScore = getMemberRetainedFinalScore(
                    member,
                    normalizedLogin,
                    currentTimezoneBonus,
                    currentModerationBonus,
                    finalNoteInEdit
                  );
                  const retainedFinalNote = finalScore;
                  const retainedFinalSource =
                    finalNoteInEdit !== undefined ||
                    savedManualFinal !== undefined ||
                    member.manualFinalNote != null
                      ? "manuelle"
                      : "membre";
                  const vipThreshold = resolveVipThresholdForMember(member.createdAt, selectedMonth);
                  const keepActive =
                    editingKeepActive[member.twitchLogin] || editingKeepActive[normalizedLogin];
                  const passage = resolveCommunityPassage(
                    member.createdAt,
                    selectedMonth,
                    finalScore,
                    normalizedLogin,
                    trendBaselines
                  );
                  const autoSignal = resolveEvaluationAutoSignal(
                    finalScore,
                    member.createdAt,
                    selectedMonth,
                    normalizedLogin,
                    trendBaselines,
                    { keepActive: !!keepActive }
                  );
                  const statusInEdit = editingStatuses[member.twitchLogin];
                  const roleInEdit = editingRoles[member.twitchLogin];
                  const vipInEdit = editingVips[normalizedLogin];
                  const autoCommunautePending = passage.autoCommunaute && !keepActive;
                  const currentIsActive =
                    statusInEdit !== undefined
                      ? statusInEdit
                      : autoCommunautePending
                        ? false
                        : member.isActive;
                  const currentRole =
                    roleInEdit !== undefined
                      ? roleInEdit
                      : autoCommunautePending
                        ? "Communauté"
                        : member.role;
                  const currentIsVip = vipInEdit !== undefined ? vipInEdit : (member.isVip ?? false);
                  const m1Baseline = trendBaselines.m1[normalizedLogin];
                  const deltaM1 = getTrendDeltaForMember(
                    member,
                    normalizedLogin,
                    currentTimezoneBonus,
                    currentModerationBonus,
                    finalNoteInEdit
                  );
                  const trend3M = getThreeMonthTrendForMember(
                    member,
                    normalizedLogin,
                    currentTimezoneBonus,
                    currentModerationBonus,
                    finalNoteInEdit
                  );
                  
                  const isPassedToCommunaute =
                    currentRole === "Communauté" &&
                    (autoCommunautePending ||
                      roleInEdit === "Communauté" ||
                      member.role === "Communauté");
                  const passageHint = formatCommunityPassageHint(passage);
                  
                  return (
                    <tr
                      key={member.twitchLogin}
                      className={`group border-b border-white/[0.05] transition hover:bg-white/[0.02] ${
                        autoCommunautePending ? "bg-cyan-950/15" : ""
                      }`}
                    >
                      <td className={`bg-zinc-950/95 px-2 group-hover:bg-zinc-900/95 sm:px-3 ${compactMode ? "py-1" : "py-1.5 sm:py-2"}`}>
                        <div className="flex items-center gap-3">
                          {member.avatar && (
                            <img
                              src={member.avatar}
                              alt={member.displayName}
                              className={`rounded-full object-cover ring-1 ring-white/10 ${compactMode ? "h-6 w-6" : "h-8 w-8"}`}
                            />
                          )}
                          <div>
                            <div className="font-medium text-zinc-100">{member.displayName}</div>
                            {member.twitchLogin && (
                              <div className="text-xs text-zinc-500">{member.twitchLogin}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`px-3 ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <span
                          className={isPassedToCommunaute ? "role-badge role-badge--community" : getRoleBadgeClassName(currentRole)}
                        >
                          {getRoleBadgeLabel(currentRole)}
                        </span>
                      </td>
                      <td className={`${evalDTableTdMutedClass} ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        {calculateSeniority(member.createdAt)}
                      </td>
                      <td className={`border-r border-white/[0.06] px-3 text-center ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        {(() => {
                          const reliability = getDataReliabilityBadge(member);
                          return (
                            <span
                              className="rounded-full px-2 py-1 text-xs font-semibold"
                              style={{ backgroundColor: reliability.bg, color: reliability.color }}
                            >
                              {reliability.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className={`${evalDTableTdClass} text-emerald-400 ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        {getEntraideScore(member).value.toFixed(2)}
                      </td>
                      <td className={`${evalDTableTdClass} ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <span title={`Presences: ${member.spotlightPresences || 0}/${member.spotlightTotal || 0}`}>
                          {member.spotlightPoints.toFixed(2)}
                        </span>
                      </td>
                      <td className={`${evalDTableTdClass} ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <span title={`Raids faits: ${member.raidsDone || 0} · Raids recus: ${member.raidsReceived || 0}`}>
                          {member.raidsPoints.toFixed(2)}
                        </span>
                      </td>
                      <td className={`${evalDTableTdClass} ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <span title="Source: /api/evaluations/discord/points">
                          {member.discordPoints.toFixed(2)}
                        </span>
                      </td>
                      <td className={`${evalDTableTdClass} ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <span title={`Présences events éligibles: ${member.eventsPresences || 0}/${member.eventsTotal || 0} · 2/4/6 pts`}>
                          {member.eventsPoints.toFixed(2)} / {COMMUNITY_EVENT_MAX_POINTS}
                        </span>
                      </td>
                      <td className={`${evalDTableTdClass} border-r border-white/[0.06] ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        {member.followEvalStatus === "unknown" ? (
                          <span title={`Follow non mesuré — neutre ${FOLLOW_NEUTRAL_POINTS}/5 imputé · ${FOLLOW_POLICY_SUMMARY}`}>
                            <span className="text-sky-300">{member.followPoints.toFixed(2)}</span>
                            <span className="ml-1 text-[10px] font-semibold text-sky-400/80">neutre</span>
                          </span>
                        ) : (
                          <span title="Source: feuilles staff ou snapshot engagement Twitch">
                            {member.followPoints.toFixed(2)}
                            {member.followRawPoints === 0 && member.followEvalStatus === "measured" ? (
                              <span className="ml-1 text-[10px] text-zinc-500">mesuré</span>
                            ) : null}
                          </span>
                        )}
                      </td>
                      {showAdvancedColumns && (
                      <td className={`px-3 text-center ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <label className="flex cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            checked={currentTimezoneBonus}
                            onChange={(e) => handleTimezoneToggle(member.twitchLogin, e.target.checked)}
                            className={evalDTableCheckboxClass}
                          />
                        </label>
                      </td>
                      )}
                      {showAdvancedColumns && (
                      <td className={`border-r border-white/[0.06] px-3 text-center ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.5"
                            value={currentModerationBonus}
                            onChange={(e) => handleModerationChange(member.twitchLogin, parseFloat(e.target.value) || 0)}
                            className={`${evalDTableInputCompactClass} w-16`}
                          />
                          <button
                            type="button"
                            onClick={() => handleModerationChange(member.twitchLogin, currentModerationBonus)}
                            className={`rounded-lg border border-violet-400/35 bg-violet-600/25 px-2 py-1 text-xs font-semibold text-violet-100 transition hover:bg-violet-600/40 ${evalDFocusRing}`}
                          >
                            OK
                          </button>
                        </div>
                      </td>
                      )}
                      <td className={`${evalDTableTdClass} ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        {member.totalHorsBonus.toFixed(2)} / 25
                      </td>
                      <td className={`${evalDTableTdClass} border-r border-white/[0.06] ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <span title={`Manuels + auto moyenne engagement (${bonusBreakdown.engagementAverageBonus.toFixed(0)} pts si moy. > 4)`}>
                          {bonusTotal.toFixed(2)}
                        </span>
                      </td>
                      <td className={`bg-zinc-950/95 px-2 text-center font-bold tabular-nums group-hover:bg-zinc-900/95 sm:px-3 ${compactMode ? "py-1" : "py-1.5 sm:py-2"} ${
                        finalScore >= vipThreshold
                          ? "text-emerald-400"
                          : finalScore < SURVEILLER_FINAL_SCORE_THRESHOLD
                            ? "text-amber-400"
                            : "text-zinc-200"
                      }`}>
                        {finalScore.toFixed(2)} / {FINAL_SCORE_MAX}
                        <div className="text-[10px] font-normal text-zinc-500">VIP ≥ {vipThreshold}</div>
                      </td>
                      <td className={`px-3 text-center ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <div className="font-semibold text-zinc-100">
                          {retainedFinalNote.toFixed(2)} / {FINAL_SCORE_MAX}
                        </div>
                        <div className={`text-xs ${retainedFinalSource === "manuelle" ? "text-emerald-400" : "text-zinc-500"}`}>
                          {retainedFinalSource === "manuelle" ? "Source: manuelle" : "Source: membre"}
                        </div>
                      </td>
                      <td className={`${evalDTableTdClass} ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <EvaluationDTrendCell
                          delta={deltaM1}
                          baseline={m1Baseline?.score}
                          baselineLabel="M-1"
                          source={m1Baseline?.source}
                          compact={compactMode}
                        />
                      </td>
                      <td className={`${evalDTableTdClass} ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <EvaluationDTrendCell
                          delta={trend3M.deltaVsAverage}
                          baseline={trend3M.averageBaseline}
                          baselineLabel={`Moy. ${trend3M.monthsUsed} mois`}
            detail={
              trend3M.slopePerMonth !== null
                ? `Pente M-3→M-1: ${trend3M.slopePerMonth > 0 ? "+" : ""}${trend3M.slopePerMonth.toFixed(2)} / mois · basé sur overrides si disponibles`
                : "Basé sur overrides synthèse ou barème recalculé par mois"
            }
                          compact={compactMode}
                        />
                      </td>
                      <td className={`border-r border-white/[0.06] px-3 text-center ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <input
                          type="number"
                          min="0"
                          max={FINAL_SCORE_MAX}
                          step="0.01"
                          placeholder={finalScore.toFixed(2)}
                          value={finalNoteInEdit !== undefined && finalNoteInEdit !== null ? finalNoteInEdit : ''}
                          onChange={(e) => handleFinalNoteChange(member.twitchLogin, e.target.value)}
                          className={`${evalDTableInputCompactClass} w-20 ${
                            finalNoteInEdit !== undefined
                              ? "border-emerald-400/50 bg-emerald-500/10 ring-emerald-400/20"
                              : ""
                          }`}
                        />
                        {finalNoteInEdit !== undefined && (
                          <input
                            type="text"
                            value={editingFinalNoteReasons[normalizedLogin] || ""}
                            onChange={(e) => handleFinalNoteReasonChange(member.twitchLogin, e.target.value)}
                            placeholder="Pourquoi cet override ?"
                            className={`${evalDTableInputCompactClass} mt-1 w-40 text-left text-xs`}
                          />
                        )}
                      </td>
                      {showAdvancedColumns && (
                      <td className={`px-3 text-center ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <label className="flex cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            checked={currentIsActive}
                            onChange={(e) => handleStatusChange(member.twitchLogin, e.target.checked)}
                            className={`${evalDTableCheckboxClass} ${
                              statusInEdit !== undefined ? "border-emerald-400/60" : ""
                            }`}
                            title={currentIsActive ? "Actif (désactiver = rôle Communauté)" : "Inactif (activer pour réintégrer)"}
                          />
                        </label>
                        {statusInEdit !== undefined && (
                          <span className={`ml-1 text-xs ${statusInEdit ? "text-emerald-400" : "text-amber-400"}`}>
                            {statusInEdit ? "✓" : "✗"}
                          </span>
                        )}
                      </td>
                      )}
                      <td className={`px-3 text-center ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        {autoSignal === "vip" && (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-400">
                            VIP
                          </span>
                        )}
                        {autoSignal === "passage_communaute" && (
                          <span
                            className="rounded-full bg-cyan-500/15 px-2 py-1 text-xs font-semibold text-cyan-300"
                            title={passageHint}
                          >
                            Passage auto
                          </span>
                        )}
                        {autoSignal === "surveiller" && (
                          <span
                            className="rounded-full bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-400"
                            title={passageHint}
                          >
                            À surveiller
                            <span className="ml-1 font-normal text-amber-500/80">
                              ({passage.consecutiveLowMonths}m)
                            </span>
                          </span>
                        )}
                        {autoSignal === "note_non_significative" && (
                          <span
                            className="rounded-full bg-zinc-800/80 px-2 py-1 text-xs font-semibold text-zinc-500"
                            title={passageHint}
                          >
                            Non significatif
                          </span>
                        )}
                        {autoSignal === "neutre" && (
                          <span className="rounded-full bg-zinc-800/80 px-2 py-1 text-xs font-semibold text-zinc-500">
                            —
                          </span>
                        )}
                        {keepActive && passage.autoCommunaute && (
                          <span className="ml-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                            Gardé actif
                          </span>
                        )}
                        {currentRole === "Communauté" && autoSignal !== "passage_communaute" && (
                          <span className="ml-1 rounded-full bg-cyan-500/15 px-2 py-1 text-xs font-semibold text-cyan-400">
                            Communauté
                          </span>
                        )}
                      </td>
                      <td className={`px-3 text-center ${compactMode ? "py-1.5" : "py-2.5"}`}>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {passage.keepActiveAvailable && (
                            <button
                              type="button"
                              onClick={() => handleKeepActive(member.twitchLogin)}
                              className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${evalDFocusRing} ${
                                keepActive
                                  ? "border-emerald-400/50 bg-emerald-600/40 text-white"
                                  : "border-emerald-500/40 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50"
                              }`}
                              title="Maintenir le membre actif — annule le passage auto Communauté à l'enregistrement"
                            >
                              {keepActive ? "Actif ✓" : "Garder actif"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleForceRole(member.twitchLogin, "Communauté")}
                            className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${evalDFocusRing} ${
                              currentRole === "Communauté"
                                ? "border-cyan-400/50 bg-cyan-600/40 text-white"
                                : "border-cyan-500/40 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-950/50"
                            }`}
                            title="Forcer le rôle Communauté (isActive = false)"
                          >
                            Forcer Communauté
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVipToggle(member.twitchLogin, !currentIsVip)}
                            className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${evalDFocusRing} ${
                              currentIsVip
                                ? "border-emerald-400/50 bg-emerald-600/40 text-white"
                                : "border-emerald-500/40 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50"
                            }`}
                            title={currentIsVip ? "Désactiver le statut VIP" : "Activer le statut VIP"}
                          >
                            {currentIsVip ? "VIP ✓" : "VIP"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </EvaluationDTableFitContainer>
          </div>
          </>
        )}
            </EvaluationDPanel>
          </MemberBentoCell>
        </MemberBentoRow>
      ) : null}

      {activeTab === "historique" ? (
        <MemberBentoRow>
          <MemberBentoCell span={12}>
            <EvaluationDHistoryPanel logs={overrideLogs} />
          </MemberBentoCell>
        </MemberBentoRow>
      ) : null}
    </MemberBentoShell>
  );
}
