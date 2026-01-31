import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin';
import { requireSectionAccess } from '@/lib/requireAdmin';
import { eventRepository } from '@/lib/repositories';
import { logAction, prepareAuditValues } from '@/lib/admin/logger';

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

    const formattedEvent = {
      ...event,
      date: event.date instanceof Date ? event.date.toISOString() : event.date,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
      updatedAt: event.updatedAt ? (event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt) : undefined,
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

    // Passer les champs à mettre à jour (date en ISO si string, conservée telle quelle par le repository)
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.image !== undefined) updates.image = body.image;
    if (body.date !== undefined) updates.date = typeof body.date === 'string' ? body.date : (body.date instanceof Date ? body.date.toISOString() : body.date);
    if (body.category !== undefined) updates.category = body.category;
    if (body.location !== undefined) updates.location = body.location;
    if (body.isPublished !== undefined) updates.isPublished = body.isPublished;

    const updatedEvent = await eventRepository.update(eventId, updates as Parameters<typeof eventRepository.update>[1]);

    const formattedEvent = {
      ...updatedEvent,
      date: updatedEvent.date instanceof Date ? updatedEvent.date.toISOString() : updatedEvent.date,
      createdAt: updatedEvent.createdAt instanceof Date ? updatedEvent.createdAt.toISOString() : updatedEvent.createdAt,
      updatedAt: updatedEvent.updatedAt ? (updatedEvent.updatedAt instanceof Date ? updatedEvent.updatedAt.toISOString() : updatedEvent.updatedAt) : undefined,
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
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
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

