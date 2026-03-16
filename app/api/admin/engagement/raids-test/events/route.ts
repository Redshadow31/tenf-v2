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
      return NextResponse.json({ runId: null, events: [], total: 0, activeRun: null });
    }

    let query = supabaseAdmin
      .from('raid_test_events')
      .select(
        'id,run_id,eventsub_message_id,dedupe_key,from_broadcaster_user_id,from_broadcaster_user_login,from_broadcaster_user_name,to_broadcaster_user_id,to_broadcaster_user_login,to_broadcaster_user_name,viewers,event_at,received_at,match_from_member,match_to_member,processing_status,error_reason,created_at',
        { count: 'exact' }
      )
      .eq('run_id', runId)
      .order('event_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('processing_status', status);
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: 'Impossible de lire les evenements test' }, { status: 500 });
    }

    return NextResponse.json({
      runId,
      activeRun,
      statusFilter: status,
      total: count || 0,
      events: data || [],
    });
  } catch (error) {
    console.error('[admin/engagement/raids-test/events] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

