import { NextResponse } from 'next/server';
import { memberRepository } from '@/lib/repositories';
import { getTwitchUsers } from '@/lib/twitch';
import { getVipBadgeText } from '@/lib/vipHistory';
import { getMemberDescription } from '@/lib/memberDescriptions';
import { logApi, LogCategory } from '@/lib/logging/logger';

// Désactiver le cache ISR pour cette route critique (page /lives doit toujours fonctionner)
// Les avatars Twitch sont mis en cache séparément dans lib/twitch.ts (24h)
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Pas de cache ISR pour garantir la disponibilité

/**
 * GET - Récupère tous les membres actifs (API publique, pas d'authentification requise)
 */
export async function GET() {
  const startTime = Date.now();
  try {
    // Récupérer tous les membres actifs depuis Supabase via le repository
    let activeMembers: any[] = [];
    try {
      activeMembers = await memberRepository.findActive(1000, 0); // Récupérer jusqu'à 1000 membres actifs
      console.log(`[Members Public API] Membres actifs récupérés: ${activeMembers.length}`);
    } catch (dbError) {
      console.error('[Members Public API] Erreur récupération membres depuis Supabase:', dbError);
      // Retourner une liste vide plutôt que d'échouer complètement
      // Cela permet à la page de continuer à fonctionner même si la base de données est temporairement indisponible
      return NextResponse.json(
        { 
          members: [], 
          total: 0,
          error: process.env.NODE_ENV === 'development' 
            ? (dbError instanceof Error ? dbError.message : 'Database error')
            : "Erreur temporaire de récupération des membres"
        },
        { status: 200 } // Retourner 200 pour permettre au client de continuer
      );
    }
    
    // Récupérer tous les logins Twitch uniques
    const twitchLogins = activeMembers
      .map(member => member.twitchLogin)
      .filter(Boolean) as string[];
    
    console.log(`[Members Public API] Logins Twitch: ${twitchLogins.length}`);
    
    // Récupérer tous les avatars Twitch en batch (beaucoup plus rapide)
    let twitchUsers: any[] = [];
    try {
      twitchUsers = await getTwitchUsers(twitchLogins);
      console.log(`[Members Public API] Avatars Twitch récupérés: ${twitchUsers.length}`);
    } catch (twitchError) {
      console.error('[Members Public API] Erreur récupération avatars Twitch:', twitchError);
      // Continuer sans avatars Twitch (on utilisera les fallbacks)
    }
    
    // Créer un map pour un accès rapide par login
    const avatarMap = new Map(
      twitchUsers.map(user => [user.login.toLowerCase(), user.profile_image_url])
    );
    
    // Mapper vers un format simplifié pour la page publique avec avatars Twitch
    const publicMembers = activeMembers.map((member) => {
      try {
        // Récupérer l'avatar depuis le map (déjà récupéré en batch)
        let avatar: string | undefined = avatarMap.get(member.twitchLogin.toLowerCase());
        
        // Si pas d'avatar Twitch, utiliser Discord en fallback
        if (!avatar && member.discordId) {
          try {
            // Utiliser l'avatar Discord par défaut (sans hash, Discord générera un avatar par défaut)
            avatar = `https://cdn.discordapp.com/embed/avatars/${parseInt(member.discordId) % 5}.png`;
          } catch (e) {
            // Ignorer les erreurs de parsing Discord ID
          }
        }

        // Calculer le badge VIP+N si le membre est VIP
        let vipBadge: string | undefined = undefined;
        try {
          vipBadge = member.isVip ? getVipBadgeText(member.twitchLogin) : undefined;
        } catch (e) {
          console.warn(`[Members Public API] Erreur récupération badge VIP pour ${member.twitchLogin}:`, e);
        }

        // Générer la description (personnalisée ou générique)
        let description: string | undefined = undefined;
        try {
          description = getMemberDescription({
            description: member.description,
            displayName: member.displayName || member.siteUsername || member.twitchLogin,
            role: member.role,
          });
        } catch (e) {
          console.warn(`[Members Public API] Erreur génération description pour ${member.twitchLogin}:`, e);
          description = member.description || undefined;
        }

        // Gérer createdAt qui peut être un Date ou une string (depuis le cache Redis)
        let createdAtISO: string | undefined = undefined;
        if (member.createdAt) {
          if (member.createdAt instanceof Date) {
            createdAtISO = member.createdAt.toISOString();
          } else if (typeof member.createdAt === 'string') {
            // Si c'est déjà une string ISO, l'utiliser directement
            createdAtISO = member.createdAt;
          } else {
            // Sinon, essayer de convertir
            try {
              const date = new Date(member.createdAt);
              if (!isNaN(date.getTime())) {
                createdAtISO = date.toISOString();
              }
            } catch (e) {
              // Ignorer les erreurs de conversion
            }
          }
        }

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
          createdAt: createdAtISO,
        };
      } catch (memberError) {
        console.error(`[Members Public API] Erreur mapping membre ${member.twitchLogin}:`, memberError);
        // Retourner un membre minimal en cas d'erreur
        return {
          twitchLogin: member.twitchLogin || '',
          twitchUrl: member.twitchUrl || '',
          displayName: member.displayName || member.siteUsername || member.twitchLogin || 'Unknown',
          role: member.role || 'Affilié',
          isVip: member.isVip || false,
          isActive: member.isActive !== false,
          vipBadge: undefined,
          badges: member.badges || [],
          discordId: member.discordId,
          discordUsername: member.discordUsername,
          avatar: undefined,
          description: member.description,
          createdAt: member.createdAt 
            ? (member.createdAt instanceof Date 
                ? member.createdAt.toISOString() 
                : typeof member.createdAt === 'string' 
                  ? member.createdAt 
                  : new Date(member.createdAt).toISOString())
            : undefined,
        };
      }
    });

    const response = NextResponse.json({ 
      members: publicMembers,
      total: publicMembers.length 
    });

    // Cache minimal côté client uniquement (pas de cache serveur pour garantir la disponibilité)
    // La page /lives doit toujours pouvoir récupérer les données même si la DB est temporairement indisponible
    response.headers.set(
      'Cache-Control',
      'public, max-age=30, stale-while-revalidate=60'
    );

    const duration = Date.now() - startTime;
    logApi.success('/api/members/public', duration);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logApi.error('/api/members/public', error instanceof Error ? error : new Error(String(error)));
    
    // Retourner une réponse d'erreur mais avec status 200 pour permettre au client de continuer
    // Le client pourra afficher un message d'erreur mais la page ne plantera pas
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : 'Unknown error')
      : "Erreur temporaire de récupération des membres";
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        members: [], 
        total: 0,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error instanceof Error ? error.stack : String(error) 
        })
      },
      { status: 200 } // Retourner 200 pour permettre au client de continuer
    );
  }
}

