import { NextResponse } from 'next/server';
import { getAllActiveMemberDataFromAllLists, loadMemberDataFromStorage, initializeMemberData } from '@/lib/memberData';
import { allMembers } from '@/lib/members';
import { GUILD_ID } from '@/lib/discordRoles';

/**
 * GET - Récupère les statistiques pour la page d'accueil
 */
export async function GET() {
  try {
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    
    // 1. Récupérer le nombre total de membres du serveur Discord
    let totalDiscordMembers = 0;
    if (DISCORD_BOT_TOKEN) {
      try {
        // Récupérer les informations du serveur Discord (contient member_count)
        const guildResponse = await fetch(
          `https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`,
          {
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            },
          }
        );

        if (guildResponse.ok) {
          const guildData: any = await guildResponse.json();
          // member_count est le nombre total de membres (hors bots)
          // approximate_member_count est une estimation si le serveur est grand
          totalDiscordMembers = guildData.approximate_member_count || guildData.member_count || 0;
        }
      } catch (error) {
        console.error('Error fetching Discord server member count:', error);
        // Fallback : essayer de compter via les membres récupérés
        try {
          const membersResponse = await fetch(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`,
            {
              headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
              },
            }
          );
          if (membersResponse.ok) {
            const members: any[] = await membersResponse.json();
            // Compter uniquement les membres (pas les bots)
            totalDiscordMembers = members.filter(m => !m.user?.bot).length;
          }
        } catch (fallbackError) {
          console.error('Error in fallback member count:', fallbackError);
        }
      }
    }

    // Initialiser les données membres si nécessaire
    initializeMemberData();
    
    // Charger les données depuis le stockage persistant (Blobs ou fichier)
    await loadMemberDataFromStorage();
    
    // 2. Compter le nombre total de membres actifs
    // Utiliser allMembers comme source de vérité (membres enregistrés dans le site)
    // C'est la liste complète des membres TENF enregistrés
    const activeMembersCount = allMembers.length;
    
    // Pour les lives, utiliser les logins Twitch de allMembers
    const twitchLoginsForLives = allMembers.map(m => m.twitchLogin).filter(Boolean);
    
    // Debug: logger le nombre de membres actifs
    console.log(`[Stats API] Active members count (from allMembers): ${activeMembersCount}`);

    // 3. Compter les lives en cours (utiliser la même logique que /api/twitch/streams et la page /lives)
    let livesCount = 0;
    try {
      console.log(`[Stats API] Members with Twitch: ${twitchLoginsForLives.length}`);
      
      if (twitchLoginsForLives.length > 0) {
        const accessToken = await getTwitchAccessToken();
        if (!accessToken) {
          console.error('[Stats API] Failed to get Twitch access token');
        } else {
          const clientId = process.env.TWITCH_CLIENT_ID;
          if (!clientId) {
            console.error('[Stats API] Twitch Client ID not configured');
          } else {
            // Utiliser la même logique que /api/twitch/streams : batches de 99 logins
            const BATCH_SIZE = 99;
            let totalLives = 0;
            
            for (let i = 0; i < twitchLoginsForLives.length; i += BATCH_SIZE) {
              const batch = twitchLoginsForLives.slice(i, i + BATCH_SIZE);
              
              const params = batch
                .map((login) => `user_login=${encodeURIComponent(login.trim().toLowerCase())}`)
                .join('&');

              const streamsResponse = await fetch(
                `https://api.twitch.tv/helix/streams?${params}`,
                {
                  headers: {
                    'Client-ID': clientId,
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );

              if (streamsResponse.ok) {
                const streamsData = await streamsResponse.json();
                const streams = streamsData.data || [];
                // Filtrer uniquement les streams vraiment en live (même logique que la page lives)
                const liveStreamsOnly = streams.filter((stream: any) => stream.type === "live");
                totalLives += liveStreamsOnly.length;
              } else {
                const errorText = await streamsResponse.text();
                console.error(`[Stats API] Twitch Streams API error for batch ${i / BATCH_SIZE + 1}:`, errorText);
              }
            }
            
            livesCount = totalLives;
            console.log(`[Stats API] Total lives in progress: ${livesCount}`);
          }
        }
      } else {
        console.log('[Stats API] No members with Twitch login');
      }
    } catch (error) {
      console.error('[Stats API] Error fetching live streams count:', error);
    }

    return NextResponse.json({
      totalMembers: totalDiscordMembers,
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


