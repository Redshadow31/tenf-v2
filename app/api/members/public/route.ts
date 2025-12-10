import { NextResponse } from 'next/server';
import { getAllMemberData, getAllActiveMemberData } from '@/lib/memberData';
import { initializeMemberData } from '@/lib/memberData';
import { getTwitchUser } from '@/lib/twitch';

// Désactiver le cache pour cette route - les données doivent toujours être à jour
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Initialiser les données au démarrage du serveur
let initialized = false;
if (!initialized) {
  initializeMemberData();
  initialized = true;
}

/**
 * GET - Récupère tous les membres actifs (API publique, pas d'authentification requise)
 */
export async function GET() {
  try {
    // Récupérer tous les membres actifs depuis la base de données centralisée
    const activeMembers = getAllActiveMemberData();
    
    // Mapper vers un format simplifié pour la page publique avec avatars Twitch
    const publicMembers = await Promise.all(
      activeMembers.map(async (member) => {
        // Récupérer l'avatar depuis Twitch
        let avatar: string | undefined = undefined;
        try {
          const twitchUser = await getTwitchUser(member.twitchLogin);
          avatar = twitchUser.profile_image_url;
        } catch (err) {
          // Si erreur, utiliser Discord en fallback, sinon undefined
          if (member.discordId) {
            avatar = `https://cdn.discordapp.com/avatars/${member.discordId}/avatar.png`;
          }
        }

        return {
          twitchLogin: member.twitchLogin,
          twitchUrl: member.twitchUrl,
          displayName: member.displayName || member.siteUsername || member.twitchLogin,
          role: member.role,
          isVip: member.isVip,
          badges: member.badges || [],
          discordId: member.discordId,
          discordUsername: member.discordUsername,
          avatar: avatar,
        };
      })
    );

    const response = NextResponse.json({ 
      members: publicMembers,
      total: publicMembers.length 
    });

    // Désactiver le cache côté client
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error("Error fetching public members:", error);
    return NextResponse.json(
      { error: "Erreur serveur", members: [], total: 0 },
      { status: 500 }
    );
  }
}

