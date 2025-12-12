import { NextRequest, NextResponse } from 'next/server';
import { loadDiscordStats, getMonthKey } from '@/lib/statbotStorage';
import { computeStatbotStats } from '@/lib/statbot';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

/**
 * GET - Récupère les statistiques Discord pour un mois donné
 * Query params: ?month=YYYY-MM (optionnel, défaut: mois actuel)
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
          monthKey = `${year}-${monthNum.toString().padStart(2, '0')}`;
        } else {
          return NextResponse.json({ error: 'Mois invalide' }, { status: 400 });
        }
      } else {
        monthKey = getMonthKey();
      }
    } else {
      monthKey = getMonthKey();
    }

    // Charger les stats depuis le storage
    const stats = await loadDiscordStats(monthKey);

    if (!stats) {
      return NextResponse.json({
        month: monthKey,
        members: [],
        totalMessages: 0,
        totalVoiceHours: 0,
        topMembers: [],
        message: 'Aucune donnée disponible pour ce mois',
      });
    }

    // Charger les membres pour enrichir les données
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const memberMap = new Map(allMembers.map(m => [m.discordId, m]));

    // Enrichir les stats avec les noms d'affichage
    const enrichedMembers = stats.members.map(member => {
      const memberData = memberMap.get(member.discordId);
      return {
        ...member,
        displayName: memberData?.displayName || 'Membre inconnu',
        twitchLogin: memberData?.twitchLogin || null,
      };
    });

    // Calculer les stats globales
    const computedStats = computeStatbotStats(stats.members);

    return NextResponse.json({
      month: monthKey,
      members: enrichedMembers,
      totalMessages: stats.totalMessages,
      totalVoiceHours: stats.totalVoiceHours,
      topMembers: computedStats.topMembers.map(m => {
        const memberData = memberMap.get(m.discordId);
        return {
          ...m,
          displayName: memberData?.displayName || 'Membre inconnu',
          twitchLogin: memberData?.twitchLogin || null,
        };
      }),
      lastUpdated: stats.lastUpdated,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats Discord:', error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

