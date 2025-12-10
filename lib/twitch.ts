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
 * @param login - Le login Twitch de l'utilisateur
 * @returns Les informations de l'utilisateur Twitch
 */
export async function getTwitchUser(login: string): Promise<TwitchUser> {
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
      // Retourner des données mock en cas d'erreur
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
      return {
        id: user.id,
        login: user.login,
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
        description: user.description,
      };
    }

    // Si l'utilisateur n'est pas trouvé, retourner des données mock
    return {
      id: `mock_${login}_${Date.now()}`,
      login: login.toLowerCase(),
      display_name: login,
      profile_image_url: "https://placehold.co/128x128?text=Twitch",
    };
  } catch (error) {
    console.error(`Error fetching Twitch user ${login}:`, error);
    // Retourner des données mock en cas d'erreur
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
 * @param logins - Tableau de logins Twitch
 * @returns Tableau d'informations utilisateurs Twitch
 */
export async function getTwitchUsers(logins: string[]): Promise<TwitchUser[]> {
  if (logins.length === 0) return [];

  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    console.warn("TWITCH_CLIENT_ID not configured, returning mock data");
    return logins.map((login) => ({
      id: `mock_${login}_${Date.now()}`,
      login: login.toLowerCase(),
      display_name: login,
      profile_image_url: "https://placehold.co/128x128?text=Twitch",
    }));
  }

  const accessToken = await getTwitchAccessToken();

  if (!accessToken) {
    console.warn("Could not get Twitch access token, returning mock data");
    return logins.map((login) => ({
      id: `mock_${login}_${Date.now()}`,
      login: login.toLowerCase(),
      display_name: login,
      profile_image_url: "https://placehold.co/128x128?text=Twitch",
    }));
  }

  try {
    // L'API Twitch permet jusqu'à 100 utilisateurs par requête
    const queryParams = logins
      .slice(0, 100)
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
      console.error("Twitch API error:", errorText);
      return logins.map((login) => ({
        id: `mock_${login}_${Date.now()}`,
        login: login.toLowerCase(),
        display_name: login,
        profile_image_url: "https://placehold.co/128x128?text=Twitch",
      }));
    }

    const data: TwitchAPIResponse = await response.json();

    // Créer un map pour un accès rapide
    const userMap = new Map(
      data.data.map((user) => [user.login.toLowerCase(), user])
    );

    // Retourner les utilisateurs dans l'ordre demandé, avec des mocks pour ceux non trouvés
    return logins.map((login) => {
      const user = userMap.get(login.toLowerCase());
      if (user) {
        return {
          id: user.id,
          login: user.login,
          display_name: user.display_name,
          profile_image_url: user.profile_image_url,
          description: user.description,
        };
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
    return logins.map((login) => ({
      id: `mock_${login}_${Date.now()}`,
      login: login.toLowerCase(),
      display_name: login,
      profile_image_url: "https://placehold.co/128x128?text=Twitch",
    }));
  }
}
