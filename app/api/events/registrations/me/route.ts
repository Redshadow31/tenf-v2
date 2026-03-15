import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { memberRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user?.discordId) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const member = await memberRepository.findByDiscordId(user.discordId);
    if (!member?.twitchLogin) {
      return NextResponse.json({ registeredEventIds: [] });
    }

    const login = member.twitchLogin.toLowerCase();

    const [{ data: registrations }, { data: presences }] = await Promise.all([
      supabaseAdmin.from("event_registrations").select("event_id").eq("twitch_login", login).limit(5000),
      supabaseAdmin
        .from("event_presences")
        .select("event_id")
        .eq("twitch_login", login)
        .eq("is_registered", true)
        .limit(5000),
    ]);

    const rawIds = new Set<string>();
    for (const row of registrations || []) {
      if (row?.event_id) rawIds.add(String(row.event_id));
    }
    for (const row of presences || []) {
      if (row?.event_id) rawIds.add(String(row.event_id));
    }

    if (rawIds.size === 0) {
      return NextResponse.json({ registeredEventIds: [] });
    }

    const uuidIds = Array.from(rawIds).filter(isUuid);
    const legacyIds = Array.from(rawIds).filter((id) => !isUuid(id));
    const canonicalIds = new Set<string>(rawIds);

    const queries: Promise<any>[] = [];
    if (uuidIds.length > 0) {
      queries.push(
        supabaseAdmin
          .from("community_events")
          .select("id")
          .in("id", uuidIds)
          .eq("is_published", true)
      );
    }
    if (legacyIds.length > 0) {
      queries.push(
        supabaseAdmin
          .from("community_events")
          .select("id,legacy_event_id")
          .in("legacy_event_id", legacyIds)
          .eq("is_published", true)
      );
    }

    const results = await Promise.all(queries);
    for (const result of results) {
      for (const row of result?.data || []) {
        if (row?.id) canonicalIds.add(String(row.id));
      }
    }

    return NextResponse.json({ registeredEventIds: Array.from(canonicalIds) });
  } catch (error) {
    console.error("[events/registrations/me] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
