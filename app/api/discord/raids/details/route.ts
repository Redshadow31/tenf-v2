import { NextRequest, NextResponse } from 'next/server';
import { 
  loadRaidsFaits, 
  loadRaidsRecus, 
  getMonthKey, 
  getCurrentMonthKey 
} from '@/lib/raidStorage';
import { memberRepository } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

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
    
    // Charger le membre depuis Supabase
    const member = await memberRepository.findByTwitchLogin(memberTwitchLogin);
    
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
    
    // Créer les maps pour la conversion (depuis Supabase)
    const allMembers = await memberRepository.findAll(1000, 0);
    const discordIdToMember = new Map<string, { twitchLogin: string; displayName: string; discordId: string }>();
    const twitchLoginToMember = new Map<string, { twitchLogin: string; displayName: string; discordId?: string }>();
    const discordIdToTwitchLogin = new Map<string, string>();
    allMembers.forEach(m => {
      const info = {
        twitchLogin: m.twitchLogin,
        displayName: m.displayName || m.siteUsername || m.twitchLogin,
        discordId: m.discordId || '',
      };
      if (m.discordId) {
        discordIdToMember.set(m.discordId, info);
        discordIdToTwitchLogin.set(m.discordId, m.twitchLogin.toLowerCase());
      }
      twitchLoginToMember.set(m.twitchLogin.toLowerCase(), info);
    });

    const getMemberByRaiderOrTarget = (id: string) =>
      discordIdToMember.get(id) || twitchLoginToMember.get(id?.toLowerCase?.() || '');
    
    // Convertir les RaidFait[] et RaidRecu[] vers le format RaidEntry[] attendu par le modal
    // Format RaidEntry: { targetDiscordId, timestamp, source, messageId? }
    const raids: Array<{
      targetDiscordId: string;
      timestamp: string;
      source: "twitch-live" | "manual";
      messageId?: string;
    }> = memberRaidsFaits.map(raid => {
      let targetDiscordId = raid.target;
      const targetMember = getMemberByRaiderOrTarget(raid.target);
      if (targetMember?.discordId) targetDiscordId = targetMember.discordId;
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
      let raiderDiscordId = raid.raider;
      const raiderMember = getMemberByRaiderOrTarget(raid.raider);
      if (raiderMember?.discordId) raiderDiscordId = raiderMember.discordId;
      return {
        targetDiscordId: raiderDiscordId,
        timestamp: raid.date,
        source: (raid.source === "manual" ? "manual" : "twitch-live") as "twitch-live" | "manual",
        messageId: raid.messageId,
      };
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

