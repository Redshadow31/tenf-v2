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
  // Charge v2 + legacy puis fusionne (au lieu de fallback exclusif),
  // pour éviter de perdre des événements/statistiques pendant migration.
  const tryCommunityStartsAt = await supabaseAdmin
    .from('community_events')
    .select('*')
    .order('starts_at', { ascending: false })
    .limit(1000);

  // compat: community_events.date
  const tryCommunityDate = await supabaseAdmin
    .from('community_events')
    .select('*')
    .order('date', { ascending: false })
    .limit(1000);

  // legacy: events.date
  const tryLegacyDate = await supabaseAdmin
    .from('events')
    .select('*')
    .order('date', { ascending: false })
    .limit(1000);

  // legacy: events.starts_at
  const tryLegacyStartsAt = await supabaseAdmin
    .from('events')
    .select('*')
    .order('starts_at', { ascending: false })
    .limit(1000);
  const communityRows = [
    ...(tryCommunityStartsAt.error ? [] : (tryCommunityStartsAt.data || [])),
    ...(tryCommunityDate.error ? [] : (tryCommunityDate.data || [])),
  ];
  const legacyRows = [
    ...(tryLegacyDate.error ? [] : (tryLegacyDate.data || [])),
    ...(tryLegacyStartsAt.error ? [] : (tryLegacyStartsAt.data || [])),
  ];

  const dedupCommunity = new Map<string, any>();
  for (const row of communityRows) {
    if (!row?.id) continue;
    dedupCommunity.set(String(row.id), row);
  }
  const community = Array.from(dedupCommunity.values());

  const representedLegacy = new Set<string>();
  const representedTitleDate = new Set<string>();
  for (const row of community) {
    if (row?.legacy_event_id) {
      representedLegacy.add(String(row.legacy_event_id));
    }
    const key = `${String(row?.title || '').trim().toLowerCase()}__${String(row?.starts_at || row?.date || '')}`;
    representedTitleDate.add(key);
  }

  const legacyOnly: any[] = [];
  const seenLegacyId = new Set<string>();
  for (const row of legacyRows) {
    const legacyId = String(row?.id || '');
    if (!legacyId || seenLegacyId.has(legacyId)) continue;
    seenLegacyId.add(legacyId);

    const key = `${String(row?.title || '').trim().toLowerCase()}__${String(row?.date || row?.starts_at || '')}`;
    if (representedLegacy.has(legacyId) || representedTitleDate.has(key)) {
      continue;
    }
    legacyOnly.push(row);
  }

  return [...community, ...legacyOnly];
}

function eventMergeKey(eventLike: {
  id?: string;
  legacyEventId?: string;
  title?: string;
  date?: Date | string;
}): string {
  const title = String(eventLike.title || '').trim().toLowerCase();
  const dateRaw = eventLike.date;
  const dateIso = dateRaw instanceof Date ? dateRaw.toISOString() : String(dateRaw || '');
  return `${title}__${dateIso}`;
}

function normalizeLogin(value?: string): string {
  return (value || '').trim().toLowerCase();
}

function toTs(value?: string): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
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
    const directRows = await loadEventsWithoutCache();
    const directEvents = directRows.map((row: any) => ({
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
      legacyEventId: row.legacy_event_id ? String(row.legacy_event_id) : undefined,
    }));

    // Fusionne toujours les sources v2 + legacy pour éviter de perdre des événements
    // tant que la migration n'est pas totalement homogène.
    const byId = new Map<string, any>();
    const byLegacyId = new Map<string, string>();
    const byTitleDate = new Map<string, string>();

    for (const event of events) {
      byId.set(String(event.id), event);
      const legacy = (event as any).legacyEventId;
      if (legacy) byLegacyId.set(String(legacy), String(event.id));
      byTitleDate.set(eventMergeKey(event), String(event.id));
    }

    for (const event of directEvents) {
      const directId = String(event.id);
      if (byId.has(directId)) continue;

      if (event.legacyEventId && byLegacyId.has(event.legacyEventId)) {
        continue;
      }

      const key = eventMergeKey(event);
      if (byTitleDate.has(key)) {
        continue;
      }

      byId.set(directId, event);
      if (event.legacyEventId) byLegacyId.set(event.legacyEventId, directId);
      byTitleDate.set(key, directId);
    }

    events = Array.from(byId.values());
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
      const dedupByLogin = new Map<string, any>();
      for (const reg of registrations) {
        const key = normalizeLogin(reg?.twitchLogin);
        if (!key) continue;
        const existing = dedupByLogin.get(key);
        if (!existing || toTs(reg?.registeredAt) >= toTs(existing?.registeredAt)) {
          dedupByLogin.set(key, reg);
        }
      }
      const deduped = Array.from(dedupByLogin.values());
      allRegistrationsMap[eventId] = deduped;
      totalRegistrations += deduped.length;
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

