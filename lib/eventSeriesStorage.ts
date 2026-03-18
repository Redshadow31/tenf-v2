import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

const EVENTS_STORE_NAME = "tenf-events";
const EVENT_SERIES_KEY = "event-series.json";

export type EventSeriesMeta = {
  eventId: string;
  seriesId: string;
  seriesName: string;
  sourceEventId?: string;
  updatedAt: string;
};

function isNetlify(): boolean {
  return (
    typeof getStore === "function" ||
    !!process.env.NETLIFY ||
    !!process.env.NETLIFY_DEV
  );
}

async function loadSeriesMapRaw(): Promise<Record<string, EventSeriesMeta>> {
  try {
    if (isNetlify()) {
      const store = getStore(EVENTS_STORE_NAME);
      const data = await store.get(EVENT_SERIES_KEY, { type: "json" });
      return (data as Record<string, EventSeriesMeta>) || {};
    }
    const dataDir = path.join(process.cwd(), "data", "events");
    const filePath = path.join(dataDir, EVENT_SERIES_KEY);
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as Record<string, EventSeriesMeta>;
  } catch (error) {
    console.error("[EventSeriesStorage] Erreur chargement map:", error);
    return {};
  }
}

async function saveSeriesMapRaw(seriesMap: Record<string, EventSeriesMeta>): Promise<void> {
  if (isNetlify()) {
    const store = getStore(EVENTS_STORE_NAME);
    await store.set(EVENT_SERIES_KEY, JSON.stringify(seriesMap, null, 2));
    return;
  }
  const dataDir = path.join(process.cwd(), "data", "events");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, EVENT_SERIES_KEY);
  fs.writeFileSync(filePath, JSON.stringify(seriesMap, null, 2), "utf-8");
}

export async function loadEventSeriesMap(): Promise<Record<string, EventSeriesMeta>> {
  return loadSeriesMapRaw();
}

export async function getEventSeriesMeta(eventId: string): Promise<EventSeriesMeta | null> {
  const seriesMap = await loadSeriesMapRaw();
  return seriesMap[eventId] || null;
}

export async function upsertEventSeriesMeta(meta: {
  eventId: string;
  seriesId: string;
  seriesName: string;
  sourceEventId?: string;
}): Promise<void> {
  const eventId = String(meta.eventId || "").trim();
  const seriesId = String(meta.seriesId || "").trim();
  const seriesName = String(meta.seriesName || "").trim();
  if (!eventId || !seriesId || !seriesName) return;

  const seriesMap = await loadSeriesMapRaw();
  seriesMap[eventId] = {
    eventId,
    seriesId,
    seriesName,
    sourceEventId: meta.sourceEventId ? String(meta.sourceEventId).trim() : undefined,
    updatedAt: new Date().toISOString(),
  };
  await saveSeriesMapRaw(seriesMap);
}

export async function deleteEventSeriesMeta(eventId: string): Promise<void> {
  const seriesMap = await loadSeriesMapRaw();
  if (!seriesMap[eventId]) return;
  delete seriesMap[eventId];
  await saveSeriesMapRaw(seriesMap);
}

