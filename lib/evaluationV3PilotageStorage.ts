import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

/** Saisie manuelle Discord (sous-objet par membre). */
export interface EvaluationV3DiscordManual {
  nbMessages: number;
  nbVocalMinutes: number;
  nbReactions: number;
  staffNote?: string;
  reason?: string;
  updatedAt: string;
  updatedBy: string;
}

/** Saisies pilotage v3 pour un membre (Discord + autres piliers + bonus/malus). */
export interface EvaluationV3PilotageEntry {
  twitchLogin: string;
  discord?: EvaluationV3DiscordManual;
  /** null = utiliser l’auto (comptage raids / mois). */
  raidsDoneOverride?: number | null;
  /** Si 0 raid détecté mais soutien visible autre (5 pts barème). */
  raidsOtherSupport?: boolean;
  eventsPresentOverride?: number | null;
  spotlightPresentOverride?: number | null;
  /** 0–3 mois actifs sur les 3 derniers ; null = auto (proxy legacy). */
  regularityMonthsOverride?: number | null;
  bonusStaff?: number;
  malusStaff?: number;
  pillarsReason?: string;
  pillarsStaffNote?: string;
  pillarsUpdatedAt?: string;
  pillarsUpdatedBy?: string;
}

export interface EvaluationV3PilotageMonth {
  month: string;
  entries: Record<string, EvaluationV3PilotageEntry>;
  lastUpdated: string;
}

const STORE_NAME = "tenf-evaluation-v3-pilotage";

function isNetlify(): boolean {
  return typeof getStore === "function" || !!process.env.NETLIFY || !!process.env.NETLIFY_DEV;
}

function pilotageBlobKey(month: string): string {
  return `${month}/pilotage.json`;
}

function legacyDiscordFsPath(month: string): string {
  return path.join(process.cwd(), "data", "evaluation-v3", month, "manual-discord.json");
}

/** Ancien fichier JSON (discord seul), avant fusion pilotage. */
interface LegacyDiscordMonth {
  month: string;
  entries: Record<
    string,
    {
      twitchLogin: string;
      nbMessages: number;
      nbVocalMinutes: number;
      nbReactions: number;
      staffNote?: string;
      reason?: string;
      updatedAt: string;
      updatedBy: string;
    }
  >;
  lastUpdated: string;
}

function migrateLegacyDiscord(legacy: LegacyDiscordMonth): EvaluationV3PilotageMonth {
  const entries: Record<string, EvaluationV3PilotageEntry> = {};
  for (const [login, row] of Object.entries(legacy.entries || {})) {
    const key = login.toLowerCase();
    entries[key] = {
      twitchLogin: key,
      discord: {
        nbMessages: row.nbMessages,
        nbVocalMinutes: row.nbVocalMinutes,
        nbReactions: row.nbReactions ?? 0,
        staffNote: row.staffNote,
        reason: row.reason,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
      },
    };
  }
  return {
    month: legacy.month,
    entries,
    lastUpdated: legacy.lastUpdated,
  };
}

async function loadLegacyDiscordOnly(month: string): Promise<EvaluationV3PilotageMonth | null> {
  try {
    if (isNetlify()) {
      const legacyStore = getStore("tenf-evaluation-v3-manual");
      const raw = await legacyStore.get(`${month}/manual-discord.json`, { type: "json" });
      if (!raw) return null;
      return migrateLegacyDiscord(raw as LegacyDiscordMonth);
    }
    const fp = legacyDiscordFsPath(month);
    if (!fs.existsSync(fp)) return null;
    const legacy = JSON.parse(fs.readFileSync(fp, "utf-8")) as LegacyDiscordMonth;
    return migrateLegacyDiscord(legacy);
  } catch {
    return null;
  }
}

export async function loadEvaluationV3Pilotage(month: string): Promise<EvaluationV3PilotageMonth | null> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const raw = await store.get(pilotageBlobKey(month), { type: "json" });
      if (raw) return raw as EvaluationV3PilotageMonth;
      return await loadLegacyDiscordOnly(month);
    }

    const filePath = path.join(process.cwd(), "data", "evaluation-v3", month, "pilotage.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as EvaluationV3PilotageMonth;
    }
    return await loadLegacyDiscordOnly(month);
  } catch (error) {
    console.error(`[EvaluationV3PilotageStorage] load ${month}:`, error);
    return null;
  }
}

export async function saveEvaluationV3Pilotage(data: EvaluationV3PilotageMonth): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(pilotageBlobKey(data.month), JSON.stringify(data, null, 2));
      return;
    }

    const dir = path.join(process.cwd(), "data", "evaluation-v3", data.month);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, "pilotage.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`[EvaluationV3PilotageStorage] save ${data.month}:`, error);
    throw error;
  }
}

export async function upsertEvaluationV3PilotageDiscord(
  month: string,
  payload: {
    twitchLogin: string;
    nbMessages: number;
    nbVocalMinutes: number;
    nbReactions: number;
    staffNote?: string;
    reason: string;
    updatedBy: string;
  },
): Promise<EvaluationV3PilotageEntry> {
  const login = payload.twitchLogin.toLowerCase().trim();
  if (!login) throw new Error("twitchLogin requis");

  const base =
    (await loadEvaluationV3Pilotage(month)) ||
    ({
      month,
      entries: {},
      lastUpdated: new Date().toISOString(),
    } satisfies EvaluationV3PilotageMonth);

  const prev = base.entries[login] || { twitchLogin: login };
  const discord: EvaluationV3DiscordManual = {
    nbMessages: Math.max(0, Math.floor(Number(payload.nbMessages) || 0)),
    nbVocalMinutes: Math.max(0, Number(payload.nbVocalMinutes) || 0),
    nbReactions: Math.max(0, Math.floor(Number(payload.nbReactions) || 0)),
    staffNote: payload.staffNote?.trim() || undefined,
    reason: payload.reason.trim(),
    updatedAt: new Date().toISOString(),
    updatedBy: payload.updatedBy,
  };

  const next: EvaluationV3PilotageEntry = {
    ...prev,
    twitchLogin: login,
    discord,
  };

  base.entries[login] = next;
  base.lastUpdated = new Date().toISOString();
  await saveEvaluationV3Pilotage(base);
  return next;
}

export async function upsertEvaluationV3PilotagePillars(
  month: string,
  payload: {
    twitchLogin: string;
    raidsDoneOverride?: number | null;
    raidsOtherSupport?: boolean;
    eventsPresentOverride?: number | null;
    spotlightPresentOverride?: number | null;
    regularityMonthsOverride?: number | null;
    bonusStaff?: number;
    malusStaff?: number;
    pillarsReason: string;
    pillarsStaffNote?: string;
    updatedBy: string;
  },
): Promise<EvaluationV3PilotageEntry> {
  const login = payload.twitchLogin.toLowerCase().trim();
  if (!login) throw new Error("twitchLogin requis");

  const base =
    (await loadEvaluationV3Pilotage(month)) ||
    ({
      month,
      entries: {},
      lastUpdated: new Date().toISOString(),
    } satisfies EvaluationV3PilotageMonth);

  const prev = base.entries[login] || { twitchLogin: login };

  const next: EvaluationV3PilotageEntry = {
    ...prev,
    twitchLogin: login,
    raidsDoneOverride:
      payload.raidsDoneOverride === undefined
        ? prev.raidsDoneOverride
        : payload.raidsDoneOverride === null
          ? null
          : Math.max(0, Math.floor(Number(payload.raidsDoneOverride))),
    raidsOtherSupport:
      payload.raidsOtherSupport === undefined ? prev.raidsOtherSupport : Boolean(payload.raidsOtherSupport),
    eventsPresentOverride:
      payload.eventsPresentOverride === undefined
        ? prev.eventsPresentOverride
        : payload.eventsPresentOverride === null
          ? null
          : Math.max(0, Math.floor(Number(payload.eventsPresentOverride))),
    spotlightPresentOverride:
      payload.spotlightPresentOverride === undefined
        ? prev.spotlightPresentOverride
        : payload.spotlightPresentOverride === null
          ? null
          : Math.max(0, Math.floor(Number(payload.spotlightPresentOverride))),
    regularityMonthsOverride:
      payload.regularityMonthsOverride === undefined
        ? prev.regularityMonthsOverride
        : payload.regularityMonthsOverride === null
          ? null
          : Math.max(0, Math.min(3, Math.floor(Number(payload.regularityMonthsOverride)))),
    bonusStaff: payload.bonusStaff === undefined ? prev.bonusStaff : Math.max(0, Math.min(5, Number(payload.bonusStaff) || 0)),
    malusStaff: payload.malusStaff === undefined ? prev.malusStaff : Math.max(0, Math.min(30, Number(payload.malusStaff) || 0)),
    pillarsReason: payload.pillarsReason.trim(),
    pillarsStaffNote: payload.pillarsStaffNote?.trim() || undefined,
    pillarsUpdatedAt: new Date().toISOString(),
    pillarsUpdatedBy: payload.updatedBy,
  };

  base.entries[login] = next;
  base.lastUpdated = new Date().toISOString();
  await saveEvaluationV3Pilotage(base);
  return next;
}
