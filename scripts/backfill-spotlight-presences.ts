import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Variables manquantes: NEXT_PUBLIC_SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function normalize(value?: string | null): string {
  return String(value || "").trim().toLowerCase();
}

async function resolveSpotlightEventIds(input: {
  spotlightId: string;
  startedAt?: string | null;
  streamerTwitchLogin?: string | null;
  streamerDisplayName?: string | null;
}): Promise<string[]> {
  const startedAtDate = input.startedAt ? new Date(input.startedAt) : null;
  const startedAtIso = startedAtDate && !Number.isNaN(startedAtDate.getTime()) ? startedAtDate.toISOString() : "";
  const startedAtDay = startedAtIso ? startedAtIso.slice(0, 10) : "";
  const titleTokens = [input.streamerDisplayName, input.streamerTwitchLogin].map(normalize).filter(Boolean);

  const { data: communityRows, error: communityError } = await supabase
    .from("community_events")
    .select("id,legacy_event_id,title,category,starts_at,date")
    .limit(200);

  const { data: legacyRows, error: legacyError } = await supabase
    .from("events")
    .select("id,title,category,date,starts_at")
    .limit(2000);

  if (communityError && legacyError) return [];

  const normalizedCommunity = (communityRows || []).map((row: any) => ({
    id: String(row.id || ""),
    legacyEventId: row.legacy_event_id ? String(row.legacy_event_id) : "",
    title: normalize(row.title),
    category: normalize(row.category),
    dateIso: String(row.starts_at || row.date || ""),
  }));

  const normalizedLegacy = (legacyRows || []).map((row: any) => ({
    id: String(row.id || ""),
    title: normalize(row.title),
    category: normalize(row.category),
    dateIso: String(row.starts_at || row.date || ""),
  }));

  const combinedRows = [
    ...normalizedCommunity,
    ...normalizedLegacy,
  ].filter((row) => row.id && row.dateIso);

  if (!combinedRows.length) return [];

  const scored = combinedRows.map((row) => {
    let score = 0;
    const eventDay = row.dateIso.slice(0, 10);
    if (startedAtDay && eventDay === startedAtDay) score += 4;
    if (startedAtIso && row.dateIso === startedAtIso) score += 5;

    if (row.category.includes("spotlight") || row.title.includes("spotlight")) score += 2;

    if (titleTokens.length) {
      const haystack = `${row.title} ${row.category}`;
      if (titleTokens.some((token) => haystack.includes(token))) score += 3;
    }

    return { ...row, score };
  });

  const bestScore = Math.max(0, ...scored.map((row) => row.score));
  if (bestScore <= 0) return [];

  const candidateRows = scored
    .filter((row) => row.score === bestScore)
    .slice(0, 5);

  const ids = new Set<string>();
  for (const row of candidateRows) {
    ids.add(row.id);
    const legacyEventId = "legacyEventId" in row ? row.legacyEventId : undefined;
    if (typeof legacyEventId === "string" && legacyEventId) {
      ids.add(legacyEventId);
    }
  }

  return Array.from(ids);
}

async function main() {
  const dryRun = process.argv.includes("--apply") ? false : true;
  console.log(`Backfill spotlight -> event_presences (${dryRun ? "DRY RUN" : "APPLY"})`);

  const { data: spotlights, error: spotlightsError } = await supabase
    .from("spotlights")
    .select("id,streamer_twitch_login,streamer_display_name,starts_at,started_at,status")
    .in("status", ["completed", "active"])
    .order("created_at", { ascending: false })
    .limit(2000);

  if (spotlightsError) {
    throw spotlightsError;
  }

  let totalSpotlights = 0;
  let totalAttendanceRows = 0;
  let totalUpserts = 0;
  let skipped = 0;

  for (const spotlight of spotlights || []) {
    totalSpotlights += 1;
    const spotlightId = String(spotlight.id);
    const startedAt = String(spotlight.starts_at || spotlight.started_at || "");

    const eventIds = await resolveSpotlightEventIds({
      spotlightId,
      startedAt,
      streamerTwitchLogin: spotlight.streamer_twitch_login,
      streamerDisplayName: spotlight.streamer_display_name,
    });

    if (!eventIds.length) {
      skipped += 1;
      continue;
    }

    const { data: attendanceRows, error: attendanceError } = await supabase
      .from("spotlight_attendance")
      .select("twitch_login,added_by,added_at,present")
      .eq("spotlight_id", spotlightId)
      .eq("present", true);

    if (attendanceError) {
      throw attendanceError;
    }

    const uniqueLogins = new Map<string, { addedBy?: string; addedAt?: string }>();
    for (const row of attendanceRows || []) {
      const login = normalize(row.twitch_login);
      if (!login) continue;
      if (!uniqueLogins.has(login)) {
        uniqueLogins.set(login, {
          addedBy: row.added_by || "spotlight-backfill",
          addedAt: row.added_at || new Date().toISOString(),
        });
      }
    }

    totalAttendanceRows += uniqueLogins.size;
    if (dryRun) {
      totalUpserts += uniqueLogins.size * eventIds.length;
      continue;
    }

    for (const [login, meta] of uniqueLogins.entries()) {
      for (const eventId of eventIds) {
        const { error: upsertError } = await supabase.from("event_presences").upsert(
          {
            event_id: eventId,
            twitch_login: login,
            display_name: login,
            is_registered: false,
            present: true,
            validated_at: meta.addedAt || new Date().toISOString(),
            validated_by: meta.addedBy || "spotlight-backfill",
            added_manually: true,
          },
          { onConflict: "event_id,twitch_login", ignoreDuplicates: false }
        );

        if (upsertError) {
          throw upsertError;
        }
        totalUpserts += 1;
      }
    }
  }

  console.log("-----");
  console.log(`Spotlights traites: ${totalSpotlights}`);
  console.log(`Spotlights sans event associe: ${skipped}`);
  console.log(`Presences source uniques: ${totalAttendanceRows}`);
  console.log(`${dryRun ? "Upserts estimes" : "Upserts effectues"}: ${totalUpserts}`);
  console.log("Termine.");
}

main().catch((error) => {
  console.error("Echec backfill:", error);
  process.exit(1);
});
