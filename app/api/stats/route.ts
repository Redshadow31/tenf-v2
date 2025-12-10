import { NextResponse } from 'next/server';
import { getAllActiveMemberData } from '@/lib/memberData';

// ID du salon Discord pour compter les membres
const MEMBERS_CHANNEL_ID = '1300154679614898247';

/**
 * GET - Récupère les statistiques pour la page d'accueil
 */
export async function GET() {
  try {
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    // 1. Compter les membres du salon Discord (membres qui ont posté dans ce canal)
    let discordChannelMembersCount = 0;
    if (DISCORD_BOT_TOKEN) {
      try {
        // Récupérer les messages du canal pour compter les membres uniques
        const messagesResponse = await fetch(
          `https://discord.com/api/v10/channels/${MEMBERS_CHANNEL_ID}/messages?limit=100`,
          {
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            },
          }
        );

        if (messagesResponse.ok) {
          const messages: any[] = await messagesResponse.json();
          // Compter les auteurs uniques (membres qui ont posté dans ce canal)
          const uniqueAuthors = new Set(
            messages
              .filter(msg => msg.author && !msg.author.bot)
              .map(msg => msg.author.id)
          );
          discordChannelMembersCount = uniqueAuthors.size;
        }
      } catch (error) {
        console.error('Error fetching Discord channel members count:', error);
      }
    }

    // 2. Compter les membres actifs depuis le système centralisé (isActive: true)
    const activeMembers = getAllActiveMemberData();
    const activeMembersCount = activeMembers.length;

    // 3. Compter les lives en cours (utiliser la même logique que /api/twitch/streams)
    let livesCount = 0;
    try {
      const twitchLogins = activeMembers
        .map(member => member.twitchLogin)
        .filter(Boolean);

      if (twitchLogins.length > 0) {
        // Utiliser directement la logique de l'API Twitch
        const accessToken = await getTwitchAccessToken();
        if (accessToken) {
          // Récupérer les IDs utilisateurs depuis les logins
          const userLogins = twitchLogins.slice(0, 100); // Limite API Twitch
          const userLoginsParam = userLogins.map(l => `login=${l}`).join('&');
          
          const usersResponse = await fetch(
            `https://api.twitch.tv/helix/users?${userLoginsParam}`,
            {
              headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID || '',
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );

          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            const userIds = (usersData.data || []).map((user: any) => user.id);

            if (userIds.length > 0) {
              // Récupérer les streams en cours
              const userIdsParam = userIds.map((id: string) => `user_id=${id}`).join('&');
              const streamsResponse = await fetch(
                `https://api.twitch.tv/helix/streams?${userIdsParam}`,
                {
                  headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID || '',
                    'Authorization': `Bearer ${accessToken}`,
                  },
                }
              );

              if (streamsResponse.ok) {
                const streamsData = await streamsResponse.json();
                const liveStreams = (streamsData.data || []).filter((stream: any) => stream.type === 'live');
                livesCount = liveStreams.length;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching live streams count:', error);
    }

    return NextResponse.json({
      totalMembers: discordChannelMembersCount,
      activeMembers: activeMembersCount,
      livesInProgress: livesCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Récupère un token d'accès Twitch
 */
async function getTwitchAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
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

    if (response.ok) {
      const data = await response.json();
      return data.access_token || null;
    }
  } catch (error) {
    console.error('Error getting Twitch access token:', error);
  }
  return null;
}


