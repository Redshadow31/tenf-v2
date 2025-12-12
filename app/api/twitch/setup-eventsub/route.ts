import { NextRequest, NextResponse } from 'next/server';
import { ensureChannelRaidSubscription } from '@/lib/twitchEventSub';

/**
 * POST - Force la synchronisation EventSub (crée la subscription si elle n'existe pas)
 */
export async function POST(request: NextRequest) {
  try {
    const BROADCASTER_ID = process.env.TWITCH_TARGET_BROADCASTER_ID;
    const EVENTSUB_SECRET = process.env.TWITCH_EVENTSUB_SECRET;
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://teamnewfamily.netlify.app';

    if (!BROADCASTER_ID) {
      return NextResponse.json(
        { error: 'TWITCH_TARGET_BROADCASTER_ID non configuré' },
        { status: 500 }
      );
    }

    if (!EVENTSUB_SECRET) {
      return NextResponse.json(
        { error: 'TWITCH_EVENTSUB_SECRET non configuré' },
        { status: 500 }
      );
    }

    // Construire l'URL du webhook
    const webhookUrl = `${BASE_URL}/api/twitch/eventsub`;

    console.log('[Twitch EventSub Setup] Vérification/création de la subscription...');
    console.log('[Twitch EventSub Setup] Broadcaster ID:', BROADCASTER_ID);
    console.log('[Twitch EventSub Setup] Webhook URL:', webhookUrl);

    const result = await ensureChannelRaidSubscription(
      BROADCASTER_ID,
      webhookUrl,
      EVENTSUB_SECRET
    );

    if (result.created) {
      return NextResponse.json({
        status: 'ok',
        subscription: 'created',
        message: 'Subscription EventSub créée avec succès',
        subscriptionId: result.subscription?.id,
      });
    } else {
      return NextResponse.json({
        status: 'ok',
        subscription: 'active',
        message: 'Subscription EventSub déjà active',
      });
    }
  } catch (error) {
    console.error('[Twitch EventSub Setup] Erreur:', error);
    return NextResponse.json(
      { 
        error: `Erreur lors de la configuration: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Vérifie le statut de la subscription EventSub
 */
export async function GET(request: NextRequest) {
  try {
    const { getTwitchOAuthToken, getEventSubSubscriptions } = await import('@/lib/twitchEventSub');
    const BROADCASTER_ID = process.env.TWITCH_TARGET_BROADCASTER_ID;

    if (!BROADCASTER_ID) {
      return NextResponse.json(
        { error: 'TWITCH_TARGET_BROADCASTER_ID non configuré' },
        { status: 500 }
      );
    }

    const accessToken = await getTwitchOAuthToken();
    const subscriptions = await getEventSubSubscriptions(accessToken);

    const channelRaidSub = subscriptions.find(sub => 
      sub.type === 'channel.raid' &&
      sub.condition.to_broadcaster_user_id === BROADCASTER_ID
    );

    return NextResponse.json({
      status: channelRaidSub ? 'active' : 'missing',
      subscription: channelRaidSub || null,
      broadcasterId: BROADCASTER_ID,
    });
  } catch (error) {
    console.error('[Twitch EventSub Setup] Erreur lors de la vérification:', error);
    return NextResponse.json(
      { 
        error: `Erreur lors de la vérification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      },
      { status: 500 }
    );
  }
}

