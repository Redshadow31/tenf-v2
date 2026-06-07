import type { MonthFinalScoreEntry } from "@/lib/admin/evaluation-d/evaluationDMonthScores";
import {
  getMemberHistoryDaysForMonth,
  resolveVipThresholdForMember,
  SURVEILLER_FINAL_SCORE_THRESHOLD,
  VIP_HISTORY_DAYS_SENIOR,
} from "@/lib/evaluationSynthesisHelpers";

/** Mois consécutifs < 5 pour le signal « à surveiller » (profil ≥ 61 j). */
export const SURVEILLER_CONSECUTIVE_MONTHS = 2;

/** Mois consécutifs < 5 pour passage automatique en Communauté. */
export const AUTO_COMMUNAUTE_CONSECUTIVE_MONTHS = 3;

export type CommunityPassageBaselines = {
  m1: Record<string, MonthFinalScoreEntry>;
  m2: Record<string, MonthFinalScoreEntry>;
  m3: Record<string, MonthFinalScoreEntry>;
};

export type CommunityPassageResolution = {
  consecutiveLowMonths: number;
  /** Profil établi (≥ 61 j) — note prise en compte pour surveillance / passage. */
  noteSignificant: boolean;
  surveiller: boolean;
  autoCommunaute: boolean;
  keepActiveAvailable: boolean;
};

export type EvaluationAutoSignal =
  | "vip"
  | "surveiller"
  | "passage_communaute"
  | "note_non_significative"
  | "neutre";

function isCountablePastMonth(entry: MonthFinalScoreEntry | undefined): entry is MonthFinalScoreEntry {
  if (!entry) return false;
  return entry.source === "manual" || entry.hasActivity;
}

/** Compte les mois consécutifs < seuil en remontant depuis le mois courant. */
export function countConsecutiveLowScoreMonths(
  currentScore: number,
  normalizedLogin: string,
  baselines: CommunityPassageBaselines
): number {
  const months: number[] = [currentScore];
  const pastEntries = [
    baselines.m1[normalizedLogin],
    baselines.m2[normalizedLogin],
    baselines.m3[normalizedLogin],
  ];

  for (const entry of pastEntries) {
    if (!isCountablePastMonth(entry)) break;
    months.push(entry.score);
  }

  let count = 0;
  for (const score of months) {
    if (score >= SURVEILLER_FINAL_SCORE_THRESHOLD) break;
    count++;
  }
  return count;
}

export function resolveCommunityPassage(
  createdAt: string | null | undefined,
  monthKey: string,
  currentScore: number,
  normalizedLogin: string,
  baselines: CommunityPassageBaselines
): CommunityPassageResolution {
  const historyDays = getMemberHistoryDaysForMonth(monthKey, createdAt);
  const noteSignificant = historyDays !== null && historyDays >= VIP_HISTORY_DAYS_SENIOR;
  const consecutiveLowMonths = countConsecutiveLowScoreMonths(
    currentScore,
    normalizedLogin,
    baselines
  );

  if (!noteSignificant) {
    return {
      consecutiveLowMonths,
      noteSignificant: false,
      surveiller: false,
      autoCommunaute: false,
      keepActiveAvailable: false,
    };
  }

  const surveiller = consecutiveLowMonths >= SURVEILLER_CONSECUTIVE_MONTHS;
  const autoCommunaute = consecutiveLowMonths >= AUTO_COMMUNAUTE_CONSECUTIVE_MONTHS;

  return {
    consecutiveLowMonths,
    noteSignificant: true,
    surveiller,
    autoCommunaute,
    keepActiveAvailable: autoCommunaute,
  };
}

export function resolveEvaluationAutoSignal(
  finalScore: number,
  createdAt: string | null | undefined,
  monthKey: string,
  normalizedLogin: string,
  baselines: CommunityPassageBaselines,
  options?: { keepActive?: boolean }
): EvaluationAutoSignal {
  const vipThreshold = resolveVipThresholdForMember(createdAt, monthKey);
  if (finalScore >= vipThreshold) return "vip";

  const passage = resolveCommunityPassage(
    createdAt,
    monthKey,
    finalScore,
    normalizedLogin,
    baselines
  );

  if (!passage.noteSignificant) return "note_non_significative";
  if (passage.autoCommunaute && !options?.keepActive) return "passage_communaute";
  if (passage.surveiller) return "surveiller";
  return "neutre";
}

export function formatCommunityPassageHint(resolution: CommunityPassageResolution): string {
  if (!resolution.noteSignificant) {
    return `< ${VIP_HISTORY_DAYS_SENIOR} j — note non significative pour passage Communauté`;
  }
  if (resolution.autoCommunaute) {
    return `${resolution.consecutiveLowMonths} mois < ${SURVEILLER_FINAL_SCORE_THRESHOLD} — passage auto Communauté à l'enregistrement`;
  }
  if (resolution.surveiller) {
    return `${resolution.consecutiveLowMonths} mois < ${SURVEILLER_FINAL_SCORE_THRESHOLD} consécutifs`;
  }
  return "";
}
