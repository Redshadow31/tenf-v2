import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { eventRepository } from '@/lib/repositories';
import { supabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

function toIsoSafeDate(input: any): string {
  const date = new Date(input);
  if (!Number.isNaN(date.getTime())) return date.toISOString();
  return new Date().toISOString();
}

async function loadEventsWithoutCache(): Promise<any[]> {
  // 1) v2 prioritaire: community_events.starts_at
  const tryCommunityStartsAt = await supabaseAdmin
    .from('community_events')
    .select('*')
    .order('starts_at', { ascending: false })
    .limit(1000);
  if (!tryCommunityStartsAt.error && tryCommunityStartsAt.data?.length) {
    return tryCommunityStartsAt.data;
  }

  // 2) compat: community_events.date
  const tryCommunityDate = await supabaseAdmin
    .from('community_events')
    .select('*')
    .order('date', { ascending: false })
    .limit(1000);
  if (!tryCommunityDate.error && tryCommunityDate.data?.length) {
    return tryCommunityDate.data;
  }

  // 3) fallback legacy: events.date
  const tryLegacyDate = await supabaseAdmin
    .from('events')
    .select('*')
    .order('date', { ascending: false })
    .limit(1000);
  if (!tryLegacyDate.error && tryLegacyDate.data?.length) {
    return tryLegacyDate.data;
  }

  // 4) fallback legacy: events.starts_at
  const tryLegacyStartsAt = await supabaseAdmin
    .from('events')
    .select('*')
    .order('starts_at', { ascending: false })
    .limit(1000);
  if (!tryLegacyStartsAt.error && tryLegacyStartsAt.data?.length) {
    return tryLegacyStartsAt.data;
  }

  return [];
}

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
    let events = await eventRepository.findAll(1000, 0);
    if (!events.length) {
      // Résilience: si cache stale vide, bypass direct DB.
      const directRows = await loadEventsWithoutCache();
      events = directRows.map((row: any) => ({
        id: String(row.id),
        title: row.title || 'Sans titre',
        description: row.description || '',
        image: row.image || undefined,
        date: new Date(row.starts_at || row.date || row.created_at || row.updated_at || new Date().toISOString()),
        category: row.category || 'Non classé',
        location: row.location || undefined,
        invitedMembers: row.invited_members || [],
        isPublished: row.is_published ?? row.isPublished ?? false,
        createdAt: new Date(row.created_at || new Date().toISOString()),
        createdBy: row.created_by || 'system',
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      }));
    }
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
    const result = events.map(event => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      return {
        event: {
          id: event.id,
          title: event.title,
          date: toIsoSafeDate(eventDate),
          category: event.category,
          description: event.description,
          location: event.location,
          image: event.image,
          isPublished: event.isPublished,
        },
        registrations: allRegistrationsMap[event.id] || [],
        registrationCount: (allRegistrationsMap[event.id] || []).length,
      };
    });
    
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

