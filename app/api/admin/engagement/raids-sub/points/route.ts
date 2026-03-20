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

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getCurrentMonthKey(): string {
  return toMonthKey(new Date());
}

function monthRange(monthKey: string): { startIso: string; endIso: string } {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month || month < 1 || month > 12) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return { startIso: start.toISOString(), endIso: end.toISOString() };
  }
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

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
    const explicitRunId = String(searchParams.get("runId") || "").trim() || null;
    const runId = explicitRunId || (await getActiveRaidTestRun())?.id || null;
    const includeTodo = searchParams.get("includeTodo") !== "false";
    const includeHistory = searchParams.get("includeHistory") !== "false";
    const requestedMonth = String(searchParams.get("month") || "").trim();
    const month = /^\d{4}-\d{2}$/.test(requestedMonth) ? requestedMonth : getCurrentMonthKey();
    const { startIso, endIso } = monthRange(month);

    if (!runId && !includeHistory) {
      return NextResponse.json({
        backendReady: true,
        runId: null,
        todo: [],
        history: [],
        counters: { todo: 0, history: 0 },
        month,
      });
    }

    const eventsPromise = includeTodo && !!runId
      ? supabaseAdmin
          .from("raid_test_events")
          .select("id,run_id,from_broadcaster_user_login,to_broadcaster_user_login,event_at,viewers,processing_status")
          .eq("run_id", runId)
          .eq("processing_status", "matched")
          .order("event_at", { ascending: false })
          .limit(1000)
      : Promise.resolve({ data: [] as any[], error: null as any });

    const pointsHistoryPromise = includeHistory
      ? (() => {
          let query = supabaseAdmin
          .from("raid_test_points")
          .select("id,run_id,raid_test_event_id,raider_twitch_login,target_twitch_login,event_at,points,status,note,awarded_by_discord_id,awarded_by_username,awarded_at")
          .gte("awarded_at", startIso)
          .lt("awarded_at", endIso)
          .order("awarded_at", { ascending: false })
          .limit(2000);
          if (explicitRunId) {
            query = query.eq("run_id", explicitRunId);
          }
          return query;
        })()
      : Promise.resolve({ data: [] as any[], error: null as any });

    const pointsAwardedIdsPromise = includeTodo && !includeHistory && !!runId
      ? supabaseAdmin
          .from("raid_test_points")
          .select("raid_test_event_id")
          .eq("run_id", runId)
          .limit(5000)
      : Promise.resolve({ data: [] as any[], error: null as any });

    const [eventsRes, pointsHistoryRes, pointsAwardedIdsRes] = await Promise.all([
      eventsPromise,
      pointsHistoryPromise,
      pointsAwardedIdsPromise,
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

    if (pointsHistoryRes.error) {
      const message = String(pointsHistoryRes.error.message || "");
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

    if (pointsAwardedIdsRes.error) {
      const message = String(pointsAwardedIdsRes.error.message || "");
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
    const history = (pointsHistoryRes.data || []) as RaidPointRow[];
    const awardedEventRows = includeHistory
      ? history.map((item) => ({ raid_test_event_id: item.raid_test_event_id }))
      : (pointsAwardedIdsRes.data || []);
    const awardedEventIds = new Set(awardedEventRows.map((item: any) => String(item.raid_test_event_id || "")));
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
      month,
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
    const eventIds = Array.isArray(body?.eventIds)
      ? Array.from(
          new Set(
            body.eventIds
              .map((value: unknown) => String(value || "").trim())
              .filter(Boolean)
          )
        )
      : [];
    const eventId = String(body?.eventId || "").trim();
    const note = String(body?.note || "").trim();
    const pointsRaw = Number.parseInt(String(body?.points || "500"), 10);
    const points = Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : 500;

    if (eventIds.length > 0) {
      const eventsRes = await supabaseAdmin
        .from("raid_test_events")
        .select("id,run_id,from_broadcaster_user_login,to_broadcaster_user_login,event_at,processing_status")
        .in("id", eventIds);

      if (eventsRes.error) {
        const message = String(eventsRes.error.message || "");
        if (isMissingRelationError(message)) {
          return NextResponse.json({ error: "Table points manquante. Applique la migration 0037." }, { status: 500 });
        }
        return NextResponse.json({ error: "Impossible de charger les raids à valider" }, { status: 500 });
      }

      const events = eventsRes.data || [];
      const foundIds = new Set(events.map((event: any) => String(event.id)));
      const missingCount = eventIds.filter((id) => !foundIds.has(id)).length;
      const matchedEvents = events.filter((event: any) => event.processing_status === "matched");
      const invalidStatusCount = events.length - matchedEvents.length;

      let alreadyAwardedCount = 0;
      let toInsert = matchedEvents;
      if (matchedEvents.length > 0) {
        const existingRes = await supabaseAdmin
          .from("raid_test_points")
          .select("raid_test_event_id")
          .in(
            "raid_test_event_id",
            matchedEvents.map((event: any) => event.id)
          );

        if (existingRes.error) {
          const message = String(existingRes.error.message || "");
          if (isMissingRelationError(message)) {
            return NextResponse.json({ error: "Table points manquante. Applique la migration 0037." }, { status: 500 });
          }
          return NextResponse.json({ error: "Vérification des points existants impossible" }, { status: 500 });
        }

        const alreadyAwardedIds = new Set(
          (existingRes.data || []).map((item: any) => String(item.raid_test_event_id || ""))
        );
        alreadyAwardedCount = alreadyAwardedIds.size;
        toInsert = matchedEvents.filter((event: any) => !alreadyAwardedIds.has(String(event.id)));
      }

      let insertedCount = 0;
      if (toInsert.length > 0) {
        const insertRes = await supabaseAdmin.from("raid_test_points").insert(
          toInsert.map((event: any) => ({
            run_id: event.run_id,
            raid_test_event_id: event.id,
            raider_twitch_login: event.from_broadcaster_user_login,
            target_twitch_login: event.to_broadcaster_user_login,
            event_at: event.event_at,
            points,
            status: "awarded",
            note,
            awarded_by_discord_id: admin.discordId,
            awarded_by_username: admin.username,
          }))
        );

        if (insertRes.error) {
          const message = String(insertRes.error.message || "");
          if (isMissingRelationError(message)) {
            return NextResponse.json({ error: "Table points manquante. Applique la migration 0037." }, { status: 500 });
          }
          return NextResponse.json({ error: "Impossible d'attribuer les points en masse" }, { status: 500 });
        }
        insertedCount = toInsert.length;
      }

      return NextResponse.json({
        success: true,
        bulk: true,
        totalRequested: eventIds.length,
        insertedCount,
        alreadyAwardedCount,
        invalidStatusCount,
        missingCount,
      });
    }

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
