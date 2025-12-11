import { NextResponse } from 'next/server';
import { getAllMemberData, getAllActiveMemberData, getAllActiveMemberDataFromAllLists, loadMemberDataFromStorage } from '@/lib/memberData';
import { initializeMemberData } from '@/lib/memberData';
import { getTwitchUsers } from '@/lib/twitch';
import { getVipBadgeText } from '@/lib/vipHistory';
import { getMemberDescription } from '@/lib/memberDescriptions';

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
    // Charger les données depuis le stockage persistant (Blobs ou fichier)
    await loadMemberDataFromStorage();
    
    // Récupérer tous les membres actifs de toutes les listes (1, 2, et 3) depuis la base de données centralisée
    const activeMembers = getAllActiveMemberDataFromAllLists();
    
    // Récupérer tous les logins Twitch uniques
    const twitchLogins = activeMembers
      .map(member => member.twitchLogin)
      .filter(Boolean) as string[];
    
    // Récupérer tous les avatars Twitch en batch (beaucoup plus rapide)
    const twitchUsers = await getTwitchUsers(twitchLogins);
    
    // Créer un map pour un accès rapide par login
    const avatarMap = new Map(
      twitchUsers.map(user => [user.login.toLowerCase(), user.profile_image_url])
    );
    
    // Mapper vers un format simplifié pour la page publique avec avatars Twitch
    const publicMembers = activeMembers.map((member) => {
      // Récupérer l'avatar depuis le map (déjà récupéré en batch)
      let avatar: string | undefined = avatarMap.get(member.twitchLogin.toLowerCase());
      
      // Si pas d'avatar Twitch, utiliser Discord en fallback
      if (!avatar && member.discordId) {
        // Utiliser l'avatar Discord par défaut (sans hash, Discord générera un avatar par défaut)
        avatar = `https://cdn.discordapp.com/embed/avatars/${parseInt(member.discordId) % 5}.png`;
      }

      // Calculer le badge VIP+N si le membre est VIP
      const vipBadge = member.isVip ? getVipBadgeText(member.twitchLogin) : undefined;

      // Générer la description (personnalisée ou générique)
      const description = getMemberDescription({
        description: member.description,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        role: member.role,
      });

      return {
        twitchLogin: member.twitchLogin,
        twitchUrl: member.twitchUrl,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        role: member.role,
        isVip: member.isVip,
        vipBadge: vipBadge,
        badges: member.badges || [],
        discordId: member.discordId,
        discordUsername: member.discordUsername,
        avatar: avatar,
        description: description,
      };
    });

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

