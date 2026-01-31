import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { eventRepository } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

/**
 * DELETE - Supprime un événement (et ses inscriptions / présences via CASCADE en base)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Non authentifié ou accès refusé' },
        { status: 401 }
      );
    }

    const { eventId } = await params;
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId requis' },
        { status: 400 }
      );
    }

    const event = await eventRepository.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Événement introuvable' },
        { status: 404 }
      );
    }

    await eventRepository.delete(eventId);

    return NextResponse.json({ success: true, deletedId: eventId });
  } catch (error) {
    console.error('[API DELETE Event] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'événement' },
      { status: 500 }
    );
  }
}
