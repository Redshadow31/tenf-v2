// Twitch API integration
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  description?: string;
}

interface TwitchAPIResponse {
  data: Array<{
    id: string;
    login: string;
    display_name: string;
    profile_image_url: string;
    description?: string;
  }>;
}

/**
 * Cache en mémoire pour les avatars Twitch
 * TTL: 24 heures (86 400 000 ms)
 */
interface CachedTwitchUser {
  user: TwitchUser;
  timestamp: number;
}

const AVATAR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
const avatarCache = new Map<string, CachedTwitchUser>();

/**
 * Nettoie le cache des avatars expirés
 */
function cleanExpiredAvatars(): void {
  const now = Date.now();
  for (const [key, cached] of avatarCache.entries()) {
    if (now - cached.timestamp > AVATAR_CACHE_TTL) {
      avatarCache.delete(key);
    }
  }
}

/**
 * Récupère un utilisateur depuis le cache s'il est valide
 */
function getCachedUser(login: string): TwitchUser | null {
  const cached = avatarCache.get(login.toLowerCase());
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > AVATAR_CACHE_TTL) {
    avatarCache.delete(login.toLowerCase());
    return null;
  }
  
  return cached.user;
}

/**
 * Met en cache un utilisateur Twitch
 */
function setCachedUser(login: string, user: TwitchUser): void {
  avatarCache.set(login.toLowerCase(), {
    user,
    timestamp: Date.now(),
  });
  
  // Nettoyer le cache périodiquement (tous les 100 insertions environ)
  if (avatarCache.size % 100 === 0) {
    cleanExpiredAvatars();
  }
}

/**
 * Récupère plusieurs utilisateurs depuis le cache s'ils sont valides
 * Retourne un map des utilisateurs en cache et la liste des logins à récupérer
 */
function getCachedUsers(logins: string[]): {
  cached: Map<string, TwitchUser>;
  toFetch: string[];
} {
  const cached = new Map<string, TwitchUser>();
  const toFetch: string[] = [];
  
  for (const login of logins) {
    const user = getCachedUser(login);
    if (user) {
      cached.set(login.toLowerCase(), user);
    } else {
      toFetch.push(login);
    }
  }
  
  return { cached, toFetch };
}

/**
 * Récupère un token d'accès Twitch via Client Credentials Flow
 */
async function getTwitchAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Twitch API credentials not configured");
    return null;
  }

  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twitch token error:", errorText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error fetching Twitch access token:", error);
    return null;
  }
}

/**
 * Récupère les informations d'un utilisateur Twitch par son login
 * Utilise un cache en mémoire de 24h pour réduire les appels API
 * @param login - Le login Twitch de l'utilisateur
 * @returns Les informations de l'utilisateur Twitch
 */
export async function getTwitchUser(login: string): Promise<TwitchUser> {
  // Vérifier le cache d'abord
  const cached = getCachedUser(login);
  if (cached) {
    return cached;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    console.warn("TWITCH_CLIENT_ID not configured, returning mock data");
    return {
      id: `mock_${login}_${Date.now()}`,
      login: login.toLowerCase(),
      display_name: login,
      profile_image_url: "https://placehold.co/128x128?text=Twitch",
    };
  }

  // Obtenir un token d'accès
  const accessToken = await getTwitchAccessToken();

  if (!accessToken) {
    console.warn("Could not get Twitch access token, returning mock data");
    return {
      id: `mock_${login}_${Date.now()}`,
      login: login.toLowerCase(),
      display_name: login,
      profile_image_url: "https://placehold.co/128x128?text=Twitch",
    };
  }

  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login.toLowerCase())}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Twitch API error for ${login}:`, errorText);
      // Retourner des données mock en cas d'erreur (ne pas mettre en cache)
      return {
        id: `mock_${login}_${Date.now()}`,
        login: login.toLowerCase(),
        display_name: login,
        profile_image_url: "https://placehold.co/128x128?text=Twitch",
      };
    }

    const data: TwitchAPIResponse = await response.json();

    if (data.data && data.data.length > 0) {
      const user = data.data[0];
      const twitchUser: TwitchUser = {
        id: user.id,
        login: user.login,
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
        description: user.description,
      };
      // Mettre en cache l'utilisateur récupéré avec succès
      setCachedUser(user.login, twitchUser);
      return twitchUser;
    }

    // Si l'utilisateur n'est pas trouvé, retourner des données mock (ne pas mettre en cache)
    return {
      id: `mock_${login}_${Date.now()}`,
      login: login.toLowerCase(),
      display_name: login,
      profile_image_url: "https://placehold.co/128x128?text=Twitch",
    };
  } catch (error) {
    console.error(`Error fetching Twitch user ${login}:`, error);
    // Retourner des données mock en cas d'erreur (ne pas mettre en cache)
    return {
      id: `mock_${login}_${Date.now()}`,
      login: login.toLowerCase(),
      display_name: login,
      profile_image_url: "https://placehold.co/128x128?text=Twitch",
    };
  }
}

/**
 * Récupère plusieurs utilisateurs Twitch par leurs logins
 * Utilise un cache en mémoire de 24h pour réduire les appels API
 * @param logins - Tableau de logins Twitch
 * @returns Tableau d'informations utilisateurs Twitch
 */
export async function getTwitchUsers(logins: string[]): Promise<TwitchUser[]> {
  if (logins.length === 0) return [];

  // Nettoyer le cache des entrées expirées
  cleanExpiredAvatars();

  // Récupérer les utilisateurs depuis le cache
  const { cached, toFetch } = getCachedUsers(logins);
  
  // Si tous les utilisateurs sont en cache, les retourner directement
  if (toFetch.length === 0) {
    return logins.map((login) => {
      const user = cached.get(login.toLowerCase());
      if (user) return user;
      // Fallback (ne devrait pas arriver)
      return {
        id: `mock_${login}_${Date.now()}`,
        login: login.toLowerCase(),
        display_name: login,
        profile_image_url: "https://placehold.co/128x128?text=Twitch",
      };
    });
  }

  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    console.warn("TWITCH_CLIENT_ID not configured, returning mock data");
    return logins.map((login) => {
      const cachedUser = cached.get(login.toLowerCase());
      if (cachedUser) return cachedUser;
      return {
        id: `mock_${login}_${Date.now()}`,
        login: login.toLowerCase(),
        display_name: login,
        profile_image_url: "https://placehold.co/128x128?text=Twitch",
      };
    });
  }

  const accessToken = await getTwitchAccessToken();

  if (!accessToken) {
    console.warn("Could not get Twitch access token, returning mock data");
    return logins.map((login) => {
      const cachedUser = cached.get(login.toLowerCase());
      if (cachedUser) return cachedUser;
      return {
        id: `mock_${login}_${Date.now()}`,
        login: login.toLowerCase(),
        display_name: login,
        profile_image_url: "https://placehold.co/128x128?text=Twitch",
      };
    });
  }

  try {
    // L'API Twitch permet jusqu'à 100 utilisateurs par requête, mais on utilise 99 pour être sûr
    const BATCH_SIZE = 99;
    const allUsers: TwitchUser[] = [];
    
    // Diviser les logins à récupérer en batches de 99
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batch = toFetch.slice(i, i + BATCH_SIZE);
      
      const queryParams = batch
        .map((login) => `login=${encodeURIComponent(login.toLowerCase())}`)
        .join("&");

      const response = await fetch(
        `https://api.twitch.tv/helix/users?${queryParams}`,
        {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Twitch API error for batch ${i / BATCH_SIZE + 1}:`, errorText);
        // Ajouter des mocks pour ce batch en cas d'erreur
        batch.forEach((login) => {
          const mockUser = {
            id: `mock_${login}_${Date.now()}`,
            login: login.toLowerCase(),
            display_name: login,
            profile_image_url: "https://placehold.co/128x128?text=Twitch",
          };
          allUsers.push(mockUser);
          // Ne pas mettre en cache les mocks
        });
        continue;
      }

      const data: TwitchAPIResponse = await response.json();
      
      // Ajouter les utilisateurs trouvés et les mettre en cache
      if (data.data && data.data.length > 0) {
        data.data.forEach((user) => {
          const twitchUser: TwitchUser = {
            id: user.id,
            login: user.login,
            display_name: user.display_name,
            profile_image_url: user.profile_image_url,
            description: user.description,
          };
          allUsers.push(twitchUser);
          // Mettre en cache les utilisateurs récupérés avec succès
          setCachedUser(user.login, twitchUser);
        });
      }
      
      // Ajouter des mocks pour les utilisateurs non trouvés dans ce batch
      const foundLogins = new Set(data.data?.map((u: any) => u.login.toLowerCase()) || []);
      batch.forEach((login) => {
        if (!foundLogins.has(login.toLowerCase())) {
          const mockUser = {
            id: `mock_${login}_${Date.now()}`,
            login: login.toLowerCase(),
            display_name: login,
            profile_image_url: "https://placehold.co/128x128?text=Twitch",
          };
          allUsers.push(mockUser);
          // Ne pas mettre en cache les mocks
        }
      });
    }

    // Créer un map pour un accès rapide (incluant les utilisateurs en cache)
    const userMap = new Map<string, TwitchUser>([
      ...Array.from(cached.entries()),
      ...allUsers.map((user): [string, TwitchUser] => [user.login.toLowerCase(), user])
    ]);

    // Retourner les utilisateurs dans l'ordre demandé
    return logins.map((login) => {
      const user = userMap.get(login.toLowerCase());
      if (user) {
        return user;
      }
      return {
        id: `mock_${login}_${Date.now()}`,
        login: login.toLowerCase(),
        display_name: login,
        profile_image_url: "https://placehold.co/128x128?text=Twitch",
      };
    });
  } catch (error) {
    console.error("Error fetching Twitch users:", error);
    return logins.map((login) => {
      const cachedUser = cached.get(login.toLowerCase());
      if (cachedUser) return cachedUser;
      return {
        id: `mock_${login}_${Date.now()}`,
        login: login.toLowerCase(),
        display_name: login,
        profile_image_url: "https://placehold.co/128x128?text=Twitch",
      };
    });
  }
}
