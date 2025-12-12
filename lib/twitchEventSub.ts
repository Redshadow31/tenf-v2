// Gestion de l'authentification OAuth et des subscriptions Twitch EventSub
// CRITICAL: Utilise UNIQUEMENT App Access Tokens (TWITCH_APP_CLIENT_ID + TWITCH_APP_CLIENT_SECRET)

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

// Cache pour le token d'application avec expiration
interface CachedAppToken {
  token: string;
  expiresAt: number;
  clientId: string;
}

let cachedAppToken: CachedAppToken | null = null;

/**
 * Obtient un App Access Token Twitch via client credentials
 * CRITICAL: Utilise UNIQUEMENT TWITCH_APP_CLIENT_ID et TWITCH_APP_CLIENT_SECRET
 * Ne JAMAIS utiliser TWITCH_CLIENT_ID pour EventSub
 */
export async function getTwitchOAuthToken(): Promise<string> {
  const APP_CLIENT_ID = process.env.TWITCH_APP_CLIENT_ID;
  const APP_CLIENT_SECRET = process.env.TWITCH_APP_CLIENT_SECRET;

  // Vérification stricte : refuser si on utilise les mauvaises variables
  if (process.env.TWITCH_CLIENT_ID && !APP_CLIENT_ID) {
    throw new Error(
      'ERREUR CRITIQUE: TWITCH_CLIENT_ID détecté mais TWITCH_APP_CLIENT_ID manquant. ' +
      'EventSub nécessite UNIQUEMENT TWITCH_APP_CLIENT_ID et TWITCH_APP_CLIENT_SECRET. ' +
      'Ne JAMAIS utiliser TWITCH_CLIENT_ID pour EventSub.'
    );
  }

  if (!APP_CLIENT_ID || !APP_CLIENT_SECRET) {
    throw new Error(
      'TWITCH_APP_CLIENT_ID et TWITCH_APP_CLIENT_SECRET doivent être configurés pour EventSub. ' +
      'Ces variables sont OBLIGATOIRES et différentes de TWITCH_CLIENT_ID.'
    );
  }

  // Vérifier le cache
  if (cachedAppToken && cachedAppToken.clientId === APP_CLIENT_ID) {
    const now = Date.now();
    // Renouveler 5 minutes avant expiration pour éviter les erreurs
    if (now < cachedAppToken.expiresAt - 5 * 60 * 1000) {
      console.log('[Twitch EventSub] ✅ Utilisation du token APP en cache');
      return cachedAppToken.token;
    }
    console.log('[Twitch EventSub] ⚠️ Token APP expiré, renouvellement...');
  }

  console.log('[Twitch EventSub] 🔑 Génération d\'un nouveau APP ACCESS TOKEN...');
  console.log('[Twitch EventSub] Source: TWITCH_APP_CLIENT_ID (App Token)');

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: APP_CLIENT_ID,
      client_secret: APP_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Twitch EventSub] ❌ Erreur génération APP TOKEN:', response.status, error);
    throw new Error(`Erreur OAuth Twitch (APP TOKEN): ${response.status} ${error}`);
  }

  const data: TwitchOAuthToken = await response.json();
  
  // Mettre en cache avec expiration
  const expiresIn = data.expires_in || 3600; // Par défaut 1 heure
  cachedAppToken = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000, // -60s pour marge de sécurité
    clientId: APP_CLIENT_ID,
  };

  console.log('[Twitch EventSub] ✅ APP ACCESS TOKEN généré avec succès');
  console.log(`[Twitch EventSub] Expiration dans ${expiresIn} secondes`);
  
  return data.access_token;
}

/**
 * Récupère toutes les subscriptions EventSub actives
 * CRITICAL: Utilise UNIQUEMENT TWITCH_APP_CLIENT_ID
 */
export async function getEventSubSubscriptions(accessToken: string): Promise<TwitchEventSubSubscription[]> {
  // CRITICAL: Utiliser UNIQUEMENT TWITCH_APP_CLIENT_ID pour EventSub
  const APP_CLIENT_ID = process.env.TWITCH_APP_CLIENT_ID;
  
  if (!APP_CLIENT_ID) {
    throw new Error(
      'TWITCH_APP_CLIENT_ID doit être configuré pour EventSub. ' +
      'Ne JAMAIS utiliser TWITCH_CLIENT_ID pour EventSub.'
    );
  }

  // Vérifier que le token correspond au Client ID
  if (cachedAppToken && cachedAppToken.clientId !== APP_CLIENT_ID) {
    console.warn('[Twitch EventSub] ⚠️ Client ID mismatch détecté, régénération du token...');
    cachedAppToken = null;
  }

  const response = await fetch(`${TWITCH_API_BASE}/eventsub/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': APP_CLIENT_ID,
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
 * CRITICAL: Utilise UNIQUEMENT TWITCH_APP_CLIENT_ID
 */
export async function createChannelRaidSubscription(
  accessToken: string,
  broadcasterId: string,
  webhookUrl: string,
  secret: string
): Promise<TwitchEventSubSubscription> {
  // CRITICAL: Utiliser UNIQUEMENT TWITCH_APP_CLIENT_ID pour EventSub
  const APP_CLIENT_ID = process.env.TWITCH_APP_CLIENT_ID;
  
  if (!APP_CLIENT_ID) {
    throw new Error(
      'TWITCH_APP_CLIENT_ID doit être configuré pour EventSub. ' +
      'Ne JAMAIS utiliser TWITCH_CLIENT_ID pour EventSub.'
    );
  }

  // Vérifier que le token correspond au Client ID
  if (cachedAppToken && cachedAppToken.clientId !== APP_CLIENT_ID) {
    console.warn('[Twitch EventSub] ⚠️ Client ID mismatch détecté, régénération du token...');
    cachedAppToken = null;
  }

  const response = await fetch(`${TWITCH_API_BASE}/eventsub/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': APP_CLIENT_ID,
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
 * CRITICAL: Utilise UNIQUEMENT TWITCH_APP_CLIENT_ID
 */
export async function deleteEventSubSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<void> {
  // CRITICAL: Utiliser UNIQUEMENT TWITCH_APP_CLIENT_ID pour EventSub
  const APP_CLIENT_ID = process.env.TWITCH_APP_CLIENT_ID;
  
  if (!APP_CLIENT_ID) {
    throw new Error(
      'TWITCH_APP_CLIENT_ID doit être configuré pour EventSub. ' +
      'Ne JAMAIS utiliser TWITCH_CLIENT_ID pour EventSub.'
    );
  }

  // Vérifier que le token correspond au Client ID
  if (cachedAppToken && cachedAppToken.clientId !== APP_CLIENT_ID) {
    console.warn('[Twitch EventSub] ⚠️ Client ID mismatch détecté, régénération du token...');
    cachedAppToken = null;
  }

  const response = await fetch(`${TWITCH_API_BASE}/eventsub/subscriptions?id=${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': APP_CLIENT_ID,
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

