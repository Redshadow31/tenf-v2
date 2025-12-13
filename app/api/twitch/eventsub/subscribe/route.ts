import { NextRequest, NextResponse } from 'next/server';
import { ensureGlobalChannelRaidSubscription, getTwitchOAuthToken } from '@/lib/twitchEventSub';
import { resolveAndCacheTwitchIds } from '@/lib/twitchIdResolver';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';
import { getBaseUrl } from '@/lib/config';

const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

/**
 * POST - Crée programmatiquement des subscriptions EventSub pour tous les membres actifs
 * Résout automatiquement les IDs Twitch depuis les logins
 */
export async function POST(request: NextRequest) {
  try {
    const EVENTSUB_SECRET = process.env.TWITCH_EVENTSUB_SECRET;
    const CLIENT_ID = process.env.TWITCH_APP_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
    
    if (!EVENTSUB_SECRET) {
      return NextResponse.json(
        { 
          error: 'TWITCH_EVENTSUB_SECRET non configuré',
          message: 'Veuillez configurer TWITCH_EVENTSUB_SECRET dans les variables d\'environnement Netlify',
        },
        { status: 500 }
      );
    }

    if (!CLIENT_ID) {
      return NextResponse.json(
        { 
          error: 'TWITCH_APP_CLIENT_ID ou TWITCH_CLIENT_ID non configuré',
          message: 'Veuillez configurer TWITCH_APP_CLIENT_ID ou TWITCH_CLIENT_ID dans les variables d\'environnement Netlify',
        },
        { status: 500 }
      );
    }

    // Obtenir un token OAuth
    let accessToken: string;
    try {
      accessToken = await getTwitchOAuthToken();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Impossible d\'obtenir un token OAuth Twitch',
          message: error instanceof Error ? error.message : 'Erreur inconnue',
          details: 'Vérifiez que TWITCH_CLIENT_ID et TWITCH_CLIENT_SECRET sont correctement configurés',
        },
        { status: 500 }
      );
    }

    // Charger les membres
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const membersWithTwitch = allMembers.filter(
      m => m.isActive && m.twitchLogin && m.twitchLogin.trim() !== ''
    );

    if (membersWithTwitch.length === 0) {
      return NextResponse.json(
        { 
          error: 'Aucun membre actif avec un login Twitch',
          message: 'Aucun membre actif trouvé avec un login Twitch. Ajoutez des membres actifs avec leur login Twitch.',
        },
        { status: 400 }
      );
    }

    // Résoudre et cacher les IDs Twitch pour les membres qui n'ont pas encore d'ID
    const membersNeedingId = membersWithTwitch.filter(m => !m.twitchId);
    let resolvedIds = new Map<string, string>();
    
    if (membersNeedingId.length > 0) {
      console.log(`[EventSub Subscribe] Résolution et cache des IDs pour ${membersNeedingId.length} membres via Helix API...`);
      const logins = membersNeedingId.map(m => m.twitchLogin!);
      resolvedIds = await resolveAndCacheTwitchIds(logins, false);
      
      // Recharger les données pour avoir les IDs mis à jour
      await loadMemberDataFromStorage();
      const updatedMembers = getAllMemberData();
      membersWithTwitch.forEach(m => {
        const updated = updatedMembers.find(um => um.twitchLogin === m.twitchLogin);
        if (updated?.twitchId) {
          m.twitchId = updated.twitchId;
        }
      });
    }

    // Construire l'URL du webhook
    const baseUrl = getBaseUrl();
    const webhookUrl = `${baseUrl}/api/twitch/eventsub`;

    // Sélectionner le premier membre actif comme "monitor" pour la souscription globale
    const monitorMember = membersWithTwitch.find(m => m.twitchId) || membersWithTwitch[0];
    
    if (!monitorMember) {
      return NextResponse.json(
        { error: 'Aucun membre actif avec Twitch trouvé pour monitor' },
        { status: 400 }
      );
    }

    // S'assurer que le membre monitor a un ID Twitch résolu
    let monitorBroadcasterId = monitorMember.twitchId;
    if (!monitorBroadcasterId) {
      console.log(`[EventSub Subscribe] Résolution de l'ID pour le monitor ${monitorMember.twitchLogin}...`);
      const { resolveAndCacheTwitchId } = await import('@/lib/twitchIdResolver');
      const resolvedId = await resolveAndCacheTwitchId(monitorMember.twitchLogin!);
      if (!resolvedId) {
        return NextResponse.json(
          { error: `Impossible de résoudre l'ID Twitch pour le monitor ${monitorMember.twitchLogin}` },
          { status: 500 }
        );
      }
      monitorBroadcasterId = resolvedId;
    }

    // Créer UNE SEULE souscription globale
    try {
      const result = await ensureGlobalChannelRaidSubscription(
        monitorBroadcasterId,
        webhookUrl,
        EVENTSUB_SECRET
      );

      return NextResponse.json({
        success: true,
        message: result.created 
          ? 'Souscription globale EventSub créée avec succès' 
          : 'Souscription globale EventSub déjà active',
        subscription: {
          id: result.subscription?.id,
          type: 'global',
          monitor: {
            login: monitorMember.twitchLogin,
            twitchId: monitorBroadcasterId,
          },
          created: result.created,
        },
        webhookUrl,
        summary: {
          totalMembers: membersWithTwitch.length,
          idsResolved: membersNeedingId.length > 0 ? resolvedIds.size : 0,
        },
      });
    } catch (error) {
      console.error('[EventSub Subscribe] Erreur lors de la création de la souscription globale:', error);
      return NextResponse.json(
        { 
          error: `Erreur lors de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          message: 'Vérifiez les logs pour plus de détails',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[EventSub Subscribe] Erreur:', error);
    return NextResponse.json(
      { 
        error: `Erreur lors de la création des subscriptions: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        message: 'Vérifiez les logs pour plus de détails',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Vérifie le statut de la souscription globale EventSub
 */
export async function GET(request: NextRequest) {
  try {
    const { getTwitchOAuthToken, getEventSubSubscriptions } = await import('@/lib/twitchEventSub');
    const { loadMemberDataFromStorage, getAllMemberData } = await import('@/lib/memberData');
    const { getBaseUrl } = await import('@/lib/config');
    const baseUrl = getBaseUrl();
    const webhookUrl = `${baseUrl}/api/twitch/eventsub`;

    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const membersWithTwitch = allMembers.filter(
      m => m.isActive && m.twitchLogin && m.twitchLogin.trim() !== ''
    );

    if (membersWithTwitch.length === 0) {
      return NextResponse.json({
        status: 'no_members',
        message: 'Aucun membre actif avec un login Twitch',
        subscription: null,
      });
    }

    const accessToken = await getTwitchOAuthToken();
    const subscriptions = await getEventSubSubscriptions(accessToken);

    // Statistiques détaillées des subscriptions
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'enabled');
    const activeCount = activeSubscriptions.length;
    
    const channelRaidSubscriptions = subscriptions.filter(sub => sub.type === 'channel.raid');
    const channelRaidCount = channelRaidSubscriptions.length;
    const channelRaidActive = channelRaidSubscriptions.filter(sub => sub.status === 'enabled');
    const channelRaidActiveCount = channelRaidActive.length;
    
    // Vérifier les conditions from_broadcaster_user_id et to_broadcaster_user_id
    const subscriptionsWithFrom = channelRaidSubscriptions.filter(sub => 
      sub.condition?.from_broadcaster_user_id
    );
    const subscriptionsWithTo = channelRaidSubscriptions.filter(sub => 
      sub.condition?.to_broadcaster_user_id
    );
    
    // Vérifier si on a atteint la limite de 100 subscriptions (BLOQUANT)
    const isBlocking = totalSubscriptions >= 100;

    // Chercher la souscription globale channel.raid
    const globalSubscription = subscriptions.find(sub => 
      sub.type === 'channel.raid' &&
      sub.status === 'enabled' &&
      sub.transport?.callback === webhookUrl
    );

    return NextResponse.json({
      status: 'ok',
      subscription: globalSubscription ? {
        id: globalSubscription.id,
        status: globalSubscription.status,
        type: 'global',
        monitorBroadcasterId: globalSubscription.condition.to_broadcaster_user_id,
        createdAt: globalSubscription.created_at,
      } : null,
      totalMembers: membersWithTwitch.length,
      isActive: !!globalSubscription,
      message: globalSubscription 
        ? 'Souscription globale EventSub active' 
        : 'Aucune souscription globale EventSub trouvée',
      // Statistiques détaillées
      statistics: {
        totalSubscriptions,
        activeSubscriptions: activeCount,
        channelRaidCount,
        channelRaidActive: channelRaidActiveCount,
        isBlocking,
        hasFromBroadcaster: subscriptionsWithFrom.length > 0,
        hasToBroadcaster: subscriptionsWithTo.length > 0,
        fromBroadcasterCount: subscriptionsWithFrom.length,
        toBroadcasterCount: subscriptionsWithTo.length,
      },
      // Détails des subscriptions channel.raid
      channelRaidDetails: channelRaidSubscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        from_broadcaster_user_id: sub.condition?.from_broadcaster_user_id || null,
        to_broadcaster_user_id: sub.condition?.to_broadcaster_user_id || null,
        callback: sub.transport?.callback,
        createdAt: sub.created_at,
      })),
    });
  } catch (error) {
    console.error('[EventSub Subscribe] Erreur lors de la vérification:', error);
    return NextResponse.json(
      { 
        error: `Erreur lors de la vérification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      },
      { status: 500 }
    );
  }
}

