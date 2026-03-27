import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

const EVENTS_STORE_NAME = "tenf-events";
const EVENT_SPOTLIGHT_KEY = "event-spotlights.json";

export type EventSpotlightMeta = {
  eventId: string;
  spotlightId: string;
  streamerTwitchLogin: string;
  streamerDisplayName?: string;
  updatedAt: string;
};

function isNetlify(): boolean {
  return (
    typeof getStore === "function" ||
    !!process.env.NETLIFY ||
    !!process.env.NETLIFY_DEV
  );
}

async function loadSpotlightMapRaw(): Promise<Record<string, EventSpotlightMeta>> {
  try {
    if (isNetlify()) {
      const store = getStore(EVENTS_STORE_NAME);
      const data = await store.get(EVENT_SPOTLIGHT_KEY, { type: "json" });
      return (data as Record<string, EventSpotlightMeta>) || {};
    }
    const dataDir = path.join(process.cwd(), "data", "events");
    const filePath = path.join(dataDir, EVENT_SPOTLIGHT_KEY);
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as Record<string, EventSpotlightMeta>;
  } catch (error) {
    console.error("[EventSpotlightStorage] Erreur chargement map:", error);
    return {};
  }
}

async function saveSpotlightMapRaw(spotlightMap: Record<string, EventSpotlightMeta>): Promise<void> {
  if (isNetlify()) {
    const store = getStore(EVENTS_STORE_NAME);
    await store.set(EVENT_SPOTLIGHT_KEY, JSON.stringify(spotlightMap, null, 2));
    return;
  }
  const dataDir = path.join(process.cwd(), "data", "events");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, EVENT_SPOTLIGHT_KEY);
  fs.writeFileSync(filePath, JSON.stringify(spotlightMap, null, 2), "utf-8");
}

export async function loadEventSpotlightMap(): Promise<Record<string, EventSpotlightMeta>> {
  return loadSpotlightMapRaw();
}

export async function getEventSpotlightMeta(eventId: string): Promise<EventSpotlightMeta | null> {
  const spotlightMap = await loadSpotlightMapRaw();
  return spotlightMap[eventId] || null;
}

export async function upsertEventSpotlightMeta(meta: {
  eventId: string;
  spotlightId: string;
  streamerTwitchLogin: string;
  streamerDisplayName?: string;
}): Promise<void> {
  const eventId = String(meta.eventId || "").trim();
  const spotlightId = String(meta.spotlightId || "").trim();
  const streamerTwitchLogin = String(meta.streamerTwitchLogin || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  if (!eventId || !spotlightId || !streamerTwitchLogin) return;

  const spotlightMap = await loadSpotlightMapRaw();
  spotlightMap[eventId] = {
    eventId,
    spotlightId,
    streamerTwitchLogin,
    streamerDisplayName: meta.streamerDisplayName?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
  await saveSpotlightMapRaw(spotlightMap);
}

export async function deleteEventSpotlightMeta(eventId: string): Promise<void> {
  const spotlightMap = await loadSpotlightMapRaw();
  if (!spotlightMap[eventId]) return;
  delete spotlightMap[eventId];
  await saveSpotlightMapRaw(spotlightMap);
}
