import {
  computeThreeMonthTrend,
  computeTrendDelta,
  resolveRetainedFinalScore,
  resolveSavedManualFinalNote,
  type MonthFinalScoreEntry,
} from "@/lib/admin/evaluation-d/evaluationDMonthScores";
import type { FinalNoteRecord, MemberEvaluationData } from "@/lib/admin/evaluation-d/evaluationDTypes";
import { TIMEZONE_BONUS_POINTS } from "@/lib/evaluationBonusHelpers";
import { resolveEvaluationAutoSignal, type EvaluationAutoSignal } from "@/lib/admin/evaluation-d/evaluationDCommunityPassage";
import { getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

export type EvaluationDSortColumn =
  | "membre"
  | "role"
  | "anciennete"
  | "fiabilite"
  | "entraide"
  | "spotlight"
  | "raids"
  | "discord"
  | "events"
  | "follow"
  | "horsBonus"
  | "bonus"
  | "note"
  | "retenue"
  | "deltaM1"
  | "delta3M"
  | "actif"
  | "auto";

export type EvaluationDSortDirection = "asc" | "desc";

export type EvaluationDSortContext = {
  selectedMonth: string;
  editingBonuses: Record<string, { timezone: boolean; moderation: number }>;
  editingFinalNotes: Record<string, number | null>;
  currentMonthFinalNotes: Record<string, FinalNoteRecord>;
  trendBaselines: {
    m1: Record<string, MonthFinalScoreEntry>;
    m2: Record<string, MonthFinalScoreEntry>;
    m3: Record<string, MonthFinalScoreEntry>;
  };
  editingStatuses: Record<string, boolean>;
  editingRoles: Record<string, string>;
  editingKeepActive: Record<string, boolean>;
};

const RELIABILITY_RANK: Record<string, number> = {
  Complete: 0,
  "A surveiller": 1,
  Partielle: 2,
};

const AUTO_SIGNAL_RANK: Record<EvaluationAutoSignal, number> = {
  vip: 0,
  passage_communaute: 1,
  surveiller: 2,
  neutre: 3,
  note_non_significative: 4,
};

function getReliabilityRank(member: MemberEvaluationData): number {
  const missingSources = [
    member.spotlightTotal === 0,
    member.eventsTotal === 0,
    member.followEvalStatus === "unknown",
  ].filter(Boolean).length;

  if (missingSources >= 2) return RELIABILITY_RANK.Partielle;
  if (missingSources === 1) return RELIABILITY_RANK["A surveiller"];
  return RELIABILITY_RANK.Complete;
}

function getEntraideValue(member: MemberEvaluationData): number {
  return member.raidsPoints + member.discordPoints + member.eventsPoints + member.followPoints;
}

function getMemberBonusTotal(
  member: MemberEvaluationData,
  ctx: EvaluationDSortContext
): number {
  const bonusInEdit = ctx.editingBonuses[member.twitchLogin];
  const timezoneBonusEnabled = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
  const moderationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
  const timezoneBonus = timezoneBonusEnabled ? TIMEZONE_BONUS_POINTS : 0;
  const engagementAverageBonus = calculateEngagementAverageBonus(
    member.spotlightPoints,
    member.discordPoints,
    member.eventsPoints,
    member.followPoints
  );
  return timezoneBonus + moderationBonus + engagementAverageBonus;
}

function getRetainedFinalScore(member: MemberEvaluationData, ctx: EvaluationDSortContext): number {
  const normalizedLogin = member.twitchLogin?.toLowerCase() || "";
  const bonusInEdit = ctx.editingBonuses[member.twitchLogin];
  const timezoneBonusEnabled = bonusInEdit?.timezone ?? member.timezoneBonusEnabled;
  const moderationBonus = bonusInEdit?.moderation ?? member.moderationBonus;
  const finalNoteInEdit = ctx.editingFinalNotes[normalizedLogin];
  const savedManual =
    resolveSavedManualFinalNote(ctx.currentMonthFinalNotes, normalizedLogin) ??
    member.manualFinalNote ??
    null;

  return resolveRetainedFinalScore({
    totalHorsBonus: member.totalHorsBonus,
    timezoneBonusEnabled,
    moderationBonus,
    editingFinalNote: finalNoteInEdit,
    savedManualFinal: savedManual,
    persistedManualFinal: member.manualFinalNote,
    spotlightPoints: member.spotlightPoints,
    discordPoints: member.discordPoints,
      eventsPoints: member.eventsPoints,
      followPoints: member.followPoints,
      followEvalStatus: member.followEvalStatus,
    });
  }

function getDeltaM1(member: MemberEvaluationData, ctx: EvaluationDSortContext): number | null {
  const normalizedLogin = member.twitchLogin?.toLowerCase() || "";
  const current = getRetainedFinalScore(member, ctx);
  const baseline = ctx.trendBaselines.m1[normalizedLogin];
  if (!baseline) return null;
  if (baseline.source !== "manual" && !baseline.hasActivity) return null;
  return computeTrendDelta(current, baseline.score);
}

function getDelta3M(member: MemberEvaluationData, ctx: EvaluationDSortContext): number | null {
  const normalizedLogin = member.twitchLogin?.toLowerCase() || "";
  const current = getRetainedFinalScore(member, ctx);
  const trend = computeThreeMonthTrend(
    current,
    ctx.trendBaselines.m1[normalizedLogin],
    ctx.trendBaselines.m2[normalizedLogin],
    ctx.trendBaselines.m3[normalizedLogin]
  );
  return trend.deltaVsAverage;
}

function getEffectiveRole(member: MemberEvaluationData, ctx: EvaluationDSortContext): string {
  const roleInEdit = ctx.editingRoles[member.twitchLogin];
  return roleInEdit ?? member.role;
}

function getEffectiveIsActive(member: MemberEvaluationData, ctx: EvaluationDSortContext): boolean {
  const statusInEdit = ctx.editingStatuses[member.twitchLogin];
  return statusInEdit !== undefined ? statusInEdit : member.isActive;
}

function getEffectiveAutoSignal(member: MemberEvaluationData, ctx: EvaluationDSortContext): EvaluationAutoSignal {
  const normalizedLogin = member.twitchLogin?.toLowerCase() || "";
  const keepActive =
    ctx.editingKeepActive[member.twitchLogin] || ctx.editingKeepActive[normalizedLogin];
  const finalScore = getRetainedFinalScore(member, ctx);
  return resolveEvaluationAutoSignal(
    finalScore,
    member.createdAt,
    ctx.selectedMonth,
    normalizedLogin,
    ctx.trendBaselines,
    { keepActive: !!keepActive }
  );
}

function compareNullableNumber(
  a: number | null,
  b: number | null,
  direction: EvaluationDSortDirection
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const diff = a - b;
  return direction === "asc" ? diff : -diff;
}

function compareString(
  a: string,
  b: string,
  direction: EvaluationDSortDirection
): number {
  const diff = a.localeCompare(b, "fr", { sensitivity: "base" });
  return direction === "asc" ? diff : -diff;
}

function compareNumber(
  a: number,
  b: number,
  direction: EvaluationDSortDirection
): number {
  const diff = a - b;
  return direction === "asc" ? diff : -diff;
}

export function getDefaultSortDirection(column: EvaluationDSortColumn): EvaluationDSortDirection {
  if (column === "membre" || column === "role") return "asc";
  return "desc";
}

export function sortEvaluationDMembers(
  members: MemberEvaluationData[],
  column: EvaluationDSortColumn,
  direction: EvaluationDSortDirection,
  ctx: EvaluationDSortContext
): MemberEvaluationData[] {
  const sorted = [...members];
  sorted.sort((a, b) => {
    let comparison = 0;

    switch (column) {
      case "membre":
        comparison = compareString(a.displayName, b.displayName, direction);
        break;
      case "role":
        comparison = compareString(
          getRoleBadgeLabel(getEffectiveRole(a, ctx)),
          getRoleBadgeLabel(getEffectiveRole(b, ctx)),
          direction
        );
        break;
      case "anciennete": {
        const daysA = getMemberHistoryDaysForMonth(ctx.selectedMonth, a.createdAt) ?? -1;
        const daysB = getMemberHistoryDaysForMonth(ctx.selectedMonth, b.createdAt) ?? -1;
        comparison = compareNumber(daysA, daysB, direction);
        break;
      }
      case "fiabilite":
        comparison = compareNumber(getReliabilityRank(a), getReliabilityRank(b), direction);
        break;
      case "entraide":
        comparison = compareNumber(getEntraideValue(a), getEntraideValue(b), direction);
        break;
      case "spotlight":
        comparison = compareNumber(a.spotlightPoints, b.spotlightPoints, direction);
        break;
      case "raids":
        comparison = compareNumber(a.raidsPoints, b.raidsPoints, direction);
        break;
      case "discord":
        comparison = compareNumber(a.discordPoints, b.discordPoints, direction);
        break;
      case "events":
        comparison = compareNumber(a.eventsPoints, b.eventsPoints, direction);
        break;
      case "follow":
        comparison = compareNumber(a.followPoints, b.followPoints, direction);
        break;
      case "horsBonus":
        comparison = compareNumber(a.totalHorsBonus, b.totalHorsBonus, direction);
        break;
      case "bonus":
        comparison = compareNumber(getMemberBonusTotal(a, ctx), getMemberBonusTotal(b, ctx), direction);
        break;
      case "note":
      case "retenue":
        comparison = compareNumber(getRetainedFinalScore(a, ctx), getRetainedFinalScore(b, ctx), direction);
        break;
      case "deltaM1":
        return compareNullableNumber(getDeltaM1(a, ctx), getDeltaM1(b, ctx), direction);
      case "delta3M":
        return compareNullableNumber(getDelta3M(a, ctx), getDelta3M(b, ctx), direction);
      case "actif": {
        const activeA = getEffectiveIsActive(a, ctx) ? 1 : 0;
        const activeB = getEffectiveIsActive(b, ctx) ? 1 : 0;
        comparison = compareNumber(activeA, activeB, direction);
        break;
      }
      case "auto": {
        const statusA = getEffectiveAutoSignal(a, ctx);
        const statusB = getEffectiveAutoSignal(b, ctx);
        comparison = compareNumber(AUTO_SIGNAL_RANK[statusA], AUTO_SIGNAL_RANK[statusB], direction);
        break;
      }
    }

    if (comparison !== 0) return comparison;
    return compareString(a.displayName, b.displayName, "asc");
  });

  return sorted;
}
