import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveRaidTestEvent } from '@/lib/raidEventsubTest';

function getEventsubSecret(): string | null {
  return process.env.TWITCH_EVENTSUB_TEST_SECRET || process.env.TWITCH_EVENTSUB_SECRET || null;
}

export async function POST(request: NextRequest) {
  try {
    const enabled = String(process.env.RAID_EVENTSUB_TEST_ENABLED || '').toLowerCase() === 'true';
    if (!enabled) {
      return NextResponse.json({ received: false, reason: 'test_disabled' }, { status: 200 });
    }

    const secret = getEventsubSecret();
    if (!secret) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 });
    }

    const messageId = request.headers.get('Twitch-Eventsub-Message-Id');
    const messageTimestamp = request.headers.get('Twitch-Eventsub-Message-Timestamp');
    const messageSignature = request.headers.get('Twitch-Eventsub-Message-Signature');

    if (!messageId || !messageTimestamp || !messageSignature) {
      return NextResponse.json({ error: 'Headers EventSub manquants' }, { status: 403 });
    }

    const body = await request.text();
    const expected = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(messageId + messageTimestamp + body)
      .digest('hex')}`;

    if (expected !== messageSignature) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 403 });
    }

    const payload = JSON.parse(body);
    if (payload.subscription?.status === 'webhook_callback_verification_pending') {
      return new NextResponse(payload.challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    if (payload.subscription?.type !== 'channel.raid' || !payload.event) {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    const result = await saveRaidTestEvent({
      event: {
        from_broadcaster_user_id: payload.event.from_broadcaster_user_id,
        from_broadcaster_user_login: payload.event.from_broadcaster_user_login,
        from_broadcaster_user_name: payload.event.from_broadcaster_user_name,
        to_broadcaster_user_id: payload.event.to_broadcaster_user_id,
        to_broadcaster_user_login: payload.event.to_broadcaster_user_login,
        to_broadcaster_user_name: payload.event.to_broadcaster_user_name,
        viewers: payload.event.viewers || 0,
      },
      eventsubMessageId: messageId,
      eventsubTimestamp: messageTimestamp,
      rawPayload: payload,
    });

    return NextResponse.json(
      {
        received: true,
        stored: result.stored,
        duplicate: result.duplicate,
        runId: result.runId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[twitch/eventsub/test] POST error:', error);
    // Repondre 200 pour eviter les retries aggressifs Twitch.
    return NextResponse.json({ received: false, error: 'Erreur interne' }, { status: 200 });
  }
}

