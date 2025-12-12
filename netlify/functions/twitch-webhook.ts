import { Handler } from '@netlify/functions';
import crypto from 'crypto';
import { saveTwitchRaid, TwitchRaidEvent } from '../../lib/raidsTwitch';

/**
 * Netlify Function pour recevoir les webhooks Twitch EventSub
 * 
 * Cette fonction gère :
 * - La vérification de signature HMAC
 * - Le challenge de validation webhook
 * - Les événements channel.raid
 */
export const handler: Handler = async (event, context) => {
  try {
    const EVENTSUB_SECRET = process.env.TWITCH_EVENTSUB_SECRET;
    
    if (!EVENTSUB_SECRET) {
      console.error('[Twitch Webhook] TWITCH_EVENTSUB_SECRET non configuré');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Configuration manquante: TWITCH_EVENTSUB_SECRET',
        }),
      };
    }

    // Lire les headers EventSub
    const messageId = event.headers['twitch-eventsub-message-id'] || event.headers['Twitch-Eventsub-Message-Id'];
    const messageTimestamp = event.headers['twitch-eventsub-message-timestamp'] || event.headers['Twitch-Eventsub-Message-Timestamp'];
    const messageSignature = event.headers['twitch-eventsub-message-signature'] || event.headers['Twitch-Eventsub-Message-Signature'];

    if (!messageId || !messageTimestamp || !messageSignature) {
      console.error('[Twitch Webhook] Headers EventSub manquants');
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Headers EventSub manquants',
        }),
      };
    }

    // Lire le body
    const body = event.body || '';
    
    // Vérifier la signature
    const hmacMessage = messageId + messageTimestamp + body;
    const hmac = crypto
      .createHmac('sha256', EVENTSUB_SECRET)
      .update(hmacMessage)
      .digest('hex');
    
    const expectedSignature = `sha256=${hmac}`;
    
    if (messageSignature !== expectedSignature) {
      console.error('[Twitch Webhook] Signature invalide', {
        received: messageSignature.substring(0, 20) + '...',
        expected: expectedSignature.substring(0, 20) + '...',
      });
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Signature invalide',
        }),
      };
    }

    // Parser le JSON
    let eventData: any;
    try {
      eventData = JSON.parse(body);
    } catch (error) {
      console.error('[Twitch Webhook] Erreur parsing JSON:', error);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Body JSON invalide',
        }),
      };
    }

    // Gérer le challenge (webhook verification)
    if (eventData.subscription?.status === 'webhook_callback_verification_pending') {
      const challenge = eventData.challenge;
      console.log('[Twitch Webhook] Challenge reçu, réponse:', challenge);
      
      // Répondre avec le challenge en texte brut
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: challenge,
      };
    }

    // Gérer l'événement channel.raid
    if (eventData.subscription?.type === 'channel.raid' && eventData.event) {
      const twitchEvent: TwitchRaidEvent = {
        from_broadcaster_user_id: eventData.event.from_broadcaster_user_id,
        from_broadcaster_user_login: eventData.event.from_broadcaster_user_login,
        from_broadcaster_user_name: eventData.event.from_broadcaster_user_name,
        to_broadcaster_user_id: eventData.event.to_broadcaster_user_id,
        to_broadcaster_user_login: eventData.event.to_broadcaster_user_login,
        to_broadcaster_user_name: eventData.event.to_broadcaster_user_name,
        viewers: eventData.event.viewers || 0,
      };

      console.log('[Twitch Webhook] Événement channel.raid reçu:', {
        from: twitchEvent.from_broadcaster_user_login,
        to: twitchEvent.to_broadcaster_user_login,
        viewers: twitchEvent.viewers,
      });

      // Sauvegarder le raid (ne pas attendre pour répondre rapidement)
      saveTwitchRaid(twitchEvent).catch(error => {
        console.error('[Twitch Webhook] Erreur lors de la sauvegarde du raid:', error);
        // Ne pas throw pour répondre rapidement à Twitch
      });

      // Répondre rapidement à Twitch (200 OK)
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ received: true }),
      };
    }

    // Autres types d'événements (non gérés pour l'instant)
    console.log('[Twitch Webhook] Type d\'événement non géré:', eventData.subscription?.type);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ received: true }),
    };

  } catch (error) {
    console.error('[Twitch Webhook] Erreur générale:', error);
    // Toujours répondre 200 pour ne pas faire échouer le webhook Twitch
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Erreur interne',
      }),
    };
  }
};

