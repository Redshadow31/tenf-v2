import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { eventRepository, evaluationRepository, memberRepository } from "@/lib/repositories";
import { getCurrentMonthKey } from "@/lib/evaluationStorage";
import { getAllBonuses } from "@/lib/evaluationBonusStorage";
import { calculateNoteEcrit, calculateNoteVocal } from "@/lib/discordEngagement";
import { getDiscordEngagementData } from "@/lib/discordEngagementStorage";
import { getDiscordActivityForMonth } from "@/lib/discordActivityStorage";
import { getAllFollowValidationsForMonth } from "@/lib/followStorage";
import { getLatestFollowEngagementOverview } from "@/lib/admin/followEngagement";
import { loadRaidsFaits, loadRaidsRecus } from "@/lib/raidStorage";
import { mergeMatchedRaidTestEventsForMonth } from "@/lib/raidEventsubMerge";
import { getEvaluationV2OverridesBySystem } from "@/lib/evaluationV2ManualStorage";
import { saveEvaluationEvidence } from "@/lib/evaluationV2EvidenceStorage";
import { loadMonthlyEvaluationSummary, saveMonthlyEvaluationSummary } from "@/lib/evaluationV2SummaryStorage";
import { appendEvaluationV2RunLog, type EvaluationV2RunLogEntry } from "@/lib/evaluationV2RunLogStorage";
import { loadEvaluationV2ValidationMeta } from "@/lib/evaluationV2ValidationStorage";
import { computeMonthlyEvaluation } from "@/lib/services/evaluationV2Engine";
import {
  computeBonusCapped,
  computeEvaluationV2Total,
  computeLegacyBloc1VisibleSupport,
  computeLegacyBloc3Regularite,
  computeLegacyBloc4Implication,
  computeLegacyReliabilityScore,
  computeParticipationUtile,
  computeBloc2Discord,
  round2,
  toMonthKey,
} from "@/lib/evaluationV2Helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;
const BLOCKING_ALERT_CODES = new Set(["donnee_manquante", "follow_indisponible", "mois_incomplet", "score_incoherent"]);
const WARNING_ALERT_CODES = new Set(["override_manuel", "membre_non_eligible"]);

function normalizeLogin(x: string): string {
  return (x || "").trim().toLowerCase();
}

function toValidDate(input: unknown): Date | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input as any);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toIsoOrNull(input: unknown): string | null {
  const date = toValidDate(input);
  return date ? date.toISOString() : null;
}

function parseMonthOrCurrent(rawMonth: string | null): string {
  if (rawMonth && /^\d{4}-\d{2}$/.test(rawMonth)) {
    return rawMonth;
  }
  return getCurrentMonthKey();
}

function parseSystem(rawSystem: string | null): "legacy" | "new" {
  return rawSystem === "new" ? "new" : "legacy";
}

/** Même pipeline que `/api/discord/raids/data-v2` et `/api/evaluations/raids/points` (stockage + EventSub matched). */
async function loadRaidsFaitsMergedForEvaluation(monthKey: string) {
  const [faits, recus] = await Promise.all([loadRaidsFaits(monthKey), loadRaidsRecus(monthKey)]);
  const faitsNoDiscord = (faits || []).filter((r: { source?: string }) => r.source !== "discord");
  const recusNoDiscord = (recus || []).filter((r: { source?: string }) => r.source !== "discord");
  const merged = await mergeMatchedRaidTestEventsForMonth(monthKey, faitsNoDiscord, recusNoDiscord);
  return merged.raidsFaits;
}

async function fetchAllMembers(): Promise<any[]> {
  const rows: any[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const chunk = await memberRepository.findAll(PAGE_SIZE, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
  }
  return rows;
}

function memberFollowsStaffInSheet(sheet: any, memberLogin: string): boolean {
  const login = normalizeLogin(memberLogin);
  if (!login) return false;

  if (Array.isArray(sheet?.follows)) {
    return sheet.follows.map(normalizeLogin).includes(login);
  }

  if (sheet?.members && typeof sheet.members === "object" && !Array.isArray(sheet.members)) {
    const entry = sheet.members[login] || sheet.members[memberLogin] || sheet.members[normalizeLogin(memberLogin)];
    return Boolean(entry?.followsMe);
  }

  if (Array.isArray(sheet?.rows)) {
    const row = sheet.rows.find((r: any) => normalizeLogin(r.login || r.user) === login);
    return Boolean(row?.followsMe ?? row?.meSuit);
  }

  if (Array.isArray(sheet?.membersArray)) {
    const member = sheet.membersArray.find((m: any) => normalizeLogin(m.twitchLogin) === login);
    return Boolean(member?.meSuit === true);
  }

  if (Array.isArray(sheet?.members)) {
    const member = sheet.members.find((m: any) => normalizeLogin(m.twitchLogin) === login);
    return Boolean(member?.meSuit === true);
  }

  return false;
}

function computeFollowPoints(memberLogins: string[], sheets: any[], maxPoints = 5): Record<string, number> {
  const totalSheets = sheets.length;
  const points: Record<string, number> = {};

  for (const login of memberLogins) {
    if (totalSheets === 0) {
      points[login] = 0;
      continue;
    }
    let count = 0;
    for (const sheet of sheets) {
      if (memberFollowsStaffInSheet(sheet, login)) count++;
    }
    points[login] = round2((count / totalSheets) * maxPoints);
  }

  return points;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return round2(values.reduce((s, v) => s + v, 0) / values.length);
}

function buildAlertCounts(rows: Array<{ alerts?: string[] }>) {
  const byCode: Record<string, number> = {};
  let blocking = 0;
  let warning = 0;

  for (const row of rows) {
    for (const code of row.alerts || []) {
      byCode[code] = (byCode[code] || 0) + 1;
      if (BLOCKING_ALERT_CODES.has(code)) {
        blocking += 1;
      } else if (WARNING_ALERT_CODES.has(code)) {
        warning += 1;
      } else {
        warning += 1;
      }
    }
  }

  return { byCode, blocking, warning };
}

function computeSummaryDiff(
  previousRows: Array<{ twitchLogin: string; finalTotal: number }>,
  nextRows: Array<{ twitchLogin: string; finalTotal: number }>,
): {
  newRows: number;
  removedRows: number;
  changedRows: number;
  avgFinalDelta: number;
  maxFinalDelta: number;
} {
  const previousMap = new Map<string, number>(previousRows.map((r) => [normalizeLogin(r.twitchLogin), Number(r.finalTotal || 0)]));
  const nextMap = new Map<string, number>(nextRows.map((r) => [normalizeLogin(r.twitchLogin), Number(r.finalTotal || 0)]));

  let newRows = 0;
  let removedRows = 0;
  let changedRows = 0;
  let deltaSum = 0;
  let deltaMax = 0;

  for (const [login, nextFinal] of nextMap.entries()) {
    if (!previousMap.has(login)) {
      newRows += 1;
      changedRows += 1;
      deltaSum += Math.abs(nextFinal);
      deltaMax = Math.max(deltaMax, Math.abs(nextFinal));
      continue;
    }
    const prevFinal = previousMap.get(login) || 0;
    const delta = Math.abs(nextFinal - prevFinal);
    if (delta > 0.0001) {
      changedRows += 1;
      deltaSum += delta;
      deltaMax = Math.max(deltaMax, delta);
    }
  }

  for (const login of previousMap.keys()) {
    if (!nextMap.has(login)) removedRows += 1;
  }

  return {
    newRows,
    removedRows,
    changedRows,
    avgFinalDelta: changedRows > 0 ? round2(deltaSum / changedRows) : 0,
    maxFinalDelta: round2(deltaMax),
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseMonthOrCurrent(searchParams.get("month"));
    const system = parseSystem(searchParams.get("system"));

    const [
      allMembersRes,
      evaluationsRes,
      bonusesRes,
      raidsRes,
      eventsRes,
      manualOverridesRes,
      validationMetaRes,
      discordActivityRes,
      followOverviewRes,
      previousSummaryRes,
    ] = await Promise.allSettled([
      fetchAllMembers(),
      evaluationRepository.findByMonth(month, 3000, 0),
      getAllBonuses(month),
      loadRaidsFaitsMergedForEvaluation(month),
      eventRepository.findAll(1000, 0),
      getEvaluationV2OverridesBySystem(month, system),
      loadEvaluationV2ValidationMeta(month, system),
      getDiscordActivityForMonth(month),
      getLatestFollowEngagementOverview(),
      loadMonthlyEvaluationSummary(month),
    ]);

    const allMembers = allMembersRes.status === "fulfilled" ? allMembersRes.value : [];
    const evaluations = evaluationsRes.status === "fulfilled" ? evaluationsRes.value : [];
    const bonusesMap = bonusesRes.status === "fulfilled" ? bonusesRes.value : {};
    const raidsFaitsRaw = raidsRes.status === "fulfilled" ? raidsRes.value : [];
    const allEvents = eventsRes.status === "fulfilled" ? eventsRes.value : [];
    const manualOverrides = manualOverridesRes.status === "fulfilled" ? manualOverridesRes.value : {};
    const validationMeta = validationMetaRes.status === "fulfilled" ? validationMetaRes.value : null;
    const discordActivity = discordActivityRes.status === "fulfilled" ? discordActivityRes.value : null;
    const followOverview = followOverviewRes.status === "fulfilled" ? followOverviewRes.value : null;
    const previousSummary = previousSummaryRes.status === "fulfilled" ? previousSummaryRes.value : null;

    const monthEvents = (Array.isArray(allEvents) ? allEvents : []).filter(
      (event: any) => event && event.date && toMonthKey(event.date) === month
    );
    const eventPresenceResults = await Promise.all(
      monthEvents.map(async (event) => {
        try {
          const presences = await eventRepository.getPresences(event.id);
          return { event, presences };
        } catch (error) {
          console.warn(`[evaluations/v2/result] Présences indisponibles pour event ${event.id}:`, error);
          return { event, presences: [] as any[] };
        }
      })
    );

    const spotlightEvents = eventPresenceResults.filter(({ event }) =>
      String(event.category || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes("spotlight")
    );
    const regularEvents = eventPresenceResults.filter(({ event }) => !spotlightEvents.some((s) => s.event.id === event.id));

    const spotlightTotal = spotlightEvents.length;
    const regularEventsTotal = regularEvents.length;

    const evaluationByLogin = new Map<string, any>();
    for (const evaluation of evaluations) {
      evaluationByLogin.set(normalizeLogin(evaluation.twitchLogin), evaluation);
    }

    const memberLoginsSet = new Set<string>();
    const memberByLogin = new Map<string, any>();
    const discordToLogin = new Map<string, string>();
    for (const member of allMembers) {
      const login = normalizeLogin(member.twitchLogin);
      if (!login) continue;
      memberLoginsSet.add(login);
      memberByLogin.set(login, member);
      if (member.discordId) discordToLogin.set(String(member.discordId), login);
    }
    const memberLogins = Array.from(memberLoginsSet);
    const followOverviewByLogin = new Map<string, { followRate: number | null; state: string }>();
    for (const row of followOverview?.rows || []) {
      const login = normalizeLogin(row?.memberTwitchLogin || "");
      if (!login) continue;
      followOverviewByLogin.set(login, {
        followRate: typeof row?.followRate === "number" ? row.followRate : null,
        state: String(row?.state || ""),
      });
    }

    // Soutien réseau (sans fallback implicite sur un autre mois)
    let followValidations: any[] = [];
    try {
      followValidations = await getAllFollowValidationsForMonth(month);
    } catch (error) {
      console.warn("[evaluations/v2/result] Source follow indisponible:", error);
      followValidations = [];
    }
    const followSheets = followValidations.map((v: any) => ({ members: Array.isArray(v.members) ? v.members : [] }));
    const followPointsByLogin = computeFollowPoints(memberLogins, followSheets, 5);

    // Discord engagement source prioritaire
    let engagementData: any = null;
    try {
      engagementData = await getDiscordEngagementData(month);
    } catch (error) {
      console.warn("[evaluations/v2/result] Source discord indisponible:", error);
      engagementData = null;
    }

    // Maps calculées par membre
    const raidsDoneByLogin = new Map<string, number>();
    const spotlightPresencesByLogin = new Map<string, number>();
    const regularEventsPresencesByLogin = new Map<string, number>();
    const actionDaysByLogin = new Map<string, Set<string>>();
    const actionWeeksByLogin = new Map<string, Set<number>>();

    function addActionDate(login: string, dateLike: string | Date): void {
      if (!login) return;
      const date = toValidDate(dateLike);
      if (!date) return;
      const day = date.toISOString().slice(0, 10);
      const daySet = actionDaysByLogin.get(login) || new Set<string>();
      daySet.add(day);
      actionDaysByLogin.set(login, daySet);

      const week = Math.floor((date.getUTCDate() - 1) / 7) + 1;
      const weekSet = actionWeeksByLogin.get(login) || new Set<number>();
      weekSet.add(week);
      actionWeeksByLogin.set(login, weekSet);
    }

    // Raids faits (hors source discord)
    for (const raid of raidsFaitsRaw.filter((r: any) => r.source !== "discord")) {
      let login = "";
      if (raid.raider && discordToLogin.has(String(raid.raider))) {
        login = discordToLogin.get(String(raid.raider)) || "";
      } else {
        login = normalizeLogin(String(raid.raider || ""));
      }
      if (!login) continue;
      const current = raidsDoneByLogin.get(login) || 0;
      raidsDoneByLogin.set(login, current + (raid.count || 1));
      if (raid.date) addActionDate(login, raid.date);
    }

    // Présences events / spotlights
    for (const { event, presences } of spotlightEvents) {
      for (const presence of presences || []) {
        const login = normalizeLogin(presence?.twitchLogin || "");
        if (!login || !presence?.present) continue;
        spotlightPresencesByLogin.set(login, (spotlightPresencesByLogin.get(login) || 0) + 1);
        addActionDate(login, event.date);
      }
    }

    for (const { event, presences } of regularEvents) {
      for (const presence of presences || []) {
        const login = normalizeLogin(presence?.twitchLogin || "");
        if (!login || !presence?.present) continue;
        regularEventsPresencesByLogin.set(login, (regularEventsPresencesByLogin.get(login) || 0) + 1);
        addActionDate(login, event.date);
      }
    }

    const allSummaries: any[] = [];
    const allEvidences: any[] = [];

    const rows = memberLogins
      .map((login) => {
        try {
        const member = memberByLogin.get(login);
        const evalRow = evaluationByLogin.get(login);

        const raidsDone = raidsDoneByLogin.get(login) || 0;

        const spotlightPresences = spotlightPresencesByLogin.get(login) || 0;

        const regularEventPresences = regularEventsPresencesByLogin.get(login) || 0;

        let nbMessages = 0;
        let nbVocalMinutes = 0;
        let discordSourceUsed: "primary" | "fallback" | "none" = "none";
        const hasDiscordPrimary = Boolean(member?.discordId && engagementData?.dataByMember?.[member.discordId]);
        const hasDiscordFallback =
          Boolean(discordActivity?.messagesByUser?.[login] !== undefined) ||
          Boolean(discordActivity?.vocalsByUser?.[login]?.totalMinutes !== undefined);

        if (hasDiscordPrimary) {
          const source = engagementData.dataByMember[member.discordId];
          nbMessages = Number(source.nbMessages || 0);
          nbVocalMinutes = Number(source.nbVocalMinutes || 0);
          discordSourceUsed = "primary";
        } else if (hasDiscordFallback) {
          nbMessages = Number(discordActivity?.messagesByUser?.[login] || 0);
          nbVocalMinutes = Number(discordActivity?.vocalsByUser?.[login]?.totalMinutes || 0);
          discordSourceUsed = "fallback";
        }

        const daysSet = actionDaysByLogin.get(login) || new Set<string>();
        const weeksSet = actionWeeksByLogin.get(login) || new Set<number>();
        const followScoreSheets = followPointsByLogin[login] || 0;
        const followOverviewRow = followOverviewByLogin.get(login);
        const followScoreSnapshot =
          followOverviewRow && followOverviewRow.state === "ok" && typeof followOverviewRow.followRate === "number"
            ? round2((followOverviewRow.followRate / 100) * 5)
            : 0;
        const hasFollowSheets = followSheets.length > 0;
        const hasFollowSnapshot = Boolean(followOverviewRow && followOverviewRow.state === "ok");
        const followSourceUsed: "sheet" | "snapshot" | "none" = hasFollowSheets ? "sheet" : hasFollowSnapshot ? "snapshot" : "none";
        const followScore = hasFollowSheets ? followScoreSheets : followScoreSnapshot;

        const bonusRow = bonusesMap[login];
        const manual = manualOverrides[login];

        if (system === "legacy") {
          const raidsScore = Math.min(5, round2(raidsDone >= 6 ? 5 : raidsDone === 5 ? 4 : raidsDone === 4 ? 3 : raidsDone === 3 ? 2 : raidsDone >= 1 ? 1 : 0));
          const spotlightScore = spotlightTotal > 0 ? round2((spotlightPresences / spotlightTotal) * 5) : 0;
          const eventsScore = regularEventsTotal > 0 ? round2((regularEventPresences / regularEventsTotal) * 5) : 0;
          const bloc1Computed = computeLegacyBloc1VisibleSupport({
            raids: raidsScore,
            spotlight: spotlightScore,
            eventsOverFive: eventsScore,
          }).value;

          const noteEcrit = calculateNoteEcrit(nbMessages);
          const noteVocal = calculateNoteVocal(nbVocalMinutes);
          const participationUtile = computeParticipationUtile({
            noteEcrit,
            noteVocal,
            nbMessages,
            nbVocalMinutes,
          });
          const bloc2Computed = computeBloc2Discord({
            noteEcrit,
            noteVocal,
            participationUtile,
          }).value;

          const actionDiversityCount = [
            raidsDone > 0,
            spotlightPresences > 0,
            regularEventPresences > 0,
            noteEcrit > 0 || noteVocal > 0 || participationUtile > 0,
            followScore > 0,
          ].filter(Boolean).length;

          const bloc3Info = computeLegacyBloc3Regularite({
            distinctActiveDays: daysSet.size,
            activeWeeks: weeksSet.size,
            actionDiversityCount,
          });

          const reliabilityScore = computeLegacyReliabilityScore({
            hasDiscordIdentity: Boolean(member?.discordId),
            hasAnyAction: daysSet.size > 0 || noteEcrit > 0 || noteVocal > 0 || followScore > 0,
            hasFollowSignal: followScore > 0 || followSheets.length > 0,
            hasRaidsOrEventsSignal: raidsDone > 0 || spotlightPresences > 0 || regularEventPresences > 0,
            hasAtLeastTwoSignals:
              [daysSet.size > 0, noteEcrit > 0 || noteVocal > 0, followScore > 0, raidsDone > 0 || spotlightPresences > 0 || regularEventPresences > 0].filter(Boolean).length >= 2,
          });

          const bloc4Info = computeLegacyBloc4Implication({
            bloc1: bloc1Computed,
            bloc2: bloc2Computed,
            bloc3: bloc3Info.value,
            reliabilityScore,
            staffValidatedFinalNote: typeof evalRow?.finalNote === "number" ? evalRow.finalNote : null,
          });

          const bonusLegacy = computeBonusCapped({
            timezoneBonusEnabled: bonusRow?.timezoneBonusEnabled === true,
            moderationBonus: Number(bonusRow?.moderationBonus || 0),
            moderationCap: 5,
          });

          const autoTotals = computeEvaluationV2Total({
            bloc1: bloc1Computed,
            bloc2: bloc2Computed,
            bloc3: bloc3Info.value,
            bloc4: bloc4Info.value,
            bonusCapped: bonusLegacy.capped,
          });

          const bloc1 = manual?.bloc1 !== undefined ? round2(Math.min(5, Math.max(0, Number(manual.bloc1)))) : bloc1Computed;
          const bloc2 = manual?.bloc2 !== undefined ? round2(Math.min(5, Math.max(0, Number(manual.bloc2)))) : bloc2Computed;
          const bloc3 = manual?.bloc3 !== undefined ? round2(Math.min(5, Math.max(0, Number(manual.bloc3)))) : bloc3Info.value;
          const bloc4 = manual?.bloc4 !== undefined ? round2(Math.min(5, Math.max(0, Number(manual.bloc4)))) : bloc4Info.value;
          const bonusCapped = manual?.bonus !== undefined ? round2(Math.min(5, Math.max(0, Number(manual.bonus)))) : bonusLegacy.capped;
          const totals = computeEvaluationV2Total({ bloc1, bloc2, bloc3, bloc4, bonusCapped });

          return {
            twitchLogin: login,
            displayName: member?.displayName || member?.twitchLogin || login,
            role: member?.role || "Affilié",
            isActive: member?.isActive !== false,
            isVip: member?.isVip === true,
            createdAt: toIsoOrNull(member?.createdAt),
            alerts: [],
            blocs: {
              bloc1VisibleSupport: bloc1,
              bloc2Discord: bloc2,
              bloc3Regularite: bloc3,
              bloc4ImplicationGlobale: bloc4,
            },
            details: {
              bloc1: {
                raids: raidsScore,
                spotlight: spotlightScore,
                events: eventsScore,
                raidsDone,
                spotlightPresences,
                spotlightTotal,
                regularEventPresences,
                regularEventsTotal,
              },
              bloc2: {
                noteEcrit,
                noteVocal,
                participationUtile,
                nbMessages,
                nbVocalMinutes,
              },
              bloc3: {
                networkSignalCount: actionDiversityCount,
                followScore,
                networkParticipationScore: bloc3Info.weeksScore,
                entraideScore: bloc3Info.diversityScore,
              },
              bloc4: {
                regularityScore: bloc3Info.repartitionScore,
                obligationsScore: bloc3Info.weeksScore,
                behaviorScore: bloc3Info.diversityScore,
                responsivenessScore: reliabilityScore,
                abusePenaltyScore: 0,
                reliabilityScore,
                staffCaseScore: bloc4Info.staffCaseScore,
              },
              bonus: {
                timezoneBonusEnabled: bonusRow?.timezoneBonusEnabled === true,
                raw: bonusLegacy.raw,
                capped: bonusCapped,
              },
              sourceConfidence: {
                bloc1: monthEvents.length > 0 ? 90 : 60,
                bloc2: hasDiscordPrimary ? 100 : hasDiscordFallback ? 75 : 25,
                bloc3: hasFollowSheets ? 100 : hasFollowSnapshot ? 80 : 30,
                bloc4: daysSet.size > 0 || weeksSet.size > 0 ? 80 : 40,
                global: round2(
                  ((monthEvents.length > 0 ? 90 : 60) +
                    (hasDiscordPrimary ? 100 : hasDiscordFallback ? 75 : 25) +
                    (hasFollowSheets ? 100 : hasFollowSnapshot ? 80 : 30) +
                    (daysSet.size > 0 || weeksSet.size > 0 ? 80 : 40)) /
                    4,
                ),
                discordSourceUsed: discordSourceUsed,
                followSourceUsed: followSourceUsed,
              },
              autoScores: {
                bloc1: bloc1Computed,
                bloc2: bloc2Computed,
                bloc3: bloc3Info.value,
                bloc4: bloc4Info.value,
                bonus: bonusLegacy.capped,
                totalWithoutBonus: autoTotals.totalWithoutBonus,
                totalWithBonus: autoTotals.totalWithBonus,
              },
              manualOverride: manual
                ? {
                    bloc1: manual.bloc1,
                    bloc2: manual.bloc2,
                    bloc3: manual.bloc3,
                    bloc4: manual.bloc4,
                    bonus: manual.bonus,
                    reason: manual.reason,
                    updatedAt: manual.updatedAt,
                    updatedBy: manual.updatedBy,
                  }
                : undefined,
            },
            totals,
          };
        }

        const engine = computeMonthlyEvaluation({
          monthKey: month,
          twitchLogin: login,
          isActive: member?.isActive !== false,
          hasDiscordIdentity: Boolean(member?.discordId),
          raidsDone,
          spotlightPresences,
          spotlightTotal,
          regularEventPresences,
          regularEventsTotal,
          nbMessages,
          nbVocalMinutes,
          followScore,
          hasFollowData: hasFollowSheets || hasFollowSnapshot,
          actionDayCount: daysSet.size,
          activeWeekCount: weeksSet.size,
          staffValidatedFinalNote: typeof evalRow?.finalNote === "number" ? evalRow.finalNote : null,
          timezoneBonusEnabled: bonusRow?.timezoneBonusEnabled === true,
          timezoneBonusPoints: Number.isFinite(Number(bonusRow?.timezoneBonusPoints)) ? Number(bonusRow?.timezoneBonusPoints) : undefined,
          moderationBonus: Number(bonusRow?.moderationBonus || 0),
          manualOverride: manual,
          discordSource: {
            used: discordSourceUsed,
            primaryAvailable: hasDiscordPrimary,
            fallbackAvailable: hasDiscordFallback,
          },
          followSource: {
            used: followSourceUsed,
            sheetAvailable: hasFollowSheets,
            snapshotAvailable: hasFollowSnapshot,
          },
        });
        allSummaries.push(engine.summary);
        allEvidences.push(...engine.evidences);

        return {
          twitchLogin: login,
          displayName: member?.displayName || member?.twitchLogin || login,
          role: member?.role || "Affilié",
          isActive: member?.isActive !== false,
          isVip: member?.isVip === true,
          createdAt: toIsoOrNull(member?.createdAt),
          alerts: engine.alerts,
          blocs: {
            bloc1VisibleSupport: engine.blocs.bloc1,
            bloc2Discord: engine.blocs.bloc2,
            bloc3Regularite: engine.blocs.bloc3,
            bloc4ImplicationGlobale: engine.blocs.bloc4,
          },
          details: {
            bloc1: {
              raids: engine.details.bloc1.raids,
              spotlight: engine.details.bloc1.spotlight,
              events: engine.details.bloc1.events,
              raidsDone,
              spotlightPresences,
              spotlightTotal,
              regularEventPresences,
              regularEventsTotal,
            },
            bloc2: {
              ...engine.details.bloc2,
            },
            bloc3: {
              ...engine.details.bloc3,
            },
            bloc4: {
              ...engine.details.bloc4,
            },
            bonus: {
              timezoneBonusEnabled: bonusRow?.timezoneBonusEnabled === true,
              ...engine.details.bonus,
            },
            sourceConfidence: engine.details.sourceConfidence,
            autoScores: engine.details.autoScores,
            manualOverride: manual
              ? {
                  bloc1: manual.bloc1,
                  bloc2: manual.bloc2,
                  bloc3: manual.bloc3,
                  bloc4: manual.bloc4,
                  bonus: manual.bonus,
                  reason: manual.reason,
                  updatedAt: manual.updatedAt,
                  updatedBy: manual.updatedBy,
                }
              : undefined,
          },
          totals: engine.totals,
        };
        } catch (memberError) {
          console.warn(
            `[evaluations/v2/result] Membre ignoré (erreur calcul): ${login}`,
            memberError
          );
          return null;
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.totals.totalWithBonus - a.totals.totalWithBonus);

    let latestRun: EvaluationV2RunLogEntry | null = null;

    // Persiste les preuves et la synthèse mensuelle (non bloquant), sauf si mois gelé.
    if (system === "new" && !validationMeta?.frozen) {
      const diff = computeSummaryDiff(previousSummary?.rows || [], allSummaries);
      const hasSummaryChange =
        !previousSummary ||
        diff.changedRows > 0 ||
        diff.newRows > 0 ||
        diff.removedRows > 0;

      if (hasSummaryChange) {
        latestRun = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          month,
          system,
          runAt: new Date().toISOString(),
          trigger: "auto_result_refresh",
          triggeredBy: admin.discordId,
          triggeredByUsername: admin.username,
          summary: {
            rowsCount: allSummaries.length,
            newRows: previousSummary ? diff.newRows : allSummaries.length,
            removedRows: previousSummary ? diff.removedRows : 0,
            changedRows: previousSummary ? diff.changedRows : allSummaries.length,
            avgFinalDelta: previousSummary ? diff.avgFinalDelta : 0,
            maxFinalDelta: previousSummary ? diff.maxFinalDelta : 0,
          },
          note: previousSummary ? "Diff detecte sur la synthese mensuelle." : "Initialisation de la synthese mensuelle.",
        };
      }

      await Promise.allSettled([
        saveEvaluationEvidence(month, allEvidences),
        saveMonthlyEvaluationSummary(month, allSummaries),
        ...(latestRun ? [appendEvaluationV2RunLog(month, system, latestRun)] : []),
      ]);
    }

    const scores = rows.map((r) => r.totals.totalWithBonus);
    const alertCounts = buildAlertCounts(rows);
    const rowsWithAnyAlert = rows.filter((r) => (r.alerts || []).length > 0).length;
    const rowsWithBlockingAlert = rows.filter((r) => (r.alerts || []).some((code) => BLOCKING_ALERT_CODES.has(code))).length;
    const rowsWithWarningOnly = rows.filter((r) => {
      const alerts = r.alerts || [];
      return alerts.length > 0 && !alerts.some((code) => BLOCKING_ALERT_CODES.has(code));
    }).length;

    const discordSourcePresent =
      Boolean(engagementData?.hasMessagesImport) ||
      Boolean(engagementData?.hasVocalsImport) ||
      (engagementData?.dataByMember && Object.keys(engagementData.dataByMember).length > 0);
    const followSourcePresent = followSheets.length > 0 || (followOverview?.rows || []).some((r: any) => r?.state === "ok");
    const monthHasEvents = monthEvents.length > 0;

    const manualOverrideEntries = Object.values(manualOverrides || {}) as Array<{ reason?: string }>;
    const overridesCount = manualOverrideEntries.length;
    const overridesWithoutReasonCount = manualOverrideEntries.filter((x) => !String(x?.reason || "").trim()).length;
    const overridesJustified = overridesWithoutReasonCount === 0;

    const checklist = {
      sourcesPresent: {
        discord: discordSourcePresent,
        follow: followSourcePresent,
        events: monthHasEvents,
      },
      overridesJustified,
      hasBlockingAlerts: alertCounts.blocking > 0,
      readyToValidate: discordSourcePresent && followSourcePresent && monthHasEvents && overridesJustified && alertCounts.blocking === 0,
    };

    const confidenceRows = rows
      .map((r: any) => r?.details?.sourceConfidence)
      .filter((x: any) => x && typeof x.global === "number");
    const sourceConfidence = {
      bloc1: confidenceRows.length ? avg(confidenceRows.map((c: any) => Number(c.bloc1 || 0))) : 0,
      bloc2: confidenceRows.length ? avg(confidenceRows.map((c: any) => Number(c.bloc2 || 0))) : 0,
      bloc3: confidenceRows.length ? avg(confidenceRows.map((c: any) => Number(c.bloc3 || 0))) : 0,
      bloc4: confidenceRows.length ? avg(confidenceRows.map((c: any) => Number(c.bloc4 || 0))) : 0,
      global: confidenceRows.length ? avg(confidenceRows.map((c: any) => Number(c.global || 0))) : 0,
    };

    return NextResponse.json({
      success: true,
      version: "evaluation-v2",
      month,
      system,
      scoringScale: {
        blocs: "/20",
        bonus: "/5 max (capé)",
        total: "/25",
      },
      manualOverridesCount: Object.keys(manualOverrides || {}).length,
      quality: {
        checklist,
        alerts: {
          total: alertCounts.blocking + alertCounts.warning,
          blocking: alertCounts.blocking,
          warning: alertCounts.warning,
          byCode: alertCounts.byCode,
          rowsWithAnyAlert,
          rowsWithBlockingAlert,
          rowsWithWarningOnly,
        },
        overrides: {
          total: overridesCount,
          withoutReason: overridesWithoutReasonCount,
          justified: overridesJustified,
        },
        sourceConfidence,
      },
      validation: validationMeta,
      lifecycle: {
        frozen: validationMeta?.frozen === true,
        persistenceLocked: system === "new" && validationMeta?.frozen === true,
      },
      runs: {
        latest: latestRun,
      },
      stats: {
        membersCount: rows.length,
        avgTotalWithBonus: avg(scores),
        avgBloc1: avg(rows.map((r) => r.blocs.bloc1VisibleSupport)),
        avgBloc2: avg(rows.map((r) => r.blocs.bloc2Discord)),
        avgBloc3: avg(rows.map((r) => r.blocs.bloc3Regularite)),
        avgBloc4: avg(rows.map((r) => r.blocs.bloc4ImplicationGlobale)),
        topCount: rows.filter((r) => r.totals.totalWithBonus >= 16).length,
        watchCount: rows.filter((r) => r.totals.totalWithBonus < 6).length,
      },
      rows,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[API evaluations/v2/result] GET error:", errorMessage);
    if (errorStack) {
      console.error("[API evaluations/v2/result] stack:", errorStack);
    }

    return NextResponse.json(
      {
        error: "Erreur serveur (v2)",
        debugError:
          process.env.NODE_ENV !== "production" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

