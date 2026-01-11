import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import { getCurrentMonthKey, loadSectionAData } from '@/lib/evaluationStorage';
import { calculateSpotlightPoints } from '@/lib/evaluationSynthesisHelpers';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Calcule les points Spotlight selon la logique de la page A :
 * Points = (nombre de présences / nombre total de spotlights) * 5, arrondi
 * Utilise les mêmes données que /api/spotlight/presence/monthly
 */
export async function GET(request: NextRequest) {
  try {
    const { requirePermission } = await import('@/lib/adminAuth');
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const monthKey = monthParam || getCurrentMonthKey();

    // Charger les données depuis le storage (même logique que /api/spotlight/presence/monthly)
    await loadMemberDataFromStorage();
    const sectionAData = await loadSectionAData(monthKey);
    const allMembers = getAllMemberData();

    if (!sectionAData || !sectionAData.spotlights || sectionAData.spotlights.length === 0) {
      return NextResponse.json({ success: true, points: {}, month: monthKey });
    }

    const spotlights = sectionAData.spotlights.filter((s: any) => s.validated);
    const totalSpotlights = spotlights.length;

    // Calculer les statistiques par membre (même logique que l'API monthly)
    const memberStatsMap = new Map<string, { presences: number; totalSpotlights: number }>();

    // Initialiser tous les membres actifs
    allMembers.forEach((member: any) => {
      if (member.isActive !== false && member.twitchLogin) {
        memberStatsMap.set(member.twitchLogin.toLowerCase(), {
          presences: 0,
          totalSpotlights: totalSpotlights,
        });
      }
    });

    // Compter les présences
    spotlights.forEach((spotlight: any) => {
      spotlight.members?.forEach((member: any) => {
        const login = member.twitchLogin?.toLowerCase();
        const stats = memberStatsMap.get(login);
        if (stats && member.present) {
          stats.presences++;
        }
      });
    });

    // Calculer les points pour chaque membre
    const pointsMap: Record<string, number> = {};
    memberStatsMap.forEach((stats, login) => {
      const points = calculateSpotlightPoints(stats.presences, stats.totalSpotlights);
      pointsMap[login] = points;
    });

    return NextResponse.json({ success: true, points: pointsMap, month: monthKey });
  } catch (error) {
    console.error('[API Evaluations Spotlights Points GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

