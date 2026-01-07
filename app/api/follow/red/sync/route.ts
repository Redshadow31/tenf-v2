import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin';
import { loadMemberDataFromStorage, getMemberData } from '@/lib/memberData';

/**
 * POST - Synchronise les follows de Red depuis Twitch
 * Récupère la liste des chaînes que Red suit via l'API Twitch
 */
export async function POST() {
  try {
    // Vérifier l'authentification
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Charger les données des membres pour récupérer l'ID Twitch de Red
    await loadMemberDataFromStorage();
    
    // Récupérer les données de Red (chercher par login "red" ou "redshadow31" ou similaire)
    // On cherche d'abord par login commun
    const redLogins = ['red', 'redshadow31', 'redshadow'];
    let redMember = null;
    
    for (const login of redLogins) {
      redMember = getMemberData(login);
      if (redMember) break;
    }
    
    // Si pas trouvé, chercher dans tous les membres par displayName
    if (!redMember) {
      const { getAllMemberData } = await import('@/lib/memberData');
      const allMembers = getAllMemberData();
      redMember = allMembers.find(m => 
        m.displayName?.toLowerCase().includes('red') ||
        m.twitchLogin?.toLowerCase().includes('red')
      );
    }

    if (!redMember || !redMember.twitchId) {
      return NextResponse.json(
        { error: "ID Twitch de Red non trouvé. Veuillez d'abord synchroniser l'ID Twitch de Red." },
        { status: 404 }
      );
    }

    const redTwitchId = redMember.twitchId;
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Configuration Twitch manquante" },
        { status: 500 }
      );
    }

    // Obtenir un token d'accès Twitch (client credentials)
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
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

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Impossible d'obtenir un token Twitch" },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Récupérer les follows de Red (chaînes que Red suit)
    // L'API Twitch /helix/users/follows nécessite un token OAuth utilisateur
    // On peut utiliser un token OAuth stocké en variable d'environnement
    const redOAuthToken = process.env.TWITCH_RED_OAUTH_TOKEN;
    
    if (!redOAuthToken) {
      return NextResponse.json(
        { 
          error: "Token OAuth de Red non configuré. Veuillez configurer TWITCH_RED_OAUTH_TOKEN.",
          note: "Pour obtenir un token OAuth, Red doit autoriser l'application Twitch."
        },
        { status: 500 }
      );
    }

    // Récupérer tous les follows de Red (avec pagination)
    let allFollowedUserIds = new Set<string>();
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const followsUrl: string = cursor
        ? `https://api.twitch.tv/helix/users/follows?from_id=${redTwitchId}&first=100&after=${cursor}`
        : `https://api.twitch.tv/helix/users/follows?from_id=${redTwitchId}&first=100`;
      
      const followsResponse = await fetch(followsUrl, {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${redOAuthToken}`,
        },
      });

      if (!followsResponse.ok) {
        const errorText = await followsResponse.text();
        console.error('Twitch API error:', errorText);
        return NextResponse.json(
          { error: "Impossible de récupérer les follows de Red depuis Twitch" },
          { status: 500 }
        );
      }

      const followsData = await followsResponse.json();
      const follows = followsData.data || [];
      
      follows.forEach((follow: any) => {
        allFollowedUserIds.add(follow.to_id);
      });

      cursor = followsData.pagination?.cursor || null;
      hasMore = !!cursor && follows.length === 100;
    }

    // Récupérer les logins Twitch des membres TENF pour comparer
    const { getAllMemberData } = await import('@/lib/memberData');
    const allMembers = getAllMemberData();
    const activeMembers = allMembers.filter(m => m.isActive !== false);

    // Créer un map des IDs Twitch vers les logins
    const memberIdToLogin = new Map<string, string>();
    activeMembers.forEach(member => {
      if (member.twitchId) {
        memberIdToLogin.set(member.twitchId, member.twitchLogin);
      }
    });

    // Récupérer les IDs Twitch des membres qui n'ont pas d'ID
    const membersWithoutId = activeMembers.filter(m => !m.twitchId && m.twitchLogin);
    if (membersWithoutId.length > 0) {
      // Traiter par batch de 100
      for (let i = 0; i < membersWithoutId.length; i += 100) {
        const batch = membersWithoutId.slice(i, i + 100);
        const logins = batch.map(m => m.twitchLogin);
        const loginsParam = logins.map(l => `login=${encodeURIComponent(l.toLowerCase())}`).join('&');
        
        const usersResponse = await fetch(
          `https://api.twitch.tv/helix/users?${loginsParam}`,
          {
            headers: {
              'Client-ID': clientId,
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          (usersData.data || []).forEach((user: any) => {
            memberIdToLogin.set(user.id, user.login);
          });
        }
      }
    }

    // Déterminer quels membres sont suivis par Red
    const followedLogins = new Set<string>();
    allFollowedUserIds.forEach((userId: string) => {
      const login = memberIdToLogin.get(userId);
      if (login) {
        followedLogins.add(login.toLowerCase());
      }
    });

    return NextResponse.json({
      success: true,
      followedLogins: Array.from(followedLogins),
      totalFollowed: followedLogins.size,
      redTwitchId,
      redTwitchLogin: redMember.twitchLogin,
    });
  } catch (error) {
    console.error('Error syncing Red follows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

