import { supabaseAdmin } from "@/lib/db/supabase";
import { parseUserAgent } from "@/lib/connection-logs/userAgent";
import { hashIpAddress, maskIpAddress } from "@/lib/connection-logs/network";

export type ConnectionType = "discord" | "guest";
export type ConnectionScope = "all" | "members" | "general";
export type PeriodFilter = "today" | "7d" | "30d";

export interface ConnectionGeo {
  countryCode: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface RecordConnectionInput {
  sessionId: string;
  path: string;
  referer: string | null;
  userAgent: string | null;
  connectionType: ConnectionType;
  userId?: string | null;
  username?: string | null;
  isDiscordAuth: boolean;
  ipAddress: string | null;
  geo: ConnectionGeo;
  source?: "heartbeat" | "login" | "navigation";
}

export interface ConnectionLogFilters {
  scope: ConnectionScope;
  period: PeriodFilter;
  country?: string;
  member?: string;
  connectionType?: ConnectionType | "all" | "discord_member" | "general_visitor";
}

interface RawConnectionRow {
  id: string;
  created_at: string;
  connection_type: ConnectionType;
  user_id: string | null;
  username: string | null;
  session_id: string;
  is_discord_auth: boolean;
  path: string | null;
  referer: string | null;
  ip_masked: string | null;
  ip_hash: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
}

interface RawActiveRow {
  session_id: string;
  created_at: string;
  last_seen_at: string;
  connection_type: ConnectionType;
  user_id: string | null;
  username: string | null;
  is_discord_auth: boolean;
  path: string | null;
  referer: string | null;
  ip_masked: string | null;
  ip_hash: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  updated_at: string;
  expires_at: string | null;
  is_active: boolean;
  last_event_at: string | null;
}

let lastPurgeAt = 0;
const RETENTION_DAYS = 30;
const ACTIVE_WINDOW_MINUTES = 10;
const EVENT_MIN_INTERVAL_MS = 5 * 60 * 1000;

function getSinceDate(period: PeriodFilter): Date {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

function normalizeMemberSearch(value?: string): string {
  return (value || "").trim().toLowerCase();
}

function getExpiresAt(now: Date): string {
  return new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function toUiConnectionType(type: ConnectionType): "discord_member" | "general_visitor" {
  return type === "discord" ? "discord_member" : "general_visitor";
}

function fromUiConnectionType(
  type: ConnectionType | "all" | "discord_member" | "general_visitor"
): ConnectionType | "all" {
  if (type === "discord_member") return "discord";
  if (type === "general_visitor") return "guest";
  return type;
}

export function isSessionRecentlyActive(lastSeenAt: string, windowMinutes = ACTIVE_WINDOW_MINUTES): boolean {
  const threshold = Date.now() - windowMinutes * 60 * 1000;
  return new Date(lastSeenAt).getTime() >= threshold;
}

export async function purgeConnectionLogs(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastPurgeAt < 30 * 60 * 1000) {
    return;
  }
  lastPurgeAt = now;

  const cutoffIso = new Date(now - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await supabaseAdmin.from("connection_session_events").delete().lt("created_at", cutoffIso);
  await supabaseAdmin.from("page_activity_events").delete().lt("created_at", cutoffIso);
  await supabaseAdmin.from("connection_sessions").delete().lt("last_seen_at", cutoffIso);
  await supabaseAdmin.from("connection_sessions").delete().lt("expires_at", new Date().toISOString());
}

export async function recordConnection(input: RecordConnectionInput): Promise<void> {
  await purgeConnectionLogs();

  const now = new Date();
  const nowIso = now.toISOString();
  const maskedIp = maskIpAddress(input.ipAddress);
  const ipHash = hashIpAddress(input.ipAddress);
  const ua = parseUserAgent(input.userAgent);

  const { data: existing } = await supabaseAdmin
    .from("connection_sessions")
    .select("session_id,last_event_at,path")
    .eq("session_id", input.sessionId)
    .maybeSingle();

  const lastEventAt = existing?.last_event_at ? new Date(existing.last_event_at).getTime() : 0;
  const shouldInsertEvent =
    !existing || Date.now() - lastEventAt >= EVENT_MIN_INTERVAL_MS || existing.path !== input.path;

  await supabaseAdmin.from("connection_sessions").upsert(
    {
      session_id: input.sessionId,
      user_id: input.userId || null,
      username: input.username || null,
      is_discord_auth: input.isDiscordAuth,
      connection_type: input.connectionType,
      ip_masked: maskedIp,
      ip_hash: ipHash,
      country: input.geo.country,
      country_code: input.geo.countryCode,
      region: input.geo.region,
      city: input.geo.city,
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
      user_agent: input.userAgent,
      device_type: ua.deviceType,
      browser: ua.browser,
      os: ua.os,
      path: input.path,
      referer: input.referer,
      last_seen_at: nowIso,
      updated_at: nowIso,
      expires_at: getExpiresAt(now),
      is_active: true,
      last_event_at: shouldInsertEvent ? nowIso : existing?.last_event_at,
    },
    { onConflict: "session_id" }
  );

  if (!shouldInsertEvent) {
    return;
  }

  await supabaseAdmin.from("connection_session_events").insert({
    session_id: input.sessionId,
    user_id: input.userId || null,
    username: input.username || null,
    is_discord_auth: input.isDiscordAuth,
    connection_type: input.connectionType,
    ip_masked: maskedIp,
    ip_hash: ipHash,
    country: input.geo.country,
    country_code: input.geo.countryCode,
    region: input.geo.region,
    city: input.geo.city,
    latitude: input.geo.latitude,
    longitude: input.geo.longitude,
    user_agent: input.userAgent,
    device_type: ua.deviceType,
    browser: ua.browser,
    os: ua.os,
    path: input.path,
    referer: input.referer,
    created_at: nowIso,
  });
}

function filterRows(rows: RawConnectionRow[], filters: ConnectionLogFilters): RawConnectionRow[] {
  const memberSearch = normalizeMemberSearch(filters.member);
  return rows.filter((row) => {
    if (filters.scope === "members" && row.connection_type !== "discord") return false;
    if (filters.scope === "general" && row.connection_type !== "guest") return false;
    const normalizedType = fromUiConnectionType(filters.connectionType || "all");
    if (normalizedType !== "all" && row.connection_type !== normalizedType) return false;
    if (filters.country && row.country_code !== filters.country) return false;
    if (memberSearch) {
      const username = (row.username || "").toLowerCase();
      const userId = (row.user_id || "").toLowerCase();
      if (!username.includes(memberSearch) && !userId.includes(memberSearch)) return false;
    }
    return true;
  });
}

export async function getConnectionLogsDashboard(filters: ConnectionLogFilters) {
  await purgeConnectionLogs();

  const sinceIso = getSinceDate(filters.period).toISOString();
  const { data, error } = await supabaseAdmin
    .from("connection_session_events")
    .select("*")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(3000);

  if (error) {
    throw new Error(`[connection_logs] ${error.message}`);
  }

  const rows = filterRows((data || []) as RawConnectionRow[], filters);

  const byCountry = new Map<
    string,
    {
      countryCode: string;
      countryName: string;
      continent: string;
      count: number;
      members: number;
      general: number;
      latestAt: string;
      sampleCity: string | null;
      sampleRegion: string | null;
    }
  >();

  const byHour = new Map<number, number>();
  const memberSet = new Map<string, { discordId: string; username: string }>();

  let total = 0;
  let members = 0;
  let general = 0;

  for (const row of rows) {
    total += 1;
    if (row.connection_type === "discord") members += 1;
    if (row.connection_type === "guest") general += 1;

    const hour = new Date(row.created_at).getHours();
    byHour.set(hour, (byHour.get(hour) || 0) + 1);

    if (row.user_id) {
      memberSet.set(row.user_id, {
        discordId: row.user_id,
        username: row.username || row.user_id,
      });
    }

    const countryCode = row.country_code || "UN";
    const countryName = row.country || "Inconnu";
    const existing = byCountry.get(countryCode);
    if (!existing) {
      byCountry.set(countryCode, {
        countryCode,
        countryName,
        continent: "Monde",
        count: 1,
        members: row.connection_type === "discord" ? 1 : 0,
        general: row.connection_type === "guest" ? 1 : 0,
        latestAt: row.created_at,
        sampleCity: row.city,
        sampleRegion: row.region,
      });
    } else {
      existing.count += 1;
      if (row.connection_type === "discord") existing.members += 1;
      if (row.connection_type === "guest") existing.general += 1;
      if (new Date(row.created_at) > new Date(existing.latestAt)) {
        existing.latestAt = row.created_at;
        existing.sampleCity = row.city;
        existing.sampleRegion = row.region;
      }
    }
  }

  return {
    period: filters.period,
    totals: {
      total,
      members,
      general,
    },
    countries: Array.from(byCountry.values()).sort((a, b) => b.count - a.count),
    hourly: Array.from({ length: 24 }).map((_, hour) => ({
      hour,
      count: byHour.get(hour) || 0,
    })),
    rows: rows.slice(0, 300).map((row) => ({
      ...row,
      session_key: row.session_id,
      discord_id: row.user_id,
      country_name: row.country,
      connection_type: toUiConnectionType(row.connection_type),
    })),
    members: Array.from(memberSet.values()).sort((a, b) => a.username.localeCompare(b.username)),
  };
}

export async function getRealtimeConnectionsSnapshot() {
  await purgeConnectionLogs();

  const activeThresholdIso = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000).toISOString();
  await supabaseAdmin
    .from("connection_sessions")
    .update({ is_active: false })
    .lt("last_seen_at", activeThresholdIso)
    .eq("is_active", true);

  const { data, error } = await supabaseAdmin
    .from("connection_sessions")
    .select("*")
    .gte("last_seen_at", activeThresholdIso)
    .eq("is_active", true)
    .order("last_seen_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(`[active_connections] ${error.message}`);
  }

  const rows = (data || []) as RawActiveRow[];

  const byCountry = new Map<string, { countryCode: string; countryName: string; continent: string; count: number }>();
  const byContinent = new Map<string, number>();

  let total = 0;
  let members = 0;
  let general = 0;

  for (const row of rows) {
    total += 1;
    if (row.connection_type === "discord") members += 1;
    if (row.connection_type === "guest") general += 1;

    const countryCode = row.country_code || "UN";
    const countryName = row.country || "Inconnu";
    const continent = "Monde";

    const existingCountry = byCountry.get(countryCode);
    if (!existingCountry) {
      byCountry.set(countryCode, { countryCode, countryName, continent, count: 1 });
    } else {
      existingCountry.count += 1;
    }

    byContinent.set(continent, (byContinent.get(continent) || 0) + 1);
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      total,
      members,
      general,
    },
    countries: Array.from(byCountry.values()).sort((a, b) => b.count - a.count),
    continents: Array.from(byContinent.entries())
      .map(([continent, count]) => ({ continent, count }))
      .sort((a, b) => b.count - a.count),
    active: rows.slice(0, 250).map((row) => ({
      ...row,
      session_key: row.session_id,
      last_activity_at: row.last_seen_at,
      connection_type: toUiConnectionType(row.connection_type),
      country_name: row.country,
      continent: "Monde",
    })),
  };
}
