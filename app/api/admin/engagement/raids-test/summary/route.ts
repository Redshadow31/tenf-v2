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

    const activeRun = await getActiveRaidTestRun();
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

    if (eventsRes.error && !isMissingRelationError(eventsRes.error)) {
      return NextResponse.json({ error: 'Impossible de lire les evenements test' }, { status: 500 });
    }
    if (subsRes.error && !isMissingRelationError(subsRes.error)) {
      return NextResponse.json({ error: 'Impossible de lire les subscriptions test' }, { status: 500 });
    }
    if (declarationsRes.error && !isMissingRelationError(declarationsRes.error)) {
      return NextResponse.json({ error: 'Impossible de lire les declarations' }, { status: 500 });
    }
    if (declarationsSnapshotRes.error && !isMissingRelationError(declarationsSnapshotRes.error)) {
      return NextResponse.json({ error: 'Impossible de lire le snapshot declarations test' }, { status: 500 });
    }

    const events = eventsRes.data || [];
    const subs = subsRes.data || [];
    const declarations = declarationsRes.data || [];
    const declarationsSnapshot = declarationsSnapshotRes.data || [];

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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

