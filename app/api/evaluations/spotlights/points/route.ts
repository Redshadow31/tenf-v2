import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';
import { calculateSpotlightPoints } from '@/lib/evaluationSynthesisHelpers';
import { memberRepository, evaluationRepository } from '@/lib/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Calcule les points Spotlight selon la logique de la page A :
 * Points = (nombre de présences / nombre total de spotlights) * 5, arrondi
 * Utilise les mêmes données que /api/spotlight/presence/monthly
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const monthKey = monthParam || getCurrentMonthKey();

    // Charger les évaluations du mois depuis Supabase
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    
    // Charger tous les membres actifs depuis Supabase
    // Récupérer tous les membres actifs (limite élevée)
    const allMembers = await memberRepository.findAll(1000, 0);
    const activeMembers = allMembers.filter(m => m.isActive !== false);

    // Extraire les spotlights validés depuis les évaluations
    const allSpotlights: any[] = [];
    evaluations.forEach((eval) => {
      if (eval.spotlightEvaluations && Array.isArray(eval.spotlightEvaluations)) {
        eval.spotlightEvaluations.forEach((se: any) => {
          if (se.validated) {
            // Vérifier si ce spotlight n'est pas déjà dans la liste
            const exists = allSpotlights.some(s => s.id === se.id);
            if (!exists) {
              allSpotlights.push(se);
            }
          }
        });
      }
    });

    if (allSpotlights.length === 0) {
      return NextResponse.json({ success: true, points: {}, month: monthKey });
    }

    const totalSpotlights = allSpotlights.length;

    // Calculer les statistiques par membre
    const memberStatsMap = new Map<string, { presences: number; totalSpotlights: number }>();

    // Initialiser tous les membres actifs
    activeMembers.forEach((member) => {
      if (member.twitchLogin) {
        memberStatsMap.set(member.twitchLogin.toLowerCase(), {
          presences: 0,
          totalSpotlights: totalSpotlights,
        });
      }
    });

    // Compter les présences depuis les spotlightEvaluations
    allSpotlights.forEach((spotlight: any) => {
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

