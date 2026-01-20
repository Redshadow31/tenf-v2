import { NextRequest, NextResponse } from 'next/server';
import { 
  getActiveSpotlight, 
  getSpotlightEvaluation, 
  saveSpotlightEvaluation 
} from '@/lib/spotlightStorage';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';

/**
 * GET - Récupère l'évaluation du spotlight actif
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const spotlight = await getActiveSpotlight();
    if (!spotlight) {
      return NextResponse.json({ evaluation: null });
    }

    const evaluation = await getSpotlightEvaluation(spotlight.id);
    return NextResponse.json({ evaluation });
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
    
    if (spotlightId) {
      // Si un spotlightId est fourni, charger depuis la section A
      // Chercher dans les 6 derniers mois
      try {
        const { loadSectionAData } = await import('@/lib/evaluationStorage');
        const now = new Date();
        
        for (let i = 0; i <= 6; i++) {
          const checkDate = new Date(now);
          checkDate.setMonth(checkDate.getMonth() - i);
          const checkMonthKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
          const sectionAData = await loadSectionAData(checkMonthKey);
          const matchingSpotlight = sectionAData?.spotlights?.find((s: any) => s.id === spotlightId);
          
          if (matchingSpotlight) {
            spotlight = {
              id: matchingSpotlight.id,
              streamerTwitchLogin: matchingSpotlight.streamerTwitchLogin,
              date: matchingSpotlight.date,
            };
            break;
          }
        }
      } catch (error) {
        console.error("Erreur recherche spotlight:", error);
      }
      
      if (!spotlight) {
        return NextResponse.json(
          { error: 'Spotlight non trouvé' },
          { status: 404 }
        );
      }
    } else {
      // Sinon, utiliser le spotlight actif
      spotlight = await getActiveSpotlight();
      if (!spotlight) {
        return NextResponse.json(
          { error: 'Aucun spotlight actif et aucun spotlightId fourni' },
          { status: 404 }
        );
      }
    }

    // Vérifier que le spotlight n'est pas annulé (seulement pour spotlight actif)
    if (!spotlightId && spotlight.status === 'cancelled') {
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

    const evaluation = {
      spotlightId: spotlight.id,
      streamerTwitchLogin: spotlight.streamerTwitchLogin,
      criteria,
      totalScore,
      maxScore,
      moderatorComments: moderatorComments || '',
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: admin.id,
    };

    await saveSpotlightEvaluation(evaluation);

    return NextResponse.json({ 
      success: true, 
      evaluation,
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


