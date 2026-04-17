import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { eventRepository } from "@/lib/repositories";
import {
  listEventLeads,
  listLaneOwners,
  listScheduledItems,
  mergeLaneOwners,
  upsertEventLead,
  upsertLaneOwner,
  PILOTAGE_LANE_KEYS,
  type PilotageLaneKey,
} from "@/lib/staffPilotage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPilotageAdmin() {
  const admin = await requireAdmin();
  if (!admin) {
    return { response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  if (!(await hasAdvancedAdminAccess(admin.discordId))) {
    return {
      response: NextResponse.json(
        { error: "Réservé aux profils avec accès administrateur avancé." },
        { status: 403 }
      ),
    };
  }
  return { admin };
}

function upcomingEventsForPilotage() {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  return eventRepository.findAll(500, 0).then((events) => {
    const sorted = events
      .filter((e) => {
        const t = e.date instanceof Date ? e.date.getTime() : new Date(e.date as unknown as string).getTime();
        return !Number.isNaN(t) && t >= cutoff;
      })
      .sort((a, b) => {
        const ta = a.date instanceof Date ? a.date.getTime() : new Date(String(a.date)).getTime();
        const tb = b.date instanceof Date ? b.date.getTime() : new Date(String(b.date)).getTime();
        return ta - tb;
      })
      .slice(0, 60)
      .map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        startsAt: e.date instanceof Date ? e.date.toISOString() : new Date(e.date as unknown as string).toISOString(),
        location: e.location ?? null,
        isPublished: e.isPublished,
      }));
    return sorted;
  });
}

/**
 * GET — données de pilotage (événements à venir + affectations + planning).
 */
export async function GET() {
  const gate = await getPilotageAdmin();
  if ("response" in gate) return gate.response;

  try {
    const [eventLeads, laneRows, scheduledItems, upcomingEvents] = await Promise.all([
      listEventLeads(),
      listLaneOwners(),
      listScheduledItems(250),
      upcomingEventsForPilotage(),
    ]);

    const leadByEvent = new Map(eventLeads.map((l) => [l.eventId, l]));
    const eventsWithLeads = upcomingEvents.map((ev) => ({
      ...ev,
      lead: leadByEvent.get(ev.id) ?? null,
    }));

    return NextResponse.json({
      upcomingEvents: eventsWithLeads,
      laneOwners: mergeLaneOwners(laneRows),
      scheduledItems,
    });
  } catch (e) {
    console.error("[staff-pilotage GET]", e);
    return NextResponse.json(
      { error: "Impossible de charger le pilotage (tables absentes ou erreur base ?)." },
      { status: 500 }
    );
  }
}

type PutBody = {
  eventLeads?: Array<{
    eventId: string;
    primaryDiscordId: string;
    secondaryDiscordId?: string | null;
    notes?: string | null;
  }>;
  laneOwners?: Array<{
    laneKey: string;
    primaryDiscordId: string;
    secondaryDiscordId?: string | null;
    notes?: string | null;
  }>;
};

/**
 * PUT — enregistre les responsables d’événements et les référents par pôle (remplace côté serveur par upsert / delete si vide).
 */
export async function PUT(request: NextRequest) {
  const gate = await getPilotageAdmin();
  if ("response" in gate) return gate.response;
  const { admin } = gate;

  let body: PutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  try {
    if (Array.isArray(body.eventLeads)) {
      for (const row of body.eventLeads) {
        if (!row?.eventId) continue;
        await upsertEventLead(
          {
            eventId: String(row.eventId),
            primaryDiscordId: typeof row.primaryDiscordId === "string" ? row.primaryDiscordId : "",
            secondaryDiscordId: row.secondaryDiscordId,
            notes: row.notes,
            updatedByDiscordId: admin.discordId,
          },
          { deleteIfEmpty: true }
        );
      }
    }

    if (Array.isArray(body.laneOwners)) {
      for (const row of body.laneOwners) {
        const key = String(row?.laneKey || "") as PilotageLaneKey;
        if (!PILOTAGE_LANE_KEYS.includes(key)) continue;
        await upsertLaneOwner({
          laneKey: key,
          primaryDiscordId: typeof row.primaryDiscordId === "string" ? row.primaryDiscordId : "",
          secondaryDiscordId: row.secondaryDiscordId,
          notes: row.notes,
          updatedByDiscordId: admin.discordId,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[staff-pilotage PUT]", e);
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
}
