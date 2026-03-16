import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getActiveRaidTestRun, getRaidTestWatchlistSnapshot } from '@/lib/raidEventsubTest';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const activeRun = await getActiveRaidTestRun();
    const testEnabled = String(process.env.RAID_EVENTSUB_TEST_ENABLED || '').toLowerCase() === 'true';

    if (!activeRun) {
      return NextResponse.json({
        testEnabled,
        activeRun: null,
        stats: {
          eventsTotal: 0,
          subscriptionsTotal: 0,
          activeSubscriptions: 0,
          failedSubscriptions: 0,
          revokedSubscriptions: 0,
        },
        eventStatus: {
          received: 0,
          matched: 0,
          ignored: 0,
          duplicate: 0,
          error: 0,
        },
        watchlist: {
          eligibleMembers: 0,
          liveNow: 0,
          targetedByPolicy: 0,
          localSubscriptionsActiveOrPending: 0,
          remoteSubscriptionsEnabled: 0,
        },
      });
    }

    const [eventsRes, subsRes, watchlist] = await Promise.all([
      supabaseAdmin
        .from('raid_test_events')
        .select('id,processing_status', { count: 'exact' })
        .eq('run_id', activeRun.id)
        .limit(5000),
      supabaseAdmin
        .from('raid_test_subscriptions')
        .select('id,status', { count: 'exact' })
        .eq('run_id', activeRun.id)
        .limit(5000),
      getRaidTestWatchlistSnapshot(),
    ]);

    if (eventsRes.error) {
      return NextResponse.json({ error: 'Impossible de charger les events EventSub' }, { status: 500 });
    }
    if (subsRes.error) {
      return NextResponse.json({ error: 'Impossible de charger les subscriptions EventSub' }, { status: 500 });
    }

    const events = eventsRes.data || [];
    const subs = subsRes.data || [];

    return NextResponse.json({
      testEnabled,
      activeRun,
      stats: {
        eventsTotal: eventsRes.count || events.length,
        subscriptionsTotal: subsRes.count || subs.length,
        activeSubscriptions: subs.filter((s: any) => s.status === 'active').length,
        failedSubscriptions: subs.filter((s: any) => s.status === 'failed').length,
        revokedSubscriptions: subs.filter((s: any) => s.status === 'revoked').length,
      },
      eventStatus: {
        received: events.filter((e: any) => e.processing_status === 'received').length,
        matched: events.filter((e: any) => e.processing_status === 'matched').length,
        ignored: events.filter((e: any) => e.processing_status === 'ignored').length,
        duplicate: events.filter((e: any) => e.processing_status === 'duplicate').length,
        error: events.filter((e: any) => e.processing_status === 'error').length,
      },
      watchlist: {
        eligibleMembers: watchlist.summary.eligibleMembers,
        liveNow: watchlist.summary.liveNow,
        targetedByPolicy: watchlist.summary.targetedByPolicy,
        localSubscriptionsActiveOrPending: watchlist.summary.localSubscriptionsActiveOrPending,
        remoteSubscriptionsEnabled: watchlist.summary.remoteSubscriptionsEnabled,
      },
    });
  } catch (error) {
    console.error('[admin/engagement/raids-sub/summary] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

