import { NextResponse } from 'next/server';
import { getAllMemberData, getAllActiveMemberData } from '@/lib/memberData';
import { initializeMemberData } from '@/lib/memberData';

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
    
    // Mapper vers un format simplifié pour la page publique
    const publicMembers = activeMembers.map((member) => ({
      twitchLogin: member.twitchLogin,
      twitchUrl: member.twitchUrl,
      displayName: member.displayName || member.siteUsername || member.twitchLogin,
      role: member.role,
      isVip: member.isVip,
      badges: member.badges || [],
      discordId: member.discordId,
      discordUsername: member.discordUsername,
      // Avatar depuis Discord si disponible
      avatar: member.discordId 
        ? `https://cdn.discordapp.com/avatars/${member.discordId}/avatar.png`
        : undefined,
    }));

    return NextResponse.json({ 
      members: publicMembers,
      total: publicMembers.length 
    });
  } catch (error) {
    console.error("Error fetching public members:", error);
    return NextResponse.json(
      { error: "Erreur serveur", members: [], total: 0 },
      { status: 500 }
    );
  }
}

