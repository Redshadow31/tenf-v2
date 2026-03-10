/**
 * API Route pour vérifier la synchronisation entre source legacy et Supabase v2
 * 
 * GET /api/admin/migration/check-sync
 * Retourne les événements et inscriptions source legacy vs Supabase
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
  date: string;
  category: string;
  isPublished: boolean;
}

interface SupabaseEvent {
  id: string;
  title: string;
  starts_at?: string;
  legacy_event_id?: string | null;
}

interface SyncCheckResult {
  events: {
    inBlobs: number;
    inSupabase: number;
    missingInSupabase: BlobEvent[];
    extraInSupabase: string[];
  };
  registrations: {
    totalInBlobs: number;
    totalInSupabase: number;
    byEvent: Array<{
      eventId: string;
      eventTitle: string;
      inBlobs: number;
      inSupabase: number;
      missingInSupabase: number;
    }>;
  };
  presences: {
    totalInBlobs: number;
    totalInSupabase: number;
    byEvent: Array<{
      eventId: string;
      eventTitle: string;
      inBlobs: number;
      inSupabase: number;
      missingInSupabase: number;
    }>;
  };
}

async function loadEventsFromBlobs(): Promise<BlobEvent[]> {
  try {
    const store = getBlobStore(EVENTS_STORE_NAME);
    const data = await store.get(EVENTS_KEY, { type: 'json' });
    return (data as BlobEvent[]) || [];
  } catch (error) {
    console.error('Erreur chargement événements depuis Blobs:', error);
    return [];
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
      date: row.date ? String(row.date) : new Date().toISOString(),
      category: row.category || 'Non classé',
      isPublished: row.is_published ?? row.isPublished ?? false,
    }));
  } catch (error) {
    console.error('Erreur chargement événements legacy Supabase:', error);
    return [];
  }
}

async function loadRegistrationsFromBlobs(eventId: string): Promise<any[]> {
  try {
    const store = getBlobStore(EVENTS_STORE_NAME);
    const key = `registrations/${eventId}.json`;
    const data = await store.get(key, { type: 'json' });
    return (data as any[]) || [];
  } catch (error) {
    return [];
  }
}

async function loadRegistrationsFromLegacySupabase(eventId: string): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .limit(10000);
    if (error) {
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

async function loadAllRegistrationsFromLegacySupabase(): Promise<Map<string, any[]>> {
  const byEventId = new Map<string, any[]>();
  try {
    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('*')
      .limit(50000);
    if (error) {
      console.error('Erreur chargement global inscriptions legacy Supabase:', error);
      return byEventId;
    }
    for (const row of (data || [])) {
      const eventId = String((row as any).event_id ?? '');
      if (!eventId) continue;
      const arr = byEventId.get(eventId) || [];
      arr.push(row);
      byEventId.set(eventId, arr);
    }
  } catch (error) {
    console.error('Erreur chargement global inscriptions legacy Supabase:', error);
  }
  return byEventId;
}

async function loadPresencesFromBlobs(eventId: string): Promise<any[]> {
  try {
    const store = getBlobStore(EVENT_PRESENCE_STORE_NAME);
    const key = `${eventId}/presence.json`;
    const data = await store.get(key, { type: 'json' });
    if (data && (data as any).presences) {
      return (data as any).presences || [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function loadPresencesFromLegacySupabase(eventId: string): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('event_presences')
      .select('*')
      .eq('event_id', eventId)
      .limit(10000);
    if (error) {
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

async function loadAllPresencesFromLegacySupabase(): Promise<Map<string, any[]>> {
  const byEventId = new Map<string, any[]>();
  try {
    const { data, error } = await supabaseAdmin
      .from('event_presences')
      .select('*')
      .limit(50000);
    if (error) {
      console.error('Erreur chargement global présences legacy Supabase:', error);
      return byEventId;
    }
    for (const row of (data || [])) {
      const eventId = String((row as any).event_id ?? '');
      if (!eventId) continue;
      const arr = byEventId.get(eventId) || [];
      arr.push(row);
      byEventId.set(eventId, arr);
    }
  } catch (error) {
    console.error('Erreur chargement global présences legacy Supabase:', error);
  }
  return byEventId;
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

    console.log(`🔍 Vérification de synchronisation ${useLegacySupabase ? 'Supabase legacy' : 'Blobs'} ↔ Supabase v2`);

    // 1. Charger les événements depuis la source legacy choisie
    const blobEvents = useLegacySupabase
      ? await loadEventsFromLegacySupabase()
      : await loadEventsFromBlobs();
    const blobEventIds = new Set(blobEvents.map(e => e.id));

    // 2. Charger les événements depuis Supabase
    const { data: supabaseEvents, error: eventsError } = await supabaseAdmin
      .from('community_events')
      .select('id, title, starts_at, legacy_event_id');

    if (eventsError) {
      throw eventsError;
    }

    const supabaseEventRows = (supabaseEvents || []) as SupabaseEvent[];
    const supabaseEventIds = new Set(supabaseEventRows.map((e) => e.id));
    const supabaseEventMap = new Map(supabaseEventRows.map((e) => [e.id, e.title]));
    const supabaseByLegacyId = new Map(
      supabaseEventRows.filter((e) => e.legacy_event_id).map((e) => [e.legacy_event_id as string, e.id])
    );
    const supabaseByTitleDate = new Map(
      supabaseEventRows
        .filter((e) => e.starts_at)
        .map((e) => [`${e.title}__${e.starts_at}`, e.id])
    );

    // 3. Trouver les événements manquants dans Supabase
    const missingInSupabase = blobEvents.filter((e) => {
      const byLegacy = supabaseByLegacyId.get(e.id);
      const byTitleDate = supabaseByTitleDate.get(`${e.title}__${e.date}`);
      return !byLegacy && !byTitleDate;
    });
    
    // 4. Trouver les événements supplémentaires dans Supabase (pas dans Blobs)
    const blobMatchedSupabaseIds = new Set<string>();
    blobEvents.forEach((e) => {
      const matched = supabaseByLegacyId.get(e.id) || supabaseByTitleDate.get(`${e.title}__${e.date}`);
      if (matched) blobMatchedSupabaseIds.add(matched);
    });
    const extraInSupabase = Array.from(supabaseEventIds).filter(id => !blobMatchedSupabaseIds.has(id));

    const legacyRegsByEvent = useLegacySupabase
      ? await loadAllRegistrationsFromLegacySupabase()
      : null;
    const legacyPresencesByEvent = useLegacySupabase
      ? await loadAllPresencesFromLegacySupabase()
      : null;

    // 5. Vérifier les inscriptions pour chaque événement
    const registrationsByEvent: Array<{
      eventId: string;
      eventTitle: string;
      inBlobs: number;
      inSupabase: number;
      missingInSupabase: number;
    }> = [];

    for (const blobEvent of blobEvents) {
      const blobRegistrations = useLegacySupabase
        ? (legacyRegsByEvent?.get(blobEvent.id) || [])
        : await loadRegistrationsFromBlobs(blobEvent.id);
      
      const targetEventId = supabaseByLegacyId.get(blobEvent.id) || supabaseByTitleDate.get(`${blobEvent.title}__${blobEvent.date}`);
      if (!targetEventId) {
        registrationsByEvent.push({
          eventId: blobEvent.id,
          eventTitle: blobEvent.title,
          inBlobs: blobRegistrations.length,
          inSupabase: 0,
          missingInSupabase: blobRegistrations.length,
        });
        continue;
      }

      const { data: supabaseRegs, error: regsError } = await supabaseAdmin
        .from('event_registrations')
        .select('id')
        .eq('event_id', targetEventId);

      if (regsError) {
        console.error(`Erreur récupération inscriptions pour ${blobEvent.id}:`, regsError);
        continue;
      }

      const inBlobs = blobRegistrations.length;
      const inSupabase = supabaseRegs?.length || 0;
      const missingInSupabase = Math.max(0, inBlobs - inSupabase);

      registrationsByEvent.push({
        eventId: blobEvent.id,
        eventTitle: blobEvent.title,
        inBlobs,
        inSupabase,
        missingInSupabase,
      });
    }

    // 6. Compter les inscriptions totales
    const totalRegistrationsInBlobs = registrationsByEvent.reduce((sum, r) => sum + r.inBlobs, 0);
    
    const { data: allSupabaseRegs, error: allRegsError } = await supabaseAdmin
      .from('event_registrations')
      .select('id', { count: 'exact' });

    const totalRegistrationsInSupabase = allSupabaseRegs?.length || 0;

    // 7. Vérifier les présences pour chaque événement
    const presencesByEvent: Array<{
      eventId: string;
      eventTitle: string;
      inBlobs: number;
      inSupabase: number;
      missingInSupabase: number;
    }> = [];

    for (const blobEvent of blobEvents) {
      const blobPresences = useLegacySupabase
        ? (legacyPresencesByEvent?.get(blobEvent.id) || [])
        : await loadPresencesFromBlobs(blobEvent.id);
      
      const targetEventId = supabaseByLegacyId.get(blobEvent.id) || supabaseByTitleDate.get(`${blobEvent.title}__${blobEvent.date}`);
      if (!targetEventId) {
        presencesByEvent.push({
          eventId: blobEvent.id,
          eventTitle: blobEvent.title,
          inBlobs: blobPresences.length,
          inSupabase: 0,
          missingInSupabase: blobPresences.length,
        });
        continue;
      }

      const { data: supabasePresences, error: presencesError } = await supabaseAdmin
        .from('event_presences')
        .select('id')
        .eq('event_id', targetEventId);

      if (presencesError) {
        console.error(`Erreur récupération présences pour ${blobEvent.id}:`, presencesError);
        continue;
      }

      const inBlobs = blobPresences.length;
      const inSupabase = supabasePresences?.length || 0;
      const missingInSupabase = Math.max(0, inBlobs - inSupabase);

      presencesByEvent.push({
        eventId: blobEvent.id,
        eventTitle: blobEvent.title,
        inBlobs,
        inSupabase,
        missingInSupabase,
      });
    }

    // 8. Compter les présences totales
    const totalPresencesInBlobs = presencesByEvent.reduce((sum, p) => sum + p.inBlobs, 0);
    
    const { data: allSupabasePresences, error: allPresencesError } = await supabaseAdmin
      .from('event_presences')
      .select('id', { count: 'exact' });

    const totalPresencesInSupabase = allSupabasePresences?.length || 0;

    const result: SyncCheckResult = {
      events: {
        inBlobs: blobEvents.length,
        inSupabase: supabaseEvents?.length || 0,
        missingInSupabase: missingInSupabase.map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
          category: e.category,
          isPublished: e.isPublished,
        })),
        extraInSupabase: extraInSupabase.map(id => supabaseEventMap.get(id) || id),
      },
      registrations: {
        totalInBlobs: totalRegistrationsInBlobs,
        totalInSupabase: totalRegistrationsInSupabase,
        byEvent: registrationsByEvent,
      },
      presences: {
        totalInBlobs: totalPresencesInBlobs,
        totalInSupabase: totalPresencesInSupabase,
        byEvent: presencesByEvent,
      },
    };

    return NextResponse.json({
      success: true,
      source,
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Erreur vérification synchronisation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
