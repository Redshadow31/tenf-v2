import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type EventDiscordPointsStatus = "awarded" | "cancelled";

export type EventDiscordPointsEntry = {
  id: string;
  presenceKey: string;
  eventId: string;
  eventTitle: string;
  eventAt: string;
  twitchLogin: string;
  displayName: string;
  discordUsername?: string;
  points: number;
  status: EventDiscordPointsStatus;
  note: string;
  awardedByDiscordId: string;
  awardedByUsername: string;
  awardedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "event-discord-points.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function listEventDiscordPoints(): EventDiscordPointsEntry[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(FILE_PATH)) return [];
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as EventDiscordPointsEntry[];
  } catch (error) {
    console.error("[eventDiscordPointsStorage] list error:", error);
    return [];
  }
}

function saveEventDiscordPoints(entries: EventDiscordPointsEntry[]): void {
  ensureDataDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

export function hasEventDiscordPointForPresence(presenceKey: string): boolean {
  const entries = listEventDiscordPoints();
  return entries.some((entry) => entry.presenceKey === presenceKey);
}

export function createEventDiscordPoint(input: {
  presenceKey: string;
  eventId: string;
  eventTitle: string;
  eventAt: string;
  twitchLogin: string;
  displayName: string;
  discordUsername?: string;
  points: number;
  note?: string;
  awardedByDiscordId: string;
  awardedByUsername: string;
}): EventDiscordPointsEntry {
  const now = new Date().toISOString();
  const entry: EventDiscordPointsEntry = {
    id: randomUUID(),
    presenceKey: input.presenceKey,
    eventId: input.eventId,
    eventTitle: input.eventTitle,
    eventAt: input.eventAt,
    twitchLogin: input.twitchLogin.toLowerCase(),
    displayName: input.displayName,
    discordUsername: input.discordUsername?.trim() || undefined,
    points: Number.isFinite(input.points) && input.points > 0 ? Math.floor(input.points) : 300,
    status: "awarded",
    note: String(input.note || "").trim(),
    awardedByDiscordId: input.awardedByDiscordId,
    awardedByUsername: input.awardedByUsername,
    awardedAt: now,
  };

  const all = listEventDiscordPoints();
  all.unshift(entry);
  saveEventDiscordPoints(all);
  return entry;
}
