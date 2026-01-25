import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { eventRepository } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

/**
 * GET - Récupère toutes les inscriptions pour tous les événements (admin uniquement)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 });
    }
    
    // Récupérer tous les événements (limite élevée pour l'admin)
    console.log('[Admin Events Registrations API] Récupération des événements...');
    const events = await eventRepository.findAll(1000, 0);
    console.log(`[Admin Events Registrations API] ${events.length} événements trouvés`);
    
    // Récupérer toutes les inscriptions pour tous les événements en parallèle (évite N+1 queries)
    const registrationPromises = events.map(event => 
      eventRepository.getRegistrations(event.id)
        .then(registrations => {
          console.log(`[Admin Events Registrations API] Événement ${event.id}: ${registrations.length} inscriptions`);
          return {
            eventId: event.id,
            registrations: registrations.map(reg => {
              try {
                return {
                  id: reg.id,
                  eventId: reg.eventId,
                  twitchLogin: reg.twitchLogin,
                  displayName: reg.displayName,
                  discordId: reg.discordId,
                  discordUsername: reg.discordUsername,
                  notes: reg.notes,
                  registeredAt: reg.registeredAt instanceof Date 
                    ? reg.registeredAt.toISOString() 
                    : (typeof reg.registeredAt === 'string' 
                        ? reg.registeredAt 
                        : new Date(reg.registeredAt).toISOString()),
                };
              } catch (regError) {
                console.error(`[Admin Events Registrations API] Erreur mapping inscription ${reg.id}:`, regError);
                return null;
              }
            }).filter((reg: any) => reg !== null)
          };
        })
        .catch(error => {
          console.error(`[Admin Events Registrations API] Erreur récupération inscriptions pour événement ${event.id}:`, error);
          return { eventId: event.id, registrations: [] };
        })
    );
    
    const registrationResults = await Promise.all(registrationPromises);
    const allRegistrationsMap: Record<string, any[]> = {};
    let totalRegistrations = 0;
    
    registrationResults.forEach(({ eventId, registrations }) => {
      allRegistrationsMap[eventId] = registrations;
      totalRegistrations += registrations.length;
    });
    
    // Enrichir avec les informations des événements
    const result = events.map(event => ({
      event: {
        id: event.id,
        title: event.title,
        date: event.date.toISOString(),
        category: event.category,
        isPublished: event.isPublished,
      },
      registrations: allRegistrationsMap[event.id] || [],
      registrationCount: (allRegistrationsMap[event.id] || []).length,
    }));
    
    return NextResponse.json({ 
      eventsWithRegistrations: result,
      totalEvents: events.length,
      totalRegistrations,
    });
  } catch (error) {
    console.error('[Admin Events Registrations API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

