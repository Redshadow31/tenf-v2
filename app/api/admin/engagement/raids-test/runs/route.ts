import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import {
  getActiveRaidTestRun,
  startRaidTestRun,
  stopRaidTestRun,
} from '@/lib/raidEventsubTest';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const activeRun = await getActiveRaidTestRun();
    const { data, error } = await supabaseAdmin
      .from('raid_test_runs')
      .select('id,label,status,started_at,ended_at,created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: 'Impossible de lire les runs test' }, { status: 500 });
    }

    return NextResponse.json({
      activeRun,
      runs: data || [],
      testEnabled: String(process.env.RAID_EVENTSUB_TEST_ENABLED || '').toLowerCase() === 'true',
    });
  } catch (error) {
    console.error('[admin/engagement/raids-test/runs] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || 'start').toLowerCase();

    if (action === 'start') {
      const label = String(body?.label || '').trim() || `Run test ${new Date().toISOString()}`;
      const run = await startRaidTestRun(label, admin.discordId);
      return NextResponse.json({ success: true, action: 'start', run });
    }

    if (action === 'stop') {
      const activeRun = await getActiveRaidTestRun();
      if (!activeRun) {
        return NextResponse.json({ error: 'Aucun run actif a stopper' }, { status: 400 });
      }
      const status = body?.status === 'cancelled' ? 'cancelled' : 'completed';
      await stopRaidTestRun(activeRun.id, status);
      return NextResponse.json({ success: true, action: 'stop', runId: activeRun.id, status });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    console.error('[admin/engagement/raids-test/runs] POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

