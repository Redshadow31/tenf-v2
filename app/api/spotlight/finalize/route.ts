import { NextRequest, NextResponse } from 'next/server';
import { 
  getActiveSpotlight, 
  getSpotlightPresences, 
  getSpotlightEvaluation,
  saveActiveSpotlight 
} from '@/lib/spotlightStorage';
import { loadSectionAData, saveSectionAData } from '@/lib/evaluationStorage';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';

/**
 * POST - Finalise un spotlight et l'intègre dans le système d'évaluation mensuelle
 * Body: { month?: string } (optionnel, utilise le mois en cours si non fourni)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const spotlight = await getActiveSpotlight();
    if (!spotlight) {
      return NextResponse.json(
        { error: 'Aucun spotlight actif' },
        { status: 404 }
      );
    }

    // Vérifier que le spotlight n'est pas annulé
    if (spotlight.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Ce spotlight a été annulé et ne peut pas être finalisé' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const monthParam = body.month;

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
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      monthKey = `${year}-${month}`;
    }

    // Récupérer les données du spotlight
    const presences = await getSpotlightPresences(spotlight.id);
    const evaluation = await getSpotlightEvaluation(spotlight.id);

    // Charger les données de la section A
    const sectionAData = await loadSectionAData(monthKey);
    const existingData = sectionAData || {
      month: monthKey,
      spotlights: [],
      events: [],
      raidPoints: {},
      spotlightBonus: {},
      lastUpdated: new Date().toISOString(),
    };

    // Créer l'entrée SpotlightEvaluation
    const spotlightEvaluation = {
      id: spotlight.id,
      date: spotlight.startedAt.split('T')[0],
      streamerTwitchLogin: spotlight.streamerTwitchLogin,
      moderatorDiscordId: spotlight.moderatorDiscordId,
      moderatorUsername: spotlight.moderatorUsername,
      members: presences.map(p => ({
        twitchLogin: p.twitchLogin,
        present: true,
        note: undefined,
        comment: undefined,
      })),
      validated: true,
      validatedAt: new Date().toISOString(),
      createdAt: spotlight.createdAt,
      createdBy: spotlight.createdBy,
    };

    // Vérifier si le spotlight existe déjà
    const existingIndex = existingData.spotlights.findIndex(s => s.id === spotlight.id);
    if (existingIndex >= 0) {
      existingData.spotlights[existingIndex] = spotlightEvaluation;
    } else {
      existingData.spotlights.push(spotlightEvaluation);
    }

    existingData.lastUpdated = new Date().toISOString();

    // Sauvegarder
    await saveSectionAData(existingData);

    // Marquer le spotlight comme complété
    await saveActiveSpotlight({ ...spotlight, status: 'completed' });

    return NextResponse.json({ 
      success: true,
      message: 'Spotlight finalisé et intégré dans les évaluations mensuelles',
      spotlight: spotlightEvaluation,
    });
  } catch (error) {
    console.error('[Spotlight Finalize API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


