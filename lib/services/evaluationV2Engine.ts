import { calculateNoteEcrit, calculateNoteVocal } from "@/lib/discordEngagement";
import {
  clamp,
  computeBloc1VisibleSupport,
  computeBloc2Discord,
  computeBloc3Regularite,
  computeBloc4Implication,
  computeBonusCapped,
  computeEvaluationV2Total,
  computeParticipationUtile,
  computeReliabilityScore,
  round2,
  scoreByThresholds,
} from "@/lib/evaluationV2Helpers";
import type { EvaluationV2ManualOverride } from "@/lib/evaluationV2ManualStorage";
import type { EvaluationEvidence } from "@/lib/evaluationV2EvidenceStorage";
import type { MonthlyEvaluationSummaryRow } from "@/lib/evaluationV2SummaryStorage";

export interface MonthlyEvaluationInput {
  monthKey: string;
  twitchLogin: string;
  isActive: boolean;
  hasDiscordIdentity: boolean;
  raidsDone: number;
  spotlightPresences: number;
  spotlightTotal: number;
  regularEventPresences: number;
  regularEventsTotal: number;
  nbMessages: number;
  nbVocalMinutes: number;
  followScore: number;
  hasFollowData: boolean;
  actionDayCount: number;
  activeWeekCount: number;
  staffValidatedFinalNote?: number | null;
  timezoneBonusEnabled: boolean;
  timezoneBonusPoints?: number;
  moderationBonus: number;
  manualOverride?: EvaluationV2ManualOverride;
  discordSource?: {
    used: "primary" | "fallback" | "none";
    primaryAvailable: boolean;
    fallbackAvailable: boolean;
  };
  followSource?: {
    used: "sheet" | "snapshot" | "none";
    sheetAvailable: boolean;
    snapshotAvailable: boolean;
  };
}

export interface MonthlyEvaluationEngineResult {
  blocs: {
    bloc1: number;
    bloc2: number;
    bloc3: number;
    bloc4: number;
  };
  details: {
    bloc1: {
      raids: number;
      spotlight: number;
      events: number;
    };
    bloc2: {
      noteEcrit: number;
      noteVocal: number;
      participationUtile: number;
      nbMessages: number;
      nbVocalMinutes: number;
    };
    bloc3: {
      followScore: number;
      networkParticipationScore: number;
      entraideScore: number;
      networkSignalCount: number;
    };
    bloc4: {
      regularityScore: number;
      obligationsScore: number;
      behaviorScore: number;
      responsivenessScore: number;
      abusePenaltyScore: number;
      reliabilityScore: number;
      staffCaseScore?: number;
    };
    bonus: {
      timezoneBonusPoints: number;
      moderationBonus: number;
      raw: number;
      capped: number;
    };
    autoScores: {
      bloc1: number;
      bloc2: number;
      bloc3: number;
      bloc4: number;
      bonus: number;
      totalWithoutBonus: number;
      totalWithBonus: number;
    };
    sourceConfidence: {
      bloc1: number;
      bloc2: number;
      bloc3: number;
      bloc4: number;
      global: number;
      discordSourceUsed: "primary" | "fallback" | "none";
      followSourceUsed: "sheet" | "snapshot" | "none";
    };
  };
  totals: {
    totalWithoutBonus: number;
    totalWithBonus: number;
  };
  alerts: string[];
  summary: MonthlyEvaluationSummaryRow;
  evidences: EvaluationEvidence[];
}

function pushAlert(alerts: string[], condition: boolean, code: string): void {
  if (condition) alerts.push(code);
}

export function computeMonthlyEvaluation(input: MonthlyEvaluationInput): MonthlyEvaluationEngineResult {
  const discordSource = input.discordSource || {
    used: "none" as const,
    primaryAvailable: false,
    fallbackAvailable: false,
  };
  const followSource = input.followSource || {
    used: "none" as const,
    sheetAvailable: false,
    snapshotAvailable: false,
  };

  const raidsOverTwo = round2(
    clamp(
      input.raidsDone >= 6 ? 2 : input.raidsDone === 5 ? 1.5 : input.raidsDone >= 3 ? 1 : input.raidsDone >= 1 ? 0.5 : 0,
      0,
      2,
    ),
  );
  const spotlightOverTwo =
    input.spotlightTotal > 0 ? round2(clamp((input.spotlightPresences / input.spotlightTotal) * 2, 0, 2)) : 0;
  const eventsOverOne =
    input.regularEventsTotal > 0 ? round2(clamp((input.regularEventPresences / input.regularEventsTotal) * 1, 0, 1)) : 0;

  const bloc1Computed = computeBloc1VisibleSupport({
    raidsOverTwo,
    spotlightOverTwo,
    eventsOverOne,
  }).value;

  const noteEcrit = calculateNoteEcrit(input.nbMessages);
  const noteVocal = calculateNoteVocal(input.nbVocalMinutes);
  const participationUtile = computeParticipationUtile({
    noteEcrit,
    noteVocal,
    nbMessages: input.nbMessages,
    nbVocalMinutes: input.nbVocalMinutes,
  });

  const bloc2Computed = computeBloc2Discord({
    noteEcrit,
    noteVocal,
    participationUtile,
  }).value;

  const networkSignalCount = [
    input.raidsDone > 0,
    input.spotlightPresences > 0,
    input.regularEventPresences > 0,
    noteEcrit > 0 || noteVocal > 0 || participationUtile > 0,
    input.followScore > 0,
  ].filter(Boolean).length;

  const bloc3Info = computeBloc3Regularite({
    followScore: input.followScore,
    networkParticipationScore: round2((networkSignalCount / 5) * 5),
    entraideScore: round2(clamp(networkSignalCount >= 3 ? 5 : networkSignalCount >= 2 ? 3.5 : networkSignalCount >= 1 ? 2 : 0, 0, 5)),
  });

  const regularityByDays = scoreByThresholds(input.actionDayCount, [2, 4, 7, 10, 14]);
  const regularityByWeeks = scoreByThresholds(input.activeWeekCount, [1, 2, 3, 4, 5]);
  const regularityScore = round2((regularityByDays + regularityByWeeks) / 2);
  const obligationsSpotlight =
    input.spotlightTotal > 0 ? round2(clamp((input.spotlightPresences / input.spotlightTotal) * 5, 0, 5)) : null;
  const obligationsEvents =
    input.regularEventsTotal > 0 ? round2(clamp((input.regularEventPresences / input.regularEventsTotal) * 5, 0, 5)) : null;
  const obligationsValues = [obligationsSpotlight, obligationsEvents].filter((v): v is number => v !== null);
  const obligationsScore = obligationsValues.length > 0 ? round2(obligationsValues.reduce((a, b) => a + b, 0) / obligationsValues.length) : 0;
  const behaviorScore = round2(
    clamp(networkSignalCount >= 4 ? 5 : networkSignalCount === 3 ? 4 : networkSignalCount === 2 ? 3 : networkSignalCount === 1 ? 2 : 1, 0, 5),
  );
  const responsivenessScore = round2(
    clamp(
      input.hasDiscordIdentity
        ? noteEcrit > 0 || noteVocal > 0 || participationUtile > 0
          ? 5
          : 3
        : noteEcrit > 0 || noteVocal > 0 || participationUtile > 0
          ? 3
          : 1,
      0,
      5,
    ),
  );
  const abusePenaltyScore = 0;
  const reliabilityScore = computeReliabilityScore({
    regularityScore,
    obligationsScore,
    behaviorScore,
    responsivenessScore,
    abusePenaltyScore,
  });

  const bloc4Info = computeBloc4Implication({
    regularityScore,
    obligationsScore,
    behaviorScore,
    responsivenessScore,
    abusePenaltyScore,
    reliabilityScore,
    staffValidatedFinalNote: input.staffValidatedFinalNote,
  });

  const bonusComputed = computeBonusCapped({
    timezoneBonusEnabled: input.timezoneBonusEnabled,
    timezoneBonusPoints: input.timezoneBonusPoints,
    moderationBonus: input.moderationBonus,
  });

  const autoTotals = computeEvaluationV2Total({
    bloc1: bloc1Computed,
    bloc2: bloc2Computed,
    bloc3: bloc3Info.value,
    bloc4: bloc4Info.value,
    bonusCapped: bonusComputed.capped,
  });

  const manual = input.manualOverride;
  const bloc1 = manual?.bloc1 !== undefined ? round2(clamp(Number(manual.bloc1), 0, 5)) : bloc1Computed;
  const bloc2 = manual?.bloc2 !== undefined ? round2(clamp(Number(manual.bloc2), 0, 5)) : bloc2Computed;
  const bloc3 = manual?.bloc3 !== undefined ? round2(clamp(Number(manual.bloc3), 0, 5)) : bloc3Info.value;
  const bloc4 = manual?.bloc4 !== undefined ? round2(clamp(Number(manual.bloc4), 0, 5)) : bloc4Info.value;
  const bonusCapped = manual?.bonus !== undefined ? round2(clamp(Number(manual.bonus), 0, 5)) : bonusComputed.capped;

  const totals = computeEvaluationV2Total({
    bloc1,
    bloc2,
    bloc3,
    bloc4,
    bonusCapped,
  });

  const alerts: string[] = [];
  const hasDiscordSignals = noteEcrit > 0 || noteVocal > 0 || participationUtile > 0;
  const hasAnySignal = input.raidsDone > 0 || input.spotlightPresences > 0 || input.regularEventPresences > 0 || hasDiscordSignals || input.followScore > 0;
  const hasEvents = input.spotlightTotal > 0 || input.regularEventsTotal > 0;
  const overriddenFields = ["bloc1", "bloc2", "bloc3", "bloc4", "bonus"].filter((key) => (manual as any)?.[key] !== undefined);

  pushAlert(alerts, !hasAnySignal, "donnee_manquante");
  pushAlert(alerts, !input.hasFollowData, "follow_indisponible");
  pushAlert(alerts, !hasEvents, "mois_incomplet");
  pushAlert(alerts, overriddenFields.length > 0, "override_manuel");
  pushAlert(alerts, !input.isActive, "membre_non_eligible");
  pushAlert(alerts, totals.totalWithBonus < totals.totalWithoutBonus || totals.totalWithBonus > 25, "score_incoherent");

  const summary: MonthlyEvaluationSummaryRow = {
    twitchLogin: input.twitchLogin,
    monthKey: input.monthKey,
    spotlightPoints: spotlightOverTwo,
    raidsPoints: raidsOverTwo,
    discordPoints: bloc2,
    eventsPoints: eventsOverOne,
    networkPoints: bloc3,
    reliabilityPoints: bloc4,
    equityBonus: input.timezoneBonusPoints ?? (input.timezoneBonusEnabled ? 2 : 0),
    staffBonus: round2(clamp(input.moderationBonus, 0, 3)),
    totalBase: totals.totalWithoutBonus,
    totalBonus: bonusCapped,
    finalTotal: totals.totalWithBonus,
    status: alerts.includes("score_incoherent") ? "error" : alerts.length > 0 ? "warning" : "ok",
    sourceHealth: {
      hasEvents,
      hasFollowData: input.hasFollowData,
      hasDiscordSignals,
      hasManualOverride: overriddenFields.length > 0,
      ...(discordSource
        ? {
            discordSourceUsed: discordSource.used,
            discordPrimaryAvailable: discordSource.primaryAvailable,
            discordFallbackAvailable: discordSource.fallbackAvailable,
          }
        : {}),
      ...(followSource
        ? {
            followSourceUsed: followSource.used,
            followSheetAvailable: followSource.sheetAvailable,
            followSnapshotAvailable: followSource.snapshotAvailable,
          }
        : {}),
    },
    overriddenFields,
    finalizedAt: new Date().toISOString(),
    alerts,
  };

  const nowIso = new Date().toISOString();
  const evidences: EvaluationEvidence[] = [
    {
      memberId: input.twitchLogin,
      monthKey: input.monthKey,
      type: "raid",
      source: "eventsub",
      timestamp: nowIso,
      value: input.raidsDone,
      status: "auto_validated",
      metadata: { scoreOverTwo: raidsOverTwo },
    },
    {
      memberId: input.twitchLogin,
      monthKey: input.monthKey,
      type: "spotlight",
      source: "manual_validation",
      timestamp: nowIso,
      value: input.spotlightPresences,
      status: "auto_validated",
      metadata: { total: input.spotlightTotal, scoreOverTwo: spotlightOverTwo },
    },
    {
      memberId: input.twitchLogin,
      monthKey: input.monthKey,
      type: "event",
      source: "manual_validation",
      timestamp: nowIso,
      value: input.regularEventPresences,
      status: "auto_validated",
      metadata: { total: input.regularEventsTotal, scoreOverOne: eventsOverOne },
    },
    {
      memberId: input.twitchLogin,
      monthKey: input.monthKey,
      type: "discord_text",
      source: "discord_bot",
      timestamp: nowIso,
      value: input.nbMessages,
      status: "auto_validated",
      metadata: { noteEcrit },
    },
    {
      memberId: input.twitchLogin,
      monthKey: input.monthKey,
      type: "discord_voice",
      source: "discord_bot",
      timestamp: nowIso,
      value: input.nbVocalMinutes,
      status: "auto_validated",
      metadata: { noteVocal },
    },
    {
      memberId: input.twitchLogin,
      monthKey: input.monthKey,
      type: "follow",
      source: "manual_validation",
      timestamp: nowIso,
      value: input.followScore,
      status: "auto_validated",
      metadata: { hasFollowData: input.hasFollowData },
    },
    {
      memberId: input.twitchLogin,
      monthKey: input.monthKey,
      type: "network_participation",
      source: "supabase",
      timestamp: nowIso,
      value: networkSignalCount,
      status: "auto_validated",
      metadata: { participationScore: bloc3Info.networkParticipationScore, entraideScore: bloc3Info.entraideScore },
    },
  ];

  const bloc1Confidence = round2(
    clamp(
      ((input.raidsDone >= 0 ? 1 : 0) + (input.spotlightTotal > 0 || input.regularEventsTotal > 0 ? 1 : 0)) / 2 * 100,
      0,
      100,
    ),
  );
  const bloc2Confidence = round2(
    clamp(
      discordSource.used === "primary"
        ? 100
        : discordSource.used === "fallback"
          ? 75
          : 25,
      0,
      100,
    ),
  );
  const bloc3Confidence = round2(
    clamp(
      followSource.used === "sheet"
        ? 100
        : followSource.used === "snapshot"
          ? 80
          : 30,
      0,
      100,
    ),
  );
  const bloc4Confidence = round2(
    clamp(
      ((input.actionDayCount > 0 || input.activeWeekCount > 0 ? 50 : 20) +
        (input.spotlightTotal > 0 || input.regularEventsTotal > 0 ? 25 : 5) +
        (hasDiscordSignals ? 25 : 10)),
      0,
      100,
    ),
  );
  const globalConfidence = round2((bloc1Confidence + bloc2Confidence + bloc3Confidence + bloc4Confidence) / 4);

  return {
    blocs: { bloc1, bloc2, bloc3, bloc4 },
    details: {
      bloc1: { raids: raidsOverTwo, spotlight: spotlightOverTwo, events: eventsOverOne },
      bloc2: { noteEcrit, noteVocal, participationUtile, nbMessages: input.nbMessages, nbVocalMinutes: input.nbVocalMinutes },
      bloc3: {
        followScore: bloc3Info.followScore,
        networkParticipationScore: bloc3Info.networkParticipationScore,
        entraideScore: bloc3Info.entraideScore,
        networkSignalCount,
      },
      bloc4: {
        regularityScore: bloc4Info.regularityScore,
        obligationsScore: bloc4Info.obligationsScore,
        behaviorScore: bloc4Info.behaviorScore,
        responsivenessScore: bloc4Info.responsivenessScore,
        abusePenaltyScore: bloc4Info.abusePenaltyScore,
        reliabilityScore,
        staffCaseScore: bloc4Info.staffCaseScore,
      },
      bonus: {
        timezoneBonusPoints: summary.equityBonus,
        moderationBonus: summary.staffBonus,
        raw: bonusComputed.raw,
        capped: bonusCapped,
      },
      autoScores: {
        bloc1: bloc1Computed,
        bloc2: bloc2Computed,
        bloc3: bloc3Info.value,
        bloc4: bloc4Info.value,
        bonus: bonusComputed.capped,
        totalWithoutBonus: autoTotals.totalWithoutBonus,
        totalWithBonus: autoTotals.totalWithBonus,
      },
      sourceConfidence: {
        bloc1: bloc1Confidence,
        bloc2: bloc2Confidence,
        bloc3: bloc3Confidence,
        bloc4: bloc4Confidence,
        global: globalConfidence,
        discordSourceUsed: discordSource.used,
        followSourceUsed: followSource.used,
      },
    },
    totals,
    alerts,
    summary,
    evidences,
  };
}

