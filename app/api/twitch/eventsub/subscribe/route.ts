import { NextRequest, NextResponse } from 'next/server';
import { getTwitchOAuthToken } from '@/lib/twitchEventSub';
import { getTwitchUserIdByLogin, getTwitchUserIdsByLogins } from '@/lib/twitchHelpers';
import { loadMemberDataFromStorage, getAllMemberData, updateMemberData } from '@/lib/memberData';
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

    // Résoudre les IDs Twitch pour les membres qui n'ont pas encore d'ID
    const membersNeedingId = membersWithTwitch.filter(m => !m.twitchId);
    if (membersNeedingId.length > 0) {
      console.log(`[EventSub Subscribe] Résolution des IDs pour ${membersNeedingId.length} membres...`);
      const logins = membersNeedingId.map(m => m.twitchLogin!);
      const idsMap = await getTwitchUserIdsByLogins(logins);
      
      // Mettre à jour les membres avec les IDs résolus
      for (const member of membersNeedingId) {
        const twitchId = idsMap.get(member.twitchLogin!.toLowerCase());
        if (twitchId) {
          member.twitchId = twitchId;
          try {
            await updateMemberData(member.twitchLogin!, { twitchId }, 'system');
          } catch (error) {
            console.error(`[EventSub Subscribe] Erreur sauvegarde ${member.twitchLogin}:`, error);
          }
        }
      }
    }

    // Construire l'URL du webhook
    const baseUrl = getBaseUrl();
    const webhookUrl = `${baseUrl}/.netlify/functions/twitch-webhook`;

    // Créer des subscriptions pour tous les membres actifs
    const results: Array<{
      login: string;
      twitchId: string | null;
      status: 'created' | 'exists' | 'error';
      error?: string;
      subscriptionId?: string;
    }> = [];

    let successCount = 0;
    let errorCount = 0;
    let existsCount = 0;

    for (const member of membersWithTwitch) {
      let broadcasterId = member.twitchId;

      // Si l'ID n'est pas encore résolu, essayer de le résoudre maintenant
      if (!broadcasterId) {
        const resolvedId = await getTwitchUserIdByLogin(member.twitchLogin!);
        if (resolvedId) {
          broadcasterId = resolvedId;
          member.twitchId = broadcasterId;
          try {
            await updateMemberData(member.twitchLogin!, { twitchId: broadcasterId }, 'system');
          } catch (error) {
            console.error(`[EventSub Subscribe] Erreur sauvegarde ${member.twitchLogin}:`, error);
          }
        }
      }

      if (!broadcasterId) {
        results.push({
          login: member.twitchLogin!,
          twitchId: null,
          status: 'error',
          error: 'ID Twitch non résolu',
        });
        errorCount++;
        continue;
      }

      try {
        // Vérifier si la subscription existe déjà
        const subscriptionsResponse = await fetch(`${TWITCH_API_BASE}/eventsub/subscriptions`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Client-Id': CLIENT_ID,
          },
        });

        let subscriptionExists = false;
        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          subscriptionExists = (subscriptionsData.data || []).some((sub: any) => 
            sub.type === 'channel.raid' &&
            sub.status === 'enabled' &&
            sub.condition.to_broadcaster_user_id === broadcasterId
          );
        }

        if (subscriptionExists) {
          results.push({
            login: member.twitchLogin!,
            twitchId: broadcasterId,
            status: 'exists',
          });
          existsCount++;
          continue;
        }

        // Créer la subscription
        const createResponse = await fetch(`${TWITCH_API_BASE}/eventsub/subscriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Client-Id': CLIENT_ID,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'channel.raid',
            version: '1',
            condition: {
              to_broadcaster_user_id: broadcasterId,
            },
            transport: {
              method: 'webhook',
              callback: webhookUrl,
              secret: EVENTSUB_SECRET,
            },
          }),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(`Erreur création subscription: ${createResponse.status} ${errorText}`);
        }

        const createData = await createResponse.json();
        const subscriptionId = createData.data?.[0]?.id;

        results.push({
          login: member.twitchLogin!,
          twitchId: broadcasterId,
          status: 'created',
          subscriptionId,
        });
        successCount++;
      } catch (error) {
        console.error(`[EventSub Subscribe] Erreur pour ${member.twitchLogin}:`, error);
        results.push({
          login: member.twitchLogin!,
          twitchId: broadcasterId || null,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Subscriptions créées/vérifiées pour ${membersWithTwitch.length} membres`,
      summary: {
        total: membersWithTwitch.length,
        created: successCount,
        alreadyExists: existsCount,
        errors: errorCount,
      },
      results,
      webhookUrl,
    });
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
 * GET - Vérifie le statut des subscriptions EventSub
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
            sub.status === 'enabled' &&
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
    console.error('[EventSub Subscribe] Erreur lors de la vérification:', error);
    return NextResponse.json(
      { 
        error: `Erreur lors de la vérification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      },
      { status: 500 }
    );
  }
}

