// Helpers pour l'API Twitch Helix

const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

/**
 * Obtient un token OAuth Twitch via client credentials
 */
async function getTwitchAccessToken(): Promise<string | null> {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('[Twitch Helpers] TWITCH_CLIENT_ID et TWITCH_CLIENT_SECRET doivent être configurés');
    return null;
  }

  try {
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
      console.error('[Twitch Helpers] Erreur OAuth:', response.status, error);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('[Twitch Helpers] Erreur lors de la récupération du token:', error);
    return null;
  }
}

/**
 * Récupère l'ID utilisateur Twitch depuis un login
 * @param login - Le login Twitch (ex: "nexou31")
 * @returns L'ID numérique Twitch (ex: "123456789") ou null si non trouvé
 */
export async function getTwitchUserIdByLogin(login: string): Promise<string | null> {
  if (!login || typeof login !== 'string' || login.trim() === '') {
    console.warn('[Twitch Helpers] Login invalide:', login);
    return null;
  }

  const CLIENT_ID = process.env.TWITCH_CLIENT_ID || process.env.TWITCH_APP_CLIENT_ID;
  
  if (!CLIENT_ID) {
    console.warn('[Twitch Helpers] TWITCH_CLIENT_ID non configuré');
    return null;
  }

  const accessToken = await getTwitchAccessToken();
  if (!accessToken) {
    console.warn('[Twitch Helpers] Impossible d\'obtenir un token d\'accès');
    return null;
  }

  try {
    const response = await fetch(
      `${TWITCH_API_BASE}/users?login=${encodeURIComponent(login.toLowerCase().trim())}`,
      {
        headers: {
          'Client-Id': CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Twitch Helpers] Erreur API pour ${login}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const userId = data.data[0].id;
      console.log(`[Twitch Helpers] ✅ ID résolu pour ${login}: ${userId}`);
      return userId;
    }

    console.warn(`[Twitch Helpers] Utilisateur non trouvé: ${login}`);
    return null;
  } catch (error) {
    console.error(`[Twitch Helpers] Erreur lors de la résolution de l'ID pour ${login}:`, error);
    return null;
  }
}

/**
 * Récupère les IDs Twitch pour plusieurs logins en une seule requête
 * @param logins - Tableau de logins Twitch
 * @returns Map<login, userId> ou null si erreur
 */
export async function getTwitchUserIdsByLogins(logins: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  
  if (!logins || logins.length === 0) {
    return result;
  }

  const CLIENT_ID = process.env.TWITCH_CLIENT_ID || process.env.TWITCH_APP_CLIENT_ID;
  
  if (!CLIENT_ID) {
    console.warn('[Twitch Helpers] TWITCH_CLIENT_ID non configuré');
    return result;
  }

  const accessToken = await getTwitchAccessToken();
  if (!accessToken) {
    console.warn('[Twitch Helpers] Impossible d\'obtenir un token d\'accès');
    return result;
  }

  // L'API Twitch permet jusqu'à 100 utilisateurs par requête
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < logins.length; i += BATCH_SIZE) {
    const batch = logins.slice(i, i + BATCH_SIZE).filter(login => login && typeof login === 'string');
    
    if (batch.length === 0) continue;

    try {
      const queryParams = batch
        .map(login => `login=${encodeURIComponent(login.toLowerCase().trim())}`)
        .join('&');

      const response = await fetch(
        `${TWITCH_API_BASE}/users?${queryParams}`,
        {
          headers: {
            'Client-Id': CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Twitch Helpers] Erreur API batch ${i / BATCH_SIZE + 1}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((user: any) => {
          if (user.id && user.login) {
            result.set(user.login.toLowerCase(), user.id);
          }
        });
      }
    } catch (error) {
      console.error(`[Twitch Helpers] Erreur lors de la résolution du batch ${i / BATCH_SIZE + 1}:`, error);
      continue;
    }
  }

  return result;
}

/**
 * Récupère le login Twitch depuis un ID utilisateur
 * @param userId - L'ID numérique Twitch (ex: "123456789")
 * @returns Le login Twitch ou null si non trouvé
 */
export async function getTwitchLoginById(userId: string): Promise<string | null> {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.warn('[Twitch Helpers] ID utilisateur invalide:', userId);
    return null;
  }

  const CLIENT_ID = process.env.TWITCH_CLIENT_ID || process.env.TWITCH_APP_CLIENT_ID;
  
  if (!CLIENT_ID) {
    console.warn('[Twitch Helpers] TWITCH_CLIENT_ID non configuré');
    return null;
  }

  const accessToken = await getTwitchAccessToken();
  if (!accessToken) {
    console.warn('[Twitch Helpers] Impossible d\'obtenir un token d\'accès');
    return null;
  }

  try {
    const response = await fetch(
      `${TWITCH_API_BASE}/users?id=${encodeURIComponent(userId.trim())}`,
      {
        headers: {
          'Client-Id': CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Twitch Helpers] Erreur API pour ID ${userId}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const login = data.data[0].login;
      console.log(`[Twitch Helpers] ✅ Login résolu pour ID ${userId}: ${login}`);
      return login;
    }

    console.warn(`[Twitch Helpers] Utilisateur non trouvé pour ID: ${userId}`);
    return null;
  } catch (error) {
    console.error(`[Twitch Helpers] Erreur lors de la résolution du login pour ID ${userId}:`, error);
    return null;
  }
}

/**
 * Récupère les logins Twitch pour plusieurs IDs en une seule requête
 * @param userIds - Tableau d'IDs Twitch
 * @returns Map<userId, login> ou Map vide si erreur
 */
export async function getTwitchLoginsByIds(userIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  
  if (!userIds || userIds.length === 0) {
    return result;
  }

  const CLIENT_ID = process.env.TWITCH_CLIENT_ID || process.env.TWITCH_APP_CLIENT_ID;
  
  if (!CLIENT_ID) {
    console.warn('[Twitch Helpers] TWITCH_CLIENT_ID non configuré');
    return result;
  }

  const accessToken = await getTwitchAccessToken();
  if (!accessToken) {
    console.warn('[Twitch Helpers] Impossible d\'obtenir un token d\'accès');
    return result;
  }

  // L'API Twitch permet jusqu'à 100 utilisateurs par requête
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE).filter(id => id && typeof id === 'string');
    
    if (batch.length === 0) continue;

    try {
      const queryParams = batch
        .map(id => `id=${encodeURIComponent(id.trim())}`)
        .join('&');

      const response = await fetch(
        `${TWITCH_API_BASE}/users?${queryParams}`,
        {
          headers: {
            'Client-Id': CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Twitch Helpers] Erreur API batch ${i / BATCH_SIZE + 1}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((user: any) => {
          if (user.id && user.login) {
            result.set(user.id, user.login);
          }
        });
      }
    } catch (error) {
      console.error(`[Twitch Helpers] Erreur lors de la résolution du batch ${i / BATCH_SIZE + 1}:`, error);
      continue;
    }
  }

  return result;
}

