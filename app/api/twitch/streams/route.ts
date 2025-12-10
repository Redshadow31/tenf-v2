import { NextResponse } from 'next/server';

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

/**
 * Récupère les streams Twitch en cours pour une liste de logins
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const logins = searchParams.get('user_logins')?.split(',') ?? [];

  if (logins.length === 0) {
    return NextResponse.json(
      { error: 'No user logins provided' },
      { status: 400 }
    );
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
    // L'API Twitch permet jusqu'à 100 utilisateurs par requête
    const loginsToFetch = logins.slice(0, 100);
    const params = loginsToFetch
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
      console.error('Twitch Streams API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch Twitch streams', details: errorText },
        { status: response.status }
      );
    }

    const data: TwitchStreamsResponse = await response.json();

    // Formater les données pour l'application
    // On renvoie directement data.data sans filtrage (Twitch ne retourne que les streams actifs)
    const streams = data.data.map((stream) => ({
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

    return NextResponse.json({ streams });
  } catch (error) {
    console.error('Error fetching Twitch streams:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

