import { NextResponse } from 'next/server';
import { getTwitchOAuthToken, getEventSubSubscriptions } from '@/lib/twitchEventSub';

/**
 * GET - Diagnostic des subscriptions EventSub
 * Retourne le nombre exact de subscriptions actives et leurs détails
 */
export async function GET() {
  try {
    const accessToken = await getTwitchOAuthToken();
    const subscriptions = await getEventSubSubscriptions(accessToken);

    // Compter les subscriptions actives
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'enabled');
    const totalSubscriptions = subscriptions.length;
    const activeCount = activeSubscriptions.length;

    // Compter les subscriptions channel.raid
    const channelRaidSubscriptions = subscriptions.filter(sub => sub.type === 'channel.raid');
    const channelRaidActive = channelRaidSubscriptions.filter(sub => sub.status === 'enabled');

    // Vérifier les conditions
    const withFromBroadcaster = channelRaidSubscriptions.filter(sub => 
      sub.condition?.from_broadcaster_user_id
    );
    const withToBroadcaster = channelRaidSubscriptions.filter(sub => 
      sub.condition?.to_broadcaster_user_id
    );

    // Vérifier si on a atteint la limite de 100 (BLOQUANT)
    const isBlocking = totalSubscriptions >= 100;

    return NextResponse.json({
      success: true,
      summary: {
        totalSubscriptions,
        activeSubscriptions: activeCount,
        channelRaidTotal: channelRaidSubscriptions.length,
        channelRaidActive: channelRaidActive.length,
        isBlocking,
      },
      details: {
        allSubscriptions: subscriptions.map(sub => ({
          id: sub.id,
          type: sub.type,
          status: sub.status,
          from_broadcaster_user_id: sub.condition?.from_broadcaster_user_id || null,
          to_broadcaster_user_id: sub.condition?.to_broadcaster_user_id || null,
          createdAt: sub.created_at,
        })),
        channelRaidDetails: channelRaidSubscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          from_broadcaster_user_id: sub.condition?.from_broadcaster_user_id || null,
          to_broadcaster_user_id: sub.condition?.to_broadcaster_user_id || null,
          callback: sub.transport?.callback,
          createdAt: sub.created_at,
        })),
      },
      analysis: {
        hasFromBroadcaster: withFromBroadcaster.length > 0,
        hasToBroadcaster: withToBroadcaster.length > 0,
        fromBroadcasterCount: withFromBroadcaster.length,
        toBroadcasterCount: withToBroadcaster.length,
      },
    });
  } catch (error) {
    console.error('[EventSub Diagnostic] Erreur:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Erreur lors de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      },
      { status: 500 }
    );
  }
}

