import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

export interface MemberStreamPlanning {
  id: string;
  userId: string;
  twitchLogin: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  liveType: string; // Jeu / type de live
  title?: string; // Optionnel
  createdAt: string;
  updatedAt?: string;
}

const STORE_NAME = "tenf-member-planning";
const STORE_KEY = "stream-plannings.json";
const MAX_PAST_DAYS_TO_KEEP = 30;
const MAX_FUTURE_DAYS_TO_KEEP = 180;
const MAX_PLANNINGS_PER_USER = 200;
const MAX_LIVE_TYPE_LENGTH = 80;
const MAX_TITLE_LENGTH = 120;

function isNetlify(): boolean {
  return !!process.env.NETLIFY || !!process.env.NETLIFY_DEV;
}

function sortByDateTimeAsc(a: MemberStreamPlanning, b: MemberStreamPlanning): number {
  return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
}

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

function toDateTimeMs(date: string, time: string): number {
  return new Date(`${date}T${time}:00`).getTime();
}

function trimAndLimit(value: string | undefined, maxLength: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function sanitizePlanning(raw: MemberStreamPlanning): MemberStreamPlanning | null {
  const userId = (raw.userId || "").trim();
  const twitchLogin = (raw.twitchLogin || "").trim().toLowerCase();
  const date = (raw.date || "").trim();
  const time = (raw.time || "").trim();
  const liveType = trimAndLimit(raw.liveType, MAX_LIVE_TYPE_LENGTH);
  const title = trimAndLimit(raw.title, MAX_TITLE_LENGTH);
  const createdAt = raw.createdAt || new Date().toISOString();

  if (!raw.id || !userId || !twitchLogin || !date || !time || !liveType) return null;
  if (!isValidDate(date) || !isValidTime(time)) return null;
  if (Number.isNaN(toDateTimeMs(date, time))) return null;

  return {
    ...raw,
    userId,
    twitchLogin,
    date,
    time,
    liveType,
    title,
    createdAt,
  };
}

function cleanupPlannings(plannings: MemberStreamPlanning[]): {
  cleaned: MemberStreamPlanning[];
  changed: boolean;
} {
  const now = Date.now();
  const oldestAllowed = now - MAX_PAST_DAYS_TO_KEEP * 24 * 60 * 60 * 1000;
  const newestAllowed = now + MAX_FUTURE_DAYS_TO_KEEP * 24 * 60 * 60 * 1000;

  const dedup = new Map<string, MemberStreamPlanning>();
  let changed = false;

  for (const raw of plannings) {
    const sanitized = sanitizePlanning(raw);
    if (!sanitized) {
      changed = true;
      continue;
    }

    const streamAtMs = toDateTimeMs(sanitized.date, sanitized.time);
    if (streamAtMs < oldestAllowed || streamAtMs > newestAllowed) {
      changed = true;
      continue;
    }

    const key = `${sanitized.userId}|${sanitized.date}|${sanitized.time}`;
    const existing = dedup.get(key);
    if (!existing) {
      dedup.set(key, sanitized);
      continue;
    }

    changed = true;
    const existingUpdated = new Date(existing.updatedAt || existing.createdAt).getTime();
    const candidateUpdated = new Date(sanitized.updatedAt || sanitized.createdAt).getTime();
    if (candidateUpdated >= existingUpdated) {
      dedup.set(key, sanitized);
    }
  }

  const byUser = new Map<string, MemberStreamPlanning[]>();
  for (const planning of dedup.values()) {
    const current = byUser.get(planning.userId) || [];
    current.push(planning);
    byUser.set(planning.userId, current);
  }

  const cleaned: MemberStreamPlanning[] = [];
  for (const [userId, userPlannings] of byUser) {
    userPlannings.sort(sortByDateTimeAsc);
    const kept = userPlannings.slice(0, MAX_PLANNINGS_PER_USER);
    if (kept.length !== userPlannings.length) {
      changed = true;
    }
    cleaned.push(...kept);
    byUser.set(userId, kept);
  }

  cleaned.sort(sortByDateTimeAsc);
  if (cleaned.length !== plannings.length) {
    changed = true;
  }

  return { cleaned, changed };
}

async function readRawMemberStreamPlannings(): Promise<MemberStreamPlanning[]> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const data = await store.get(STORE_KEY, { type: "json" });
      return (data as MemberStreamPlanning[]) || [];
    }

    const dataDir = path.join(process.cwd(), "data", "members");
    const filePath = path.join(dataDir, STORE_KEY);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    console.error("[MemberPlanningStorage] Erreur chargement:", error);
    return [];
  }
}

async function writeRawMemberStreamPlannings(plannings: MemberStreamPlanning[]): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(STORE_KEY, JSON.stringify(plannings, null, 2));
      return;
    }

    const dataDir = path.join(process.cwd(), "data", "members");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, STORE_KEY);
    fs.writeFileSync(filePath, JSON.stringify(plannings, null, 2), "utf-8");
  } catch (error) {
    console.error("[MemberPlanningStorage] Erreur sauvegarde:", error);
    throw error;
  }
}

export async function loadMemberStreamPlannings(): Promise<MemberStreamPlanning[]> {
  const raw = await readRawMemberStreamPlannings();
  const { cleaned, changed } = cleanupPlannings(raw);
  if (changed) {
    await writeRawMemberStreamPlannings(cleaned);
  }
  return cleaned;
}

export async function saveMemberStreamPlannings(plannings: MemberStreamPlanning[]): Promise<void> {
  const { cleaned } = cleanupPlannings(plannings);
  await writeRawMemberStreamPlannings(cleaned);
}

export async function getMemberStreamPlanningsByUser(userId: string): Promise<MemberStreamPlanning[]> {
  const plannings = await loadMemberStreamPlannings();
  return plannings.filter((p) => p.userId === userId).sort(sortByDateTimeAsc);
}

export async function getPublicStreamPlanningsByTwitchLogin(twitchLogin: string): Promise<MemberStreamPlanning[]> {
  const plannings = await loadMemberStreamPlannings();
  return plannings
    .filter((p) => p.twitchLogin.toLowerCase() === twitchLogin.toLowerCase())
    .sort(sortByDateTimeAsc);
}

export async function createMemberStreamPlanning(input: {
  userId: string;
  twitchLogin: string;
  date: string;
  time: string;
  liveType: string;
  title?: string;
}): Promise<MemberStreamPlanning> {
  const plannings = await loadMemberStreamPlannings();
  const liveType = trimAndLimit(input.liveType, MAX_LIVE_TYPE_LENGTH) || "";
  const title = trimAndLimit(input.title, MAX_TITLE_LENGTH);
  const planning: MemberStreamPlanning = {
    id: `member-planning-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    userId: input.userId.trim(),
    twitchLogin: input.twitchLogin.trim().toLowerCase(),
    date: input.date.trim(),
    time: input.time.trim(),
    liveType,
    title,
    createdAt: new Date().toISOString(),
  };

  plannings.push(planning);
  await saveMemberStreamPlannings(plannings);
  return planning;
}

export async function deleteMemberStreamPlanning(planningId: string, userId: string): Promise<boolean> {
  const plannings = await loadMemberStreamPlannings();
  const before = plannings.length;
  const filtered = plannings.filter((p) => !(p.id === planningId && p.userId === userId));
  if (filtered.length === before) return false;
  await saveMemberStreamPlannings(filtered);
  return true;
}

