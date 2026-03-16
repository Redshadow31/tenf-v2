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
    const search = String(searchParams.get('search') || '').trim().toLowerCase();
    const runId = searchParams.get('runId') || (await getActiveRaidTestRun())?.id || null;
    const limitRaw = Number.parseInt(searchParams.get('limit') || '300', 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(500, Math.max(10, limitRaw)) : 300;

    if (!runId) {
      return NextResponse.json({ backendReady: true, runId: null, events: [] });
    }

    let query = supabaseAdmin
      .from('raid_test_events')
      .select(
        'id,run_id,from_broadcaster_user_login,from_broadcaster_user_name,to_broadcaster_user_login,to_broadcaster_user_name,viewers,event_at,processing_status,error_reason,match_from_member,match_to_member,created_at'
      )
      .eq('run_id', runId)
      .order('event_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('processing_status', status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Impossible de charger les events a valider' }, { status: 500 });
    }

    let events = data || [];
    if (search) {
      events = events.filter((row: any) => {
        const from = String(row.from_broadcaster_user_login || '').toLowerCase();
        const to = String(row.to_broadcaster_user_login || '').toLowerCase();
        const reason = String(row.error_reason || '').toLowerCase();
        return from.includes(search) || to.includes(search) || reason.includes(search);
      });
    }

    return NextResponse.json({ backendReady: true, runId, events });
  } catch (error) {
    console.error('[admin/engagement/raids-sub/review] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

