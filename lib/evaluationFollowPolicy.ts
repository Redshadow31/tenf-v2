/**
 * Politique d'évaluation Follow quand les données staff / snapshot sont absentes.
 * Objectif : ne pas pénaliser à 0/5 un membre non mesurable.
 */

export const FOLLOW_SCORE_MAX = 5;

/** Note neutre imputée si follow non mesurable (ni récompense ni sanction forte). */
export const FOLLOW_NEUTRAL_POINTS = 2.5;

export type FollowEvalStatus = "measured" | "unknown";

export type FollowEvalResolution = {
  status: FollowEvalStatus;
  /** Score réel si mesuré ; 0 si inconnu ou absence confirmée. */
  rawPoints: number;
  /** Score retenu pour la synthèse (/5). */
  adjustedPoints: number;
};

export type ResolveFollowEvalInput = {
  sheetPoints: number;
  snapshotPoints?: number;
  hasSheets: boolean;
  hasSnapshotRow: boolean;
};

/**
 * Résout le statut follow d'un membre pour un mois.
 * - Mesuré : snapshot « ok » ou au moins une feuille staff du mois (même si 0/5).
 * - Inconnu : aucune source exploitable → note neutre imputée.
 */
export function resolveFollowEvalForMember(input: ResolveFollowEvalInput): FollowEvalResolution {
  const { sheetPoints, snapshotPoints, hasSheets, hasSnapshotRow } = input;

  if (snapshotPoints !== undefined) {
    return {
      status: "measured",
      rawPoints: snapshotPoints,
      adjustedPoints: snapshotPoints,
    };
  }

  if (hasSheets) {
    return {
      status: "measured",
      rawPoints: sheetPoints,
      adjustedPoints: sheetPoints,
    };
  }

  if (hasSnapshotRow) {
    return {
      status: "measured",
      rawPoints: 0,
      adjustedPoints: 0,
    };
  }

  return {
    status: "unknown",
    rawPoints: 0,
    adjustedPoints: FOLLOW_NEUTRAL_POINTS,
  };
}

/** Moyenne engagement : exclut le follow du dénominateur s'il est inconnu. */
export function calculateEngagementAverageBonusWithFollowPolicy(
  spotlight: number,
  discord: number,
  events: number,
  followAdjusted: number,
  followStatus: FollowEvalStatus,
  threshold = 4,
  bonusPoints = 2
): number {
  const parts =
    followStatus === "unknown"
      ? [spotlight, discord, events]
      : [spotlight, discord, events, followAdjusted];
  if (parts.length === 0) return 0;
  const average = parts.reduce((sum, value) => sum + value, 0) / parts.length;
  return average > threshold ? bonusPoints : 0;
}

export function formatFollowEvalLabel(resolution: FollowEvalResolution): string {
  if (resolution.status === "unknown") {
    return `Non mesuré · neutre ${FOLLOW_NEUTRAL_POINTS}/${FOLLOW_SCORE_MAX}`;
  }
  if (resolution.rawPoints === 0) {
    return `0/${FOLLOW_SCORE_MAX} (mesuré)`;
  }
  return `${resolution.adjustedPoints.toFixed(2)}/${FOLLOW_SCORE_MAX}`;
}

export const FOLLOW_POLICY_SUMMARY =
  "Sans feuille staff ni snapshot pour le membre : follow neutre à 2,5/5 (non pénalisant). Le bonus moyenne engagement ignore le follow inconnu.";
