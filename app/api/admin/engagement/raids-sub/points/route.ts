import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getActiveRaidTestRun } from "@/lib/raidEventsubTest";
import { supabaseAdmin } from "@/lib/db/supabase";

type RaidTestEventRow = {
  id: string;
  run_id: string;
  from_broadcaster_user_login: string;
  to_broadcaster_user_login: string;
  event_at: string;
  viewers: number;
  processing_status: string;
};

type MemberLiteRow = {
  twitch_login: string;
  discord_username: string | null;
};

type RaidPointRow = {
  id: string;
  run_id: string;
  raid_test_event_id: string;
  raider_twitch_login: string;
  target_twitch_login: string;
  event_at: string;
  points: number;
  status: "awarded" | "cancelled";
  note: string;
  awarded_by_discord_id: string;
  awarded_by_username: string;
  awarded_at: string;
};

function isMissingRelationError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("42p01");
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId") || (await getActiveRaidTestRun())?.id || null;

    if (!runId) {
      return NextResponse.json({
        backendReady: true,
        runId: null,
        todo: [],
        history: [],
        counters: { todo: 0, history: 0 },
      });
    }

    const [eventsRes, pointsRes] = await Promise.all([
      supabaseAdmin
        .from("raid_test_events")
        .select("id,run_id,from_broadcaster_user_login,to_broadcaster_user_login,event_at,viewers,processing_status")
        .eq("run_id", runId)
        .eq("processing_status", "matched")
        .order("event_at", { ascending: false })
        .limit(1000),
      supabaseAdmin
        .from("raid_test_points")
        .select("id,run_id,raid_test_event_id,raider_twitch_login,target_twitch_login,event_at,points,status,note,awarded_by_discord_id,awarded_by_username,awarded_at")
        .eq("run_id", runId)
        .order("awarded_at", { ascending: false })
        .limit(2000),
    ]);

    if (eventsRes.error) {
      const message = String(eventsRes.error.message || "");
      if (isMissingRelationError(message)) {
        return NextResponse.json({
          backendReady: false,
          warning: "Table manquante. Applique la migration 0037_raid_test_points_queue.sql.",
          runId,
          todo: [],
          history: [],
          counters: { todo: 0, history: 0 },
        });
      }
      return NextResponse.json({ error: "Impossible de charger les raids matches" }, { status: 500 });
    }

    if (pointsRes.error) {
      const message = String(pointsRes.error.message || "");
      if (isMissingRelationError(message)) {
        return NextResponse.json({
          backendReady: false,
          warning: "Table manquante. Applique la migration 0037_raid_test_points_queue.sql.",
          runId,
          todo: [],
          history: [],
          counters: { todo: 0, history: 0 },
        });
      }
      return NextResponse.json({ error: "Impossible de charger l'historique des points" }, { status: 500 });
    }

    const matchedEvents = (eventsRes.data || []) as RaidTestEventRow[];
    const history = (pointsRes.data || []) as RaidPointRow[];
    const awardedEventIds = new Set(history.map((item) => item.raid_test_event_id));
    const todoBase = matchedEvents.filter((item) => !awardedEventIds.has(item.id));

    const uniqueRaiderLogins = Array.from(
      new Set(todoBase.map((item) => String(item.from_broadcaster_user_login || "").toLowerCase()).filter(Boolean))
    );
    let discordByTwitchLogin = new Map<string, string>();
    if (uniqueRaiderLogins.length > 0) {
      const membersRes = await supabaseAdmin
        .from("members")
        .select("twitch_login,discord_username")
        .in("twitch_login", uniqueRaiderLogins);

      if (!membersRes.error) {
        for (const row of (membersRes.data || []) as MemberLiteRow[]) {
          const login = String(row.twitch_login || "").toLowerCase();
          const discordUsername = String(row.discord_username || "").trim();
          if (login && discordUsername) {
            discordByTwitchLogin.set(login, discordUsername);
          }
        }
      }
    }

    const todo = todoBase.map((item) => ({
      ...item,
      raider_discord_username: discordByTwitchLogin.get(String(item.from_broadcaster_user_login || "").toLowerCase()) || null,
    }));

    return NextResponse.json({
      backendReady: true,
      runId,
      todo,
      history,
      counters: { todo: todo.length, history: history.length },
    });
  } catch (error) {
    console.error("[admin/engagement/raids-sub/points] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const eventId = String(body?.eventId || "").trim();
    const note = String(body?.note || "").trim();
    const pointsRaw = Number.parseInt(String(body?.points || "500"), 10);
    const points = Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : 500;

    if (!eventId) {
      return NextResponse.json({ error: "eventId manquant" }, { status: 400 });
    }

    const eventRes = await supabaseAdmin
      .from("raid_test_events")
      .select("id,run_id,from_broadcaster_user_login,to_broadcaster_user_login,event_at,processing_status")
      .eq("id", eventId)
      .single();

    if (eventRes.error || !eventRes.data) {
      return NextResponse.json({ error: "Event introuvable" }, { status: 404 });
    }
    if (eventRes.data.processing_status !== "matched") {
      return NextResponse.json({ error: "Seuls les raids en status matched peuvent recevoir des points." }, { status: 400 });
    }

    const existing = await supabaseAdmin
      .from("raid_test_points")
      .select("id,raid_test_event_id")
      .eq("raid_test_event_id", eventId)
      .maybeSingle();

    if (existing.error) {
      const message = String(existing.error.message || "");
      if (isMissingRelationError(message)) {
        return NextResponse.json({ error: "Table points manquante. Applique la migration 0037." }, { status: 500 });
      }
      return NextResponse.json({ error: "Verification des points existants impossible" }, { status: 500 });
    }

    if (existing.data?.id) {
      return NextResponse.json({
        success: true,
        alreadyAwarded: true,
        message: "Les points ont deja ete attribues pour ce raid.",
      });
    }

    const insertRes = await supabaseAdmin
      .from("raid_test_points")
      .insert({
        run_id: eventRes.data.run_id,
        raid_test_event_id: eventRes.data.id,
        raider_twitch_login: eventRes.data.from_broadcaster_user_login,
        target_twitch_login: eventRes.data.to_broadcaster_user_login,
        event_at: eventRes.data.event_at,
        points,
        status: "awarded",
        note,
        awarded_by_discord_id: admin.discordId,
        awarded_by_username: admin.username,
      })
      .select("id,run_id,raid_test_event_id,raider_twitch_login,target_twitch_login,event_at,points,status,note,awarded_by_discord_id,awarded_by_username,awarded_at")
      .single();

    if (insertRes.error) {
      const message = String(insertRes.error.message || "");
      if (isMissingRelationError(message)) {
        return NextResponse.json({ error: "Table points manquante. Applique la migration 0037." }, { status: 500 });
      }
      return NextResponse.json({ error: "Impossible d'attribuer les points" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      alreadyAwarded: false,
      entry: insertRes.data,
    });
  } catch (error) {
    console.error("[admin/engagement/raids-sub/points] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
