import { memberRepository, evaluationRepository, eventRepository } from "@/lib/repositories";
import { getDiscordEngagementData } from "@/lib/discordEngagementStorage";
import { loadRaidsFaits, loadRaidsRecus, getMonthKey } from "@/lib/raidStorage";
import { mergeMatchedRaidTestEventsForMonth } from "@/lib/raidEventsubMerge";
import { loadEvaluationV3Pilotage, type EvaluationV3PilotageEntry } from "@/lib/evaluationV3PilotageStorage";
import {
  scoreV3DiscordBlock,
  scoreV3Raids,
  scoreV3Events,
  scoreV3Spotlight,
  scoreV3Regularite,
  clampBonusStaff,
  clampMalusStaff,
  totalV3Score,
  recommendV3Status,
  type V3RecommendedStatus,
} from "@/lib/evaluationV3Scoring";

const MEMBER_PAGE = 1000;
const MEMBER_MAX_PAGES = 25;

export type EvaluationV3SnapshotRow = {
  twitchLogin: string;
  displayName: string;
  role: string;
  isActive: boolean;
  auto: {
    raidsDone: number;
    eventsPresent: number;
    spotlightPresent: number;
    discordMessages: number;
    discordVocalMinutes: number;
    discordReactions: number;
    /** Mois actifs sur M, M-1, M-2 (proxy score legacy ≥ 16). */
    regularityActiveMonths: number;
  };
  pilotage: EvaluationV3PilotageEntry | null;
  resolved: {
    raidsDone: number;
    raidsOtherSupport: boolean;
    eventsPresent: number;
    spotlightPresent: number;
    nbMessages: number;
    nbVocalMinutes: number;
    nbReactions: number;
    regularityActiveMonths: number;
    bonusStaff: number;
    malusStaff: number;
  };
  scores: {
    raids: number;
    discord: number;
    events: number;
    spotlight: number;
    regularite: number;
    bonus: number;
    malus: number;
    total: number;
  };
  recommendedStatus: V3RecommendedStatus;
};

function parseMonthToKey(monthParam: string): string {
  const m = monthParam.match(/^(\d{4})-(\d{2})$/);
  if (!m) throw new Error("Mois invalide");
  const year = parseInt(m[1], 10);
  const monthNum = parseInt(m[2], 10);
  if (monthNum < 1 || monthNum > 12) throw new Error("Mois invalide");
  return getMonthKey(year, monthNum);
}

export function prevMonthKey(monthKey: string): string {
  const [y, mo] = monthKey.split("-").map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchAllMembers(): Promise<any[]> {
  const rows: any[] = [];
  for (let page = 0; page < MEMBER_MAX_PAGES; page++) {
    const chunk = await memberRepository.findAll(MEMBER_PAGE, page * MEMBER_PAGE);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    rows.push(...chunk);
    if (chunk.length < MEMBER_PAGE) break;
  }
  return rows;
}

async function loadRaidDoneByLogin(monthKey: string): Promise<Map<string, number>> {
  const allMembers = await memberRepository.findAll(5000, 0);
  const discordIdToMember = new Map<string, any>();
  allMembers.forEach((m) => {
    if (m.discordId && m.twitchLogin) {
      discordIdToMember.set(m.discordId, m);
    }
  });

  let raidsFaits = await loadRaidsFaits(monthKey);
  let raidsRecus = await loadRaidsRecus(monthKey);
  raidsFaits = raidsFaits.filter((raid: any) => raid.source !== "discord");
  raidsRecus = raidsRecus.filter((raid: any) => raid.source !== "discord");
  const merged = await mergeMatchedRaidTestEventsForMonth(monthKey, raidsFaits, raidsRecus);
  raidsFaits = merged.raidsFaits;

  const memberStatsMap = new Map<string, { done: number }>();
  raidsFaits.forEach((raid: any) => {
    let twitchLogin = raid.raiderTwitchLogin || raid.raiderLogin;
    if (!twitchLogin) {
      const member = discordIdToMember.get(raid.raider);
      twitchLogin = member?.twitchLogin || raid.raider;
    }
    if (twitchLogin) {
      const loginLower = twitchLogin.toLowerCase();
      if (!memberStatsMap.has(loginLower)) memberStatsMap.set(loginLower, { done: 0 });
      memberStatsMap.get(loginLower)!.done += raid.count || 1;
    }
  });

  const out = new Map<string, number>();
  memberStatsMap.forEach((v, k) => out.set(k, v.done));
  return out;
}

function memberLoginNorm(x: any): string {
  return String(x?.twitchLogin || x?.login || "")
    .trim()
    .toLowerCase();
}

function isPresentTruthy(p: unknown): boolean {
  return p === true || p === 1 || p === "true" || p === "1";
}

/** Aligné sur evaluations/v2/result et le dashboard admin : événements « type spotlight » (catégorie ou titre). */
function normalizedEventLabel(raw: string): string {
  return String(raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSpotlightCommunityEvent(category: string, title?: string): boolean {
  if (normalizedEventLabel(category).includes("spotlight")) return true;
  if (title && normalizedEventLabel(title).includes("spotlight")) return true;
  return false;
}

function isSpotlightJsonEvent(ev: any): boolean {
  return isSpotlightCommunityEvent(String(ev?.category || ""), String(ev?.name || ev?.title || ""));
}

/** Déduplique les events décrits dans les évaluations mensuelles (toutes lignes membres du mois). */
function mergeEventEvaluationsFromMonth(evaluations: any[]): any[] {
  const byId = new Map<string, any>();
  for (const evaluation of evaluations || []) {
    for (const ev of evaluation?.eventEvaluations || []) {
      const id = String(ev?.id || "").trim();
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, ev);
    }
  }
  return Array.from(byId.values());
}

/** Déduplique les spotlights validés depuis toutes les évaluations du mois (comme /api/spotlight/presence/monthly). */
function mergeSpotlightEvaluationsFromMonth(evaluations: any[]): any[] {
  const byId = new Map<string, any>();
  for (const evaluation of evaluations || []) {
    for (const sp of evaluation?.spotlightEvaluations || []) {
      if (sp?.validated === false || sp?.validated === "false" || sp?.validated === 0) continue;
      const id = String(sp?.id || "").trim();
      const fallbackKey = sp?.date && sp?.streamerTwitchLogin ? `legacy:${sp.date}:${sp.streamerTwitchLogin}` : "";
      const key = id || fallbackKey;
      if (!key) continue;
      if (!byId.has(key)) byId.set(key, sp);
    }
  }
  return Array.from(byId.values());
}

function countEventPresencesUnified(eventList: any[], login: string): number {
  const l = login.toLowerCase();
  let n = 0;
  for (const ev of eventList) {
    const me = ev.members?.find((x: any) => memberLoginNorm(x) === l);
    if (me && isPresentTruthy(me.present)) n++;
  }
  return n;
}

function countSpotlightPresencesUnified(spotlightList: any[], login: string): number {
  const l = login.toLowerCase();
  let n = 0;
  for (const sp of spotlightList) {
    const me = sp.members?.find((x: any) => memberLoginNorm(x) === l);
    if (me && isPresentTruthy(me.present)) n++;
  }
  return n;
}

/**
 * Présences réelles du mois (`event_presences`), scindées comme en v2 :
 * événements communautaires vs événements catégorie/titre « spotlight ».
 */
async function loadEventPresenceMapsSplitByDb(monthKey: string): Promise<{
  community: Map<string, number>;
  spotlight: Map<string, number>;
}> {
  const community = new Map<string, number>();
  const spotlight = new Map<string, number>();

  const bump = (map: Map<string, number>, login: string) => {
    const k = login.trim().toLowerCase();
    if (!k) return;
    map.set(k, (map.get(k) || 0) + 1);
  };

  let allEvents = await eventRepository.findAll(1000, 0);
  if (!allEvents?.length) return { community, spotlight };

  const monthEvents = allEvents.filter((event) => {
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    if (Number.isNaN(eventDate.getTime())) return false;
    const mk = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`;
    return mk === monthKey;
  });

  for (const event of monthEvents) {
    const target = isSpotlightCommunityEvent(event.category, event.title) ? spotlight : community;
    try {
      const presences = await eventRepository.getPresences(event.id);
      for (const p of presences || []) {
        if (isPresentTruthy(p.present) && p.twitchLogin) bump(target, String(p.twitchLogin));
      }
    } catch {
      // événement ignoré
    }
  }
  return { community, spotlight };
}

function finalScoreFromEvaluation(evaluation: any): number {
  return Number(evaluation?.finalNote ?? evaluation?.totalPoints ?? 0) || 0;
}

/** Proxy « mois actif » pour la régularité v3 : note synthèse legacy ~ mi-parcours sur /32 ou /25. */
const REGULARITY_ACTIVE_THRESHOLD = 16;

function buildFinalScoreMap(evals: any[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const ev of evals || []) {
    const login = ev.twitchLogin?.toLowerCase();
    if (!login) continue;
    map.set(login, finalScoreFromEvaluation(ev));
  }
  return map;
}

function regularityActiveMonthsFromMaps(
  login: string,
  scoreM0: Map<string, number>,
  scoreM1: Map<string, number>,
  scoreM2: Map<string, number>,
): number {
  let c = 0;
  if ((scoreM0.get(login) || 0) >= REGULARITY_ACTIVE_THRESHOLD) c++;
  if ((scoreM1.get(login) || 0) >= REGULARITY_ACTIVE_THRESHOLD) c++;
  if ((scoreM2.get(login) || 0) >= REGULARITY_ACTIVE_THRESHOLD) c++;
  return c;
}

export async function buildEvaluationV3Snapshot(monthParam: string): Promise<{
  month: string;
  rows: EvaluationV3SnapshotRow[];
  meta: {
    regularityThreshold: number;
    note: string;
  };
}> {
  const monthKey = parseMonthToKey(monthParam);
  const m1 = prevMonthKey(monthKey);
  const m2 = prevMonthKey(m1);

  const evalLimit = 5000;
  const [members, evaluations, evPrev1, evPrev2, raidDoneByLogin, engagement, pilotage, eventPresenceSplit] =
    await Promise.all([
      fetchAllMembers(),
      evaluationRepository.findByMonth(monthKey, evalLimit, 0),
      evaluationRepository.findByMonth(m1, evalLimit, 0),
      evaluationRepository.findByMonth(m2, evalLimit, 0),
      loadRaidDoneByLogin(monthKey),
      getDiscordEngagementData(monthKey),
      loadEvaluationV3Pilotage(monthKey),
      loadEventPresenceMapsSplitByDb(monthKey),
    ]);

  const scoreMap0 = buildFinalScoreMap(evaluations);
  const scoreMap1 = buildFinalScoreMap(evPrev1);
  const scoreMap2 = buildFinalScoreMap(evPrev2);

  const mergedEvents = mergeEventEvaluationsFromMonth(evaluations);
  const mergedEventsCommunity = mergedEvents.filter((ev) => !isSpotlightJsonEvent(ev));
  const mergedEventsAsSpotlight = mergedEvents.filter((ev) => isSpotlightJsonEvent(ev));
  const mergedSpotlights = mergeSpotlightEvaluationsFromMonth(evaluations);

  const discordIdToLogin = new Map<string, string>();
  members.forEach((m) => {
    if (m.discordId && m.twitchLogin) {
      discordIdToLogin.set(m.discordId, String(m.twitchLogin).toLowerCase());
    }
  });

  const pilotageEntries = pilotage?.entries || {};

  const rows: EvaluationV3SnapshotRow[] = [];

  for (const member of members) {
    if (!member.twitchLogin) continue;
    const login = String(member.twitchLogin).toLowerCase();
    const displayName = member.displayName || member.twitchLogin;
    const role = member.role || "Affilié";
    const isActive = member.isActive !== false;

    const eventsFromJson = countEventPresencesUnified(mergedEventsCommunity, login);
    const eventsFromDb = eventPresenceSplit.community.get(login) || 0;
    const eventsPresent = Math.max(eventsFromJson, eventsFromDb);

    const spotlightFromEvaluations = countSpotlightPresencesUnified(mergedSpotlights, login);
    const spotlightFromJsonEvents = countEventPresencesUnified(mergedEventsAsSpotlight, login);
    const spotlightFromDb = eventPresenceSplit.spotlight.get(login) || 0;
    const spotlightPresent = Math.max(spotlightFromEvaluations, spotlightFromJsonEvents, spotlightFromDb);

    let discordMessages = 0;
    let discordVocal = 0;
    let discordReactions = 0;
    if (member.discordId && engagement?.dataByMember?.[member.discordId]) {
      const src = engagement.dataByMember[member.discordId];
      discordMessages = Math.max(0, Math.floor(Number(src.nbMessages) || 0));
      discordVocal = Math.max(0, Math.floor(Number(src.nbVocalMinutes) || 0));
    }

    const raidsDone = raidDoneByLogin.get(login) || 0;
    const regularityAuto = regularityActiveMonthsFromMaps(login, scoreMap0, scoreMap1, scoreMap2);

    const pilot = pilotageEntries[login] || null;

    const resolvedRaids =
      pilot?.raidsDoneOverride !== undefined && pilot?.raidsDoneOverride !== null
        ? pilot.raidsDoneOverride
        : raidsDone;
    const resolvedEvents =
      pilot?.eventsPresentOverride !== undefined && pilot?.eventsPresentOverride !== null
        ? pilot.eventsPresentOverride
        : eventsPresent;
    const resolvedSpotlight =
      pilot?.spotlightPresentOverride !== undefined && pilot?.spotlightPresentOverride !== null
        ? pilot.spotlightPresentOverride
        : spotlightPresent;
    const resolvedReg =
      pilot?.regularityMonthsOverride !== undefined && pilot?.regularityMonthsOverride !== null
        ? pilot.regularityMonthsOverride
        : regularityAuto;

    const dManual = pilot?.discord;
    const resolvedMessages = dManual ? dManual.nbMessages : discordMessages;
    const resolvedVocal = dManual ? dManual.nbVocalMinutes : discordVocal;
    const resolvedReactions = dManual ? dManual.nbReactions : discordReactions;

    const raidsOther = Boolean(pilot?.raidsOtherSupport);
    const bonusStaff = clampBonusStaff(pilot?.bonusStaff ?? 0);
    const malusStaff = clampMalusStaff(pilot?.malusStaff ?? 0);

    const scores = {
      raids: scoreV3Raids(resolvedRaids, raidsOther),
      discord: scoreV3DiscordBlock({
        nbMessages: resolvedMessages,
        nbVocalMinutes: resolvedVocal,
        nbReactions: resolvedReactions,
      }).total,
      events: scoreV3Events(resolvedEvents),
      spotlight: scoreV3Spotlight(resolvedSpotlight),
      regularite: scoreV3Regularite(resolvedReg),
      bonus: bonusStaff,
      malus: malusStaff,
      total: 0,
    };
    scores.total = totalV3Score(scores);

    rows.push({
      twitchLogin: login,
      displayName,
      role,
      isActive,
      auto: {
        raidsDone,
        eventsPresent,
        spotlightPresent,
        discordMessages,
        discordVocalMinutes: discordVocal,
        discordReactions,
        regularityActiveMonths: regularityAuto,
      },
      pilotage: pilot,
      resolved: {
        raidsDone: resolvedRaids,
        raidsOtherSupport: raidsOther,
        eventsPresent: resolvedEvents,
        spotlightPresent: resolvedSpotlight,
        nbMessages: resolvedMessages,
        nbVocalMinutes: resolvedVocal,
        nbReactions: resolvedReactions,
        regularityActiveMonths: resolvedReg,
        bonusStaff,
        malusStaff,
      },
      scores,
      recommendedStatus: recommendV3Status(scores.total),
    });
  }

  rows.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return {
    month: monthKey,
    rows,
      meta: {
      regularityThreshold: REGULARITY_ACTIVE_THRESHOLD,
      note:
        "Events communautaires : max(présences `event_presences` hors catégorie/titre « spotlight », agrégat `eventEvaluations` JSON hors spotlight). " +
        "Spotlight : max(présences `event_presences` sur événements catégorie/titre spotlight — comme v2 —, `spotlightEvaluations` validées, et entrées JSON `eventEvaluations` typées spotlight). " +
        "Régularité auto : mois M, M-1, M-2 avec note synthèse legacy ≥ " +
        REGULARITY_ACTIVE_THRESHOLD +
        " (proxy). Surcharges possibles dans le pilotage v3.",
    },
  };
}
