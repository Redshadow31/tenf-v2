/**
 * Script de migration des événements depuis Netlify Blobs vers Supabase
 * 
 * Ce script :
 * 1. Lit les événements depuis Netlify Blobs (tenf-events/events.json)
 * 2. Les insère dans Supabase (table events)
 * 3. Lit les inscriptions depuis Netlify Blobs (tenf-events/registrations/{eventId}.json)
 * 4. Les insère dans Supabase (table event_registrations)
 * 
 * Usage:
 *   npm run migration:migrate-events
 *   ou
 *   tsx migration/migrate-events-blobs-to-supabase.ts
 */

import { getBlobStore } from '@/lib/memberData';
import { supabaseAdmin } from '@/lib/db/supabase';
import { eventRepository } from '@/lib/repositories';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
const envPath = resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const EVENTS_STORE_NAME = 'tenf-events';
const EVENTS_KEY = 'events.json';

interface BlobEvent {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string; // ISO date
  category: string;
  location?: string;
  invitedMembers?: string[];
  createdAt: string; // ISO timestamp
  createdBy: string; // Discord ID
  updatedAt?: string; // ISO timestamp
  isPublished: boolean;
}

interface BlobRegistration {
  id: string;
  eventId: string;
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  registeredAt: string; // ISO timestamp
  notes?: string;
}

async function loadEventsFromBlobs(): Promise<BlobEvent[]> {
  console.log('📦 Chargement des événements depuis Netlify Blobs...');
  try {
    const store = getBlobStore(EVENTS_STORE_NAME);
    const data = await store.get(EVENTS_KEY, { type: 'json' });
    const events = (data as BlobEvent[]) || [];
    console.log(`✅ ${events.length} événement(s) trouvé(s) dans Blobs`);
    return events;
  } catch (error) {
    console.error('❌ Erreur chargement événements depuis Blobs:', error);
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
    // Si le fichier n'existe pas, retourner un tableau vide
    if (error instanceof Error && error.message.includes('not found')) {
      return [];
    }
    console.error(`⚠️  Erreur chargement inscriptions pour ${eventId}:`, error);
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

async function migrateEvent(blobEvent: BlobEvent): Promise<boolean> {
  // Vérifier si l'événement existe déjà
  const exists = await checkEventExistsInSupabase(blobEvent.id);
  if (exists) {
    console.log(`  ⏭️  Événement ${blobEvent.id} existe déjà, ignoré`);
    return false;
  }

  // Convertir le format Blob vers le format Supabase
  const eventRecord: any = {
    id: blobEvent.id,
    title: blobEvent.title,
    description: blobEvent.description,
    image: blobEvent.image || null,
    date: blobEvent.date, // Déjà en ISO string
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
    console.error(`  ❌ Erreur insertion événement ${blobEvent.id}:`, error);
    return false;
  }

  console.log(`  ✅ Événement ${blobEvent.id} migré: "${blobEvent.title}"`);
  return true;
}

async function migrateRegistration(blobReg: BlobRegistration): Promise<boolean> {
  // Vérifier si l'inscription existe déjà
  const exists = await checkRegistrationExistsInSupabase(blobReg.eventId, blobReg.twitchLogin);
  if (exists) {
    return false; // Déjà migré, pas besoin de log
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
    console.error(`  ❌ Erreur insertion inscription ${blobReg.id}:`, error);
    return false;
  }

  return true;
}

async function main() {
  console.log('🚀 Migration des événements depuis Netlify Blobs vers Supabase\n');

  // 1. Charger les événements depuis Blobs
  const blobEvents = await loadEventsFromBlobs();
  
  if (blobEvents.length === 0) {
    console.log('⚠️  Aucun événement trouvé dans Blobs. Migration terminée.');
    return;
  }

  // 2. Migrer les événements
  console.log('\n📝 Migration des événements...');
  let eventsMigrated = 0;
  let eventsSkipped = 0;
  
  for (const blobEvent of blobEvents) {
    const migrated = await migrateEvent(blobEvent);
    if (migrated) {
      eventsMigrated++;
    } else {
      eventsSkipped++;
    }
  }

  console.log(`\n✅ Événements: ${eventsMigrated} migré(s), ${eventsSkipped} déjà présent(s)`);

  // 3. Migrer les inscriptions pour chaque événement
  console.log('\n📝 Migration des inscriptions...');
  let totalRegistrations = 0;
  let registrationsMigrated = 0;
  let registrationsSkipped = 0;

  for (const blobEvent of blobEvents) {
    const blobRegistrations = await loadRegistrationsFromBlobs(blobEvent.id);
    totalRegistrations += blobRegistrations.length;

    if (blobRegistrations.length > 0) {
      console.log(`  📋 Événement ${blobEvent.id}: ${blobRegistrations.length} inscription(s)`);
      
      for (const blobReg of blobRegistrations) {
        const migrated = await migrateRegistration(blobReg);
        if (migrated) {
          registrationsMigrated++;
        } else {
          registrationsSkipped++;
        }
      }
    }
  }

  console.log(`\n✅ Inscriptions: ${totalRegistrations} trouvée(s), ${registrationsMigrated} migrée(s), ${registrationsSkipped} déjà présente(s)`);

  // 4. Vérification finale
  console.log('\n🔍 Vérification finale...');
  const { data: supabaseEvents, error: eventsError } = await supabaseAdmin
    .from('events')
    .select('id', { count: 'exact' });
  
  if (eventsError) {
    console.error('❌ Erreur vérification événements:', eventsError);
  } else {
    console.log(`✅ Total événements dans Supabase: ${supabaseEvents?.length || 0}`);
  }

  const { data: supabaseRegs, error: regsError } = await supabaseAdmin
    .from('event_registrations')
    .select('id', { count: 'exact' });
  
  if (regsError) {
    console.error('❌ Erreur vérification inscriptions:', regsError);
  } else {
    console.log(`✅ Total inscriptions dans Supabase: ${supabaseRegs?.length || 0}`);
  }

  console.log('\n🎉 Migration terminée !');
  console.log(`\n📊 Résumé:`);
  console.log(`   - Événements migrés: ${eventsMigrated}`);
  console.log(`   - Événements déjà présents: ${eventsSkipped}`);
  console.log(`   - Inscriptions migrées: ${registrationsMigrated}`);
  console.log(`   - Inscriptions déjà présentes: ${registrationsSkipped}`);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
