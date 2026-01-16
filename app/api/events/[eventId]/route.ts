import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { getEvent, updateEvent, deleteEvent } from '@/lib/eventStorage';
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
    const event = await getEvent(eventId);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }
    
    // Vérifier si l'utilisateur est admin ou si l'événement est publié
    const admin = await getCurrentAdmin();
    const isAdmin = admin && hasAdminDashboardAccess(admin.id);
    
    if (!event.isPublished && !isAdmin) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ event });
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
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const { eventId } = params;
    const body = await request.json();
    
    // Capturer l'état avant la mise à jour
    const existingEvent = await getEvent(eventId);
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }
    
    const updatedEvent = await updateEvent(eventId, body);
    
    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }
    
    // Logger l'action avec before/after optimisés
    const { previousValue, newValue } = prepareAuditValues(existingEvent, updatedEvent);
    await logAction({
      action: "event.update",
      resourceType: "event",
      resourceId: eventId,
      previousValue,
      newValue,
      metadata: { sourcePage: "/admin/events" },
    });
    
    return NextResponse.json({ event: updatedEvent, success: true });
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
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const { eventId } = params;
    
    // Capturer l'état avant la suppression
    const existingEvent = await getEvent(eventId);
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }
    
    const deleted = await deleteEvent(eventId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }
    
    // Logger l'action avec before optimisé
    const { previousValue } = prepareAuditValues(existingEvent, undefined);
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

