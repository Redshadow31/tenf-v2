import { NextRequest, NextResponse } from 'next/server';
import { ensureChannelRaidSubscription } from '@/lib/twitchEventSub';
import { loadMemberDataFromStorage, getAllMemberData, updateMemberData } from '@/lib/memberData';
import { getTwitchUserIdByLogin, getTwitchUserIdsByLogins } from '@/lib/twitchHelpers';

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

    // Résoudre les IDs Twitch pour les membres qui n'ont pas encore d'ID
    const membersNeedingId = membersWithTwitch.filter(m => !m.twitchId);
    const resolvedIds = new Map<string, string>();

    if (membersNeedingId.length > 0) {
      console.log(`[Twitch EventSub Setup] Résolution des IDs pour ${membersNeedingId.length} membres...`);
      const logins = membersNeedingId.map(m => m.twitchLogin!);
      const idsMap = await getTwitchUserIdsByLogins(logins);
      
      // Mettre à jour les membres avec les IDs résolus
      let updatedCount = 0;
      for (const member of membersNeedingId) {
        const twitchId = idsMap.get(member.twitchLogin!.toLowerCase());
        if (twitchId) {
          member.twitchId = twitchId;
          resolvedIds.set(member.twitchLogin!.toLowerCase(), twitchId);
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        console.log(`[Twitch EventSub Setup] ✅ ${updatedCount} IDs résolus et mis en cache`);
        // Sauvegarder les membres mis à jour
        for (const member of membersNeedingId) {
          const twitchId = idsMap.get(member.twitchLogin!.toLowerCase());
          if (twitchId) {
            try {
              await updateMemberData(member.twitchLogin!, { twitchId }, 'system');
            } catch (error) {
              console.error(`[Twitch EventSub Setup] Erreur sauvegarde ${member.twitchLogin}:`, error);
            }
          }
        }
      }
    }

    // Construire l'URL du webhook
    const webhookUrl = `${BASE_URL}/api/twitch/eventsub`;

    // Créer des subscriptions pour tous les membres actifs
    const results: Array<{ login: string; id: string; status: string; error?: string }> = [];
    let successCount = 0;
    let errorCount = 0;

    for (const member of membersWithTwitch) {
      let broadcasterId: string | undefined = member.twitchId;

      // Si l'ID n'est pas encore résolu, essayer de le résoudre maintenant
      if (!broadcasterId) {
        console.log(`[Twitch EventSub Setup] Résolution de l'ID pour ${member.twitchLogin}...`);
        const resolvedId = await getTwitchUserIdByLogin(member.twitchLogin!);
        
        if (resolvedId) {
          broadcasterId = resolvedId;
          member.twitchId = broadcasterId;
          resolvedIds.set(member.twitchLogin!.toLowerCase(), broadcasterId);
          // Sauvegarder l'ID résolu
          try {
            await updateMemberData(member.twitchLogin!, { twitchId: broadcasterId }, 'system');
          } catch (error) {
            console.error(`[Twitch EventSub Setup] Erreur sauvegarde ${member.twitchLogin}:`, error);
          }
        }
      }

      if (!broadcasterId) {
        console.warn(`[Twitch EventSub Setup] ⚠️ Impossible de résoudre l'ID pour ${member.twitchLogin}`);
        results.push({
          login: member.twitchLogin!,
          id: '',
          status: 'skipped',
          error: 'ID Twitch non résolu',
        });
        errorCount++;
        continue;
      }

      try {
        const result = await ensureChannelRaidSubscription(
          broadcasterId,
          webhookUrl,
          EVENTSUB_SECRET
        );

        results.push({
          login: member.twitchLogin!,
          id: broadcasterId,
          status: result.created ? 'created' : 'active',
        });

        if (result.created) {
          successCount++;
        }
      } catch (error) {
        console.error(`[Twitch EventSub Setup] Erreur pour ${member.twitchLogin}:`, error);
        results.push({
          login: member.twitchLogin!,
          id: broadcasterId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
        errorCount++;
      }
    }

    // Les IDs résolus ont déjà été sauvegardés individuellement

    return NextResponse.json({
      status: 'ok',
      message: `Subscriptions vérifiées/créées pour ${membersWithTwitch.length} membres`,
      results,
      summary: {
        total: membersWithTwitch.length,
        success: successCount,
        alreadyActive: membersWithTwitch.length - successCount - errorCount,
        errors: errorCount,
        idsResolved: resolvedIds.size,
      },
    });
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
 * GET - Vérifie le statut des subscriptions EventSub pour tous les membres actifs
 */
export async function GET(request: NextRequest) {
  try {
    const { getTwitchOAuthToken, getEventSubSubscriptions } = await import('@/lib/twitchEventSub');
    const { loadMemberDataFromStorage, getAllMemberData } = await import('@/lib/memberData');

    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const membersWithTwitch = allMembers.filter(
      m => m.isActive && m.twitchLogin && m.twitchLogin.trim() !== ''
    );

    if (membersWithTwitch.length === 0) {
      return NextResponse.json({
        status: 'no_members',
        message: 'Aucun membre actif avec un login Twitch',
        subscriptions: [],
      });
    }

    const accessToken = await getTwitchOAuthToken();
    const subscriptions = await getEventSubSubscriptions(accessToken);

    const results = membersWithTwitch.map(member => {
      const broadcasterId = member.twitchId;
      const channelRaidSub = broadcasterId
        ? subscriptions.find(sub => 
            sub.type === 'channel.raid' &&
            sub.condition.to_broadcaster_user_id === broadcasterId
          )
        : null;

      return {
        login: member.twitchLogin,
        twitchId: broadcasterId || null,
        status: channelRaidSub ? 'active' : (broadcasterId ? 'missing' : 'id_not_resolved'),
        subscription: channelRaidSub || null,
      };
    });

    return NextResponse.json({
      status: 'ok',
      totalMembers: membersWithTwitch.length,
      activeSubscriptions: results.filter(r => r.status === 'active').length,
      subscriptions: results,
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

