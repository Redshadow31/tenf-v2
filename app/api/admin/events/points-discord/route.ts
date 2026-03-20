import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { eventRepository } from "@/lib/repositories";
import { createEventDiscordPoint, listEventDiscordPoints } from "@/lib/eventDiscordPointsStorage";

type EventTodoItem = {
  presence_key: string;
  event_id: string;
  event_title: string;
  event_at: string;
  twitch_login: string;
  display_name: string;
  discord_username?: string | null;
  validated_at?: string;
};

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

function toMonthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parsePresenceKey(value: string): { eventId: string; twitchLogin: string } | null {
  const [eventId, twitchLogin] = value.split("::");
  if (!eventId || !twitchLogin) return null;
  return { eventId: eventId.trim(), twitchLogin: twitchLogin.trim().toLowerCase() };
}

function inRange(iso: string, startIso: string, endIso: string): boolean {
  return iso >= startIso && iso < endIso;
}

async function buildTodoForMonth(month: string): Promise<EventTodoItem[]> {
  const { startIso, endIso } = monthRange(month);
  const events = await eventRepository.findAll(1000, 0);
  const awarded = new Set(listEventDiscordPoints().map((item) => item.presenceKey));
  const todos: EventTodoItem[] = [];

  for (const event of events) {
    const eventAt = (event.date instanceof Date ? event.date : new Date(event.date)).toISOString();
    if (!inRange(eventAt, startIso, endIso)) continue;

    const [presences, registrations] = await Promise.all([
      eventRepository.getPresences(event.id),
      eventRepository.getRegistrations(event.id),
    ]);
    const regMap = new Map(
      registrations.map((reg) => [String(reg.twitchLogin || "").toLowerCase(), reg])
    );

    for (const presence of presences || []) {
      if (!presence?.present) continue;
      const twitchLogin = String(presence.twitchLogin || "").toLowerCase();
      if (!twitchLogin) continue;
      const presenceKey = `${event.id}::${twitchLogin}`;
      if (awarded.has(presenceKey)) continue;
      const registration = regMap.get(twitchLogin);
      todos.push({
        presence_key: presenceKey,
        event_id: event.id,
        event_title: event.title || "Evenement",
        event_at: eventAt,
        twitch_login: twitchLogin,
        display_name:
          String(presence.displayName || "").trim() ||
          String(registration?.displayName || "").trim() ||
          twitchLogin,
        discord_username:
          String(presence.discordUsername || "").trim() ||
          String(registration?.discordUsername || "").trim() ||
          null,
        validated_at: presence.validatedAt || undefined,
      });
    }
  }

  return todos.sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());
}

async function loadPresenceCandidate(eventId: string, twitchLogin: string): Promise<EventTodoItem | null> {
  const event = await eventRepository.findById(eventId);
  if (!event) return null;
  const [presences, registrations] = await Promise.all([
    eventRepository.getPresences(eventId),
    eventRepository.getRegistrations(eventId),
  ]);
  const normalized = twitchLogin.toLowerCase();
  const presence = (presences || []).find(
    (item) => String(item.twitchLogin || "").toLowerCase() === normalized
  );
  if (!presence || !presence.present) return null;
  const registration = (registrations || []).find(
    (item) => String(item.twitchLogin || "").toLowerCase() === normalized
  );
  const eventAt = (event.date instanceof Date ? event.date : new Date(event.date)).toISOString();
  return {
    presence_key: `${eventId}::${normalized}`,
    event_id: eventId,
    event_title: event.title || "Evenement",
    event_at: eventAt,
    twitch_login: normalized,
    display_name:
      String(presence.displayName || "").trim() ||
      String(registration?.displayName || "").trim() ||
      normalized,
    discord_username:
      String(presence.discordUsername || "").trim() ||
      String(registration?.discordUsername || "").trim() ||
      null,
    validated_at: presence.validatedAt || undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeTodo = searchParams.get("includeTodo") !== "false";
    const includeHistory = searchParams.get("includeHistory") !== "false";
    const requestedMonth = String(searchParams.get("month") || "").trim();
    const month = /^\d{4}-\d{2}$/.test(requestedMonth) ? requestedMonth : toMonthKey(new Date());
    const { startIso, endIso } = monthRange(month);

    const allHistory = listEventDiscordPoints();
    const history = includeHistory
      ? allHistory
          .filter((item) => inRange(item.awardedAt, startIso, endIso))
          .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime())
      : [];
    const todo = includeTodo ? await buildTodoForMonth(month) : [];

    return NextResponse.json({
      backendReady: true,
      month,
      todo,
      history,
      counters: { todo: todo.length, history: history.length },
    });
  } catch (error) {
    console.error("[admin/events/points-discord] GET error:", error);
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
    const pointsRaw = Number.parseInt(String(body?.points || "300"), 10);
    const points = Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : 300;
    const note = String(body?.note || "").trim();
    const presenceKeys: string[] = Array.isArray(body?.presenceKeys)
      ? Array.from(
          new Set(
            body.presenceKeys
              .map((value: unknown) => String(value || "").trim())
              .filter((value: string) => value.length > 0)
          )
        )
      : [];
    const singlePresenceKey = String(body?.presenceKey || "").trim();

    if (presenceKeys.length > 0) {
      const existingKeys = new Set(listEventDiscordPoints().map((item) => item.presenceKey));
      let insertedCount = 0;
      let alreadyAwardedCount = 0;
      let invalidCount = 0;
      let missingCount = 0;

      for (const presenceKey of presenceKeys) {
        if (existingKeys.has(presenceKey)) {
          alreadyAwardedCount += 1;
          continue;
        }
        const parsed = parsePresenceKey(presenceKey);
        if (!parsed) {
          invalidCount += 1;
          continue;
        }
        const candidate = await loadPresenceCandidate(parsed.eventId, parsed.twitchLogin);
        if (!candidate) {
          missingCount += 1;
          continue;
        }
        createEventDiscordPoint({
          presenceKey: candidate.presence_key,
          eventId: candidate.event_id,
          eventTitle: candidate.event_title,
          eventAt: candidate.event_at,
          twitchLogin: candidate.twitch_login,
          displayName: candidate.display_name,
          discordUsername: candidate.discord_username || undefined,
          points,
          note,
          awardedByDiscordId: admin.discordId,
          awardedByUsername: admin.username,
        });
        insertedCount += 1;
        existingKeys.add(presenceKey);
      }

      return NextResponse.json({
        success: true,
        bulk: true,
        totalRequested: presenceKeys.length,
        insertedCount,
        alreadyAwardedCount,
        invalidCount,
        missingCount,
      });
    }

    if (!singlePresenceKey) {
      return NextResponse.json({ error: "presenceKey manquant" }, { status: 400 });
    }

    const parsed = parsePresenceKey(singlePresenceKey);
    if (!parsed) {
      return NextResponse.json({ error: "presenceKey invalide" }, { status: 400 });
    }

    const existing = listEventDiscordPoints().find((item) => item.presenceKey === singlePresenceKey);
    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyAwarded: true,
        message: "Les points ont deja ete attribues pour cette presence.",
      });
    }

    const candidate = await loadPresenceCandidate(parsed.eventId, parsed.twitchLogin);
    if (!candidate) {
      return NextResponse.json(
        { error: "Presence introuvable ou non validee pour ce membre/evenement." },
        { status: 404 }
      );
    }

    const entry = createEventDiscordPoint({
      presenceKey: candidate.presence_key,
      eventId: candidate.event_id,
      eventTitle: candidate.event_title,
      eventAt: candidate.event_at,
      twitchLogin: candidate.twitch_login,
      displayName: candidate.display_name,
      discordUsername: candidate.discord_username || undefined,
      points,
      note,
      awardedByDiscordId: admin.discordId,
      awardedByUsername: admin.username,
    });

    return NextResponse.json({
      success: true,
      alreadyAwarded: false,
      entry,
    });
  } catch (error) {
    console.error("[admin/events/points-discord] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
