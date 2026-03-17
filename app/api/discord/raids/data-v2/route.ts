import { NextRequest, NextResponse } from 'next/server';
import {
  loadRaidsFaits,
  loadRaidsRecus,
  loadAlerts,
  getMonthKey,
  getCurrentMonthKey,
} from '@/lib/raidStorage';
import type { RaidFait, RaidRecu } from '@/lib/raidStorage';
import { memberRepository } from '@/lib/repositories';
import { cacheGet, cacheSet, cacheKey } from '@/lib/cache';
import { supabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';
const RAIDS_CURRENT_MONTH_TTL_SECONDS = 45;
const RAIDS_HISTORICAL_MONTH_TTL_SECONDS = 300;

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

async function fetchAllMembersForRaidsDataV2() {
  const allMembers: any[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const chunk = await memberRepository.findAll(PAGE_SIZE, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    allMembers.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
  }
  return allMembers;
}

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

    const currentMonthKey = getCurrentMonthKey();
    const ttlSeconds =
      monthKey === currentMonthKey ? RAIDS_CURRENT_MONTH_TTL_SECONDS : RAIDS_HISTORICAL_MONTH_TTL_SECONDS;
    const cacheKeyStr = cacheKey('api', 'discord', 'raids', 'data-v2', monthKey, 'v1');
    const cached = await cacheGet<any>(cacheKeyStr);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Charger les membres depuis Supabase pour la conversion Discord ID / Twitch → displayName
    const allMembers = await fetchAllMembersForRaidsDataV2();
    const discordIdToMember = new Map<string, { twitchLogin: string; displayName: string }>();
    const twitchLoginToMember = new Map<string, { twitchLogin: string; displayName: string }>();
    allMembers.forEach(m => {
      const info = {
        twitchLogin: m.twitchLogin,
        displayName: m.displayName || m.siteUsername || m.twitchLogin,
      };
      if (m.discordId) discordIdToMember.set(m.discordId, info);
      twitchLoginToMember.set(m.twitchLogin.toLowerCase(), info);
    });

    const [yearStr, monthStr] = monthKey.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const monthEnd = new Date(Date.UTC(year, month, 1)).toISOString();

    // Charger les données
    let raidsFaits = await loadRaidsFaits(monthKey);
    let raidsRecus = await loadRaidsRecus(monthKey);
    let alerts = await loadAlerts(monthKey);
    
    // Filtrer les raids Discord (ne garder que twitch-live et manual)
    raidsFaits = raidsFaits.filter(raid => raid.source !== "discord");
    raidsRecus = raidsRecus.filter(raid => raid.source !== "discord");
    alerts = alerts.filter(alert => alert.source !== "discord");

    // Injecter les raids-sub valides (processing_status = matched) du mois
    // pour qu'ils remontent dans /admin/raids.
    const eventsubMatchedRes = await supabaseAdmin
      .from("raid_test_events")
      .select(
        "id,from_broadcaster_user_login,to_broadcaster_user_login,event_at,viewers,processing_status"
      )
      .eq("processing_status", "matched")
      .gte("event_at", monthStart)
      .lt("event_at", monthEnd)
      .order("event_at", { ascending: false })
      .limit(5000);

    if (!eventsubMatchedRes.error) {
      const eventsubRows = (eventsubMatchedRes.data || []) as Array<{
        id: string;
        from_broadcaster_user_login: string | null;
        to_broadcaster_user_login: string | null;
        event_at: string | null;
        viewers: number | null;
      }>;

      const existingFaitsKeys = new Set(
        raidsFaits.map((raid) => `${String(raid.raider || "").toLowerCase()}|${String(raid.target || "").toLowerCase()}|${raid.date}`)
      );
      const existingRecusKeys = new Set(
        raidsRecus.map((raid) => `${String(raid.raider || "").toLowerCase()}|${String(raid.target || "").toLowerCase()}|${raid.date}`)
      );

      const eventsubFaits: RaidFait[] = eventsubRows
        .filter((row) => row.from_broadcaster_user_login && row.to_broadcaster_user_login && row.event_at)
        .map((row) => ({
          raider: String(row.from_broadcaster_user_login || "").toLowerCase(),
          target: String(row.to_broadcaster_user_login || "").toLowerCase(),
          date: String(row.event_at || ""),
          count: 1,
          manual: false,
          source: "raids_sub" as const,
          viewers: typeof row.viewers === "number" ? row.viewers : undefined,
          countFrom: true,
          countTo: undefined,
        }))
        .filter((row) => !existingFaitsKeys.has(`${row.raider}|${row.target}|${row.date}`));

      const eventsubRecus: RaidRecu[] = eventsubRows
        .filter((row) => row.from_broadcaster_user_login && row.to_broadcaster_user_login && row.event_at)
        .map((row) => ({
          target: String(row.to_broadcaster_user_login || "").toLowerCase(),
          raider: String(row.from_broadcaster_user_login || "").toLowerCase(),
          date: String(row.event_at || ""),
          manual: false,
          source: "raids_sub" as const,
          viewers: typeof row.viewers === "number" ? row.viewers : undefined,
          countFrom: undefined,
          countTo: true,
        }))
        .filter((row) => !existingRecusKeys.has(`${row.raider}|${row.target}|${row.date}`));

      raidsFaits = [...raidsFaits, ...eventsubFaits];
      raidsRecus = [...raidsRecus, ...eventsubRecus];
    } else {
      console.error("[raids/data-v2] Erreur chargement raids-sub matched:", eventsubMatchedRes.error);
    }

    const resolveMember = (id: string) =>
      discordIdToMember.get(id) || twitchLoginToMember.get(id?.toLowerCase?.() || '');

    // Convertir Discord IDs / Twitch en Twitch Logins et displayNames pour l'affichage
    const raidsFaitsFormatted = raidsFaits.map(raid => ({
      ...raid,
      raiderTwitchLogin: resolveMember(raid.raider)?.twitchLogin || raid.raider,
      targetTwitchLogin: resolveMember(raid.target)?.twitchLogin || raid.target,
      raiderDisplayName: resolveMember(raid.raider)?.displayName || raid.raider,
      targetDisplayName: resolveMember(raid.target)?.displayName || raid.target,
    }));

    const raidsRecusFormatted = raidsRecus.map(raid => ({
      ...raid,
      raiderTwitchLogin: resolveMember(raid.raider)?.twitchLogin || raid.raider,
      targetTwitchLogin: resolveMember(raid.target)?.twitchLogin || raid.target,
      raiderDisplayName: resolveMember(raid.raider)?.displayName || raid.raider,
      targetDisplayName: resolveMember(raid.target)?.displayName || raid.target,
    }));

    const alertsFormatted = alerts.map(alert => ({
      ...alert,
      raiderTwitchLogin: resolveMember(alert.raider)?.twitchLogin || alert.raider,
      targetTwitchLogin: resolveMember(alert.target)?.twitchLogin || alert.target,
      raiderDisplayName: resolveMember(alert.raider)?.displayName || alert.raider,
      targetDisplayName: resolveMember(alert.target)?.displayName || alert.target,
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
      .map(([id, count], index) => ({
        rank: index + 1,
        discordId: id,
        twitchLogin: resolveMember(id)?.twitchLogin || id,
        displayName: resolveMember(id)?.displayName || id,
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
      .map(([id, count], index) => ({
        rank: index + 1,
        discordId: id,
        twitchLogin: resolveMember(id)?.twitchLogin || id,
        displayName: resolveMember(id)?.displayName || id,
        count,
      }));
    const topTarget = topTargets[0] || null;

    // Calculer les données quotidiennes pour les sparklines
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Vérifier si on est dans le mois courant
    const [monthYear, monthNum] = monthKey.split('-');
    const isCurrentMonth = parseInt(monthYear) === currentYear && parseInt(monthNum) === currentMonth;
    
    // Construire les séries quotidiennes
    const dailySentMap = new Map<number, number>();
    const dailyReceivedMap = new Map<number, number>();
    
    if (isCurrentMonth) {
      // Pour les raids faits
      raidsFaits.forEach(raid => {
        const raidDate = new Date(raid.date);
        if (raidDate.getFullYear() === currentYear && raidDate.getMonth() + 1 === currentMonth) {
          const day = raidDate.getDate();
          dailySentMap.set(day, (dailySentMap.get(day) || 0) + (raid.count || 1));
        }
      });
      
      // Pour les raids reçus
      raidsRecus.forEach(raid => {
        const raidDate = new Date(raid.date);
        if (raidDate.getFullYear() === currentYear && raidDate.getMonth() + 1 === currentMonth) {
          const day = raidDate.getDate();
          dailyReceivedMap.set(day, (dailyReceivedMap.get(day) || 0) + 1);
        }
      });
    }
    
    // Convertir en tableaux triés
    const dailySent: Array<{ day: number; count: number }> = Array.from(dailySentMap.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day - b.day);
    
    const dailyReceived: Array<{ day: number; count: number }> = Array.from(dailyReceivedMap.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day - b.day);

    const payload = {
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
        dailySent, // Données quotidiennes pour les sparklines
        dailyReceived, // Données quotidiennes pour les sparklines
      },
    };

    await cacheSet(cacheKeyStr, payload, ttlSeconds);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

