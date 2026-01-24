import { NextResponse } from 'next/server';
import { memberRepository } from '@/lib/repositories';
import { getTwitchUsers } from '@/lib/twitch';
import { getVipBadgeText } from '@/lib/vipHistory';
import { getMemberDescription } from '@/lib/memberDescriptions';

// Activer le cache avec revalidation ISR de 60 secondes
// Les avatars Twitch sont mis en cache séparément dans lib/twitch.ts (24h)
export const revalidate = 60; // Revalidation toutes les 60 secondes

/**
 * GET - Récupère tous les membres actifs (API publique, pas d'authentification requise)
 */
export async function GET() {
  try {
    // Récupérer tous les membres actifs depuis Supabase via le repository
    const activeMembers = await memberRepository.findActive(1000, 0); // Récupérer jusqu'à 1000 membres actifs
    
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
        isActive: member.isActive, // Inclure isActive pour les filtres côté client
        vipBadge: vipBadge,
        badges: member.badges || [],
        discordId: member.discordId,
        discordUsername: member.discordUsername,
        avatar: avatar,
        description: description,
        createdAt: member.createdAt ? member.createdAt.toISOString() : undefined,
      };
    });

    const response = NextResponse.json({ 
      members: publicMembers,
      total: publicMembers.length 
    });

    // Configurer les headers de cache pour Next.js ISR
    // Revalidation de 60 secondes côté serveur (ISR)
    // Cache de 60 secondes côté client/CDN avec revalidation en arrière-plan
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );

    return response;
  } catch (error) {
    console.error("Error fetching public members:", error);
    return NextResponse.json(
      { error: "Erreur serveur", members: [], total: 0 },
      { status: 500 }
    );
  }
}

