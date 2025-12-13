import { NextRequest, NextResponse } from 'next/server';
import { 
  loadRaidsFaits, 
  loadRaidsRecus, 
  getMonthKey, 
  getCurrentMonthKey 
} from '@/lib/raidStorage';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

/**
 * GET - Récupère les détails des raids d'un membre (avec dates)
 * Query params: ?member=twitchLogin&month=YYYY-MM
 * 
 * Utilise maintenant lib/raidStorage.ts (nouveau système) au lieu de lib/raids.ts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberTwitchLogin = searchParams.get('member');
    const monthParam = searchParams.get('month');
    
    if (!memberTwitchLogin) {
      return NextResponse.json(
        { error: "member est requis" },
        { status: 400 }
      );
    }
    
    // Déterminer le monthKey
    let monthKey: string;
    if (monthParam) {
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const month = parseInt(monthMatch[2]);
        if (month >= 1 && month <= 12) {
          monthKey = getMonthKey(year, month);
        } else {
          monthKey = getCurrentMonthKey();
        }
      } else {
        monthKey = getCurrentMonthKey();
      }
    } else {
      monthKey = getCurrentMonthKey();
    }
    
    // Charger les membres pour la conversion
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    
    // Trouver le membre par Twitch login
    const member = allMembers.find(m => m.twitchLogin.toLowerCase() === memberTwitchLogin.toLowerCase());
    
    if (!member || !member.discordId) {
      return NextResponse.json(
        { error: `Membre non trouvé: ${memberTwitchLogin}` },
        { status: 404 }
      );
    }
    
    // Charger les raids depuis le nouveau système (raidStorage.ts)
    const raidsFaits = await loadRaidsFaits(monthKey);
    const raidsRecus = await loadRaidsRecus(monthKey);
    
    console.log(`[Raid Details] Recherche pour Discord ID: ${member.discordId}, monthKey: ${monthKey}`);
    console.log(`[Raid Details] Total raids faits dans le mois: ${raidsFaits.length}, raids reçus: ${raidsRecus.length}`);
    
    // Filtrer les raids pour ce membre spécifique
    // Pour les raids faits: raider doit correspondre au Discord ID du membre
    const memberRaidsFaits = raidsFaits.filter(raid => {
      // Le raider peut être un Discord ID ou un Twitch Login
      return raid.raider === member.discordId || 
             raid.raider === member.twitchLogin ||
             raid.raider.toLowerCase() === member.twitchLogin.toLowerCase();
    });
    
    // Pour les raids reçus: target doit correspondre au Discord ID du membre
    const memberRaidsRecus = raidsRecus.filter(raid => {
      // Le target peut être un Discord ID ou un Twitch Login
      return raid.target === member.discordId || 
             raid.target === member.twitchLogin ||
             raid.target.toLowerCase() === member.twitchLogin.toLowerCase();
    });
    
    console.log(`[Raid Details] Raids trouvés pour ${member.twitchLogin}: ${memberRaidsFaits.length} faits, ${memberRaidsRecus.length} reçus`);
    
    // Créer un map Discord ID -> Member pour la conversion
    const discordIdToMember = new Map<string, any>();
    allMembers.forEach(m => {
      if (m.discordId) {
        discordIdToMember.set(m.discordId, m);
      }
    });
    
    // Convertir les RaidFait[] et RaidRecu[] vers le format RaidEntry[] attendu par le modal
    // Format RaidEntry: { targetDiscordId, timestamp, source, messageId? }
    const raids: Array<{
      targetDiscordId: string;
      timestamp: string;
      source: "twitch-live" | "manual";
      messageId?: string;
    }> = memberRaidsFaits.map(raid => {
      // Pour les raids faits, targetDiscordId est la cible du raid
      let targetDiscordId = raid.target;
      
      // Si target est un Twitch Login, chercher le Discord ID correspondant
      const targetMember = discordIdToMember.get(raid.target) || 
                          allMembers.find(m => m.twitchLogin?.toLowerCase() === raid.target.toLowerCase());
      if (targetMember?.discordId) {
        targetDiscordId = targetMember.discordId;
      }
      
      return {
        targetDiscordId,
        timestamp: raid.date,
        source: (raid.source === "manual" ? "manual" : "twitch-live") as "twitch-live" | "manual",
        messageId: raid.messageId,
      };
    });
    
    const receivedRaids: Array<{
      targetDiscordId: string;
      timestamp: string;
      source: "twitch-live" | "manual";
      messageId?: string;
    }> = memberRaidsRecus.map(raid => {
      // Pour les raids reçus, targetDiscordId est le raider (celui qui a fait le raid)
      let raiderDiscordId = raid.raider;
      
      // Si raider est un Twitch Login, chercher le Discord ID correspondant
      const raiderMember = discordIdToMember.get(raid.raider) || 
                          allMembers.find(m => m.twitchLogin?.toLowerCase() === raid.raider.toLowerCase());
      if (raiderMember?.discordId) {
        raiderDiscordId = raiderMember.discordId;
      }
      
      return {
        targetDiscordId: raiderDiscordId, // Pour les raids reçus, targetDiscordId = raider
        timestamp: raid.date,
        source: (raid.source === "manual" ? "manual" : "twitch-live") as "twitch-live" | "manual",
        messageId: raid.messageId,
      };
    });
    
    // Créer un map Discord ID -> Twitch Login pour la conversion (compatibilité)
    const discordIdToTwitchLogin = new Map<string, string>();
    allMembers.forEach(m => {
      if (m.discordId && m.twitchLogin) {
        discordIdToTwitchLogin.set(m.discordId, m.twitchLogin.toLowerCase());
      }
    });
    
    return NextResponse.json({
      details: {
        raids,
        receivedRaids,
        discordIdToTwitchLogin: Object.fromEntries(discordIdToTwitchLogin),
        hasLegacyData: false, // Nouveau système, pas de données anciennes
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des détails:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

