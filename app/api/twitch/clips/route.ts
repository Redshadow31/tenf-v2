import { NextResponse } from 'next/server';

interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  vod_offset: number | null;
}

interface TwitchClipsResponse {
  data: TwitchClip[];
  pagination?: {
    cursor?: string;
  };
}

async function getTwitchAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Twitch credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get Twitch access token:', errorText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Twitch access token:', error);
    return null;
  }
}

/**
 * Récupère les clips Twitch pour une liste de broadcaster IDs
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const broadcasterIds = searchParams.get('broadcaster_ids')?.split(',') ?? [];
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  if (broadcasterIds.length === 0) {
    return NextResponse.json(
      { error: 'No broadcaster IDs provided' },
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
    const allClips: TwitchClip[] = [];
    
    // Récupérer les clips pour chaque broadcaster (max 100 par requête)
    for (const broadcasterId of broadcasterIds) {
      try {
        const response = await fetch(
          `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&first=${Math.min(limit, 100)}`,
          {
            headers: {
              'Client-ID': clientId,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Twitch Clips API error for broadcaster ${broadcasterId}:`, errorText);
          continue;
        }

        const data: TwitchClipsResponse = await response.json();
        
        if (data.data && data.data.length > 0) {
          allClips.push(...data.data);
        }
      } catch (error) {
        console.error(`Error fetching clips for broadcaster ${broadcasterId}:`, error);
        continue;
      }
    }

    // Trier par nombre de vues (décroissant)
    allClips.sort((a, b) => b.view_count - a.view_count);

    // Formater les clips
    const formattedClips = allClips.map((clip) => ({
      id: clip.id,
      url: clip.url,
      title: clip.title,
      thumbnailUrl: clip.thumbnail_url,
      creatorId: clip.creator_id,
      creatorName: clip.creator_name,
      broadcasterId: clip.broadcaster_id,
      broadcasterName: clip.broadcaster_name,
      viewCount: clip.view_count,
      createdAt: clip.created_at,
      duration: clip.duration,
      embedUrl: clip.embed_url,
    }));

    return NextResponse.json({ clips: formattedClips });
  } catch (error) {
    console.error('Error fetching Twitch clips:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

