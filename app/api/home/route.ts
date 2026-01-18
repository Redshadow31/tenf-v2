import { NextResponse } from 'next/server';

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

/**
 * GET - Récupère toutes les données nécessaires pour la page d'accueil
 * Consolide les appels à /api/stats, /api/vip-members, /api/members/public et /api/twitch/streams
 * avec cache de 30 secondes
 */
export async function GET() {
  try {
    // Appeler toutes les APIs en parallèle avec Promise.all
    const [statsResponse, vipMembersResponse, membersResponse] = await Promise.all([
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stats`, {
        next: { revalidate: 30 },
      }),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/vip-members`, {
        next: { revalidate: 30 },
      }),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/members/public`, {
        next: { revalidate: 30 },
      }),
    ]);

    // Récupérer les données
    const stats = statsResponse.ok ? await statsResponse.json() : { totalMembers: 0, activeMembers: 0, livesInProgress: 0 };
    const vipData = vipMembersResponse.ok ? await vipMembersResponse.json() : { members: [] };
    const membersData = membersResponse.ok ? await membersResponse.json() : { members: [] };

    const activeMembers = membersData.members || [];
    const vipMembers = vipData.members || [];

    // Récupérer les streams en cours uniquement si on a des membres actifs
    let lives: any[] = [];
    if (activeMembers.length > 0) {
      const twitchLogins = activeMembers
        .map((member: any) => member.twitchLogin)
        .filter(Boolean);

      if (twitchLogins.length > 0) {
        try {
          // Utiliser le cache de 30s également pour les streams
          const userLoginsParam = twitchLogins.join(',');
          const streamsResponse = await fetch(
            `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/twitch/streams?user_logins=${encodeURIComponent(userLoginsParam)}`,
            {
              next: { revalidate: 30 },
            }
          );

          if (streamsResponse.ok) {
            const streamsData = await streamsResponse.json();
            const liveStreams = (streamsData.streams || [])
              .filter((stream: any) => stream.type === 'live')
              .map((stream: any) => {
                const member = activeMembers.find(
                  (m: any) => m.twitchLogin.toLowerCase() === stream.userLogin.toLowerCase()
                );
                return {
                  id: stream.userLogin,
                  username: member?.displayName || stream.userName,
                  game: stream.gameName || "Just Chatting",
                  thumbnail: stream.thumbnailUrl || "/api/placeholder/400/225",
                  twitchUrl: member?.twitchUrl || `https://www.twitch.tv/${stream.userLogin}`,
                };
              });

            lives = liveStreams;
          }
        } catch (error) {
          console.error('[Home API] Error fetching streams:', error);
        }
      }
    }

    const homeData: HomeData = {
      stats: {
        totalMembers: stats.totalMembers || 0,
        activeMembers: stats.activeMembers || 0,
        livesInProgress: stats.livesInProgress || 0,
      },
      vipMembers: vipMembers,
      lives: lives,
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
