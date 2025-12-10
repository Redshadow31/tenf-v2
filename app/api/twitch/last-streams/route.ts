import { NextResponse } from 'next/server';

interface TwitchVideo {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  title: string;
  description: string;
  created_at: string;
  published_at: string;
  url: string;
  thumbnail_url: string;
  viewable: string;
  view_count: number;
  language: string;
  type: string;
  duration: string;
}

interface TwitchVideosResponse {
  data: TwitchVideo[];
  pagination?: {
    cursor?: string;
  };
}

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
 * Récupère la date du dernier stream pour une liste de logins Twitch
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const logins = searchParams.get('logins')?.split(',') ?? [];

  if (logins.length === 0) {
    return NextResponse.json(
      { error: 'No logins provided' },
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
    // D'abord, récupérer les IDs utilisateurs
    const BATCH_SIZE = 100;
    const userMap = new Map<string, string>(); // login -> user_id
    
    for (let i = 0; i < logins.length; i += BATCH_SIZE) {
      const batch = logins.slice(i, i + BATCH_SIZE);
      const queryParams = batch
        .map((login) => `login=${encodeURIComponent(login.trim().toLowerCase())}`)
        .join("&");

      const usersResponse = await fetch(
        `https://api.twitch.tv/helix/users?${queryParams}`,
        {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        usersData.data?.forEach((user: any) => {
          userMap.set(user.login.toLowerCase(), user.id);
        });
      }
    }

    // Ensuite, récupérer la dernière vidéo pour chaque utilisateur
    const lastStreams: Record<string, string> = {}; // login -> last_stream_date

    for (const login of logins) {
      const userId = userMap.get(login.toLowerCase());
      if (!userId) {
        continue;
      }

      try {
        // Récupérer les dernières vidéos (type=archive pour les streams terminés)
        const videosResponse = await fetch(
          `https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive&first=1&sort=time`,
          {
            headers: {
              "Client-ID": clientId,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (videosResponse.ok) {
          const videosData: TwitchVideosResponse = await videosResponse.json();
          if (videosData.data && videosData.data.length > 0) {
            // Prendre la vidéo la plus récente
            const latestVideo = videosData.data[0];
            lastStreams[login.toLowerCase()] = latestVideo.created_at;
          }
        }
      } catch (error) {
        console.error(`Error fetching last stream for ${login}:`, error);
        // Continuer avec le suivant
      }
    }

    return NextResponse.json({ lastStreams });
  } catch (error) {
    console.error('Error fetching last streams:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

