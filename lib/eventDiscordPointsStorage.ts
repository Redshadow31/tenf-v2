import { supabaseAdmin } from "@/lib/db/supabase";

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

type EventDiscordPointsRow = {
  id: string;
  presence_key: string;
  event_id: string;
  event_title: string;
  event_at: string;
  twitch_login: string;
  display_name: string;
  discord_username: string | null;
  points: number;
  status: string;
  note: string;
  awarded_by_discord_id: string;
  awarded_by_username: string;
  awarded_at: string;
};

function mapRow(row: EventDiscordPointsRow): EventDiscordPointsEntry {
  return {
    id: row.id,
    presenceKey: row.presence_key,
    eventId: row.event_id,
    eventTitle: row.event_title,
    eventAt: row.event_at,
    twitchLogin: row.twitch_login,
    displayName: row.display_name,
    discordUsername: row.discord_username?.trim() || undefined,
    points: row.points,
    status: row.status === "cancelled" ? "cancelled" : "awarded",
    note: row.note || "",
    awardedByDiscordId: row.awarded_by_discord_id,
    awardedByUsername: row.awarded_by_username,
    awardedAt: row.awarded_at,
  };
}

export async function listEventDiscordPoints(): Promise<EventDiscordPointsEntry[]> {
  const { data, error } = await supabaseAdmin
    .from("event_discord_points")
    .select(
      "id,presence_key,event_id,event_title,event_at,twitch_login,display_name,discord_username,points,status,note,awarded_by_discord_id,awarded_by_username,awarded_at"
    )
    .order("awarded_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[eventDiscordPointsStorage] list error:", error);
    throw error;
  }
  return ((data || []) as EventDiscordPointsRow[]).map(mapRow);
}

/** Toutes les clés déjà enregistrées (évite de réafficher des lignes « à faire » au-delà du cap de listEventDiscordPoints). */
export async function listAllEventDiscordPresenceKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  const pageSize = 1000;
  let from = 0;
  const maxRows = 500_000;
  for (;;) {
    const { data, error } = await supabaseAdmin
      .from("event_discord_points")
      .select("presence_key")
      .order("presence_key", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("[eventDiscordPointsStorage] listAllPresenceKeys error:", error);
      throw error;
    }
    const rows = (data || []) as { presence_key: string }[];
    for (const row of rows) {
      const k = String(row.presence_key || "").trim();
      if (k) keys.add(k);
    }
    if (rows.length < pageSize) break;
    from += pageSize;
    if (from >= maxRows) break;
  }
  return keys;
}

export async function listEventDiscordPointsAwardedInRange(
  startIso: string,
  endIso: string,
  limit = 5000
): Promise<EventDiscordPointsEntry[]> {
  const { data, error } = await supabaseAdmin
    .from("event_discord_points")
    .select(
      "id,presence_key,event_id,event_title,event_at,twitch_login,display_name,discord_username,points,status,note,awarded_by_discord_id,awarded_by_username,awarded_at"
    )
    .gte("awarded_at", startIso)
    .lt("awarded_at", endIso)
    .order("awarded_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[eventDiscordPointsStorage] listAwardedInRange error:", error);
    throw error;
  }
  return ((data || []) as EventDiscordPointsRow[]).map(mapRow);
}

export async function hasEventDiscordPointForPresence(presenceKey: string): Promise<boolean> {
  const row = await findEventDiscordPointByPresenceKey(presenceKey);
  return row !== null;
}

export async function findEventDiscordPointByPresenceKey(
  presenceKey: string
): Promise<EventDiscordPointsEntry | null> {
  const { data, error } = await supabaseAdmin
    .from("event_discord_points")
    .select(
      "id,presence_key,event_id,event_title,event_at,twitch_login,display_name,discord_username,points,status,note,awarded_by_discord_id,awarded_by_username,awarded_at"
    )
    .eq("presence_key", presenceKey)
    .maybeSingle();

  if (error) {
    console.error("[eventDiscordPointsStorage] find error:", error);
    throw error;
  }
  return data ? mapRow(data as EventDiscordPointsRow) : null;
}

function isUniqueViolation(err: { code?: string }): boolean {
  return err?.code === "23505";
}

export async function createEventDiscordPoint(input: {
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
}): Promise<{ entry: EventDiscordPointsEntry; created: boolean }> {
  const points = Number.isFinite(input.points) && input.points > 0 ? Math.floor(input.points) : 300;
  const row = {
    presence_key: input.presenceKey,
    event_id: input.eventId,
    event_title: input.eventTitle,
    event_at: input.eventAt,
    twitch_login: input.twitchLogin.toLowerCase(),
    display_name: input.displayName,
    discord_username: input.discordUsername?.trim() || null,
    points,
    status: "awarded" as const,
    note: String(input.note || "").trim(),
    awarded_by_discord_id: input.awardedByDiscordId,
    awarded_by_username: input.awardedByUsername,
  };

  const { data, error } = await supabaseAdmin.from("event_discord_points").insert(row).select("*").single();

  if (error && isUniqueViolation(error)) {
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("event_discord_points")
      .select("*")
      .eq("presence_key", input.presenceKey)
      .single();

    if (fetchErr || !existing) {
      throw error;
    }
    return { entry: mapRow(existing as EventDiscordPointsRow), created: false };
  }

  if (error) {
    console.error("[eventDiscordPointsStorage] insert error:", error);
    throw error;
  }

  return { entry: mapRow(data as EventDiscordPointsRow), created: true };
}
