export interface EvaluationV2Config {
  bonusCap: number;
}

export const EVALUATION_V2_CONFIG: EvaluationV2Config = {
  bonusCap: 5,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toMonthKey(dateLike: Date | string): string {
  if (typeof dateLike === "string") {
    if (/^\d{4}-\d{2}$/.test(dateLike)) return dateLike;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateLike)) return dateLike.slice(0, 7);
    const parsed = new Date(dateLike);
    return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return `${dateLike.getUTCFullYear()}-${String(dateLike.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isoDay(dateLike: Date | string): string {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  return date.toISOString().slice(0, 10);
}

export function weekBucketInMonth(dateLike: Date | string): number {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  const day = date.getUTCDate();
  return Math.floor((day - 1) / 7) + 1; // 1..5
}

export function normalizeEventsToFive(eventsPointsOverTwo: number): number {
  return round2(clamp((eventsPointsOverTwo / 2) * 5, 0, 5));
}

export function computeBloc1VisibleSupport(input: {
  raidsOverTwo: number;
  spotlightOverTwo: number;
  eventsOverOne: number;
}): { value: number } {
  const value = round2(clamp(input.raidsOverTwo + input.spotlightOverTwo + input.eventsOverOne, 0, 5));
  return { value };
}

export function computeParticipationUtile(input: {
  noteEcrit: number;
  noteVocal: number;
  nbMessages: number;
  nbVocalMinutes: number;
}): number {
  const { noteEcrit, noteVocal, nbMessages, nbVocalMinutes } = input;
  if (noteEcrit <= 0 && noteVocal <= 0) return 0;

  const balancePenalty = Math.abs(noteEcrit - noteVocal) * 0.6;
  const base = (Math.max(noteEcrit, noteVocal) * 0.65) + (Math.min(noteEcrit, noteVocal) * 0.35);
  const volumeBoost = Math.min(1, (nbMessages / 400) + (nbVocalMinutes / 240));
  return round2(clamp(base - balancePenalty + volumeBoost, 0, 5));
}

export function computeBloc2Discord(input: {
  noteEcrit: number;
  noteVocal: number;
  participationUtile: number;
}): { value: number } {
  const value = round2(
    clamp((input.noteEcrit + input.noteVocal + input.participationUtile) / 3, 0, 5)
  );
  return { value };
}

export function scoreByThresholds(value: number, thresholds: number[]): number {
  // thresholds length 5 -> returns 0..5
  let score = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (value >= thresholds[i]) score = i + 1;
  }
  return score;
}

export function computeBloc3Regularite(input: {
  followScore: number;
  networkParticipationScore: number;
  entraideScore: number;
}): {
  value: number;
  followScore: number;
  networkParticipationScore: number;
  entraideScore: number;
} {
  const follow = round2(clamp(input.followScore, 0, 5));
  const network = round2(clamp(input.networkParticipationScore, 0, 5));
  const entraide = round2(clamp(input.entraideScore, 0, 5));
  const value = round2(clamp((follow + network + entraide) / 3, 0, 5));
  return {
    value,
    followScore: follow,
    networkParticipationScore: network,
    entraideScore: entraide,
  };
}

export function computeReliabilityScore(input: {
  regularityScore: number;
  obligationsScore: number;
  behaviorScore: number;
  responsivenessScore: number;
  abusePenaltyScore: number;
}): number {
  const base = (input.regularityScore + input.obligationsScore + input.behaviorScore + input.responsivenessScore) / 4;
  return round2(clamp(base - input.abusePenaltyScore, 0, 5));
}

export function computeBloc4Implication(input: {
  regularityScore: number;
  obligationsScore: number;
  behaviorScore: number;
  responsivenessScore: number;
  abusePenaltyScore: number;
  reliabilityScore: number;
  staffValidatedFinalNote?: number | null;
}): {
  value: number;
  regularityScore: number;
  obligationsScore: number;
  behaviorScore: number;
  responsivenessScore: number;
  abusePenaltyScore: number;
  staffCaseScore?: number;
} {
  const regularityScore = round2(clamp(input.regularityScore, 0, 5));
  const obligationsScore = round2(clamp(input.obligationsScore, 0, 5));
  const behaviorScore = round2(clamp(input.behaviorScore, 0, 5));
  const responsivenessScore = round2(clamp(input.responsivenessScore, 0, 5));
  const abusePenaltyScore = round2(clamp(input.abusePenaltyScore, 0, 5));

  let base = round2(
    clamp(
      (regularityScore + obligationsScore + behaviorScore + responsivenessScore + input.reliabilityScore) / 5 - abusePenaltyScore,
      0,
      5,
    ),
  );

  let staffCaseScore: number | undefined;
  if (typeof input.staffValidatedFinalNote === "number" && Number.isFinite(input.staffValidatedFinalNote)) {
    // Compatibilité ancienne note staff (/32), projetée en /5.
    staffCaseScore = round2(clamp((input.staffValidatedFinalNote / 32) * 5, 0, 5));
    base = round2(clamp((base * 0.8) + (staffCaseScore * 0.2), 0, 5));
  }

  return {
    value: base,
    regularityScore,
    obligationsScore,
    behaviorScore,
    responsivenessScore,
    abusePenaltyScore,
    staffCaseScore,
  };
}

export function computeBonusCapped(input: {
  timezoneBonusEnabled: boolean;
  timezoneBonusPoints?: number;
  moderationBonus: number;
  moderationCap?: number;
  bonusCap?: number;
}): { raw: number; capped: number } {
  const timezone = clamp(
    typeof input.timezoneBonusPoints === "number"
      ? input.timezoneBonusPoints
      : input.timezoneBonusEnabled
        ? 2
        : 0,
    0,
    2,
  );
  const moderation = clamp(input.moderationBonus || 0, 0, input.moderationCap ?? 3);
  const raw = timezone + moderation;
  const capped = round2(clamp(raw, 0, input.bonusCap ?? EVALUATION_V2_CONFIG.bonusCap));
  return { raw: round2(raw), capped };
}

// Legacy v2 system (kept in parallel during migration)
export function computeLegacyBloc1VisibleSupport(input: {
  raids: number;
  spotlight: number;
  eventsOverFive: number;
}): { value: number } {
  const value = round2(clamp((input.raids + input.spotlight + input.eventsOverFive) / 3, 0, 5));
  return { value };
}

export function computeLegacyBloc3Regularite(input: {
  distinctActiveDays: number;
  activeWeeks: number;
  actionDiversityCount: number;
}): {
  value: number;
  repartitionScore: number;
  weeksScore: number;
  diversityScore: number;
} {
  const repartitionScore = scoreByThresholds(input.distinctActiveDays, [1, 3, 6, 9, 13]);
  const weeksScore = scoreByThresholds(input.activeWeeks, [1, 2, 3, 4, 5]);
  const diversityScore = clamp(input.actionDiversityCount, 0, 5);
  const value = round2(clamp((repartitionScore + weeksScore + diversityScore) / 3, 0, 5));
  return { value, repartitionScore, weeksScore, diversityScore };
}

export function computeLegacyReliabilityScore(input: {
  hasDiscordIdentity: boolean;
  hasAnyAction: boolean;
  hasFollowSignal: boolean;
  hasRaidsOrEventsSignal: boolean;
  hasAtLeastTwoSignals: boolean;
}): number {
  const checks = [
    input.hasDiscordIdentity,
    input.hasAnyAction,
    input.hasFollowSignal,
    input.hasRaidsOrEventsSignal,
    input.hasAtLeastTwoSignals,
  ];
  const passed = checks.filter(Boolean).length;
  return round2((passed / checks.length) * 5);
}

export function computeLegacyBloc4Implication(input: {
  bloc1: number;
  bloc2: number;
  bloc3: number;
  reliabilityScore: number;
  staffValidatedFinalNote?: number | null;
}): { value: number; synthesisScore: number; staffCaseScore?: number } {
  const synthesisScore = round2(clamp((input.bloc1 + input.bloc2 + input.bloc3) / 3, 0, 5));
  let base = round2(clamp((synthesisScore * 0.7) + (input.reliabilityScore * 0.3), 0, 5));

  let staffCaseScore: number | undefined;
  if (typeof input.staffValidatedFinalNote === "number" && Number.isFinite(input.staffValidatedFinalNote)) {
    staffCaseScore = round2(clamp((input.staffValidatedFinalNote / 32) * 5, 0, 5));
    base = round2(clamp((base * 0.8) + (staffCaseScore * 0.2), 0, 5));
  }
  return { value: base, synthesisScore, staffCaseScore };
}

export function computeEvaluationV2Total(input: {
  bloc1: number;
  bloc2: number;
  bloc3: number;
  bloc4: number;
  bonusCapped: number;
}): {
  totalWithoutBonus: number; // /20
  totalWithBonus: number; // /25
} {
  const totalWithoutBonus = round2(clamp(input.bloc1 + input.bloc2 + input.bloc3 + input.bloc4, 0, 20));
  const totalWithBonus = round2(clamp(totalWithoutBonus + input.bonusCapped, 0, 25));
  return { totalWithoutBonus, totalWithBonus };
}
