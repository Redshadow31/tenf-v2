import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getActiveRaidTestRun } from '@/lib/raidEventsubTest';
import { supabaseAdmin } from '@/lib/db/supabase';

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return error.code === '42P01' || message.includes('does not exist') || message.includes('could not find the table');
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    let activeRun: { id: string; label: string; status: string; started_at?: string | null } | null = null;
    const warnings: string[] = [];
    try {
      activeRun = await getActiveRaidTestRun();
    } catch (error) {
      warnings.push(
        `Impossible de lire le run actif: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
    const testEnabled = String(process.env.RAID_EVENTSUB_TEST_ENABLED || '').toLowerCase() === 'true';

    const [eventsRes, subsRes, declarationsRes, declarationsSnapshotRes] = await Promise.all([
      activeRun
        ? supabaseAdmin
            .from('raid_test_events')
            .select('id,processing_status,created_at', { count: 'exact' })
            .eq('run_id', activeRun.id)
            .order('created_at', { ascending: false })
            .limit(5000)
        : Promise.resolve({ data: [], error: null, count: 0 }),
      activeRun
        ? supabaseAdmin
            .from('raid_test_subscriptions')
            .select('id,status,created_at,updated_at', { count: 'exact' })
            .eq('run_id', activeRun.id)
            .order('updated_at', { ascending: false })
            .limit(2000)
        : Promise.resolve({ data: [], error: null, count: 0 }),
      supabaseAdmin
        .from('raid_declarations')
        .select('id,status,created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(2000),
      activeRun
        ? supabaseAdmin
            .from('raid_test_declarations')
            .select('id,declaration_status,imported_at', { count: 'exact' })
            .eq('run_id', activeRun.id)
            .order('imported_at', { ascending: false })
            .limit(5000)
        : Promise.resolve({ data: [], error: null, count: 0 }),
    ]);

    if (eventsRes.error) {
      warnings.push(
        isMissingRelationError(eventsRes.error)
          ? 'Table raid_test_events manquante (migration 0036 non appliquee).'
          : `Lecture raid_test_events impossible: ${eventsRes.error.message || 'erreur inconnue'}`
      );
    }
    if (subsRes.error) {
      warnings.push(
        isMissingRelationError(subsRes.error)
          ? 'Table raid_test_subscriptions manquante (migration 0036 non appliquee).'
          : `Lecture raid_test_subscriptions impossible: ${subsRes.error.message || 'erreur inconnue'}`
      );
    }
    if (declarationsRes.error) {
      warnings.push(
        isMissingRelationError(declarationsRes.error)
          ? 'Table raid_declarations manquante (migration 0034 non appliquee).'
          : `Lecture raid_declarations impossible: ${declarationsRes.error.message || 'erreur inconnue'}`
      );
    }
    if (declarationsSnapshotRes.error) {
      warnings.push(
        isMissingRelationError(declarationsSnapshotRes.error)
          ? 'Table raid_test_declarations manquante (migration 0036 non appliquee).'
          : `Lecture raid_test_declarations impossible: ${declarationsSnapshotRes.error.message || 'erreur inconnue'}`
      );
    }

    const events = eventsRes.error ? [] : eventsRes.data || [];
    const subs = subsRes.error ? [] : subsRes.data || [];
    const declarations = declarationsRes.error ? [] : declarationsRes.data || [];
    const declarationsSnapshot = declarationsSnapshotRes.error ? [] : declarationsSnapshotRes.data || [];

    const byStatus = {
      matched: events.filter((e: any) => e.processing_status === 'matched').length,
      ignored: events.filter((e: any) => e.processing_status === 'ignored').length,
      duplicate: events.filter((e: any) => e.processing_status === 'duplicate').length,
      error: events.filter((e: any) => e.processing_status === 'error').length,
      received: events.filter((e: any) => e.processing_status === 'received').length,
    };

    const activeSubs = subs.filter((s: any) => s.status === 'active').length;
    const failedSubs = subs.filter((s: any) => s.status === 'failed').length;
    const revokedSubs = subs.filter((s: any) => s.status === 'revoked').length;

    return NextResponse.json({
      backendReady: true,
      testEnabled,
      activeRun,
      warnings,
      stats: {
        eventsTotal: eventsRes.count || events.length,
        subscriptionsTotal: subsRes.count || subs.length,
        activeSubscriptions: activeSubs,
        failedSubscriptions: failedSubs,
        revokedSubscriptions: revokedSubs,
        declarationsTotal: declarationsRes.count || declarations.length,
        declarationsSnapshotTotal: declarationsSnapshotRes.count || declarationsSnapshot.length,
      },
      eventStatus: byStatus,
    });
  } catch (error) {
    console.error('[admin/engagement/raids-test/summary] GET error:', error);
    return NextResponse.json(
      {
        backendReady: false,
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 200 }
    );
  }
}

