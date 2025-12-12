import { NextRequest, NextResponse } from 'next/server';
import { getAllRaidStats, loadPendingRaids } from '@/lib/raids';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

/**
 * GET - Récupère les stats de raids pour le mois en cours avec conversion Discord ID -> Twitch Login
 */
export async function GET(request: NextRequest) {
  try {
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
    const raidsByDiscordId = await getAllRaidStats();
    
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
    const pendingRaids = await loadPendingRaids();
    
    return NextResponse.json({
      raids: raidsByTwitchLogin,
      raidsByDiscordId: raidsByDiscordIdFormatted,
      pendingRaids,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des raids:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

