/**
 * API Route pour vérifier la synchronisation entre Netlify Blobs et Supabase
 * 
 * GET /api/admin/migration/check-sync
 * Retourne les événements et inscriptions dans Blobs vs Supabase
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
  date: string;
  category: string;
  isPublished: boolean;
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

    console.log('🔍 Vérification de synchronisation Blobs ↔ Supabase');

    // 1. Charger les événements depuis Blobs
    const blobEvents = await loadEventsFromBlobs();
    const blobEventIds = new Set(blobEvents.map(e => e.id));

    // 2. Charger les événements depuis Supabase
    const { data: supabaseEvents, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, title');

    if (eventsError) {
      throw eventsError;
    }

    const supabaseEventIds = new Set((supabaseEvents || []).map((e: any) => e.id));
    const supabaseEventMap = new Map((supabaseEvents || []).map((e: any) => [e.id, e.title]));

    // 3. Trouver les événements manquants dans Supabase
    const missingInSupabase = blobEvents.filter(e => !supabaseEventIds.has(e.id));
    
    // 4. Trouver les événements supplémentaires dans Supabase (pas dans Blobs)
    const extraInSupabase = Array.from(supabaseEventIds).filter(id => !blobEventIds.has(id));

    // 5. Vérifier les inscriptions pour chaque événement
    const registrationsByEvent: Array<{
      eventId: string;
      eventTitle: string;
      inBlobs: number;
      inSupabase: number;
      missingInSupabase: number;
    }> = [];

    for (const blobEvent of blobEvents) {
      const blobRegistrations = await loadRegistrationsFromBlobs(blobEvent.id);
      
      const { data: supabaseRegs, error: regsError } = await supabaseAdmin
        .from('event_registrations')
        .select('id')
        .eq('event_id', blobEvent.id);

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
    };

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Erreur vérification synchronisation:', error);
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
