import { supabaseAdmin } from "@/lib/db/supabase";
import { parseUserAgent } from "@/lib/connection-logs/userAgent";
import { type ClientIpGeoReason } from "@/lib/connection-logs/network";
import { hashIpAddress, maskIpAddress } from "@/lib/connection-logs/network";
import { isSessionRecentlyActive, purgeConnectionLogs } from "@/lib/connectionLogs";
import { type LoginLogsQuery } from "@/lib/models/connectionLog";

export interface RecordSessionConnectionInput {
  sessionId: string;
  userId: string | null;
  username: string | null;
  isDiscordAuth: boolean;
  connectionType: "discord" | "guest";
  ipAddress: string | null;
  userAgent: string | null;
  path: string;
  referer: string | null;
  geo: {
    country: string | null;
    countryCode: string | null;
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    status?: "resolved" | ClientIpGeoReason;
    reason?: ClientIpGeoReason | null;
  };
}

const EVENT_MIN_INTERVAL_MS = 5 * 60 * 1000;
const REALTIME_WINDOW_MINUTES = 5;

function expiresAtFromNow(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

export async function recordSessionConnection(input: RecordSessionConnectionInput): Promise<void> {
  await purgeConnectionLogs();
  const nowIso = new Date().toISOString();
  const ua = parseUserAgent(input.userAgent);
  const ipMasked = maskIpAddress(input.ipAddress);
  const ipHash = hashIpAddress(input.ipAddress);

  const { data: existing } = await supabaseAdmin
    .from("connection_sessions")
    .select("session_id,last_event_at,path")
    .eq("session_id", input.sessionId)
    .maybeSingle();

  const lastEventMs = existing?.last_event_at ? new Date(existing.last_event_at).getTime() : 0;
  const shouldInsertEvent =
    !existing || Date.now() - lastEventMs >= EVENT_MIN_INTERVAL_MS || existing.path !== input.path;

  await supabaseAdmin.from("connection_sessions").upsert(
    {
      session_id: input.sessionId,
      user_id: input.userId,
      username: input.username,
      is_discord_auth: input.isDiscordAuth,
      connection_type: input.connectionType,
      ip_masked: ipMasked,
      ip_hash: ipHash,
      country: input.geo.country,
      country_code: input.geo.countryCode,
      region: input.geo.region,
      city: input.geo.city,
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
      geo_status: input.geo.status || null,
      geo_reason: input.geo.reason || null,
      user_agent: input.userAgent,
      device_type: ua.deviceType,
      browser: ua.browser,
      os: ua.os,
      path: input.path,
      referer: input.referer,
      last_seen_at: nowIso,
      updated_at: nowIso,
      expires_at: expiresAtFromNow(),
      is_active: true,
      last_event_at: shouldInsertEvent ? nowIso : existing?.last_event_at || null,
    },
    { onConflict: "session_id" }
  );

  if (!shouldInsertEvent) return;

  await supabaseAdmin.from("connection_session_events").insert({
    session_id: input.sessionId,
    user_id: input.userId,
    username: input.username,
    is_discord_auth: input.isDiscordAuth,
    connection_type: input.connectionType,
    ip_masked: ipMasked,
    ip_hash: ipHash,
    country: input.geo.country,
    country_code: input.geo.countryCode,
    region: input.geo.region,
    city: input.geo.city,
    latitude: input.geo.latitude,
    longitude: input.geo.longitude,
    geo_status: input.geo.status || null,
    geo_reason: input.geo.reason || null,
    user_agent: input.userAgent,
    device_type: ua.deviceType,
    browser: ua.browser,
    os: ua.os,
    path: input.path,
    referer: input.referer,
    created_at: nowIso,
  });
}

export async function getPaginatedLoginLogs(query: LoginLogsQuery) {
  await purgeConnectionLogs();

  const page = Math.max(1, query.page);
  const limit = Math.min(200, Math.max(1, query.limit));
  const offset = (page - 1) * limit;

  let baseQuery = supabaseAdmin
    .from("connection_sessions")
    .select("*", { count: "exact" })
    .order("last_seen_at", { ascending: false });

  if (query.startDate) baseQuery = baseQuery.gte("created_at", query.startDate);
  if (query.endDate) baseQuery = baseQuery.lte("created_at", query.endDate);
  if (query.country) baseQuery = baseQuery.eq("country_code", query.country);
  if (query.userId) baseQuery = baseQuery.eq("user_id", query.userId);
  if (query.userSearch) {
    const safe = query.userSearch.replace(/[%_,]/g, "");
    if (safe) {
      baseQuery = baseQuery.or(`user_id.ilike.%${safe}%,username.ilike.%${safe}%`);
    }
  }
  if (query.connectionType) baseQuery = baseQuery.eq("connection_type", query.connectionType);

  const { data, error, count } = await baseQuery.range(offset, offset + limit - 1);
  if (error) throw new Error(`[getPaginatedLoginLogs] ${error.message}`);

  return {
    page,
    limit,
    total: count || 0,
    logs: (data || []).map((row) => ({
      date: row.created_at,
      username: row.username,
      userId: row.user_id,
      connectionType: row.connection_type,
      country: row.country,
      countryCode: row.country_code,
      region: row.region,
      city: row.city,
      latitude: row.latitude,
      longitude: row.longitude,
      geoStatus: row.geo_status,
      geoReason: row.geo_reason,
      deviceType: row.device_type,
      browser: row.browser,
      os: row.os,
      ipMasked: row.ip_masked,
      lastSeenAt: row.last_seen_at,
    })),
  };
}

export async function heartbeatSession(input: {
  sessionId: string;
  path?: string;
  referer?: string | null;
  userId?: string | null;
  username?: string | null;
  isDiscordAuth?: boolean;
  connectionType?: "discord" | "guest";
}): Promise<boolean> {
  await purgeConnectionLogs();
  const nowIso = new Date().toISOString();

  const payload: Record<string, unknown> = {
    last_seen_at: nowIso,
    updated_at: nowIso,
    is_active: true,
  };

  if (input.path) payload.path = input.path;
  if (typeof input.referer !== "undefined") payload.referer = input.referer;
  if (typeof input.userId !== "undefined") payload.user_id = input.userId;
  if (typeof input.username !== "undefined") payload.username = input.username;
  if (typeof input.isDiscordAuth !== "undefined") payload.is_discord_auth = input.isDiscordAuth;
  if (typeof input.connectionType !== "undefined") payload.connection_type = input.connectionType;

  const { data, error } = await supabaseAdmin
    .from("connection_sessions")
    .update(payload)
    .eq("session_id", input.sessionId)
    .select("session_id")
    .limit(1);

  if (error) {
    throw new Error(`[heartbeatSession] ${error.message}`);
  }

  return Boolean(data && data.length > 0);
}

export async function getLoginLogsStats(params: {
  startDate?: string;
  endDate?: string;
  country?: string;
  userId?: string;
  connectionType?: "discord" | "guest";
}) {
  await purgeConnectionLogs();

  let query = supabaseAdmin
    .from("connection_session_events")
    .select("created_at,connection_type,country_code,user_id");

  if (params.startDate) query = query.gte("created_at", params.startDate);
  if (params.endDate) query = query.lte("created_at", params.endDate);
  if (params.country) query = query.eq("country_code", params.country);
  if (params.userId) query = query.eq("user_id", params.userId);
  if (params.connectionType) query = query.eq("connection_type", params.connectionType);

  const { data, error } = await query.limit(10000);
  if (error) throw new Error(`[getLoginLogsStats] ${error.message}`);

  const hourlyMap = new Map<number, number>();
  let total = 0;
  let members = 0;
  let guests = 0;

  for (const row of data || []) {
    total += 1;
    if (row.connection_type === "discord") members += 1;
    else guests += 1;
    const hour = new Date(row.created_at).getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
  }

  return {
    totalConnections: total,
    memberConnections: members,
    guestConnections: guests,
    hourlyConnections: Array.from({ length: 24 }).map((_, hour) => ({
      hour,
      count: hourlyMap.get(hour) || 0,
    })),
  };
}

export async function getLoginLogsMapData(params: {
  startDate?: string;
  endDate?: string;
  country?: string;
  userId?: string;
  connectionType?: "discord" | "guest";
}) {
  await purgeConnectionLogs();

  let query = supabaseAdmin
    .from("connection_session_events")
    .select("country,country_code,latitude,longitude,connection_type,created_at,user_id");

  if (params.startDate) query = query.gte("created_at", params.startDate);
  if (params.endDate) query = query.lte("created_at", params.endDate);
  if (params.country) query = query.eq("country_code", params.country);
  if (params.userId) query = query.eq("user_id", params.userId);
  if (params.connectionType) query = query.eq("connection_type", params.connectionType);

  const { data, error } = await query.limit(10000);
  if (error) throw new Error(`[getLoginLogsMapData] ${error.message}`);

  const byCountry = new Map<
    string,
    {
      country: string;
      countryCode: string;
      latitude: number | null;
      longitude: number | null;
      connections: number;
      members: number;
      guests: number;
    }
  >();

  for (const row of data || []) {
    const code = row.country_code || "UN";
    const existing = byCountry.get(code);
    if (!existing) {
      byCountry.set(code, {
        country: row.country || "Inconnu",
        countryCode: code,
        latitude: row.latitude,
        longitude: row.longitude,
        connections: 1,
        members: row.connection_type === "discord" ? 1 : 0,
        guests: row.connection_type === "guest" ? 1 : 0,
      });
    } else {
      existing.connections += 1;
      if (row.connection_type === "discord") existing.members += 1;
      if (row.connection_type === "guest") existing.guests += 1;
      if (existing.latitude === null && typeof row.latitude === "number") existing.latitude = row.latitude;
      if (existing.longitude === null && typeof row.longitude === "number") existing.longitude = row.longitude;
    }
  }

  return Array.from(byCountry.values()).sort((a, b) => b.connections - a.connections);
}

export async function getRealtimeLoginLogs(filters?: {
  connectionType?: "discord" | "guest";
  country?: string;
  userSearch?: string;
}) {
  await purgeConnectionLogs();
  const activeThresholdIso = new Date(Date.now() - REALTIME_WINDOW_MINUTES * 60 * 1000).toISOString();

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

  if (error) throw new Error(`[getRealtimeLoginLogs] ${error.message}`);
  const searched = (data || []).filter((row) => {
    if (filters?.connectionType && row.connection_type !== filters.connectionType) return false;
    if (filters?.country && row.country_code !== filters.country) return false;
    if (filters?.userSearch) {
      const search = filters.userSearch.toLowerCase();
      const username = (row.username || "").toLowerCase();
      const userId = (row.user_id || "").toLowerCase();
      if (!username.includes(search) && !userId.includes(search)) return false;
    }
    return true;
  });
  const rows = searched.filter((row) => isSessionRecentlyActive(row.last_seen_at, REALTIME_WINDOW_MINUTES));

  let activeMembers = 0;
  let activeGuests = 0;
  let latestHeartbeatAt: string | null = null;
  const countriesMap = new Map<string, { country: string; countryCode: string; active: number; members: number; guests: number }>();
  for (const row of rows) {
    if (row.connection_type === "discord") activeMembers += 1;
    else activeGuests += 1;

    if (!latestHeartbeatAt || new Date(row.last_seen_at) > new Date(latestHeartbeatAt)) {
      latestHeartbeatAt = row.last_seen_at;
    }

    const code = row.country_code || "UN";
    const current = countriesMap.get(code) || {
      country: row.country || "Inconnu",
      countryCode: code,
      active: 0,
      members: 0,
      guests: 0,
    };
    current.active += 1;
    if (row.connection_type === "discord") current.members += 1;
    if (row.connection_type === "guest") current.guests += 1;
    countriesMap.set(code, current);
  }

  return {
    totalActiveConnections: rows.length,
    activeMembers,
    activeGuests,
    countriesRepresented: countriesMap.size,
    latestHeartbeatAt,
    countries: Array.from(countriesMap.values()).sort((a, b) => b.active - a.active),
    activeConnections: rows.map((row) => ({
      username: row.username,
      userId: row.user_id,
      country: row.country,
      countryCode: row.country_code,
      geoStatus: row.geo_status,
      geoReason: row.geo_reason,
      region: row.region,
      city: row.city,
      lastSeenAt: row.last_seen_at,
      connectionType: row.connection_type,
      path: row.path,
      deviceType: row.device_type,
      browser: row.browser,
      os: row.os,
      status: "active_recent",
    })),
  };
}

export async function getDailyMemberLoginLogs(params: {
  startDate?: string;
  endDate?: string;
  country?: string;
}) {
  await purgeConnectionLogs();

  let query = supabaseAdmin
    .from("connection_session_events")
    .select("created_at,connection_type,user_id,username,country_code");

  if (params.startDate) query = query.gte("created_at", params.startDate);
  if (params.endDate) query = query.lte("created_at", params.endDate);
  if (params.country) query = query.eq("country_code", params.country);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(20000);
  if (error) throw new Error(`[getDailyMemberLoginLogs] ${error.message}`);

  const memberUserIds = Array.from(
    new Set(
      (data || [])
        .filter((row) => row.connection_type === "discord" && row.user_id)
        .map((row) => String(row.user_id))
    )
  );

  const currentlyOnlineByUserId = new Set<string>();
  const twitchLinkedByUserId = new Set<string>();

  if (memberUserIds.length > 0) {
    const { data: activeSessions, error: activeSessionsError } = await supabaseAdmin
      .from("connection_sessions")
      .select("user_id,last_seen_at,is_active,connection_type")
      .eq("connection_type", "discord")
      .in("user_id", memberUserIds)
      .eq("is_active", true)
      .limit(5000);

    if (!activeSessionsError) {
      for (const session of activeSessions || []) {
        const userId = String(session.user_id || "");
        const lastSeenAt = String(session.last_seen_at || "");
        if (!userId || !lastSeenAt) continue;
        if (isSessionRecentlyActive(lastSeenAt, REALTIME_WINDOW_MINUTES)) {
          currentlyOnlineByUserId.add(userId);
        }
      }
    }

    const { data: linkedRows, error: linkedRowsError } = await supabaseAdmin
      .from("linked_twitch_accounts")
      .select("discord_id")
      .in("discord_id", memberUserIds)
      .limit(5000);

    if (!linkedRowsError) {
      for (const row of linkedRows || []) {
        const discordId = String((row as { discord_id?: string | null }).discord_id || "");
        if (discordId) twitchLinkedByUserId.add(discordId);
      }
    }
  }

  const byDay = new Map<
    string,
    {
      totalConnections: number;
      entries: Map<
        string,
        {
          label: string;
          count: number;
          type: "member" | "unknown_visitor";
          userId: string | null;
          currentlyOnline: boolean;
          twitchLinked: boolean;
        }
      >;
    }
  >();

  for (const row of data || []) {
    const dayKey = new Date(row.created_at).toISOString().slice(0, 10);
    const day = byDay.get(dayKey) || { totalConnections: 0, entries: new Map() };
    day.totalConnections += 1;

    const isUnknownVisitor = row.connection_type !== "discord";
    const label = isUnknownVisitor ? "Visiteur inconnu" : row.username?.trim() || row.user_id || "Membre inconnu";
    const type: "member" | "unknown_visitor" = isUnknownVisitor ? "unknown_visitor" : "member";
    const memberUserId = !isUnknownVisitor && row.user_id ? String(row.user_id) : null;
    const entryKey = type === "member" ? `member:${memberUserId || label.toLowerCase()}` : `unknown:${label}`;
    const existing = day.entries.get(entryKey);
    if (existing) {
      existing.count += 1;
    } else {
      day.entries.set(entryKey, {
        label,
        count: 1,
        type,
        userId: memberUserId,
        currentlyOnline: memberUserId ? currentlyOnlineByUserId.has(memberUserId) : false,
        twitchLinked: memberUserId ? twitchLinkedByUserId.has(memberUserId) : false,
      });
    }

    byDay.set(dayKey, day);
  }

  const days = Array.from(byDay.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, value]) => {
      const entries = Array.from(value.entries.values()).sort((a, b) => {
        if (a.type !== b.type) return a.type === "member" ? -1 : 1;
        return b.count - a.count;
      });

      return {
        date,
        totalConnections: value.totalConnections,
        membersCount: entries.filter((entry) => entry.type === "member").length,
        unknownVisitorsConnections: entries
          .filter((entry) => entry.type === "unknown_visitor")
          .reduce((sum, entry) => sum + entry.count, 0),
        entries,
      };
    });

  return {
    days,
    totalDays: days.length,
    totalConnections: days.reduce((sum, day) => sum + day.totalConnections, 0),
  };
}
