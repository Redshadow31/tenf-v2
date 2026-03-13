import { supabaseAdmin } from "@/lib/db/supabase";
import { purgeConnectionLogs } from "@/lib/connectionLogs";

export type PageActivityZone = "public" | "admin";
export type PageActivityEventType = "page_view" | "click";
export type PageActivityAuthFilter = "all" | "authenticated" | "guest";

export interface RecordPageActivityInput {
  sessionId: string;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  path: string;
  title?: string | null;
  eventType: PageActivityEventType;
  target?: string | null;
  nowMs?: number;
}

export interface PageActivityFilters {
  page: number;
  limit: number;
  startDate: string;
  endDate: string;
  zone?: PageActivityZone;
  path?: string;
  userSearch?: string;
  authState: PageActivityAuthFilter;
  eventType?: PageActivityEventType;
}

type PageActivityRow = {
  session_id: string;
  user_id: string | null;
  username: string | null;
  is_authenticated: boolean;
  zone: PageActivityZone;
  path: string;
  title: string | null;
  event_type: PageActivityEventType;
  target: string | null;
  created_at: string;
};

const PAGE_VIEW_MIN_INTERVAL_MS = 15_000;
const CLICK_MIN_INTERVAL_MS = 2_000;
const EVENT_FETCH_LIMIT = 20_000;

declare global {
  // eslint-disable-next-line no-var
  var __tenfPageActivityDedupStore: Map<string, number> | undefined;
}

function getDedupStore(): Map<string, number> {
  if (!globalThis.__tenfPageActivityDedupStore) {
    globalThis.__tenfPageActivityDedupStore = new Map<string, number>();
  }
  return globalThis.__tenfPageActivityDedupStore;
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  const noQuery = trimmed.split("?")[0]?.split("#")[0] || "/";
  return noQuery.startsWith("/") ? noQuery.slice(0, 256) : `/${noQuery.slice(0, 255)}`;
}

function shouldIgnorePath(path: string): boolean {
  return (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/favicon") ||
    path.startsWith("/robots.txt") ||
    path.startsWith("/sitemap")
  );
}

function sanitizeShortText(value: string | null | undefined, max = 160): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, max);
}

function resolveZone(path: string): PageActivityZone {
  return path.startsWith("/admin") ? "admin" : "public";
}

function shouldStoreEvent(input: {
  key: string;
  nowMs: number;
  minIntervalMs: number;
}): boolean {
  const store = getDedupStore();
  const previous = store.get(input.key) || 0;
  if (input.nowMs - previous < input.minIntervalMs) return false;
  store.set(input.key, input.nowMs);
  return true;
}

function applyFilters(rows: PageActivityRow[], filters: PageActivityFilters): PageActivityRow[] {
  const search = (filters.userSearch || "").trim().toLowerCase();
  const pathSearch = (filters.path || "").trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.zone && row.zone !== filters.zone) return false;
    if (filters.eventType && row.event_type !== filters.eventType) return false;
    if (filters.authState === "authenticated" && !row.is_authenticated) return false;
    if (filters.authState === "guest" && row.is_authenticated) return false;
    if (pathSearch && !row.path.toLowerCase().includes(pathSearch)) return false;
    if (search) {
      const username = (row.username || "").toLowerCase();
      const userId = (row.user_id || "").toLowerCase();
      if (!username.includes(search) && !userId.includes(search)) return false;
    }
    return true;
  });
}

async function loadPageActivityRows(filters: PageActivityFilters): Promise<PageActivityRow[]> {
  let query = supabaseAdmin
    .from("page_activity_events")
    .select("*")
    .gte("created_at", filters.startDate)
    .lte("created_at", filters.endDate)
    .order("created_at", { ascending: false })
    .limit(EVENT_FETCH_LIMIT);

  if (filters.zone) query = query.eq("zone", filters.zone);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);
  if (filters.authState === "authenticated") query = query.eq("is_authenticated", true);
  if (filters.authState === "guest") query = query.eq("is_authenticated", false);
  if (filters.path) query = query.ilike("path", `%${filters.path.replace(/[%_]/g, "")}%`);
  if (filters.userSearch) {
    const safe = filters.userSearch.replace(/[%_,]/g, "");
    if (safe) query = query.or(`username.ilike.%${safe}%,user_id.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`[loadPageActivityRows] ${error.message}`);
  return (data || []) as PageActivityRow[];
}

export async function recordPageActivity(input: RecordPageActivityInput): Promise<boolean> {
  await purgeConnectionLogs();

  const normalizedPath = normalizePath(input.path);
  if (shouldIgnorePath(normalizedPath)) return false;

  const nowMs = input.nowMs || Date.now();
  const minIntervalMs = input.eventType === "page_view" ? PAGE_VIEW_MIN_INTERVAL_MS : CLICK_MIN_INTERVAL_MS;
  const dedupKey = `${input.sessionId}:${input.eventType}:${normalizedPath}:${sanitizeShortText(input.target, 100) || "-"}`;
  if (!shouldStoreEvent({ key: dedupKey, nowMs, minIntervalMs })) return false;

  const { error } = await supabaseAdmin.from("page_activity_events").insert({
    session_id: input.sessionId,
    user_id: input.userId,
    username: input.username,
    is_authenticated: input.isAuthenticated,
    zone: resolveZone(normalizedPath),
    path: normalizedPath,
    title: sanitizeShortText(input.title, 140),
    event_type: input.eventType,
    target: sanitizeShortText(input.target, 180),
    created_at: new Date(nowMs).toISOString(),
  });

  if (error) throw new Error(`[recordPageActivity] ${error.message}`);
  return true;
}

export async function getPageActivityHistory(filters: PageActivityFilters) {
  await purgeConnectionLogs();
  const rows = applyFilters(await loadPageActivityRows(filters), filters);
  const grouped = new Map<
    string,
    {
      zone: PageActivityZone;
      path: string;
      title: string | null;
      userId: string | null;
      username: string | null;
      authState: "authenticated" | "guest";
      visits: number;
      clicks: number;
      lastVisitedAt: string;
    }
  >();

  for (const row of rows) {
    const key = `${row.zone}|${row.path}|${row.user_id || "guest"}`;
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        zone: row.zone,
        path: row.path,
        title: row.title,
        userId: row.user_id,
        username: row.username,
        authState: row.is_authenticated ? "authenticated" : "guest",
        visits: row.event_type === "page_view" ? 1 : 0,
        clicks: row.event_type === "click" ? 1 : 0,
        lastVisitedAt: row.created_at,
      });
      continue;
    }
    if (row.event_type === "page_view") current.visits += 1;
    if (row.event_type === "click") current.clicks += 1;
    if (new Date(row.created_at) > new Date(current.lastVisitedAt)) {
      current.lastVisitedAt = row.created_at;
      current.title = row.title || current.title;
      current.username = row.username || current.username;
    }
  }

  const sorted = Array.from(grouped.values()).sort(
    (a, b) => new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime()
  );
  const total = sorted.length;
  const start = (filters.page - 1) * filters.limit;
  const end = start + filters.limit;

  return {
    page: filters.page,
    limit: filters.limit,
    total,
    rows: sorted.slice(start, end),
  };
}

export async function getPageActivityDailyStats(filters: PageActivityFilters) {
  await purgeConnectionLogs();
  const rows = applyFilters(await loadPageActivityRows(filters), filters);

  const daily = new Map<string, { date: string; visits: number; clicks: number; uniquePages: number }>();
  const dailyPages = new Map<string, Set<string>>();
  let totalVisits = 0;
  let totalClicks = 0;

  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    const entry = daily.get(day) || { date: day, visits: 0, clicks: 0, uniquePages: 0 };
    if (row.event_type === "page_view") {
      entry.visits += 1;
      totalVisits += 1;
    } else {
      entry.clicks += 1;
      totalClicks += 1;
    }
    daily.set(day, entry);

    const set = dailyPages.get(day) || new Set<string>();
    set.add(row.path);
    dailyPages.set(day, set);
  }

  for (const [day, set] of dailyPages.entries()) {
    const current = daily.get(day);
    if (current) current.uniquePages = set.size;
  }

  const dailyRows = Array.from(daily.values()).sort((a, b) => a.date.localeCompare(b.date));
  return {
    totalVisits,
    totalClicks,
    totalEvents: totalVisits + totalClicks,
    daily: dailyRows,
  };
}

export async function getPageActivityTopPages(filters: PageActivityFilters) {
  await purgeConnectionLogs();
  const rows = applyFilters(await loadPageActivityRows(filters), filters);

  const byPath = new Map<
    string,
    { path: string; zone: PageActivityZone; visits: number; clicks: number; lastVisitedAt: string }
  >();

  for (const row of rows) {
    const key = `${row.zone}|${row.path}`;
    const current = byPath.get(key) || {
      path: row.path,
      zone: row.zone,
      visits: 0,
      clicks: 0,
      lastVisitedAt: row.created_at,
    };
    if (row.event_type === "page_view") current.visits += 1;
    if (row.event_type === "click") current.clicks += 1;
    if (new Date(row.created_at) > new Date(current.lastVisitedAt)) current.lastVisitedAt = row.created_at;
    byPath.set(key, current);
  }

  const allPages = Array.from(byPath.values()).sort(
    (a, b) => b.visits + b.clicks - (a.visits + a.clicks)
  );
  return {
    topPages: allPages.slice(0, 20),
    topPublicPages: allPages.filter((row) => row.zone === "public").slice(0, 10),
    topAdminPages: allPages.filter((row) => row.zone === "admin").slice(0, 10),
  };
}
