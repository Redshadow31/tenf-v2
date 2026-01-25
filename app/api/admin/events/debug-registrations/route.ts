import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { supabaseAdmin } from '@/lib/db/supabase';
import { eventRepository } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

/**
 * GET - Diagnostic des inscriptions d'événements
 * Aide à identifier pourquoi les inscriptions ne sont pas récupérées
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (eventId) {
      // Diagnostic pour un événement spécifique
      const event = await eventRepository.findById(eventId);
      if (!event) {
        return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
      }

      // Récupérer toutes les inscriptions pour cet event_id
      const { data: registrationsByEventId, error: error1 } = await supabaseAdmin
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId);

      // Récupérer toutes les inscriptions (pour voir s'il y en a avec un event_id différent)
      const { data: allRegistrations, error: error2 } = await supabaseAdmin
        .from('event_registrations')
        .select('event_id, twitch_login, display_name')
        .limit(50);

      // Récupérer tous les événements pour comparer les IDs
      const allEvents = await eventRepository.findAll(100, 0);

      return NextResponse.json({
        event: {
          id: event.id,
          title: event.title,
          date: event.date.toISOString(),
        },
        registrationsForThisEvent: {
          count: registrationsByEventId?.length || 0,
          data: registrationsByEventId || [],
          error: error1?.message,
        },
        allRegistrationsSample: {
          count: allRegistrations?.length || 0,
          data: allRegistrations || [],
          error: error2?.message,
          uniqueEventIds: [...new Set(allRegistrations?.map(r => r.event_id) || [])],
        },
        allEvents: {
          count: allEvents.length,
          ids: allEvents.map(e => e.id),
        },
        diagnostic: {
          eventIdInRegistrations: allRegistrations?.some(r => r.event_id === eventId),
          matchingEventIds: allEvents.filter(e => 
            allRegistrations?.some(r => r.event_id === e.id)
          ).map(e => ({ id: e.id, title: e.title })),
        },
      });
    } else {
      // Vue d'ensemble
      const { data: allRegistrations, error } = await supabaseAdmin
        .from('event_registrations')
        .select('event_id, twitch_login, display_name, registered_at')
        .order('registered_at', { ascending: false })
        .limit(100);

      const allEvents = await eventRepository.findAll(1000, 0);

      // Compter les inscriptions par événement
      const registrationsByEvent: Record<string, number> = {};
      allRegistrations?.forEach(reg => {
        registrationsByEvent[reg.event_id] = (registrationsByEvent[reg.event_id] || 0) + 1;
      });

      // Trouver les événements avec des inscriptions
      const eventsWithRegistrations = allEvents
        .filter(e => registrationsByEvent[e.id] > 0)
        .map(e => ({
          id: e.id,
          title: e.title,
          date: e.date.toISOString(),
          registrationsCount: registrationsByEvent[e.id],
        }));

      // Trouver les event_id dans les inscriptions qui ne correspondent à aucun événement
      const orphanRegistrations = [...new Set(allRegistrations?.map(r => r.event_id) || [])]
        .filter(eventId => !allEvents.some(e => e.id === eventId));

      return NextResponse.json({
        summary: {
          totalRegistrations: allRegistrations?.length || 0,
          totalEvents: allEvents.length,
          eventsWithRegistrations: eventsWithRegistrations.length,
          orphanRegistrations: orphanRegistrations.length,
        },
        registrationsByEvent,
        eventsWithRegistrations,
        orphanEventIds: orphanRegistrations,
        sampleRegistrations: allRegistrations?.slice(0, 10) || [],
        error: error?.message,
      });
    }
  } catch (error) {
    console.error('[Debug Registrations API] Erreur:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
