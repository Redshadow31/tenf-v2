import { NextRequest, NextResponse } from 'next/server';
import { getAllRaidStats, loadPendingRaids } from '@/lib/raids';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

/**
 * GET - Récupère les stats de raids pour le mois en cours avec conversion Discord ID -> Twitch Login
 * Query params: ?month=YYYY-MM (optionnel, par défaut mois en cours)
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer le paramètre de mois depuis l'URL
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    let monthKey: string | undefined;
    
    if (monthParam) {
      // Valider le format YYYY-MM
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const month = parseInt(monthMatch[2]);
        if (month >= 1 && month <= 12) {
          const { getMonthKey } = await import('@/lib/raids');
          monthKey = getMonthKey(year, month);
        }
      }
    }
    
    // Charger les membres pour la conversion
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    
    // Créer un map Discord ID -> Twitch Login
    const discordIdToTwitchLogin = new Map<string, string>();
    const discordIdToDisplayName = new Map<string, string>();
    allMembers.forEach(member => {
      if (member.discordId && member.twitchLogin) {
        discordIdToTwitchLogin.set(member.discordId, member.twitchLogin.toLowerCase());
        discordIdToDisplayName.set(member.discordId, member.displayName);
      }
    });
    
    // Charger les raids (stockés par Discord ID)
    const { loadMonthlyRaids } = await import('@/lib/raids');
    const raidsByDiscordId = await loadMonthlyRaids(monthKey);
    
    console.log(`[API Raids] Chargement pour ${monthKey || 'mois en cours'}, ${Object.keys(raidsByDiscordId).length} membres avec raids`);
    
    // Convertir en format avec Twitch Login comme clé pour faciliter l'affichage
    const raidsByTwitchLogin: Record<string, any> = {};
    const raidsByDiscordIdFormatted: Record<string, any> = {};
    
    for (const [discordId, stats] of Object.entries(raidsByDiscordId)) {
      const twitchLogin = discordIdToTwitchLogin.get(discordId);
      const displayName = discordIdToDisplayName.get(discordId);
      
      // Format avec Discord ID (pour référence)
      raidsByDiscordIdFormatted[discordId] = {
        ...stats,
        displayName: displayName || discordId,
        twitchLogin: twitchLogin || null,
      };
      
      // Format avec Twitch Login (pour affichage dans le dashboard)
      if (twitchLogin) {
        // Convertir les targets aussi
        const targetsByTwitchLogin: Record<string, number> = {};
        for (const [targetDiscordId, count] of Object.entries(stats.targets)) {
          const targetTwitchLogin = discordIdToTwitchLogin.get(targetDiscordId);
          const targetDisplayName = discordIdToDisplayName.get(targetDiscordId);
          if (targetTwitchLogin) {
            targetsByTwitchLogin[targetTwitchLogin] = count;
          } else {
            // Garder le Discord ID si pas de Twitch login
            targetsByTwitchLogin[targetDiscordId] = count;
          }
        }
        
        raidsByTwitchLogin[twitchLogin] = {
          ...stats,
          targets: targetsByTwitchLogin,
          displayName,
          discordId,
        };
      } else {
        // Si pas de Twitch login, garder le Discord ID comme clé
        raidsByTwitchLogin[discordId] = {
          ...stats,
          displayName: displayName || discordId,
          twitchLogin: null,
        };
      }
    }
    
    // Charger les raids en attente
    const { loadPendingRaids } = await import('@/lib/raids');
    const pendingRaids = await loadPendingRaids();
    
    console.log(`[API Raids] Conversion terminée: ${Object.keys(raidsByTwitchLogin).length} membres avec Twitch login`);
    
    return NextResponse.json({
      raids: raidsByTwitchLogin,
      raidsByDiscordId: raidsByDiscordIdFormatted,
      pendingRaids,
      month: monthKey || (await import('@/lib/raids')).getMonthKey(new Date().getFullYear(), new Date().getMonth() + 1),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des raids:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

