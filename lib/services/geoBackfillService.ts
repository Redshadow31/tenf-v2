import { supabaseAdmin } from "@/lib/db/supabase";

export async function backfillUnknownGeoStatus(days = 30): Promise<{
  updatedSessions: number;
  updatedEvents: number;
}> {
  const cutoffIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from("connection_sessions")
    .update({
      geo_status: "old_log_without_enrichment",
      geo_reason: "old_log_without_enrichment",
    })
    .is("country_code", null)
    .is("geo_status", null)
    .gte("created_at", cutoffIso)
    .select("id");
  if (sessionsError) throw new Error(`[backfillUnknownGeoStatus:sessions] ${sessionsError.message}`);

  const { data: events, error: eventsError } = await supabaseAdmin
    .from("connection_session_events")
    .update({
      geo_status: "old_log_without_enrichment",
      geo_reason: "old_log_without_enrichment",
    })
    .is("country_code", null)
    .is("geo_status", null)
    .gte("created_at", cutoffIso)
    .select("id");
  if (eventsError) throw new Error(`[backfillUnknownGeoStatus:events] ${eventsError.message}`);

  return {
    updatedSessions: sessions?.length || 0,
    updatedEvents: events?.length || 0,
  };
}
