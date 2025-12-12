import { NextRequest, NextResponse } from 'next/server';
import { ensureGlobalChannelRaidSubscription } from '@/lib/twitchEventSub';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';
import { resolveAndCacheTwitchIds } from '@/lib/twitchIdResolver';

/**
 * POST - Force la synchronisation EventSub (crée la subscription si elle n'existe pas)
 * Résout automatiquement les IDs Twitch depuis les logins des membres
 */
export async function POST(request: NextRequest) {
  try {
    const EVENTSUB_SECRET = process.env.TWITCH_EVENTSUB_SECRET;
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://teamnewfamily.netlify.app';

    if (!EVENTSUB_SECRET) {
      return NextResponse.json(
        { error: 'TWITCH_EVENTSUB_SECRET non configuré' },
        { status: 500 }
      );
    }

    // Charger les membres
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();

    // Filtrer les membres actifs avec un twitchLogin
    const membersWithTwitch = allMembers.filter(
      m => m.isActive && m.twitchLogin && m.twitchLogin.trim() !== ''
    );

    if (membersWithTwitch.length === 0) {
      return NextResponse.json(
        { error: 'Aucun membre actif avec un login Twitch trouvé' },
        { status: 400 }
      );
    }

    console.log(`[Twitch EventSub Setup] ${membersWithTwitch.length} membres actifs avec Twitch`);

    // Résoudre et cacher les IDs Twitch pour les membres qui n'ont pas encore d'ID
    const membersNeedingId = membersWithTwitch.filter(m => !m.twitchId);
    let resolvedIds = new Map<string, string>();

    if (membersNeedingId.length > 0) {
      console.log(`[Twitch EventSub Setup] Résolution et cache des IDs pour ${membersNeedingId.length} membres via Helix API...`);
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
      
      console.log(`[Twitch EventSub Setup] ✅ ${resolvedIds.size} IDs résolus et mis en cache`);
    }

    // Construire l'URL du webhook
    const webhookUrl = `${BASE_URL}/api/twitch/eventsub`;

    // Sélectionner le premier membre actif comme "monitor" pour la souscription globale
    // Le handler filtrera tous les raids pour ne garder que ceux entre membres TENF
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
      console.log(`[Twitch EventSub Setup] Résolution de l'ID pour le monitor ${monitorMember.twitchLogin}...`);
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
        status: 'ok',
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
        summary: {
          totalMembers: membersWithTwitch.length,
          idsResolved: resolvedIds.size,
        },
      });
    } catch (error) {
      console.error('[Twitch EventSub Setup] Erreur lors de la création de la souscription globale:', error);
      return NextResponse.json(
        { 
          error: `Erreur lors de la configuration: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          details: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 }
      );
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
 * GET - Vérifie le statut de la souscription globale EventSub
 */
export async function GET(request: NextRequest) {
  try {
    const { getTwitchOAuthToken, getEventSubSubscriptions } = await import('@/lib/twitchEventSub');
    const { loadMemberDataFromStorage, getAllMemberData } = await import('@/lib/memberData');
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://teamnewfamily.netlify.app';
    const webhookUrl = `${BASE_URL}/api/twitch/eventsub`;

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

