/**
 * API Route pour migrer les événements depuis source legacy vers Supabase v2
 * 
 * Cette route permet d'exécuter la migration depuis le navigateur,
 * évitant les problèmes de permissions avec tsx sur Windows.
 * 
 * GET /api/admin/migration/migrate-events?source=supabase-legacy|blobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getBlobStore } from '@/lib/memberData';
import { supabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

const EVENTS_STORE_NAME = 'tenf-events';
const EVENTS_KEY = 'events.json';
const EVENT_PRESENCE_STORE_NAME = 'tenf-event-presences';

interface BlobEvent {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  category: string;
  location?: string;
  invitedMembers?: string[];
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  isPublished: boolean;
}

interface SupabaseEventRow {
  id: string;
  title: string;
  starts_at: string;
  legacy_event_id?: string | null;
}

interface BlobRegistration {
  id: string;
  eventId: string;
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  registeredAt: string;
  notes?: string;
}

interface BlobPresence {
  id: string;
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  isRegistered: boolean;
  present: boolean;
  note?: string;
  validatedAt?: string;
  validatedBy?: string;
  addedManually: boolean;
  createdAt: string;
}

interface BlobPresenceData {
  eventId: string;
  presences: BlobPresence[];
  lastUpdated: string;
}

async function loadEventsFromBlobs(): Promise<BlobEvent[]> {
  try {
    const store = getBlobStore(EVENTS_STORE_NAME);
    const data = await store.get(EVENTS_KEY, { type: 'json' });
    return (data as BlobEvent[]) || [];
  } catch (error) {
    console.error('Erreur chargement événements depuis Blobs:', error);
    throw error;
  }
}

async function loadEventsFromLegacySupabase(): Promise<BlobEvent[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('date', { ascending: false })
      .limit(10000);
    if (error) {
      console.error('Erreur chargement événements legacy Supabase:', error);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title || 'Sans titre',
      description: row.description || '',
      image: row.image || undefined,
      date: row.date ? String(row.date) : new Date().toISOString(),
      category: row.category || 'Non classé',
      location: row.location || undefined,
      invitedMembers: row.invited_members || [],
      createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
      createdBy: row.created_by || 'migration',
      updatedAt: row.updated_at ? String(row.updated_at) : undefined,
      isPublished: row.is_published ?? row.isPublished ?? false,
    }));
  } catch (error) {
    console.error('Erreur chargement événements legacy Supabase:', error);
    return [];
  }
}

async function loadRegistrationsFromBlobs(eventId: string): Promise<BlobRegistration[]> {
  try {
    const store = getBlobStore(EVENTS_STORE_NAME);
    const key = `registrations/${eventId}.json`;
    const data = await store.get(key, { type: 'json' });
    return (data as BlobRegistration[]) || [];
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return [];
    }
    return [];
  }
}

async function loadRegistrationsFromLegacySupabase(eventId: string): Promise<BlobRegistration[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .limit(10000);
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: String(row.id),
      eventId: String(row.event_id),
      twitchLogin: row.twitch_login || '',
      displayName: row.display_name || row.twitch_login || '',
      discordId: row.discord_id || undefined,
      discordUsername: row.discord_username || undefined,
      registeredAt: row.registered_at ? String(row.registered_at) : new Date().toISOString(),
      notes: row.notes || undefined,
    }));
  } catch {
    return [];
  }
}

async function findEventInSupabase(blobEvent: BlobEvent): Promise<SupabaseEventRow | null> {
  const { data, error } = await supabaseAdmin
    .from('community_events')
    .select('id, title, starts_at, legacy_event_id')
    .eq('legacy_event_id', blobEvent.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data) return data as SupabaseEventRow;

  const fallback = await supabaseAdmin
    .from('community_events')
    .select('id, title, starts_at, legacy_event_id')
    .eq('title', blobEvent.title)
    .eq('starts_at', blobEvent.date)
    .limit(1)
    .single();

  if (fallback.error && fallback.error.code !== 'PGRST116') {
    throw fallback.error;
  }

  return (fallback.data as SupabaseEventRow | null) || null;
}

async function checkRegistrationExistsInSupabase(eventId: string, twitchLogin: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('twitch_login', twitchLogin.toLowerCase())
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return !!data;
}

async function loadPresencesFromBlobs(eventId: string): Promise<BlobPresence[]> {
  try {
    const store = getBlobStore(EVENT_PRESENCE_STORE_NAME);
    const key = `${eventId}/presence.json`;
    const data = await store.get(key, { type: 'json' });
    if (data && (data as BlobPresenceData).presences) {
      return (data as BlobPresenceData).presences || [];
    }
    return [];
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return [];
    }
    return [];
  }
}

async function loadPresencesFromLegacySupabase(eventId: string): Promise<BlobPresence[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('event_presences')
      .select('*')
      .eq('event_id', eventId)
      .limit(10000);
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: String(row.id),
      twitchLogin: row.twitch_login || '',
      displayName: row.display_name || row.twitch_login || '',
      discordId: row.discord_id || undefined,
      discordUsername: row.discord_username || undefined,
      isRegistered: row.is_registered ?? true,
      present: row.present ?? false,
      note: row.note || undefined,
      validatedAt: row.validated_at ? String(row.validated_at) : undefined,
      validatedBy: row.validated_by || undefined,
      addedManually: row.added_manually ?? false,
      createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

async function checkPresenceExistsInSupabase(eventId: string, twitchLogin: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('event_presences')
    .select('id')
    .eq('event_id', eventId)
    .eq('twitch_login', twitchLogin.toLowerCase())
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return !!data;
}

async function migrateEvent(blobEvent: BlobEvent): Promise<{ success: boolean; message: string; eventId?: string }> {
  const existingEvent = await findEventInSupabase(blobEvent);
  if (existingEvent) {
    return { success: false, message: `Événement ${blobEvent.id} existe déjà`, eventId: existingEvent.id };
  }

  const eventRecord: any = {
    title: blobEvent.title,
    description: blobEvent.description,
    image: blobEvent.image || null,
    starts_at: blobEvent.date,
    category: blobEvent.category,
    location: blobEvent.location || null,
    invited_members: blobEvent.invitedMembers || [],
    legacy_event_id: blobEvent.id,
    is_published: blobEvent.isPublished ?? false,
    created_by: blobEvent.createdBy,
    created_at: blobEvent.createdAt,
    updated_at: blobEvent.updatedAt || null,
  };

  const { data, error } = await supabaseAdmin
    .from('community_events')
    .insert(eventRecord);

  if (error) {
    console.error(`Erreur insertion événement ${blobEvent.id}:`, error);
    return { success: false, message: 'Erreur lors de la migration de l\'événement' };
  }

  const created = await findEventInSupabase(blobEvent);
  return { success: true, message: `Événement "${blobEvent.title}" migré`, eventId: created?.id };
}

async function migrateRegistration(blobReg: BlobRegistration): Promise<boolean> {
  const exists = await checkRegistrationExistsInSupabase(blobReg.eventId, blobReg.twitchLogin);
  if (exists) {
    return false;
  }

  const regRecord: any = {
    event_id: blobReg.eventId,
    twitch_login: blobReg.twitchLogin.toLowerCase(),
    display_name: blobReg.displayName,
    discord_id: blobReg.discordId || null,
    discord_username: blobReg.discordUsername || null,
    notes: blobReg.notes || null,
    registered_at: blobReg.registeredAt,
  };

  const { error } = await supabaseAdmin
    .from('event_registrations')
    .insert(regRecord);

  if (error) {
    console.error(`Erreur insertion inscription ${blobReg.id}:`, error);
    return false;
  }

  return true;
}

async function migratePresence(blobPresence: BlobPresence, eventId: string): Promise<boolean> {
  const exists = await checkPresenceExistsInSupabase(eventId, blobPresence.twitchLogin);
  if (exists) {
    return false;
  }

  const presenceRecord: any = {
    event_id: eventId,
    twitch_login: blobPresence.twitchLogin.toLowerCase(),
    display_name: blobPresence.displayName,
    discord_id: blobPresence.discordId || null,
    discord_username: blobPresence.discordUsername || null,
    is_registered: blobPresence.isRegistered,
    present: blobPresence.present,
    note: blobPresence.note || null,
    validated_at: blobPresence.validatedAt || null,
    validated_by: blobPresence.validatedBy || null,
    added_manually: blobPresence.addedManually || false,
  };

  const { error } = await supabaseAdmin
    .from('event_presences')
    .insert(presenceRecord);

  if (error) {
    console.error(`Erreur insertion présence ${blobPresence.id}:`, error);
    return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'supabase-legacy';
    const useLegacySupabase = source === 'supabase-legacy';

    console.log(`🚀 Début migration des événements depuis ${useLegacySupabase ? 'Supabase legacy' : 'Blobs'} vers Supabase v2`);

    // 1. Charger les événements depuis la source legacy choisie
    const blobEvents = useLegacySupabase
      ? await loadEventsFromLegacySupabase()
      : await loadEventsFromBlobs();
    
    if (blobEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Aucun événement trouvé dans la source (${source})`,
        summary: {
          eventsInBlobs: 0,
          eventsMigrated: 0,
          eventsSkipped: 0,
          totalRegistrations: 0,
          registrationsMigrated: 0,
          registrationsSkipped: 0,
          totalPresences: 0,
          presencesMigrated: 0,
          presencesSkipped: 0,
          totalEventsInSupabase: 0,
          totalRegistrationsInSupabase: 0,
          totalPresencesInSupabase: 0,
        },
      });
    }

    // 2. Migrer les événements
    let eventsMigrated = 0;
    let eventsSkipped = 0;
    const eventResults: string[] = [];
    
    const eventIdMap = new Map<string, string>();
    for (const blobEvent of blobEvents) {
      const result = await migrateEvent(blobEvent);
      if (result.success) {
        eventsMigrated++;
        eventResults.push(`✅ ${result.message}`);
      } else {
        eventsSkipped++;
        eventResults.push(`⏭️  ${result.message}`);
      }
      if (result.eventId) {
        eventIdMap.set(blobEvent.id, result.eventId);
      } else {
        const existing = await findEventInSupabase(blobEvent);
        if (existing?.id) eventIdMap.set(blobEvent.id, existing.id);
      }
    }

    // 3. Migrer les inscriptions
    let totalRegistrations = 0;
    let registrationsMigrated = 0;
    let registrationsSkipped = 0;

    for (const blobEvent of blobEvents) {
      const blobRegistrations = useLegacySupabase
        ? await loadRegistrationsFromLegacySupabase(blobEvent.id)
        : await loadRegistrationsFromBlobs(blobEvent.id);
      const targetEventId = eventIdMap.get(blobEvent.id);
      if (!targetEventId) continue;
      totalRegistrations += blobRegistrations.length;

      for (const blobReg of blobRegistrations) {
        const migrated = await migrateRegistration({ ...blobReg, eventId: targetEventId });
        if (migrated) {
          registrationsMigrated++;
        } else {
          registrationsSkipped++;
        }
      }
    }

    // 4. Migrer les présences
    let totalPresences = 0;
    let presencesMigrated = 0;
    let presencesSkipped = 0;

    for (const blobEvent of blobEvents) {
      const blobPresences = useLegacySupabase
        ? await loadPresencesFromLegacySupabase(blobEvent.id)
        : await loadPresencesFromBlobs(blobEvent.id);
      const targetEventId = eventIdMap.get(blobEvent.id);
      if (!targetEventId) continue;
      totalPresences += blobPresences.length;

      for (const blobPresence of blobPresences) {
        const migrated = await migratePresence(blobPresence, targetEventId);
        if (migrated) {
          presencesMigrated++;
        } else {
          presencesSkipped++;
        }
      }
    }

    // 5. Vérification finale
    const { data: supabaseEvents } = await supabaseAdmin
      .from('community_events')
      .select('id', { count: 'exact' });

    const { data: supabaseRegs } = await supabaseAdmin
      .from('event_registrations')
      .select('id', { count: 'exact' });

    const { data: supabasePresences } = await supabaseAdmin
      .from('event_presences')
      .select('id', { count: 'exact' });

    return NextResponse.json({
      success: true,
      source,
      message: 'Migration terminée avec succès',
      summary: {
        eventsInBlobs: blobEvents.length,
        eventsMigrated,
        eventsSkipped,
        totalRegistrations,
        registrationsMigrated,
        registrationsSkipped,
        totalPresences,
        presencesMigrated,
        presencesSkipped,
        totalEventsInSupabase: supabaseEvents?.length || 0,
        totalRegistrationsInSupabase: supabaseRegs?.length || 0,
        totalPresencesInSupabase: supabasePresences?.length || 0,
      },
      eventResults: eventResults.slice(0, 20), // Limiter à 20 pour la réponse
    });

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
