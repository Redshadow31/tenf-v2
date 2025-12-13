import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { loadSectionAData, getCurrentMonthKey } from '@/lib/evaluationStorage';
import { getStore } from '@netlify/blobs';

interface SpotlightEvaluation {
  spotlightId: string;
  streamerTwitchLogin: string;
  criteria: Array<{
    id: string;
    label: string;
    maxValue: number;
    value: number;
  }>;
  totalScore: number;
  maxScore: number;
  moderatorComments: string;
  evaluatedAt: string;
  evaluatedBy: string;
}

/**
 * GET - Récupère les évaluations des spotlights pour un mois donné
 * Query params: month (optionnel, format YYYY-MM, défaut: mois en cours)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

    // Déterminer le mois
    let monthKey: string;
    if (monthParam) {
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        monthKey = monthParam;
      } else {
        return NextResponse.json(
          { error: 'Format de mois invalide (attendu: YYYY-MM)' },
          { status: 400 }
        );
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    // Charger les données du mois
    const sectionAData = await loadSectionAData(monthKey);

    if (!sectionAData || !sectionAData.spotlights || sectionAData.spotlights.length === 0) {
      return NextResponse.json({
        month: monthKey,
        totalSpotlights: 0,
        evaluatedSpotlights: 0,
        averageScore: 0,
        spotlights: [],
      });
    }

    const spotlights = sectionAData.spotlights.filter(s => s.validated);
    
    // Récupérer les évaluations depuis le stockage spotlight
    const isNetlify = typeof getStore === 'function' || 
                      !!process.env.NETLIFY || 
                      !!process.env.NETLIFY_DEV;

    const spotlightsWithEvaluation: Array<{
      id: string;
      date: string;
      streamerTwitchLogin: string;
      moderatorUsername: string;
      moderatorDiscordId: string;
      startedAt?: string;
      endsAt?: string;
      duration?: string;
      evaluation: SpotlightEvaluation | null;
      status: 'evaluated' | 'not_evaluated';
    }> = [];

    for (const spotlight of spotlights) {
      let evaluation: SpotlightEvaluation | null = null;
      
      if (isNetlify) {
        try {
          const store = getStore('tenf-spotlights');
          const evalData = await store.get(`${spotlight.id}/evaluation.json`, { type: 'json' }).catch(() => null);
          
          if (evalData) {
            evaluation = evalData;
          }
        } catch (error) {
          // Ignorer les erreurs
        }
      }

      // Calculer la durée si on a les dates
      let duration: string | undefined;
      if (spotlight.createdAt) {
        // Essayer de récupérer les dates depuis le spotlight actif
        try {
          if (isNetlify) {
            const store = getStore('tenf-spotlights');
            const activeData = await store.get('active.json', { type: 'json' }).catch(() => null);
            if (activeData && activeData.id === spotlight.id) {
              const start = new Date(activeData.startedAt);
              const end = new Date(activeData.endsAt);
              const diffMs = end.getTime() - start.getTime();
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              duration = `${hours}h ${minutes}m`;
            }
          }
        } catch (error) {
          // Ignorer
        }
      }

      spotlightsWithEvaluation.push({
        id: spotlight.id,
        date: spotlight.date,
        streamerTwitchLogin: spotlight.streamerTwitchLogin,
        moderatorUsername: spotlight.moderatorUsername,
        moderatorDiscordId: spotlight.moderatorDiscordId,
        evaluation,
        status: evaluation ? 'evaluated' : 'not_evaluated',
        duration,
      });
    }

    // Calculer les statistiques
    const evaluatedSpotlights = spotlightsWithEvaluation.filter(s => s.status === 'evaluated');
    const totalScore = evaluatedSpotlights.reduce((sum, s) => sum + (s.evaluation?.totalScore || 0), 0);
    const averageScore = evaluatedSpotlights.length > 0 ? totalScore / evaluatedSpotlights.length : 0;

    // Trier par date (plus récent en premier)
    spotlightsWithEvaluation.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json({
      month: monthKey,
      totalSpotlights: spotlights.length,
      evaluatedSpotlights: evaluatedSpotlights.length,
      averageScore: Math.round(averageScore * 10) / 10,
      spotlights: spotlightsWithEvaluation,
    });
  } catch (error) {
    console.error('[Spotlight Evaluations Monthly API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

