import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin';
import { requireSectionAccess } from '@/lib/requireAdmin';
import { eventRepository } from '@/lib/repositories';
import { logAction, prepareAuditValues } from '@/lib/admin/logger';
import { PARIS_TIMEZONE, parisLocalDateTimeToUtcIso, utcIsoToParisDateTimeLocalInput } from '@/lib/timezone';
import { deleteEventSeriesMeta, getEventSeriesMeta, upsertEventSeriesMeta } from '@/lib/eventSeriesStorage';
import { deleteEventSpotlightMeta, getEventSpotlightMeta, upsertEventSpotlightMeta } from '@/lib/eventSpotlightStorage';
import { memberRepository, spotlightRepository } from '@/lib/repositories';

function normalizeCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isSpotlightCategory(value: string): boolean {
  return normalizeCategory(value || "") === "spotlight";
}

function isTrackedSeriesCategory(value: string): boolean {
  const normalized = normalizeCategory(value || "");
  return normalized === "formation" || normalized === "jeux communautaire";
}

/**
 * GET - Récupère un événement spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const event = await eventRepository.findById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est admin ou si l'événement est publié
    const admin = await getCurrentAdmin();
    let isAdmin = false;
    if (admin) {
      const sectionAdmin = await requireSectionAccess('/admin/events/planification');
      isAdmin = sectionAdmin !== null;
    }

    if (!event.isPublished && !isAdmin) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    const [seriesMeta, spotlightMeta] = await Promise.all([
      getEventSeriesMeta(eventId),
      getEventSpotlightMeta(eventId),
    ]);
    const formattedEvent = {
      ...event,
      date: event.date instanceof Date ? event.date.toISOString() : event.date,
      startAtUtc: event.date instanceof Date ? event.date.toISOString() : event.date,
      timezoneOrigin: PARIS_TIMEZONE,
      startAtParisLocal: utcIsoToParisDateTimeLocalInput(event.date instanceof Date ? event.date.toISOString() : event.date),
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
      updatedAt: event.updatedAt ? (event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt) : undefined,
      seriesId: seriesMeta?.seriesId,
      seriesName: seriesMeta?.seriesName,
      sourceEventId: seriesMeta?.sourceEventId,
      spotlightStreamerLogin: spotlightMeta?.streamerTwitchLogin,
      spotlightStreamerDisplayName: spotlightMeta?.streamerDisplayName,
    };
    return NextResponse.json({ event: formattedEvent });
  } catch (error) {
    console.error('[Event API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour un événement (admin uniquement)
 * Utilise Supabase (eventRepository) pour que la modification soit visible dans la liste chargée depuis /api/events.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const admin = await requireSectionAccess('/admin/events/planification');
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { eventId } = params;
    const body = await request.json();

    const existingEvent = await eventRepository.findById(eventId);
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Passer les champs à mettre à jour (entrée admin en heure de Paris -> conversion UTC)
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.image !== undefined) updates.image = body.image;
    if (body.startAtParisLocal !== undefined && typeof body.startAtParisLocal === 'string' && body.startAtParisLocal) {
      updates.date = parisLocalDateTimeToUtcIso(body.startAtParisLocal);
    } else if (body.startAtUtc !== undefined) {
      updates.date = body.startAtUtc;
    } else if (body.date !== undefined) {
      updates.date = typeof body.date === 'string' ? body.date : (body.date instanceof Date ? body.date.toISOString() : body.date);
    }
    if (body.category !== undefined) updates.category = body.category;
    if (body.location !== undefined) updates.location = body.location;
    if (body.isPublished !== undefined) updates.isPublished = body.isPublished;

    const updatedEvent = await eventRepository.update(eventId, updates as Parameters<typeof eventRepository.update>[1]);

    if (typeof body.seriesId === 'string' && typeof body.seriesName === 'string') {
      await upsertEventSeriesMeta({
        eventId,
        seriesId: body.seriesId,
        seriesName: body.seriesName,
        sourceEventId: typeof body.sourceEventId === 'string' ? body.sourceEventId : undefined,
      });
    } else if (!isTrackedSeriesCategory(String(body.category ?? updatedEvent.category ?? existingEvent.category ?? ""))) {
      await deleteEventSeriesMeta(eventId);
    }

    const spotlightMeta = await getEventSpotlightMeta(eventId);
    const nextCategory = String(body.category ?? updatedEvent.category ?? existingEvent.category ?? "");
    const isSpotlight = isSpotlightCategory(nextCategory);
    const nextDateIso =
      typeof updates.date === "string"
        ? updates.date
        : updatedEvent.date instanceof Date
          ? updatedEvent.date.toISOString()
          : String(updatedEvent.date);
    const providedSpotlightLogin = String(body.spotlightStreamerLogin || "").trim().replace(/^@/, "").toLowerCase();
    const nextSpotlightLogin = providedSpotlightLogin || spotlightMeta?.streamerTwitchLogin || "";

    if (isSpotlight && !nextSpotlightLogin) {
      return NextResponse.json(
        { error: "Un membre Spotlight est requis pour une categorie Spotlight." },
        { status: 400 }
      );
    }

    if (isSpotlight && nextSpotlightLogin) {
      const startsAt = new Date(nextDateIso);
      const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
      const member = await memberRepository.findByTwitchLogin(nextSpotlightLogin);
      const displayName =
        member?.displayName ||
        String(body.spotlightStreamerDisplayName || "").trim() ||
        spotlightMeta?.streamerDisplayName ||
        nextSpotlightLogin;

      if (spotlightMeta?.spotlightId) {
        await spotlightRepository.update(spotlightMeta.spotlightId, {
          streamerTwitchLogin: nextSpotlightLogin,
          streamerDisplayName: displayName,
          startedAt: startsAt,
          endsAt,
          status: "active",
        });
        await upsertEventSpotlightMeta({
          eventId,
          spotlightId: spotlightMeta.spotlightId,
          streamerTwitchLogin: nextSpotlightLogin,
          streamerDisplayName: displayName,
        });
      } else {
        const createdSpotlight = await spotlightRepository.create({
          streamerTwitchLogin: nextSpotlightLogin,
          streamerDisplayName: displayName,
          startedAt: startsAt,
          endsAt,
          status: "active",
          moderatorDiscordId: admin.discordId,
          moderatorUsername: admin.username,
          createdAt: new Date(),
          createdBy: admin.discordId,
        });
        await upsertEventSpotlightMeta({
          eventId,
          spotlightId: createdSpotlight.id,
          streamerTwitchLogin: nextSpotlightLogin,
          streamerDisplayName: displayName,
        });
      }
    }

    if ((!isSpotlight || !nextSpotlightLogin) && spotlightMeta?.spotlightId) {
      await spotlightRepository.update(spotlightMeta.spotlightId, { status: "cancelled" });
      await deleteEventSpotlightMeta(eventId);
    }

    const [seriesMeta, nextSpotlightMeta] = await Promise.all([
      getEventSeriesMeta(eventId),
      getEventSpotlightMeta(eventId),
    ]);
    const formattedEvent = {
      ...updatedEvent,
      date: updatedEvent.date instanceof Date ? updatedEvent.date.toISOString() : updatedEvent.date,
      startAtUtc: updatedEvent.date instanceof Date ? updatedEvent.date.toISOString() : updatedEvent.date,
      timezoneOrigin: PARIS_TIMEZONE,
      startAtParisLocal: utcIsoToParisDateTimeLocalInput(updatedEvent.date instanceof Date ? updatedEvent.date.toISOString() : updatedEvent.date),
      createdAt: updatedEvent.createdAt instanceof Date ? updatedEvent.createdAt.toISOString() : updatedEvent.createdAt,
      updatedAt: updatedEvent.updatedAt ? (updatedEvent.updatedAt instanceof Date ? updatedEvent.updatedAt.toISOString() : updatedEvent.updatedAt) : undefined,
      seriesId: seriesMeta?.seriesId,
      seriesName: seriesMeta?.seriesName,
      sourceEventId: seriesMeta?.sourceEventId,
      spotlightStreamerLogin: nextSpotlightMeta?.streamerTwitchLogin,
      spotlightStreamerDisplayName: nextSpotlightMeta?.streamerDisplayName,
    };

    const { previousValue, newValue } = prepareAuditValues(existingEvent, formattedEvent);
    await logAction({
      action: "event.update",
      resourceType: "event",
      resourceId: eventId,
      previousValue,
      newValue,
      metadata: { sourcePage: "/admin/events" },
    });

    return NextResponse.json({ event: formattedEvent, success: true });
  } catch (error) {
    console.error('[Event API] Erreur PUT:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime un événement (admin uniquement)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const admin = await requireSectionAccess('/admin/events/planification');
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { eventId } = params;

    const existingEvent = await eventRepository.findById(eventId);
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    await eventRepository.delete(eventId);
    await deleteEventSeriesMeta(eventId);
    const spotlightMeta = await getEventSpotlightMeta(eventId);
    if (spotlightMeta?.spotlightId) {
      await spotlightRepository.update(spotlightMeta.spotlightId, { status: "cancelled" });
      await deleteEventSpotlightMeta(eventId);
    }

    const previousValue = prepareAuditValues(existingEvent, undefined).previousValue;
    await logAction({
      action: "event.delete",
      resourceType: "event",
      resourceId: eventId,
      previousValue,
      metadata: { sourcePage: "/admin/events" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Event API] Erreur DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

