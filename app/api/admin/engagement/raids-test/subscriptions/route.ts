import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getActiveRaidTestRun } from '@/lib/raidEventsubTest';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'all').toLowerCase();
    const requestedRunId = searchParams.get('runId');
    const limitRaw = Number.parseInt(searchParams.get('limit') || '200', 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(500, Math.max(10, limitRaw)) : 200;

    const activeRun = await getActiveRaidTestRun();
    const runId = requestedRunId || activeRun?.id;
    if (!runId) {
      return NextResponse.json({ runId: null, subscriptions: [], total: 0, activeRun: null });
    }

    let query = supabaseAdmin
      .from('raid_test_subscriptions')
      .select(
        'id,run_id,twitch_subscription_id,monitored_member_discord_id,monitored_twitch_id,monitored_twitch_login,condition_type,status,created_at,updated_at,activated_at,revoked_at,revoke_reason,last_seen_at,metadata',
        { count: 'exact' }
      )
      .eq('run_id', runId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: 'Impossible de lire les subscriptions test' }, { status: 500 });
    }

    return NextResponse.json({
      runId,
      activeRun,
      statusFilter: status,
      total: count || 0,
      subscriptions: data || [],
    });
  } catch (error) {
    console.error('[admin/engagement/raids-test/subscriptions] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

