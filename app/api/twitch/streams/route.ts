import { NextResponse } from 'next/server';

// Cache ISR de 30 secondes pour les streams Twitch
export const revalidate = 30;

interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

interface TwitchStreamsResponse {
  data: TwitchStream[];
  pagination?: {
    cursor?: string;
  };
}

interface FormattedTwitchStream {
  id: string;
  userId: string;
  userLogin: string;
  userName: string;
  gameName: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string;
  type: string;
}

/**
 * Récupère les streams Twitch en cours pour une liste d'utilisateurs
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

async function fetchStreamsForLogins(logins: string[]): Promise<NextResponse> {
  const normalizedLogins = Array.from(
    new Set(
      logins
        .map((login) => String(login || '').trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (normalizedLogins.length === 0) {
    return NextResponse.json({ streams: [] });
  }

  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Twitch Client ID not configured' },
      { status: 500 }
    );
  }

  const accessToken = await getTwitchAccessToken();

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Failed to get Twitch access token' },
      { status: 500 }
    );
  }

  try {
    // L'API Twitch permet jusqu'à 100 utilisateurs par requête, mais on utilise 99 pour être sûr
    const BATCH_SIZE = 99;
    const allStreams: FormattedTwitchStream[] = [];
    
    // Diviser les logins en batches de 99
    for (let i = 0; i < normalizedLogins.length; i += BATCH_SIZE) {
      const batch = normalizedLogins.slice(i, i + BATCH_SIZE);
      
      const params = batch
        .map((login) => `user_login=${encodeURIComponent(login.trim().toLowerCase())}`)
        .join('&');

      const response = await fetch(
        `https://api.twitch.tv/helix/streams?${params}`,
        {
          headers: {
            'Client-ID': clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Twitch Streams API error for batch ${i / BATCH_SIZE + 1}:`, errorText);
        // Continuer avec le batch suivant en cas d'erreur
        continue;
      }

      const data: TwitchStreamsResponse = await response.json();

      // Ajouter les streams trouvés
      if (data.data && data.data.length > 0) {
        const formattedStreams: FormattedTwitchStream[] = data.data.map((stream) => ({
          id: stream.id,
          userId: stream.user_id,
          userLogin: stream.user_login,
          userName: stream.user_name,
          gameName: stream.game_name || 'Just Chatting',
          title: stream.title,
          viewerCount: stream.viewer_count,
          startedAt: stream.started_at,
          thumbnailUrl: stream.thumbnail_url
            ?.replace('{width}', '640')
            ?.replace('{height}', '360'),
          type: stream.type,
        }));
        allStreams.push(...formattedStreams);
      }
    }

    const response = NextResponse.json({ streams: allStreams });

    // Headers de cache pour Next.js ISR (30 secondes)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    );

    return response;
  } catch (error) {
    console.error('Error fetching Twitch streams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Compatibilité historique via query param user_logins
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const logins = searchParams
    .get('user_logins')
    ?.split(',')
    .map((login) => login.trim())
    .filter(Boolean) ?? [];

  return fetchStreamsForLogins(logins);
}

/**
 * POST - Recommandé pour les grandes listes (évite les URL trop longues)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const logins = Array.isArray(body?.logins) ? body.logins : [];
    return fetchStreamsForLogins(logins);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body, expected { logins: string[] }' },
      { status: 400 }
    );
  }
}

