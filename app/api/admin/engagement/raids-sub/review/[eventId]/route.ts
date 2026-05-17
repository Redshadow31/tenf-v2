import { NextRequest, NextResponse } from 'next/server';
import { requireSectionAccessAny } from '@/lib/requireAdmin';
import { RAIDS_EVENTSUB_SECTION_HREFS } from '@/lib/admin/raidsFiabiliteRbac';
import { logAction } from '@/lib/admin/logger';
import { supabaseAdmin } from '@/lib/db/supabase';
import { memberRepository } from '@/lib/repositories';

const ALLOWED_STATUS = new Set(['received', 'matched', 'ignored', 'duplicate', 'error']);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const admin = await requireSectionAccessAny(RAIDS_EVENTSUB_SECTION_HREFS);
    if (!admin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
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
    const invalidateAfterValidation = Boolean(body?.invalidateAfterValidation);

    if (!ALLOWED_STATUS.has(processingStatus)) {
      return NextResponse.json({ error: 'processingStatus invalide' }, { status: 400 });
    }

    const existingRes = await supabaseAdmin
      .from('raid_test_events')
      .select('id,processing_status')
      .eq('id', eventId)
      .single();

    if (existingRes.error || !existingRes.data?.id) {
      return NextResponse.json({ error: 'Event introuvable' }, { status: 404 });
    }

    const currentStatus = String(existingRes.data.processing_status || '').toLowerCase();

    if (invalidateAfterValidation) {
      if (currentStatus !== 'matched') {
        return NextResponse.json(
          { error: "Seuls les raids deja valides (matched) peuvent etre invalides apres coup." },
          { status: 400 }
        );
      }
      if (staffComment.length < 3) {
        return NextResponse.json(
          { error: "Une raison est obligatoire pour invalider un raid apres validation." },
          { status: 400 }
        );
      }
    }

    const effectiveStatus = invalidateAfterValidation ? 'ignored' : processingStatus;
    const updatePayload: Record<string, unknown> = {
      processing_status: effectiveStatus,
      error_reason: invalidateAfterValidation ? `Raid refuse apres validation: ${staffComment}` : staffComment || null,
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
        'id,run_id,from_broadcaster_user_login,from_broadcaster_user_name,to_broadcaster_user_login,to_broadcaster_user_name,viewers,raider_stream_started_at,raider_live_duration_minutes,event_at,processing_status,error_reason,match_from_member,match_to_member,created_at'
      )
      .single();

    if (error) {
      return NextResponse.json({ error: 'Impossible de mettre a jour l event' }, { status: 500 });
    }

    void logAction({
      action: 'raids.eventsub.review.patch',
      resourceType: 'raid_test_event',
      resourceId: eventId,
      newValue: {
        processing_status: data?.processing_status,
        error_reason: data?.error_reason,
      },
      metadata: {
        sourcePage: '/admin/communaute/engagement/raids-eventsub',
        invalidateAfterValidation,
        forceMemberMatch,
        previousStatus: currentStatus,
        overrideFromLogin: overrideFromLogin || undefined,
        overrideToLogin: overrideToLogin || undefined,
        staffCommentPreview: staffComment ? `${staffComment.slice(0, 120)}${staffComment.length > 120 ? '…' : ''}` : undefined,
      },
    });

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
    const admin = await requireSectionAccessAny(RAIDS_EVENTSUB_SECTION_HREFS);
    if (!admin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
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

    void logAction({
      action: 'raids.eventsub.review.delete',
      resourceType: 'raid_test_event',
      resourceId: eventId,
      metadata: {
        sourcePage: '/admin/communaute/engagement/raids-eventsub',
        deletedId: data.id,
      },
    });

    return NextResponse.json({ success: true, deletedId: data.id });
  } catch (error) {
    console.error('[admin/engagement/raids-sub/review/[eventId]] DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

