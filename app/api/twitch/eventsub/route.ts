import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveTwitchRaid, TwitchRaidEvent } from '@/lib/raidsTwitch';

/**
 * POST - Handler pour les webhooks Twitch EventSub
 * Gère la vérification de signature, le challenge et les événements channel.raid
 */
export async function POST(request: NextRequest) {
  try {
    const EVENTSUB_SECRET = process.env.TWITCH_EVENTSUB_SECRET;
    
    if (!EVENTSUB_SECRET) {
      console.error('[Twitch EventSub] TWITCH_EVENTSUB_SECRET non configuré');
      return NextResponse.json(
        { error: 'Configuration manquante' },
        { status: 500 }
      );
    }

    // Lire les headers EventSub
    const messageId = request.headers.get('Twitch-Eventsub-Message-Id');
    const messageTimestamp = request.headers.get('Twitch-Eventsub-Message-Timestamp');
    const messageSignature = request.headers.get('Twitch-Eventsub-Message-Signature');

    if (!messageId || !messageTimestamp || !messageSignature) {
      console.error('[Twitch EventSub] Headers manquants');
      return NextResponse.json(
        { error: 'Headers EventSub manquants' },
        { status: 403 }
      );
    }

    // Lire le body
    const body = await request.text();
    
    // Vérifier la signature
    const hmacMessage = messageId + messageTimestamp + body;
    const hmac = crypto
      .createHmac('sha256', EVENTSUB_SECRET)
      .update(hmacMessage)
      .digest('hex');
    
    const expectedSignature = `sha256=${hmac}`;
    
    if (messageSignature !== expectedSignature) {
      console.error('[Twitch EventSub] Signature invalide', {
        received: messageSignature,
        expected: expectedSignature,
      });
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 403 }
      );
    }

    // Parser le JSON
    let eventData: any;
    try {
      eventData = JSON.parse(body);
    } catch (error) {
      console.error('[Twitch EventSub] Erreur parsing JSON:', error);
      return NextResponse.json(
        { error: 'Body JSON invalide' },
        { status: 400 }
      );
    }

    // Gérer le challenge (webhook verification)
    if (eventData.subscription?.status === 'webhook_callback_verification_pending') {
      const challenge = eventData.challenge;
      console.log('[Twitch EventSub] Challenge reçu, réponse:', challenge);
      
      // Répondre avec le challenge en texte brut
      return new NextResponse(challenge, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Gérer l'événement channel.raid
    if (eventData.subscription?.type === 'channel.raid' && eventData.event) {
      const event: TwitchRaidEvent = {
        from_broadcaster_user_id: eventData.event.from_broadcaster_user_id,
        from_broadcaster_user_login: eventData.event.from_broadcaster_user_login,
        from_broadcaster_user_name: eventData.event.from_broadcaster_user_name,
        to_broadcaster_user_id: eventData.event.to_broadcaster_user_id,
        to_broadcaster_user_login: eventData.event.to_broadcaster_user_login,
        to_broadcaster_user_name: eventData.event.to_broadcaster_user_name,
        viewers: eventData.event.viewers || 0,
      };

      console.log('[Twitch EventSub] Événement channel.raid reçu:', {
        from: event.from_broadcaster_user_login,
        to: event.to_broadcaster_user_login,
        viewers: event.viewers,
      });

      // FILTER: Ne garder que les raids entre membres TENF
      // Vérifier si les deux broadcasters sont des membres TENF
      const { loadMemberDataFromStorage, getAllMemberData } = await import('@/lib/memberData');
      await loadMemberDataFromStorage();
      const allMembers = getAllMemberData();

      const fromMember = allMembers.find(m => 
        m.isActive && (
          m.twitchId === event.from_broadcaster_user_id ||
          m.twitchLogin?.toLowerCase() === event.from_broadcaster_user_login.toLowerCase()
        )
      );

      const toMember = allMembers.find(m => 
        m.isActive && (
          m.twitchId === event.to_broadcaster_user_id ||
          m.twitchLogin?.toLowerCase() === event.to_broadcaster_user_login.toLowerCase()
        )
      );

      // Si les deux membres sont TENF, enregistrer le raid
      if (fromMember && toMember) {
        console.log('[Twitch EventSub] ✅ Raid TENF détecté:', {
          from: fromMember.twitchLogin,
          to: toMember.twitchLogin,
        });

        // Sauvegarder le raid (ne pas attendre pour répondre rapidement)
        saveTwitchRaid(event).catch(error => {
          console.error('[Twitch EventSub] Erreur lors de la sauvegarde du raid:', error);
          // Ne pas throw pour répondre rapidement à Twitch
        });
      } else {
        console.log('[Twitch EventSub] ⏭️ Raid ignoré (non TENF):', {
          from: event.from_broadcaster_user_login,
          to: event.to_broadcaster_user_login,
          fromIsTENF: !!fromMember,
          toIsTENF: !!toMember,
        });
      }

      // Répondre rapidement à Twitch (200 OK)
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Autres types d'événements (non gérés pour l'instant)
    console.log('[Twitch EventSub] Type d\'événement non géré:', eventData.subscription?.type);
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('[Twitch EventSub] Erreur générale:', error);
    // Toujours répondre 200 pour ne pas faire échouer le webhook Twitch
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 200 } // 200 pour ne pas faire échouer le webhook
    );
  }
}

