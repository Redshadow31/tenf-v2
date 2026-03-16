import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { supabaseAdmin } from '@/lib/db/supabase';
import { memberRepository } from '@/lib/repositories';

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
    const overrideFromLogin = String(body?.overrideFromLogin || '').trim().toLowerCase();
    const overrideToLogin = String(body?.overrideToLogin || '').trim().toLowerCase();
    const forceMemberMatch = Boolean(body?.forceMemberMatch);

    if (!ALLOWED_STATUS.has(processingStatus)) {
      return NextResponse.json({ error: 'processingStatus invalide' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      processing_status: processingStatus,
      error_reason: staffComment || null,
    };

    if (overrideFromLogin) {
      updatePayload.from_broadcaster_user_login = overrideFromLogin;
      updatePayload.from_broadcaster_user_name = overrideFromLogin;
    }
    if (overrideToLogin) {
      updatePayload.to_broadcaster_user_login = overrideToLogin;
      updatePayload.to_broadcaster_user_name = overrideToLogin;
    }

    if (forceMemberMatch) {
      if (overrideFromLogin) {
        const fromMember = await memberRepository.findByTwitchLogin(overrideFromLogin);
        if (!fromMember) {
          return NextResponse.json(
            { error: `Raider introuvable dans la base membres: ${overrideFromLogin}` },
            { status: 400 }
          );
        }
      }
      if (overrideToLogin) {
        const toMember = await memberRepository.findByTwitchLogin(overrideToLogin);
        if (!toMember) {
          return NextResponse.json(
            { error: `Cible introuvable dans la base membres: ${overrideToLogin}` },
            { status: 400 }
          );
        }
      }
      updatePayload.match_from_member = true;
      updatePayload.match_to_member = true;
      updatePayload.processing_status = 'matched';
    }

    const { data, error } = await supabaseAdmin
      .from('raid_test_events')
      .update(updatePayload)
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

export async function DELETE(
  _request: NextRequest,
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

    const { data, error } = await supabaseAdmin
      .from('raid_test_events')
      .delete()
      .eq('id', eventId)
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Impossible de supprimer l event' }, { status: 500 });
    }

    if (!data?.id) {
      return NextResponse.json({ error: 'Event introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: data.id });
  } catch (error) {
    console.error('[admin/engagement/raids-sub/review/[eventId]] DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

