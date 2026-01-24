import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { spotlightRepository } from '@/lib/repositories';

/**
 * PUT - Met à jour l'évaluation d'un spotlight par son ID
 * Body: { criteria: SpotlightEvaluationCriteria[], moderatorComments: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { spotlightId: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.discordId)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { spotlightId } = params;

    if (!spotlightId) {
      return NextResponse.json(
        { error: 'spotlightId requis' },
        { status: 400 }
      );
    }

    // Récupérer l'évaluation existante pour obtenir le streamerTwitchLogin
    const existingEvaluation = await spotlightRepository.getEvaluation(spotlightId);
    
    if (!existingEvaluation) {
      return NextResponse.json(
        { error: 'Évaluation non trouvée' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { criteria, moderatorComments } = body;

    if (!Array.isArray(criteria)) {
      return NextResponse.json(
        { error: 'criteria doit être un tableau' },
        { status: 400 }
      );
    }

    // Calculer les nouveaux scores
    const totalScore = criteria.reduce((sum, crit) => sum + (crit.value || 0), 0);
    const maxScore = criteria.reduce((sum, crit) => sum + (crit.maxValue || 0), 0);

    // Mettre à jour l'évaluation
    const evaluation = await spotlightRepository.saveEvaluation({
      spotlightId: spotlightId,
      streamerTwitchLogin: existingEvaluation.streamerTwitchLogin,
      criteria,
      totalScore,
      maxScore,
      moderatorComments: moderatorComments || '',
      evaluatedAt: new Date(), // Mettre à jour la date d'évaluation
      evaluatedBy: admin.discordId, // Mettre à jour l'évaluateur
      validated: existingEvaluation.validated,
      validatedAt: existingEvaluation.validatedAt,
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
      message: 'Évaluation mise à jour avec succès' 
    });
  } catch (error) {
    console.error('[Spotlight Evaluation Update API] Erreur PUT:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET - Récupère l'évaluation d'un spotlight par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { spotlightId: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.discordId)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { spotlightId } = params;

    if (!spotlightId) {
      return NextResponse.json(
        { error: 'spotlightId requis' },
        { status: 400 }
      );
    }

    const evaluation = await spotlightRepository.getEvaluation(spotlightId);
    
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
    console.error('[Spotlight Evaluation Get API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

