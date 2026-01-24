import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { spotlightRepository, evaluationRepository } from '@/lib/repositories';

/**
 * GET - Récupère l'évaluation du spotlight actif
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const spotlight = await spotlightRepository.findActive();
    if (!spotlight) {
      return NextResponse.json({ evaluation: null });
    }

    const evaluation = await spotlightRepository.getEvaluation(spotlight.id);
    
    if (!evaluation) {
      return NextResponse.json({ evaluation: null });
    }

    // Convertir au format attendu par le frontend
    const formattedEvaluation = {
      spotlightId: evaluation.spotlightId,
      streamerTwitchLogin: evaluation.streamerTwitchLogin,
      criteria: evaluation.criteria,
      totalScore: evaluation.totalScore,
      maxScore: evaluation.maxScore,
      moderatorComments: evaluation.moderatorComments,
      evaluatedAt: evaluation.evaluatedAt.toISOString(),
      evaluatedBy: evaluation.evaluatedBy,
    };

    return NextResponse.json({ evaluation: formattedEvaluation });
  } catch (error) {
    console.error('[Spotlight Evaluation API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Sauvegarde l'évaluation du spotlight
 * Body: { criteria: SpotlightEvaluationCriteria[], moderatorComments: string, spotlightId?: string }
 * Si spotlightId est fourni, utilise ce spotlight, sinon utilise le spotlight actif
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { criteria, moderatorComments, spotlightId } = body;

    let spotlight;
    
    let targetSpotlight;
    
    if (spotlightId) {
      // Si un spotlightId est fourni, chercher dans la base de données
      targetSpotlight = await spotlightRepository.findById(spotlightId);
      
      if (!targetSpotlight) {
        // Si pas trouvé dans spotlights, chercher dans les évaluations mensuelles
        const now = new Date();
        for (let i = 0; i <= 6; i++) {
          const checkDate = new Date(now);
          checkDate.setMonth(checkDate.getMonth() - i);
          const checkMonthKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
          const evaluations = await evaluationRepository.findByMonth(checkMonthKey);
          
          for (const evaluation of evaluations) {
            if (evaluation.spotlightEvaluations) {
              const matchingSpotlight = evaluation.spotlightEvaluations.find((s: any) => s.id === spotlightId);
              if (matchingSpotlight) {
                targetSpotlight = {
                  id: matchingSpotlight.id,
                  streamerTwitchLogin: matchingSpotlight.streamerTwitchLogin,
                  startedAt: new Date(matchingSpotlight.date),
                  endsAt: new Date(matchingSpotlight.date),
                  status: 'completed' as const,
                  moderatorDiscordId: matchingSpotlight.moderatorDiscordId,
                  moderatorUsername: matchingSpotlight.moderatorUsername,
                  createdAt: new Date(matchingSpotlight.createdAt || matchingSpotlight.date),
                  createdBy: matchingSpotlight.createdBy,
                };
                break;
              }
            }
          }
          if (targetSpotlight) break;
        }
      }
      
      if (!targetSpotlight) {
        return NextResponse.json(
          { error: 'Spotlight non trouvé' },
          { status: 404 }
        );
      }
    } else {
      // Sinon, utiliser le spotlight actif
      targetSpotlight = await spotlightRepository.findActive();
      if (!targetSpotlight) {
        return NextResponse.json(
          { error: 'Aucun spotlight actif et aucun spotlightId fourni' },
          { status: 404 }
        );
      }
    }

    // Vérifier que le spotlight n'est pas annulé (seulement pour spotlight actif)
    if (!spotlightId && targetSpotlight.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Ce spotlight a été annulé' },
        { status: 400 }
      );
    }

    if (!Array.isArray(criteria)) {
      return NextResponse.json(
        { error: 'criteria doit être un tableau' },
        { status: 400 }
      );
    }

    const totalScore = criteria.reduce((sum, crit) => sum + (crit.value || 0), 0);
    const maxScore = criteria.reduce((sum, crit) => sum + (crit.maxValue || 0), 0);

    const evaluation = await spotlightRepository.saveEvaluation({
      spotlightId: targetSpotlight.id,
      streamerTwitchLogin: targetSpotlight.streamerTwitchLogin,
      criteria,
      totalScore,
      maxScore,
      moderatorComments: moderatorComments || '',
      evaluatedAt: new Date(),
      evaluatedBy: admin.id,
      validated: false,
    });

    // Convertir au format attendu par le frontend
    const formattedEvaluation = {
      spotlightId: evaluation.spotlightId,
      streamerTwitchLogin: evaluation.streamerTwitchLogin,
      criteria: evaluation.criteria,
      totalScore: evaluation.totalScore,
      maxScore: evaluation.maxScore,
      moderatorComments: evaluation.moderatorComments,
      evaluatedAt: evaluation.evaluatedAt.toISOString(),
      evaluatedBy: evaluation.evaluatedBy,
    };

    return NextResponse.json({ 
      success: true, 
      evaluation: formattedEvaluation,
      message: 'Évaluation enregistrée avec succès' 
    });
  } catch (error) {
    console.error('[Spotlight Evaluation API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


