// Gestion de l'authentification OAuth et des subscriptions Twitch EventSub

const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

export interface TwitchOAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface TwitchEventSubSubscription {
  id: string;
  status: string;
  type: string;
  version: string;
  condition: {
    to_broadcaster_user_id?: string;
    from_broadcaster_user_id?: string;
  };
  transport: {
    method: string;
    callback: string;
  };
  created_at: string;
}

/**
 * Obtient un token OAuth Twitch via client credentials
 * Utilise TWITCH_CLIENT_ID et TWITCH_CLIENT_SECRET pour générer le token
 * (utilisé pour créer/gérer les subscriptions EventSub)
 */
export async function getTwitchOAuthToken(): Promise<string> {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('TWITCH_CLIENT_ID et TWITCH_CLIENT_SECRET doivent être configurés (pour générer le token OAuth)');
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur OAuth Twitch: ${response.status} ${error}`);
  }

  const data: TwitchOAuthToken = await response.json();
  return data.access_token;
}

/**
 * Récupère toutes les subscriptions EventSub actives
 */
export async function getEventSubSubscriptions(accessToken: string): Promise<TwitchEventSubSubscription[]> {
  // Utiliser TWITCH_APP_CLIENT_ID pour les appels API EventSub (webhook)
  const CLIENT_ID = process.env.TWITCH_APP_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
  
  if (!CLIENT_ID) {
    throw new Error('TWITCH_APP_CLIENT_ID ou TWITCH_CLIENT_ID doit être configuré');
  }

  const response = await fetch(`${TWITCH_API_BASE}/eventsub/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': CLIENT_ID,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur récupération subscriptions: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Vérifie si une subscription channel.raid existe pour un broadcaster
 */
export async function hasChannelRaidSubscription(
  accessToken: string,
  broadcasterId: string
): Promise<boolean> {
  const subscriptions = await getEventSubSubscriptions(accessToken);
  
  return subscriptions.some(sub => 
    sub.type === 'channel.raid' &&
    sub.status === 'enabled' &&
    sub.condition.to_broadcaster_user_id === broadcasterId
  );
}

/**
 * Crée une subscription EventSub pour channel.raid
 */
export async function createChannelRaidSubscription(
  accessToken: string,
  broadcasterId: string,
  webhookUrl: string,
  secret: string
): Promise<TwitchEventSubSubscription> {
  // Utiliser TWITCH_APP_CLIENT_ID pour les appels API EventSub (webhook)
  const CLIENT_ID = process.env.TWITCH_APP_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
  
  if (!CLIENT_ID) {
    throw new Error('TWITCH_APP_CLIENT_ID ou TWITCH_CLIENT_ID doit être configuré');
  }

  const response = await fetch(`${TWITCH_API_BASE}/eventsub/subscriptions`, {
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
        secret: secret,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur création subscription: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data?.[0];
}

/**
 * Supprime une subscription EventSub
 */
export async function deleteEventSubSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<void> {
  // Utiliser TWITCH_APP_CLIENT_ID pour les appels API EventSub (webhook)
  const CLIENT_ID = process.env.TWITCH_APP_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
  
  if (!CLIENT_ID) {
    throw new Error('TWITCH_APP_CLIENT_ID ou TWITCH_CLIENT_ID doit être configuré');
  }

  const response = await fetch(`${TWITCH_API_BASE}/eventsub/subscriptions?id=${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': CLIENT_ID,
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Erreur suppression subscription: ${response.status} ${error}`);
  }
}

/**
 * Vérifie et crée une subscription si nécessaire
 * Retourne true si une nouvelle subscription a été créée
 */
export async function ensureChannelRaidSubscription(
  broadcasterId: string,
  webhookUrl: string,
  secret: string
): Promise<{ created: boolean; subscription: TwitchEventSubSubscription | null }> {
  try {
    const accessToken = await getTwitchOAuthToken();
    const exists = await hasChannelRaidSubscription(accessToken, broadcasterId);

    if (exists) {
      console.log('[Twitch EventSub] Subscription channel.raid existe déjà');
      return { created: false, subscription: null };
    }

    console.log('[Twitch EventSub] Création d\'une nouvelle subscription channel.raid');
    const subscription = await createChannelRaidSubscription(accessToken, broadcasterId, webhookUrl, secret);
    
    return { created: true, subscription };
  } catch (error) {
    console.error('[Twitch EventSub] Erreur lors de la vérification/création:', error);
    throw error;
  }
}

