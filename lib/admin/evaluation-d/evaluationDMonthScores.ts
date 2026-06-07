import {
  calculateEngagementAverageBonusWithFollowPolicy,
  type FollowEvalStatus,
} from "@/lib/evaluationFollowPolicy";
import { calculateBonusTotal, TIMEZONE_BONUS_POINTS, type MemberBonus } from "@/lib/evaluationBonusHelpers";
import {
  buildCommunityEventPresenceIndex,
  getCommunityEventPointsForLogin,
} from "@/lib/evaluationCommunityEvents";
import {
  calculateTotalAvecBonus,
  calculateTotalHorsBonus,
} from "@/lib/evaluationSynthesisHelpers";

export type MonthFinalScoreSource = "manual" | "calculated";

export type MonthFinalScoreEntry = {
  score: number;
  source: MonthFinalScoreSource;
  /** false = mois sans trace barème ni override — exclu de la moyenne 3M. */
  hasActivity: boolean;
};

export type MonthScoreInputs = {
  raidsPoints: Record<string, number>;
  discordPoints: Record<string, number>;
  events: { events: Array<{ category?: string; presences?: Array<{ twitchLogin?: string; present?: boolean }> }> };
  followPoints: Record<string, number>;
  followStatusByLogin?: Record<string, FollowEvalStatus>;
  bonuses: Record<string, MemberBonus>;
  finalNotes: Record<string, { finalNote?: number | null }>;
};

export function shiftMonthKey(monthKey: string, monthsBack: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 - monthsBack, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function roundEvalScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function isValidManualNote(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/** Normalise la map des overrides synthèse (clés lowercase, notes numériques). */
export function normalizeFinalNotesMap(
  raw: unknown
): Record<string, { finalNote?: number | null }> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, { finalNote?: number | null }> = {};
  for (const [login, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const note = (value as { finalNote?: unknown }).finalNote;
    if (isValidManualNote(note)) {
      out[login.toLowerCase()] = { finalNote: note };
    } else if (note !== undefined && note !== null && !Number.isNaN(Number(note))) {
      out[login.toLowerCase()] = { finalNote: Number(note) };
    }
  }
  return out;
}

/** Note manuelle persistée pour un login (insensible à la casse). */
export function resolveSavedManualFinalNote(
  finalNotes: Record<string, { finalNote?: number | null }> | undefined,
  login: string
): number | null {
  if (!finalNotes) return null;
  const normalized = login.toLowerCase();
  const direct = finalNotes[normalized]?.finalNote ?? finalNotes[login]?.finalNote;
  if (isValidManualNote(direct)) return roundEvalScore(direct);
  if (direct !== undefined && direct !== null && !Number.isNaN(Number(direct))) {
    return roundEvalScore(Number(direct));
  }
  for (const [key, record] of Object.entries(finalNotes)) {
    if (key.toLowerCase() !== normalized) continue;
    const note = record?.finalNote;
    if (isValidManualNote(note)) return roundEvalScore(note);
    if (note !== undefined && note !== null && !Number.isNaN(Number(note))) {
      return roundEvalScore(Number(note));
    }
  }
  return null;
}

function isActiveBaseline(entry: MonthFinalScoreEntry): boolean {
  return entry.source === "manual" || entry.hasActivity;
}

/** Note retenue affichée — override édition > override sauvegardé > calcul live bonus. */
export function resolveRetainedFinalScore(input: {
  totalHorsBonus: number;
  timezoneBonusEnabled: boolean;
  moderationBonus: number;
  editingFinalNote?: number | null;
  savedManualFinal?: number | null;
  persistedManualFinal?: number | null;
  engagementAverageBonus?: number;
  spotlightPoints?: number;
  discordPoints?: number;
  eventsPoints?: number;
  followPoints?: number;
  followEvalStatus?: FollowEvalStatus;
}): number {
  const followStatus = input.followEvalStatus ?? "measured";
  const engagementAverageBonus =
    input.engagementAverageBonus ??
    calculateEngagementAverageBonusWithFollowPolicy(
      input.spotlightPoints ?? 0,
      input.discordPoints ?? 0,
      input.eventsPoints ?? 0,
      input.followPoints ?? 0,
      followStatus
    );
  const { total: calculated } = calculateTotalAvecBonus(
    input.totalHorsBonus,
    input.timezoneBonusEnabled ? TIMEZONE_BONUS_POINTS : 0,
    input.moderationBonus,
    engagementAverageBonus
  );
  if (input.editingFinalNote !== undefined && input.editingFinalNote !== null) {
    return roundEvalScore(input.editingFinalNote);
  }
  for (const manual of [input.savedManualFinal, input.persistedManualFinal]) {
    if (isValidManualNote(manual)) return roundEvalScore(manual);
    if (manual !== undefined && manual !== null && !Number.isNaN(Number(manual))) {
      return roundEvalScore(Number(manual));
    }
  }
  return roundEvalScore(calculated);
}

export function computeTrendDelta(current: number, baseline: number | undefined | null): number | null {
  if (baseline === undefined || baseline === null || Number.isNaN(baseline)) return null;
  return roundEvalScore(current - baseline);
}

export type ThreeMonthTrend = {
  deltaVsAverage: number | null;
  averageBaseline: number | null;
  monthsUsed: number;
  /** Pente mensuelle M-3 → M-1 (derniers mois clos). */
  slopePerMonth: number | null;
};

export function computeThreeMonthTrend(
  current: number,
  m1?: MonthFinalScoreEntry | null,
  m2?: MonthFinalScoreEntry | null,
  m3?: MonthFinalScoreEntry | null
): ThreeMonthTrend {
  const baselines = [m1, m2, m3].filter(
    (entry): entry is MonthFinalScoreEntry => !!entry && isActiveBaseline(entry)
  );
  const monthsUsed = baselines.length;
  const averageBaseline =
    monthsUsed > 0
      ? roundEvalScore(baselines.reduce((sum, entry) => sum + entry.score, 0) / monthsUsed)
      : null;

  let slopePerMonth: number | null = null;
  const activeM1 = m1 && isActiveBaseline(m1) ? m1 : null;
  const activeM2 = m2 && isActiveBaseline(m2) ? m2 : null;
  const activeM3 = m3 && isActiveBaseline(m3) ? m3 : null;
  if (activeM1 && activeM3) {
    slopePerMonth = roundEvalScore((activeM1.score - activeM3.score) / 2);
  } else if (activeM1 && activeM2) {
    slopePerMonth = roundEvalScore(activeM1.score - activeM2.score);
  }

  return {
    deltaVsAverage:
      averageBaseline !== null && monthsUsed >= 2
        ? computeTrendDelta(current, averageBaseline)
        : null,
    averageBaseline,
    monthsUsed,
    slopePerMonth,
  };
}

function normalizePointsMap(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [login, points] of Object.entries(raw as Record<string, unknown>)) {
    if (login && typeof points === "number") {
      out[login.toLowerCase()] = points;
    }
  }
  return out;
}

/** Reconstruit les notes finales retenues d'un mois (override synthèse ou calcul barème). */
export function buildMonthFinalScoresMap(
  members: Array<{ twitchLogin?: string }>,
  inputs: MonthScoreInputs
): Record<string, MonthFinalScoreEntry> {
  const scores: Record<string, MonthFinalScoreEntry> = {};

  const spotlightEvents = (inputs.events.events || []).filter((event) => (event.category || "") === "Spotlight");
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
  }

  const { totalEligibleEvents, presencesByLogin: communityEventPresencesMap } = buildCommunityEventPresenceIndex(
    inputs.events.events || []
  );

  const raidsPoints = normalizePointsMap(inputs.raidsPoints);
  const discordPoints = normalizePointsMap(inputs.discordPoints);
  const followPoints = normalizePointsMap(inputs.followPoints);

  for (const member of members) {
    const login = member.twitchLogin?.toLowerCase();
    if (!login) continue;

    const manualFinal = resolveSavedManualFinalNote(inputs.finalNotes, login);
    if (manualFinal !== null) {
      scores[login] = {
        score: manualFinal,
        source: "manual",
        hasActivity: true,
      };
      continue;
    }

    const spotlightPresences = spotlightPresencesMap.get(login) || 0;
    const spotlightPoints =
      spotlightTotalCount > 0
        ? roundEvalScore((5 * spotlightPresences) / spotlightTotalCount)
        : 0;
    const raidsScore = raidsPoints[login] ?? 0;
    const discordScore = discordPoints[login] ?? 0;
    const eventsScore = getCommunityEventPointsForLogin(login, communityEventPresencesMap, totalEligibleEvents);
    const followScore = followPoints[login] ?? 0;
    const followStatus = inputs.followStatusByLogin?.[login] ?? "measured";

    const bonusInfo: MemberBonus | null = inputs.bonuses[login] || null;
    const manualBonus = calculateBonusTotal(bonusInfo);
    const engagementAverageBonus = calculateEngagementAverageBonusWithFollowPolicy(
      spotlightPoints,
      discordScore,
      eventsScore,
      followScore,
      followStatus
    );
    const hasActivity =
      spotlightPoints > 0 ||
      raidsScore > 0 ||
      discordScore > 0 ||
      eventsScore > 0 ||
      followScore > 0 ||
      manualBonus.timezoneBonus > 0 ||
      manualBonus.moderationBonus > 0 ||
      engagementAverageBonus > 0;

    const { total: totalHorsBonus } = calculateTotalHorsBonus(
      spotlightPoints,
      raidsScore,
      discordScore,
      eventsScore,
      followScore
    );
    const { total: calculatedFinal } = calculateTotalAvecBonus(
      totalHorsBonus,
      manualBonus.timezoneBonus,
      manualBonus.moderationBonus,
      engagementAverageBonus
    );

    scores[login] = {
      score: roundEvalScore(calculatedFinal),
      source: "calculated",
      hasActivity,
    };
  }

  return scores;
}

export type TrendBaselinesMaps = {
  m1: Record<string, MonthFinalScoreEntry>;
  m2: Record<string, MonthFinalScoreEntry>;
  m3: Record<string, MonthFinalScoreEntry>;
};

/** Charge M-1 / M-2 / M-3 en parallèle (18 appels API côté client — préférer en arrière-plan). */
export async function fetchTrendBaselinesMaps(
  monthKey: string,
  members: Array<{ twitchLogin?: string }>
): Promise<TrendBaselinesMaps> {
  const [m1Inputs, m2Inputs, m3Inputs] = await Promise.all([
    fetchMonthScoreInputs(shiftMonthKey(monthKey, 1)),
    fetchMonthScoreInputs(shiftMonthKey(monthKey, 2)),
    fetchMonthScoreInputs(shiftMonthKey(monthKey, 3)),
  ]);
  return {
    m1: buildMonthFinalScoresMap(members, m1Inputs),
    m2: buildMonthFinalScoresMap(members, m2Inputs),
    m3: buildMonthFinalScoresMap(members, m3Inputs),
  };
}

export async function fetchMonthScoreInputs(monthKey: string): Promise<MonthScoreInputs> {
  const [
    raidsPointsResponse,
    discordPointsResponse,
    eventsResponse,
    followResponse,
    bonusesResponse,
    finalNotesResponse,
  ] = await Promise.all([
    fetch(`/api/evaluations/raids/points?month=${monthKey}`, { cache: "no-store" }).catch(() => null),
    fetch(`/api/evaluations/discord/points?month=${monthKey}`, { cache: "no-store" }).catch(() => null),
    fetch(`/api/admin/events/presence?month=${monthKey}`, { cache: "no-store" }).catch(() => null),
    fetch(`/api/evaluations/follow/points?month=${monthKey}`, { cache: "no-store" }).catch(() => null),
    fetch(`/api/evaluations/bonus?month=${monthKey}`, { cache: "no-store" }).catch(() => null),
    fetch(`/api/evaluations/synthesis/save?month=${monthKey}`, { cache: "no-store" }).catch(() => null),
  ]);

  const raidsPoints = raidsPointsResponse?.ok
    ? normalizePointsMap((await raidsPointsResponse.json()).points)
    : {};
  const discordPoints = discordPointsResponse?.ok
    ? normalizePointsMap((await discordPointsResponse.json()).points)
    : {};
  const events = eventsResponse?.ok ? await eventsResponse.json() : { events: [] };
  const followPayload = followResponse?.ok ? await followResponse.json() : {};
  const followPoints = normalizePointsMap(followPayload.points);
  const followStatusByLogin =
    followPayload.statusByLogin && typeof followPayload.statusByLogin === "object"
      ? (followPayload.statusByLogin as Record<string, FollowEvalStatus>)
      : undefined;
  const bonuses = bonusesResponse?.ok ? (await bonusesResponse.json()).bonuses || {} : {};
  const finalNotesPayload = finalNotesResponse?.ok ? await finalNotesResponse.json() : { finalNotes: {} };

  return {
    raidsPoints,
    discordPoints,
    events,
    followPoints,
    followStatusByLogin,
    bonuses,
    finalNotes: normalizeFinalNotesMap(finalNotesPayload.finalNotes),
  };
}
