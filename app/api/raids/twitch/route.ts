import { NextRequest, NextResponse } from 'next/server';
import {
  loadRaidsFaits,
  loadRaidsRecus,
  getMonthKey,
  getCurrentMonthKey,
} from '@/lib/raidStorage';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

/**
 * GET - Récupère les raids Twitch pour un mois donné (pour debug/inspection)
 * Query params: ?month=YYYY-MM
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

    // Déterminer le monthKey
    let monthKey: string;
    if (monthParam) {
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        } else {
          return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
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
    const discordIdToMember = new Map<string, any>();
    const twitchLoginToMember = new Map<string, any>();
    allMembers.forEach(m => {
      if (m.discordId) {
        discordIdToMember.set(m.discordId, m);
      }
      if (m.twitchLogin) {
        twitchLoginToMember.set(m.twitchLogin.toLowerCase(), m);
      }
    });

    // Charger les raids
    const raidsFaits = await loadRaidsFaits(monthKey);
    const raidsRecus = await loadRaidsRecus(monthKey);

    // Filtrer uniquement les raids Twitch (bot = automatique depuis EventSub)
    const twitchRaidsFaits = raidsFaits.filter(r => r.source === "bot" || r.source === "twitch-live");
    const twitchRaidsRecus = raidsRecus.filter(r => r.source === "bot" || r.source === "twitch-live");

    // Enrichir avec les informations des membres
    const twitchRaidsFaitsFormatted = twitchRaidsFaits.map(raid => {
      const raiderMember = twitchLoginToMember.get(raid.raider.toLowerCase());
      const targetMember = twitchLoginToMember.get(raid.target.toLowerCase());
      
      return {
        ...raid,
        raiderDisplayName: raiderMember?.displayName || raid.raider,
        targetDisplayName: targetMember?.displayName || raid.target,
      };
    });

    const twitchRaidsRecusFormatted = twitchRaidsRecus.map(raid => {
      const raiderMember = twitchLoginToMember.get(raid.raider.toLowerCase());
      const targetMember = twitchLoginToMember.get(raid.target.toLowerCase());
      
      return {
        ...raid,
        raiderDisplayName: raiderMember?.displayName || raid.raider,
        targetDisplayName: targetMember?.displayName || raid.target,
      };
    });

    return NextResponse.json({
      month: monthKey,
      raidsFaits: twitchRaidsFaitsFormatted,
      raidsRecus: twitchRaidsRecusFormatted,
      totalRaidsFaits: twitchRaidsFaits.length,
      totalRaidsRecus: twitchRaidsRecus.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des raids Twitch:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

