import { NextResponse } from 'next/server';
import { loadAdminDataFromStorage, initializeMemberData } from '@/lib/memberData';
import { GUILD_ID } from '@/lib/discordRoles';

// Cache ISR de 30 secondes pour les statistiques
export const revalidate = 30;

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
    
    // 2. Compter le nombre total de membres actifs
    // IMPORTANT: Utiliser UNIQUEMENT tenf-admin-members (sans fusion avec bot)
    // Pour éviter les bugs, compter uniquement les membres avec isActive: true dans tenf-admin-members
    let adminData: Record<string, any>;
    try {
      adminData = await loadAdminDataFromStorage();
      console.log(`[Stats API] Successfully loaded admin data. Keys count: ${Object.keys(adminData).length}`);
    } catch (error) {
      console.error(`[Stats API] ERROR loading admin data:`, error);
      return NextResponse.json(
        { error: 'Failed to load admin data', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
    
    const allAdminMembers = Object.values(adminData);
    console.log(`[Stats API] Total members in tenf-admin-members Blob: ${allAdminMembers.length}`);
    
    // Analyser les valeurs isActive pour comprendre le problème
    const activeCount = allAdminMembers.filter(m => m.isActive === true).length;
    const inactiveCount = allAdminMembers.filter(m => m.isActive === false).length;
    const undefinedActive = allAdminMembers.filter(m => m.isActive === undefined).length;
    
    console.log(`[Stats API] Members with isActive=true: ${activeCount}`);
    console.log(`[Stats API] Members with isActive=false: ${inactiveCount}`);
    console.log(`[Stats API] Members with isActive=undefined: ${undefinedActive}`);
    
    // Compter UNIQUEMENT les membres avec isActive === true du Blob tenf-admin-members
    // Gérer aussi le cas où isActive pourrait être une string "true" (par sécurité)
    const activeMembers = allAdminMembers.filter(m => {
      // Vérifier si isActive est true (boolean) ou "true" (string)
      return m.isActive === true || m.isActive === "true";
    });
    const activeMembersCount = activeMembers.length;
    
    // Logs détaillés pour déboguer
    console.log(`[Stats API] Active members count: ${activeMembersCount} (from tenf-admin-members Blob only)`);
    
    // Si aucun membre actif, logger quelques détails pour déboguer
    if (activeMembersCount === 0 && allAdminMembers.length > 0) {
      const sampleMembers = allAdminMembers.slice(0, 10);
      console.log(`[Stats API] WARNING: No active members found! Sample of first 10 members:`, 
        sampleMembers.map(m => ({ 
          twitchLogin: m.twitchLogin, 
          isActive: m.isActive,
          typeofIsActive: typeof m.isActive,
          role: m.role,
          listId: m.listId
        }))
      );
      
      // Vérifier quelques membres actifs manuellement
      const manuallyFoundActive = allAdminMembers.filter(m => {
        const isActiveValue = (m as any).isActive;
        return isActiveValue === true || isActiveValue === "true" || isActiveValue === 1;
      });
      console.log(`[Stats API] Manual check: Found ${manuallyFoundActive.length} members with isActive=true/\"true\"/1`);
    } else if (allAdminMembers.length === 0) {
      console.log(`[Stats API] WARNING: tenf-admin-members Blob is EMPTY! No admin members found.`);
    }

    // 3. Compter les lives en cours (utiliser EXACTEMENT la même logique que la page /lives)
    // Utiliser uniquement les membres actifs de tenf-admin-members (comme pour le compteur)
    let livesCount = 0;
    try {
      // Utiliser uniquement les membres actifs de tenf-admin-members (sans fusion avec bot)
      const activeMembersForLives = activeMembers;
      
      const twitchLogins = activeMembersForLives
        .map((member) => member.twitchLogin)
        .filter(Boolean) as string[];
      
      console.log(`[Stats API] Active members for lives: ${activeMembersForLives.length}`);
      console.log(`[Stats API] Twitch logins: ${twitchLogins.length}`);
      
      if (twitchLogins.length > 0) {
        // Appeler directement l'API Twitch comme /api/twitch/streams le fait
        const accessToken = await getTwitchAccessToken();
        if (!accessToken) {
          console.error('[Stats API] Failed to get Twitch access token');
        } else {
          const clientId = process.env.TWITCH_CLIENT_ID;
          if (!clientId) {
            console.error('[Stats API] Twitch Client ID not configured');
          } else {
            // Utiliser exactement la même logique que /api/twitch/streams : batches de 99 logins
            const BATCH_SIZE = 99;
            const allStreams: any[] = [];
            
            for (let i = 0; i < twitchLogins.length; i += BATCH_SIZE) {
              const batch = twitchLogins.slice(i, i + BATCH_SIZE);
              
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
                
                // Ajouter tous les streams trouvés (comme dans /api/twitch/streams)
                if (streams.length > 0) {
                  const formattedStreams = streams.map((stream: any) => ({
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
              } else {
                const errorText = await streamsResponse.text();
                console.error(`[Stats API] Twitch Streams API error for batch ${i / BATCH_SIZE + 1}:`, errorText);
              }
            }
            
            // Filtrer uniquement les streams vraiment en live (comme la page /lives ligne 100)
            const liveStreamsOnly = allStreams.filter((stream: any) => stream.type === "live");
            
            // Enrichir et filtrer pour ne garder que les streams des membres actifs (comme la page /lives ligne 105-135)
            // Créer un Set des logins Twitch actifs pour une recherche rapide
            const activeMembersSet = new Set(
              activeMembersForLives.map(m => m.twitchLogin.toLowerCase())
            );
            
            const enrichedLives = liveStreamsOnly.map((stream: any) => {
              // Vérifier si le stream appartient à un membre actif (comme la page /lives ligne 107-109)
              if (activeMembersSet.has(stream.userLogin.toLowerCase())) {
                return stream;
              }
              return null;
            });
            
            // Filtrer les nulls (comme la page /lives ligne 135)
            const validLives = enrichedLives.filter((live: any) => live !== null);
            
            livesCount = validLives.length;
            
            console.log(`[Stats API] Total streams from Twitch: ${allStreams.length}`);
            console.log(`[Stats API] Live streams only: ${liveStreamsOnly.length}`);
            console.log(`[Stats API] Valid lives from active members: ${livesCount}`);
          }
        }
      }
    } catch (error) {
      console.error('[Stats API] Error fetching live streams count:', error);
    }

    const response = NextResponse.json({
      totalMembers: totalDiscordMembers,
      activeMembers: activeMembersCount,
      livesInProgress: livesCount,
    });

    // Headers de cache pour Next.js ISR (30 secondes)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    );

    return response;
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

