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
    // Source unique de vérité: session NextAuth.
    const sessionResponse = await fetch('/api/auth/session', {
      credentials: 'include',
      cache: 'no-store',
    });

    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      const discordId = session?.user?.discordId as string | undefined;
      if (discordId) {
        return {
          id: discordId,
          username: (session?.user?.username || session?.user?.name || 'Unknown') as string,
          avatar: (session?.user?.avatar || session?.user?.image || null) as string | null,
          authenticated: true,
        };
      }
    }
    return null;
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
    // Déconnexion NextAuth
    const csrfResponse = await fetch('/api/auth/csrf', {
      credentials: 'include',
      cache: 'no-store',
    });
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData?.csrfToken;

    if (csrfToken) {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken,
          callbackUrl: '/',
          json: 'true',
        }),
      });
    }

  } catch (error) {
    console.error('Error logging out:', error);
  }
}

/**
 * Redirige vers la page de connexion Discord
 */
export function loginWithDiscord(): void {
  const callbackUrl = `${window.location.pathname}${window.location.search}` || '/';
  window.location.href = `/api/auth/signin/discord?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

