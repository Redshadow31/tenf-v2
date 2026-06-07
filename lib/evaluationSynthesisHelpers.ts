// Helpers pour calculer les notes et totaux de la synthèse d'évaluation

import { TIMEZONE_BONUS_POINTS } from "@/lib/evaluationBonusHelpers";
import { COMMUNITY_EVENT_MAX_POINTS } from "@/lib/evaluationCommunityEvents";

/** Seuils VIP progressifs selon l'ancienneté (jours d'historique TENF). */
export const VIP_THRESHOLD_JUNIOR = 10;
export const VIP_THRESHOLD_MID = 12;
export const VIP_THRESHOLD_SENIOR = 15;
/** Palier max — rétrocompat affichage agrégé. */
export const VIP_FINAL_SCORE_THRESHOLD = VIP_THRESHOLD_SENIOR;

export const VIP_HISTORY_DAYS_MID = 31;
export const VIP_HISTORY_DAYS_SENIOR = 61;

/** Seuil « à surveiller » sur la note finale /32. */
export const SURVEILLER_FINAL_SCORE_THRESHOLD = 5;

/** Bonus auto si moyenne (Discord + Spotlight + Events + Follow) > 4. */
export const ENGAGEMENT_AVERAGE_BONUS_POINTS = 2;
export const ENGAGEMENT_AVERAGE_BONUS_THRESHOLD = 4;

export const MODERATION_BONUS_MAX = 5;
export const EVALUATION_MANUAL_BONUS_MAX = TIMEZONE_BONUS_POINTS + MODERATION_BONUS_MAX;
export const EVALUATION_BONUS_MAX =
  EVALUATION_MANUAL_BONUS_MAX + ENGAGEMENT_AVERAGE_BONUS_POINTS;
export const FINAL_SCORE_MAX = 25 + EVALUATION_BONUS_MAX;

/**
 * Calcule les points Spotlight selon la logique :
 * Points = (nombre de présences / nombre total de spotlights) * 5, arrondi
 */
export function calculateSpotlightPoints(presences: number, totalSpotlights: number): number {
  if (totalSpotlights === 0) return 0;
  const rate = (presences / totalSpotlights) * 5;
  return Math.round(rate); // Arrondir à l'entier le plus proche
}

/**
 * Calcule les points Raids selon la logique :
 * - 0 raid fait = 0 point
 * - 1-2 raids faits = 1 point
 * - 3 raids faits = 2 points
 * - 4 raids faits = 3 points
 * - 5 raids faits = 4 points
 * - 6+ raids faits = 5 points (sur 5)
 */
export function calculateRaidPoints(raidsDone: number): number {
  if (raidsDone === 0) return 0;
  if (raidsDone >= 1 && raidsDone <= 2) return 1;
  if (raidsDone === 3) return 2;
  if (raidsDone === 4) return 3;
  if (raidsDone === 5) return 4;
  if (raidsDone >= 6) return 5;
  return 0;
}

/**
 * Calcule le total hors bonus
 * Spotlight (/5) + Raids (/5) + Discord (/5) + Events (/6 → /5) + Follow (/5) = /25
 */
export function calculateTotalHorsBonus(
  spotlight: number, // /5
  raids: number, // /5
  discord: number, // /5
  events: number, // /6
  follow: number // /5
): { total: number; max: number; eventsNormalized: number } {
  const eventsNormalized = (events / COMMUNITY_EVENT_MAX_POINTS) * 5;

  const total = spotlight + raids + discord + eventsNormalized + follow;
  const max = 25;

  return { total, max, eventsNormalized };
}

/** +2 si moyenne Discord, Spotlight, Events (/6) et Follow > 4. */
export function calculateEngagementAverageBonus(
  spotlight: number,
  discord: number,
  events: number,
  follow: number
): number {
  const average = (spotlight + discord + events + follow) / 4;
  return average > ENGAGEMENT_AVERAGE_BONUS_THRESHOLD ? ENGAGEMENT_AVERAGE_BONUS_POINTS : 0;
}

/**
 * Calcule le total avec bonus
 * Total hors bonus + décalage + modération + bonus moyenne engagement
 */
export function calculateTotalAvecBonus(
  totalHorsBonus: number,
  timezoneBonus: number,
  moderationBonus: number,
  engagementAverageBonus = 0
): { total: number; max: number } {
  const total = totalHorsBonus + timezoneBonus + moderationBonus + engagementAverageBonus;
  const max = FINAL_SCORE_MAX;

  return { total, max };
}

/**
 * Jours d'historique entre la date d'intégration et une date de référence.
 */
export function getMemberHistoryDays(
  referenceDate?: Date | string | null,
  asOf: Date = new Date()
): number | null {
  if (!referenceDate) return null;
  const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (Number.isNaN(ref.getTime())) return null;
  const diffMs = asOf.getTime() - ref.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** Jours d'historique au 1er jour du mois suivant le mois évalué. */
export function getMemberHistoryDaysForMonth(
  monthKey: string,
  referenceDate?: Date | string | null
): number | null {
  return getMemberHistoryDays(referenceDate, getFirstDayOfNextMonth(monthKey));
}

/**
 * Seuil VIP /34 selon l'ancienneté :
 * - < 31 j → 10
 * - 31–60 j → 12
 * - ≥ 61 j → 15
 */
export function resolveVipScoreThreshold(historyDays: number | null): number {
  if (historyDays === null) return VIP_THRESHOLD_SENIOR;
  if (historyDays >= VIP_HISTORY_DAYS_SENIOR) return VIP_THRESHOLD_SENIOR;
  if (historyDays >= VIP_HISTORY_DAYS_MID) return VIP_THRESHOLD_MID;
  return VIP_THRESHOLD_JUNIOR;
}

export function resolveVipThresholdForMember(
  createdAt?: string | null,
  monthKey?: string
): number {
  const historyDays = monthKey
    ? getMemberHistoryDaysForMonth(monthKey, createdAt)
    : getMemberHistoryDays(createdAt);
  return resolveVipScoreThreshold(historyDays);
}

export type AutoStatusOptions = {
  vipThreshold?: number;
  historyDays?: number | null;
};

/**
 * Détermine le statut auto basé sur la note finale
 * - VIP si note finale ≥ seuil progressif (10 / 12 / 15)
 * - À surveiller si note finale < 5
 * - Neutre sinon
 */
export function getAutoStatus(
  finalScore: number,
  options?: AutoStatusOptions
): "vip" | "surveiller" | "neutre" {
  const threshold =
    options?.vipThreshold ?? resolveVipScoreThreshold(options?.historyDays ?? null);
  if (finalScore >= threshold) return "vip";
  if (finalScore < SURVEILLER_FINAL_SCORE_THRESHOLD) return "surveiller";
  return "neutre";
}

export function getAutoStatusForMember(
  finalScore: number,
  createdAt?: string | null,
  monthKey?: string
): "vip" | "surveiller" | "neutre" {
  const historyDays = monthKey
    ? getMemberHistoryDaysForMonth(monthKey, createdAt)
    : getMemberHistoryDays(createdAt);
  return getAutoStatus(finalScore, { historyDays });
}

export const VIP_TIER_RULES = [
  { label: "< 31 j d'historique", threshold: VIP_THRESHOLD_JUNIOR, hint: "Premier mois TENF" },
  { label: "31–60 j", threshold: VIP_THRESHOLD_MID, hint: "Ancienneté intermédiaire" },
  { label: "≥ 61 j", threshold: VIP_THRESHOLD_SENIOR, hint: "Profil établi" },
] as const;

/** Résumé court pour toolbars / pilotage. */
export function formatVipTierRulesSummary(): string {
  return VIP_TIER_RULES.map((rule) => `≥${rule.threshold} (${rule.label})`).join(" · ");
}

/**
 * Calcule l'ancienneté en mois/jours depuis une date
 */
export function calculateSeniority(createdAt?: string): string {
  if (!createdAt) return 'Non renseigné';
  
  try {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffMonths > 0) {
      return `${diffMonths} mois`;
    }
    return `${diffDays} jours`;
  } catch (error) {
    return 'Non renseigné';
  }
}

/**
 * Retourne le 1er jour du mois suivant (00:00:00 UTC) pour un monthKey YYYY-MM.
 */
export function getFirstDayOfNextMonth(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map((v) => parseInt(v, 10));
  return new Date(Date.UTC(year, month, 1, 0, 0, 0));
}

/**
 * Vérifie l'éligibilité d'un membre pour la vue progression:
 * ancienneté strictement > 15 jours avant le 1er du mois suivant.
 */
export function isEligibleForProgression(
  monthKey: string,
  integrationDate?: Date | string | null,
  createdAt?: Date | string | null
): boolean {
  const referenceRaw = integrationDate ?? createdAt;
  if (!referenceRaw) return false;

  const referenceDate = referenceRaw instanceof Date ? referenceRaw : new Date(referenceRaw);
  if (Number.isNaN(referenceDate.getTime())) return false;

  const firstOfNextMonth = getFirstDayOfNextMonth(monthKey);
  const diffMs = firstOfNextMonth.getTime() - referenceDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 15;
}


