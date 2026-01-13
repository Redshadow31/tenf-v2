import { NextRequest, NextResponse } from 'next/server';
import {
  loadRaidsFaits,
  loadRaidsRecus,
  loadAlerts,
  getMonthKey,
  getCurrentMonthKey,
} from '@/lib/raidStorage';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

/**
 * GET - Récupère les données de raids pour le dashboard
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
    allMembers.forEach(m => {
      if (m.discordId) {
        discordIdToMember.set(m.discordId, m);
      }
    });

    // Charger les données
    let raidsFaits = await loadRaidsFaits(monthKey);
    let raidsRecus = await loadRaidsRecus(monthKey);
    let alerts = await loadAlerts(monthKey);
    
    // Filtrer les raids Discord (ne garder que twitch-live et manual)
    raidsFaits = raidsFaits.filter(raid => raid.source !== "discord");
    raidsRecus = raidsRecus.filter(raid => raid.source !== "discord");
    alerts = alerts.filter(alert => alert.source !== "discord");

    // Convertir les Discord IDs en Twitch Logins pour l'affichage
    const raidsFaitsFormatted = raidsFaits.map(raid => ({
      ...raid,
      raiderTwitchLogin: discordIdToMember.get(raid.raider)?.twitchLogin || raid.raider,
      targetTwitchLogin: discordIdToMember.get(raid.target)?.twitchLogin || raid.target,
      raiderDisplayName: discordIdToMember.get(raid.raider)?.displayName || raid.raider,
      targetDisplayName: discordIdToMember.get(raid.target)?.displayName || raid.target,
    }));

    const raidsRecusFormatted = raidsRecus.map(raid => ({
      ...raid,
      raiderTwitchLogin: discordIdToMember.get(raid.raider)?.twitchLogin || raid.raider,
      targetTwitchLogin: discordIdToMember.get(raid.target)?.twitchLogin || raid.target,
      raiderDisplayName: discordIdToMember.get(raid.raider)?.displayName || raid.raider,
      targetDisplayName: discordIdToMember.get(raid.target)?.displayName || raid.target,
    }));

    const alertsFormatted = alerts.map(alert => ({
      ...alert,
      raiderTwitchLogin: discordIdToMember.get(alert.raider)?.twitchLogin || alert.raider,
      targetTwitchLogin: discordIdToMember.get(alert.target)?.twitchLogin || alert.target,
      raiderDisplayName: discordIdToMember.get(alert.raider)?.displayName || alert.raider,
      targetDisplayName: discordIdToMember.get(alert.target)?.displayName || alert.target,
    }));

    // Calculer les statistiques
    const totalRaidsFaits = raidsFaits.reduce((sum, r) => sum + (r.count || 1), 0);
    const totalRaidsRecus = raidsRecus.length;
    const raidersSet = new Set(raidsFaits.map(r => r.raider));
    const targetsSet = new Set(raidsRecus.map(r => r.target));

    // Top raideurs (top 5)
    const raiderCounts: Record<string, number> = {};
    raidsFaits.forEach(r => {
      raiderCounts[r.raider] = (raiderCounts[r.raider] || 0) + (r.count || 1);
    });
    const topRaiders = Object.entries(raiderCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([discordId, count], index) => ({
        rank: index + 1,
        discordId,
        twitchLogin: discordIdToMember.get(discordId)?.twitchLogin || discordId,
        displayName: discordIdToMember.get(discordId)?.displayName || discordId,
        count,
      }));
    const topRaider = topRaiders[0] || null;

    // Top cibles (top 5)
    const targetCounts: Record<string, number> = {};
    raidsRecus.forEach(r => {
      targetCounts[r.target] = (targetCounts[r.target] || 0) + 1;
    });
    const topTargets = Object.entries(targetCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([discordId, count], index) => ({
        rank: index + 1,
        discordId,
        twitchLogin: discordIdToMember.get(discordId)?.twitchLogin || discordId,
        displayName: discordIdToMember.get(discordId)?.displayName || discordId,
        count,
      }));
    const topTarget = topTargets[0] || null;

    return NextResponse.json({
      month: monthKey,
      raidsFaits: raidsFaitsFormatted,
      raidsRecus: raidsRecusFormatted,
      alerts: alertsFormatted,
      stats: {
        totalRaidsFaits,
        totalRaidsRecus,
        activeRaiders: raidersSet.size,
        uniqueTargets: targetsSet.size,
        topRaider: topRaider ? {
          discordId: topRaider.discordId,
          twitchLogin: topRaider.twitchLogin,
          displayName: topRaider.displayName,
          count: topRaider.count,
        } : null,
        topTarget: topTarget ? {
          discordId: topTarget.discordId,
          twitchLogin: topTarget.twitchLogin,
          displayName: topTarget.displayName,
          count: topTarget.count,
        } : null,
        topRaiders, // Top 5 des raideurs
        topTargets, // Top 5 des cibles
        alertsCount: alerts.length,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

