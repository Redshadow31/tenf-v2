import { NextResponse } from 'next/server';
import { memberRepository } from '@/lib/repositories';
import { getTwitchUsers } from '@/lib/twitch';
import { GUILD_ID } from '@/lib/discordRoles';

// Cache ISR de 30 secondes pour la page d'accueil
export const revalidate = 30;

interface HomeData {
  stats: {
    totalMembers: number;
    activeMembers: number;
    livesInProgress: number;
  };
  vipMembers: any[];
  lives: any[];
}

// Plus besoin d'initialiser memberData, on utilise directement Supabase

/**
 * GET - Récupère toutes les données nécessaires pour la page d'accueil
 * Appelle directement les fonctions serveur (plus efficace que des fetch internes)
 * avec cache de 30 secondes
 */
export async function GET() {
  try {
    // Récupérer les membres actifs d'abord (nécessaire pour les stats et les lives)
    const activeMembers = await getActiveMembersData();
    
    // Récupérer les stats et VIP en parallèle
    const [statsData, vipMembers] = await Promise.all([
      getStatsData(),
      getVipMembersData(),
    ]);

    // Récupérer les streams en cours et mettre à jour le nombre de lives dans les stats
    let lives: any[] = [];
    let livesCount = 0;
    if (activeMembers.length > 0) {
      const twitchLogins = activeMembers
        .map((member: any) => member.twitchLogin)
        .filter(Boolean);

      if (twitchLogins.length > 0) {
        try {
          const result = await getLiveStreams(twitchLogins, activeMembers);
          lives = result.streams;
          livesCount = result.count;
        } catch (error) {
          console.error('[Home API] Error fetching streams:', error);
        }
      }
    }

    // Mettre à jour les stats avec le nombre réel de lives
    const stats = {
      ...statsData,
      livesInProgress: livesCount,
    };

    const homeData: HomeData = {
      stats,
      vipMembers,
      lives,
    };

    const response = NextResponse.json(homeData);

    // Headers de cache pour Next.js ISR
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    );

    return response;
  } catch (error) {
    console.error('[Home API] Error:', error);
    return NextResponse.json(
      {
        stats: { totalMembers: 0, activeMembers: 0, livesInProgress: 0 },
        vipMembers: [],
        lives: [],
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Récupère les statistiques
 */
async function getStatsData() {
  // Compter les membres actifs depuis Supabase
  let activeMembersCount = 0;
  try {
    activeMembersCount = await memberRepository.countActive();
  } catch (error) {
    console.error('[Home API] Error counting active members:', error);
  }

  // Compter Discord members
  let totalDiscordMembers = 0;
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  if (DISCORD_BOT_TOKEN) {
    try {
      const guildResponse = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`,
        {
          headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
        }
      );
      if (guildResponse.ok) {
        const guildData: any = await guildResponse.json();
        totalDiscordMembers = guildData.approximate_member_count || guildData.member_count || 0;
      }
    } catch (error) {
      console.error('[Home API] Error fetching Discord stats:', error);
    }
  }

  // Compter les lives (simplifié - on le fait aussi dans getLiveStreams mais on peut réutiliser)
  // Pour éviter la duplication, on retourne 0 ici et on le calcule dans getLiveStreams
  return {
    totalMembers: totalDiscordMembers,
    activeMembers: activeMembersCount,
    livesInProgress: 0, // Sera calculé dans getLiveStreams
  };
}

/**
 * Récupère les membres VIP
 */
async function getVipMembersData() {
  try {
    // Récupérer les membres VIP depuis Supabase
    const vipMemberData = await memberRepository.findVip();
    
    if (vipMemberData.length === 0) {
      return [];
    }

    const twitchLogins = vipMemberData
      .map(member => member.twitchLogin)
      .filter(Boolean) as string[];
    
    const twitchUsers = await getTwitchUsers(twitchLogins);
    const avatarMap = new Map(
      twitchUsers.map(user => [user.login.toLowerCase(), user.profile_image_url])
    );

    return vipMemberData.map((member) => {
      const twitchAvatar = avatarMap.get(member.twitchLogin?.toLowerCase());
      let avatar = twitchAvatar;
      if (!avatar && member.discordId) {
        avatar = `https://cdn.discordapp.com/embed/avatars/${parseInt(member.discordId) % 5}.png`;
      }
      if (!avatar) {
        avatar = `https://placehold.co/128x128?text=${member.displayName?.charAt(0) || 'V'}`;
      }

      return {
        discordId: member.discordId || '',
        username: member.discordUsername || member.displayName,
        avatar: avatar,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        twitchLogin: member.twitchLogin,
        twitchUrl: member.twitchUrl,
        twitchAvatar: twitchAvatar,
      };
    });
  } catch (error) {
    console.error('[Home API] Error fetching VIP members:', error);
    return [];
  }
}

/**
 * Récupère les membres actifs
 */
async function getActiveMembersData() {
  try {
    // Récupérer tous les membres actifs depuis Supabase (limite élevée pour avoir tous les membres)
    const activeMembers = await memberRepository.findActive(10000, 0);
    
    const twitchLogins = activeMembers
      .map(member => member.twitchLogin)
      .filter(Boolean) as string[];
    
    const twitchUsers = await getTwitchUsers(twitchLogins);
    const avatarMap = new Map(
      twitchUsers.map(user => [user.login.toLowerCase(), user.profile_image_url])
    );

    return activeMembers.map((member) => {
      let avatar: string | undefined = avatarMap.get(member.twitchLogin?.toLowerCase());
      if (!avatar && member.discordId) {
        avatar = `https://cdn.discordapp.com/embed/avatars/${parseInt(member.discordId) % 5}.png`;
      }

      return {
        twitchLogin: member.twitchLogin,
        twitchUrl: member.twitchUrl,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        avatar: avatar,
      };
    });
  } catch (error) {
    console.error('[Home API] Error fetching active members:', error);
    return [];
  }
}

/**
 * Récupère les streams en cours
 */
async function getLiveStreams(twitchLogins: string[], activeMembers: any[]): Promise<{ streams: any[]; count: number }> {
  const accessToken = await getTwitchAccessToken();
  if (!accessToken) return { streams: [], count: 0 };

  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) return { streams: [], count: 0 };

  const BATCH_SIZE = 99;
  const allStreams: any[] = [];

  for (let i = 0; i < twitchLogins.length; i += BATCH_SIZE) {
    const batch = twitchLogins.slice(i, i + BATCH_SIZE);
    const params = batch.map((login) => `user_login=${encodeURIComponent(login.trim().toLowerCase())}`).join('&');

    try {
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
        if (streams.length > 0) {
          allStreams.push(...streams.map((stream: any) => ({
            id: stream.id,
            userId: stream.user_id,
            userLogin: stream.user_login,
            userName: stream.user_name,
            gameName: stream.game_name || 'Just Chatting',
            title: stream.title,
            thumbnailUrl: stream.thumbnail_url?.replace('{width}', '640')?.replace('{height}', '360'),
            type: stream.type,
          })));
        }
      }
    } catch (error) {
      console.error(`[Home API] Error fetching streams batch ${i / BATCH_SIZE + 1}:`, error);
    }
  }

  // Filtrer uniquement les streams en live et enrichir avec les données membres
  const liveStreams = allStreams
    .filter((stream: any) => stream.type === 'live')
    .map((stream: any) => {
      const member = activeMembers.find(
        (m: any) => m.twitchLogin?.toLowerCase() === stream.userLogin.toLowerCase()
      );
      return {
        id: stream.userLogin,
        username: member?.displayName || stream.userName,
        game: stream.gameName || "Just Chatting",
        thumbnail: stream.thumbnailUrl || "/api/placeholder/400/225",
        twitchUrl: member?.twitchUrl || `https://www.twitch.tv/${stream.userLogin}`,
      };
    });

  return {
    streams: liveStreams,
    count: liveStreams.length,
  };
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
    console.error('[Home API] Error getting Twitch access token:', error);
  }
  return null;
}
