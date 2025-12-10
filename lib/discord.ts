// Discord OAuth utilities

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  authenticated: boolean;
}

/**
 * Récupère les informations de l'utilisateur Discord connecté
 */
export async function getDiscordUser(): Promise<DiscordUser | null> {
  try {
    const response = await fetch('/api/auth/discord/user', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.authenticated ? data.user : null;
  } catch (error) {
    console.error('Error fetching Discord user:', error);
    return null;
  }
}

/**
 * Déconnecte l'utilisateur Discord
 */
export async function logoutDiscord(): Promise<void> {
  try {
    await fetch('/api/auth/discord/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

/**
 * Redirige vers la page de connexion Discord
 */
export function loginWithDiscord(): void {
  window.location.href = '/api/auth/discord/login';
}

