import { supabaseAdmin } from "@/lib/db/supabase";
import type { RaidFait, RaidRecu } from "@/lib/raidStorage";

/**
 * Ajoute les raids EventSub (raid_test_events, processing_status = matched) du mois
 * aux listes faits/reçus, en évitant les doublons — même logique que /api/discord/raids/data-v2.
 */
export async function mergeMatchedRaidTestEventsForMonth(
  monthKey: string,
  raidsFaits: RaidFait[],
  raidsRecus: RaidRecu[]
): Promise<{ raidsFaits: RaidFait[]; raidsRecus: RaidRecu[] }> {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return { raidsFaits, raidsRecus };
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const monthEnd = new Date(Date.UTC(year, month, 1)).toISOString();

  const eventsubMatchedRes = await supabaseAdmin
    .from("raid_test_events")
    .select(
      "id,from_broadcaster_user_login,to_broadcaster_user_login,event_at,viewers,processing_status"
    )
    .eq("processing_status", "matched")
    .gte("event_at", monthStart)
    .lt("event_at", monthEnd)
    .order("event_at", { ascending: false })
    .limit(5000);

  if (eventsubMatchedRes.error) {
    console.error("[raidEventsubMerge] Erreur chargement raid_test_events:", eventsubMatchedRes.error);
    return { raidsFaits, raidsRecus };
  }

  const eventsubRows = (eventsubMatchedRes.data || []) as Array<{
    id: string;
    from_broadcaster_user_login: string | null;
    to_broadcaster_user_login: string | null;
    event_at: string | null;
    viewers: number | null;
  }>;

  const existingFaitsKeys = new Set(
    raidsFaits.map(
      (raid) =>
        `${String(raid.raider || "").toLowerCase()}|${String(raid.target || "").toLowerCase()}|${raid.date}`
    )
  );
  const existingRecusKeys = new Set(
    raidsRecus.map(
      (raid) =>
        `${String(raid.raider || "").toLowerCase()}|${String(raid.target || "").toLowerCase()}|${raid.date}`
    )
  );

  const eventsubFaits: RaidFait[] = eventsubRows
    .filter((row) => row.from_broadcaster_user_login && row.to_broadcaster_user_login && row.event_at)
    .map((row) => ({
      raider: String(row.from_broadcaster_user_login || "").toLowerCase(),
      target: String(row.to_broadcaster_user_login || "").toLowerCase(),
      date: String(row.event_at || ""),
      count: 1,
      manual: false,
      source: "raids_sub" as const,
      viewers: typeof row.viewers === "number" ? row.viewers : undefined,
      countFrom: true,
      countTo: undefined,
    }))
    .filter((row) => !existingFaitsKeys.has(`${row.raider}|${row.target}|${row.date}`));

  const eventsubRecus: RaidRecu[] = eventsubRows
    .filter((row) => row.from_broadcaster_user_login && row.to_broadcaster_user_login && row.event_at)
    .map((row) => ({
      target: String(row.to_broadcaster_user_login || "").toLowerCase(),
      raider: String(row.from_broadcaster_user_login || "").toLowerCase(),
      date: String(row.event_at || ""),
      manual: false,
      source: "raids_sub" as const,
      viewers: typeof row.viewers === "number" ? row.viewers : undefined,
      countFrom: undefined,
      countTo: true,
    }))
    .filter((row) => !existingRecusKeys.has(`${row.raider}|${row.target}|${row.date}`));

  return {
    raidsFaits: [...raidsFaits, ...eventsubFaits],
    raidsRecus: [...raidsRecus, ...eventsubRecus],
  };
}
