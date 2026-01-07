import { NextResponse } from 'next/server';
import { getAllActiveMemberDataFromAllLists, loadMemberDataFromStorage } from '@/lib/memberData';
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

    // Charger les données depuis le stockage persistant (Blobs ou fichier)
    await loadMemberDataFromStorage();
    
    // 2. Compter le nombre total de membres depuis la gestion des membres (tous les membres, pas seulement les listes)
    const { getAllMemberData } = await import('@/lib/memberData');
    const allMembers = getAllMemberData();
    
    // Debug: logger le nombre de membres récupérés
    console.log(`[Stats API] Total members from getAllMemberData: ${allMembers.length}`);
    
    // Filtrer uniquement les membres actifs (même logique que la page admin : isActive !== false)
    // Un membre est actif si isActive est true ou undefined (par défaut actif)
    const activeMembers = allMembers.filter(member => {
      // Si isActive est explicitement false, le membre est inactif
      // Sinon (true ou undefined), le membre est actif
      return member.isActive !== false;
    });
    const activeMembersCount = activeMembers.length;
    
    // Debug: logger le nombre de membres actifs
    console.log(`[Stats API] Active members count: ${activeMembersCount}`);

    // 3. Compter les lives en cours (utiliser la même logique que /api/twitch/streams)
    let livesCount = 0;
    try {
      // Utiliser les twitchId si disponibles, sinon utiliser twitchLogin
      const membersWithTwitch = activeMembers.filter(member => member.twitchLogin || member.twitchId);
      
      console.log(`[Stats API] Members with Twitch: ${membersWithTwitch.length}`);
      
      if (membersWithTwitch.length > 0) {
        const accessToken = await getTwitchAccessToken();
        if (!accessToken) {
          console.error('[Stats API] Failed to get Twitch access token');
        } else {
          console.log('[Stats API] Twitch access token obtained');
          // Essayer d'abord avec les twitchId si disponibles
          const membersWithId = membersWithTwitch.filter(m => m.twitchId);
          const membersWithoutId = membersWithTwitch.filter(m => !m.twitchId);
          
          let allUserIds: string[] = [];
          
          // Utiliser les IDs Twitch déjà stockés
          if (membersWithId.length > 0) {
            allUserIds = membersWithId
              .map(m => m.twitchId)
              .filter(Boolean) as string[];
          }
          
          // Pour les membres sans ID, récupérer les IDs depuis les logins
          if (membersWithoutId.length > 0) {
            const twitchLogins = membersWithoutId
              .map(member => member.twitchLogin)
              .filter(Boolean)
              .slice(0, 100); // Limite API Twitch pour les logins
            
            if (twitchLogins.length > 0) {
              // Construire correctement la requête avec login (pour /helix/users)
              // L'API Twitch /helix/users utilise "login" et non "user_login"
              const userLoginsParam = twitchLogins.map(l => `login=${encodeURIComponent(l.trim().toLowerCase())}`).join('&');
              
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
                const userIdsFromLogins = (usersData.data || []).map((user: any) => user.id);
                allUserIds = [...allUserIds, ...userIdsFromLogins];
              }
            }
          }

          // Récupérer les streams en cours pour tous les IDs
          if (allUserIds.length > 0) {
            // L'API Twitch accepte jusqu'à 100 user_id par requête
            const batches = [];
            for (let i = 0; i < allUserIds.length; i += 100) {
              batches.push(allUserIds.slice(i, i + 100));
            }
            
            let totalLives = 0;
            for (const batch of batches) {
              const userIdsParam = batch.map((id: string) => `user_id=${id}`).join('&');
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
                totalLives += liveStreams.length;
              }
            }
            livesCount = totalLives;
            console.log(`[Stats API] Total lives in progress: ${livesCount}`);
          } else {
            console.log('[Stats API] No user IDs to check for streams');
          }
        }
      } else {
        console.log('[Stats API] No access token or no members with Twitch');
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


