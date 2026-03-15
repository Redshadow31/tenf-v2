import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { eventRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";

type FormationSession = {
  eventId: string;
  title: string;
  date: string;
  participants: number;
};

type FormationRequester = {
  id: string;
  memberDiscordId: string;
  memberDisplayName: string;
  memberTwitchLogin: string;
  requestedAt: string;
  status: string;
};

function normalizeCategory(value?: string): string {
  return String(value || "").toLowerCase().trim();
}

function isFormationCategory(category?: string): boolean {
  return normalizeCategory(category).includes("formation");
}

function normalizeTitle(value?: string): string {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const allEvents = await eventRepository.findAll(1500, 0);
    const formationEvents = allEvents
      .filter((event) => isFormationCategory(event.category))
      .map((event) => ({
        id: String(event.id),
        title: String(event.title || "Formation"),
        dateIso: event.date instanceof Date ? event.date.toISOString() : new Date(event.date).toISOString(),
      }));

    const eventIds = formationEvents.map((event) => event.id);
    const participantCounts = new Map<string, number>();

    if (eventIds.length > 0) {
      const { data: presenceRows } = await supabaseAdmin
        .from("event_presences")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("present", true);

      for (const row of presenceRows || []) {
        const key = String(row.event_id || "");
        if (!key) continue;
        participantCounts.set(key, (participantCounts.get(key) || 0) + 1);
      }
    }

    const { data: requestRows, error: requestsError } = await supabaseAdmin
      .from("formation_requests")
      .select("id,formation_title,member_discord_id,member_twitch_login,member_display_name,status,requested_at")
      .order("requested_at", { ascending: false });

    if (requestsError) {
      return NextResponse.json({ error: "Impossible de charger les demandes formation" }, { status: 500 });
    }

    const groups = new Map<
      string,
      {
        formationTitle: string;
        sessions: FormationSession[];
        requests: FormationRequester[];
      }
    >();

    for (const event of formationEvents) {
      const key = normalizeTitle(event.title);
      if (!key) continue;
      const group = groups.get(key) || { formationTitle: event.title, sessions: [], requests: [] };
      group.sessions.push({
        eventId: event.id,
        title: event.title,
        date: event.dateIso,
        participants: participantCounts.get(event.id) || 0,
      });
      groups.set(key, group);
    }

    for (const request of requestRows || []) {
      const title = String(request.formation_title || "").trim();
      if (!title) continue;
      const key = normalizeTitle(title);
      const group = groups.get(key) || { formationTitle: title, sessions: [], requests: [] };
      group.requests.push({
        id: String(request.id),
        memberDiscordId: String(request.member_discord_id || ""),
        memberDisplayName: String(request.member_display_name || "Membre"),
        memberTwitchLogin: String(request.member_twitch_login || ""),
        requestedAt: String(request.requested_at || new Date().toISOString()),
        status: String(request.status || "pending"),
      });
      groups.set(key, group);
    }

    const nowTs = Date.now();
    const formations = Array.from(groups.values()).map((group) => {
      const sessions = group.sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const pastSessions = sessions.filter((session) => new Date(session.date).getTime() <= nowTs);
      const lastSession = pastSessions[0] || sessions[0] || null;
      const pendingRequests = group.requests.filter((request) => request.status === "pending");
      return {
        formationTitle: group.formationTitle,
        lastSession,
        demandCount: pendingRequests.length,
        sessions,
        requests: pendingRequests,
      };
    });

    formations.sort((a, b) => {
      if (b.demandCount !== a.demandCount) return b.demandCount - a.demandCount;
      const aTs = a.lastSession ? new Date(a.lastSession.date).getTime() : 0;
      const bTs = b.lastSession ? new Date(b.lastSession.date).getTime() : 0;
      return bTs - aTs;
    });

    return NextResponse.json({ formations });
  } catch (error) {
    console.error("[admin/formation/requests] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

