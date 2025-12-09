// Mock data structure pour Twitch User
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

/**
 * Récupère les informations d'un utilisateur Twitch par son login
 * @param login - Le login Twitch de l'utilisateur
 * @returns Les informations de l'utilisateur Twitch (mock pour l'instant)
 */
export async function getTwitchUser(login: string): Promise<TwitchUser> {
  // TODO: Intégrer l'API Twitch réelle ici
  // Pour l'instant, retourne des mock data avec un placeholder d'image
  
  return {
    id: `mock_${login}_${Date.now()}`,
    login: login.toLowerCase(),
    display_name: login,
    profile_image_url: "https://placehold.co/128x128?text=Twitch",
  };
}

