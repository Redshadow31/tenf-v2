import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { supabaseAdmin } from '@/lib/db/supabase';

const ALLOWED_STATUS = new Set(['received', 'matched', 'ignored', 'duplicate', 'error']);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { eventId } = await context.params;
    if (!eventId) {
      return NextResponse.json({ error: 'eventId manquant' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const processingStatus = String(body?.processingStatus || '').toLowerCase();
    const staffComment = String(body?.staffComment || '').trim();

    if (!ALLOWED_STATUS.has(processingStatus)) {
      return NextResponse.json({ error: 'processingStatus invalide' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('raid_test_events')
      .update({
        processing_status: processingStatus,
        error_reason: staffComment || null,
      })
      .eq('id', eventId)
      .select(
        'id,run_id,from_broadcaster_user_login,from_broadcaster_user_name,to_broadcaster_user_login,to_broadcaster_user_name,viewers,event_at,processing_status,error_reason,match_from_member,match_to_member,created_at'
      )
      .single();

    if (error) {
      return NextResponse.json({ error: 'Impossible de mettre a jour l event' }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: data });
  } catch (error) {
    console.error('[admin/engagement/raids-sub/review/[eventId]] PATCH error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

