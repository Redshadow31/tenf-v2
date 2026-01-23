import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';
import { calculateRaidPoints } from '@/lib/evaluationSynthesisHelpers';
import {
  loadRaidsFaits,
  loadRaidsRecus,
  getMonthKey,
} from '@/lib/raidStorage';
import { memberRepository, evaluationRepository } from '@/lib/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Calcule les points Raids selon la logique de la page A :
 * - 0 raid fait = 0 point
 * - 1-2 raids faits = 1 point
 * - 3 raids faits = 2 points
 * - 4 raids faits = 3 points
 * - 5 raids faits = 4 points
 * - 6+ raids faits = 5 points (sur 5)
 * Utilise les mêmes données que /api/discord/raids/data-v2
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

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

    // Charger les membres depuis Supabase pour la conversion Discord ID -> Twitch Login
    const allMembers = await memberRepository.findAll();
    const discordIdToMember = new Map<string, any>();
    allMembers.forEach((m) => {
      if (m.discordId && m.twitchLogin) {
        discordIdToMember.set(m.discordId, m);
      }
    });

    // Charger les données de raids (même logique que /api/discord/raids/data-v2)
    let raidsFaits = await loadRaidsFaits(monthKey);
    let raidsRecus = await loadRaidsRecus(monthKey);
    
    // Filtrer les raids Discord (ne garder que twitch-live et manual)
    raidsFaits = raidsFaits.filter((raid: any) => raid.source !== "discord");
    raidsRecus = raidsRecus.filter((raid: any) => raid.source !== "discord");

    // Calculer les statistiques par membre (même logique que la page A)
    const memberStatsMap = new Map<string, { done: number; received: number }>();

    // Compter les raids faits
    raidsFaits.forEach((raid: any) => {
      // Convertir Discord ID en Twitch Login si nécessaire
      let twitchLogin = raid.raiderTwitchLogin || raid.raiderLogin;
      if (!twitchLogin) {
        const member = discordIdToMember.get(raid.raider);
        twitchLogin = member?.twitchLogin || raid.raider;
      }
      
      if (twitchLogin) {
        const loginLower = twitchLogin.toLowerCase();
        if (!memberStatsMap.has(loginLower)) {
          memberStatsMap.set(loginLower, { done: 0, received: 0 });
        }
        const stats = memberStatsMap.get(loginLower)!;
        stats.done += raid.count || 1;
      }
    });

    // Compter les raids reçus
    raidsRecus.forEach((raid: any) => {
      // Convertir Discord ID en Twitch Login si nécessaire
      let twitchLogin = raid.targetTwitchLogin || raid.targetLogin;
      if (!twitchLogin) {
        const member = discordIdToMember.get(raid.target);
        twitchLogin = member?.twitchLogin || raid.target;
      }
      
      if (twitchLogin) {
        const loginLower = twitchLogin.toLowerCase();
        if (!memberStatsMap.has(loginLower)) {
          memberStatsMap.set(loginLower, { done: 0, received: 0 });
        }
        const stats = memberStatsMap.get(loginLower)!;
        stats.received += 1;
      }
    });

    // Charger les notes d'évaluation depuis Supabase pour récupérer les points manuels
    // Les points manuels sont stockés dans le champ raidPointsManual ou raidNotes.manualPoints
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    const manualPointsMap = new Map<string, number>();
    
    evaluations.forEach((eval) => {
      // Priorité 1: raidPointsManual (champ dédié aux points manuels)
      if (eval.raidPointsManual !== undefined && eval.raidPointsManual !== null) {
        manualPointsMap.set(eval.twitchLogin.toLowerCase(), eval.raidPointsManual);
      }
      // Priorité 2: raidNotes.manualPoints (ancien système de notes)
      else if (eval.raidNotes?.manualPoints !== undefined && eval.raidNotes.manualPoints !== null) {
        manualPointsMap.set(eval.twitchLogin.toLowerCase(), eval.raidNotes.manualPoints);
      }
    });

    // Calculer les points pour chaque membre (utiliser les points manuels s'ils existent, sinon calculer)
    const pointsMap: Record<string, number> = {};
    memberStatsMap.forEach((stats, login) => {
      // Vérifier s'il y a des points manuels pour ce membre
      const manualPts = manualPointsMap.get(login);
      if (manualPts !== undefined) {
        pointsMap[login] = manualPts;
      } else {
        // Sinon, calculer les points automatiquement
        const points = calculateRaidPoints(stats.done);
        pointsMap[login] = points;
      }
    });

    // Ajouter aussi les membres qui ont des points manuels mais pas de raids
    manualPointsMap.forEach((points, login) => {
      if (!pointsMap[login]) {
        pointsMap[login] = points;
      }
    });

    return NextResponse.json({ success: true, points: pointsMap, month: monthKey });
  } catch (error) {
    console.error('[API Evaluations Raids Points GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

