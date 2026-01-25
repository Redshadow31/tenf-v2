/**
 * API Route pour migrer les événements depuis Netlify Blobs vers Supabase
 * 
 * Cette route permet d'exécuter la migration depuis le navigateur,
 * évitant les problèmes de permissions avec tsx sur Windows.
 * 
 * GET /api/admin/migration/migrate-events
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getBlobStore } from '@/lib/memberData';
import { supabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

const EVENTS_STORE_NAME = 'tenf-events';
const EVENTS_KEY = 'events.json';

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

async function checkEventExistsInSupabase(eventId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('id')
    .eq('id', eventId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return !!data;
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

async function migrateEvent(blobEvent: BlobEvent): Promise<{ success: boolean; message: string }> {
  const exists = await checkEventExistsInSupabase(blobEvent.id);
  if (exists) {
    return { success: false, message: `Événement ${blobEvent.id} existe déjà` };
  }

  const eventRecord: any = {
    id: blobEvent.id,
    title: blobEvent.title,
    description: blobEvent.description,
    image: blobEvent.image || null,
    date: blobEvent.date,
    category: blobEvent.category,
    location: blobEvent.location || null,
    invited_members: blobEvent.invitedMembers || null,
    is_published: blobEvent.isPublished ?? false,
    created_by: blobEvent.createdBy,
    created_at: blobEvent.createdAt,
    updated_at: blobEvent.updatedAt || null,
  };

  const { error } = await supabaseAdmin
    .from('events')
    .insert(eventRecord);

  if (error) {
    return { success: false, message: `Erreur: ${error.message}` };
  }

  return { success: true, message: `Événement "${blobEvent.title}" migré` };
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

    console.log('🚀 Début migration des événements depuis Netlify Blobs vers Supabase');

    // 1. Charger les événements depuis Blobs
    const blobEvents = await loadEventsFromBlobs();
    
    if (blobEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun événement trouvé dans Blobs',
        eventsMigrated: 0,
        eventsSkipped: 0,
        registrationsMigrated: 0,
        registrationsSkipped: 0,
      });
    }

    // 2. Migrer les événements
    let eventsMigrated = 0;
    let eventsSkipped = 0;
    const eventResults: string[] = [];
    
    for (const blobEvent of blobEvents) {
      const result = await migrateEvent(blobEvent);
      if (result.success) {
        eventsMigrated++;
        eventResults.push(`✅ ${result.message}`);
      } else {
        eventsSkipped++;
        eventResults.push(`⏭️  ${result.message}`);
      }
    }

    // 3. Migrer les inscriptions
    let totalRegistrations = 0;
    let registrationsMigrated = 0;
    let registrationsSkipped = 0;

    for (const blobEvent of blobEvents) {
      const blobRegistrations = await loadRegistrationsFromBlobs(blobEvent.id);
      totalRegistrations += blobRegistrations.length;

      for (const blobReg of blobRegistrations) {
        const migrated = await migrateRegistration(blobReg);
        if (migrated) {
          registrationsMigrated++;
        } else {
          registrationsSkipped++;
        }
      }
    }

    // 4. Vérification finale
    const { data: supabaseEvents } = await supabaseAdmin
      .from('events')
      .select('id', { count: 'exact' });

    const { data: supabaseRegs } = await supabaseAdmin
      .from('event_registrations')
      .select('id', { count: 'exact' });

    return NextResponse.json({
      success: true,
      message: 'Migration terminée avec succès',
      summary: {
        eventsInBlobs: blobEvents.length,
        eventsMigrated,
        eventsSkipped,
        totalRegistrations,
        registrationsMigrated,
        registrationsSkipped,
        totalEventsInSupabase: supabaseEvents?.length || 0,
        totalRegistrationsInSupabase: supabaseRegs?.length || 0,
      },
      eventResults: eventResults.slice(0, 20), // Limiter à 20 pour la réponse
    });

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
