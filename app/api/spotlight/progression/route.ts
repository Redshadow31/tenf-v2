import { NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { evaluationRepository } from '@/lib/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les données de progression Spotlight pour les 3 derniers mois
 * Pour chaque mois, calcule la moyenne du nombre de présents par spotlight + 1 (le streamer)
 */
export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.discordId)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const now = new Date();
    const months: string[] = [];
    
    // Générer les 3 derniers mois
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }

    const progressionData: Array<{ month: string; value: number }> = [];

    // Pour chaque mois
    for (const monthKey of months) {
      try {
        // Charger les données du mois depuis Supabase
        const evaluations = await evaluationRepository.findByMonth(monthKey);
        
        // Agréger les spotlightEvaluations depuis toutes les évaluations
        const spotlightsMap = new Map<string, any>();
        evaluations.forEach(evaluation => {
          if (evaluation.spotlightEvaluations && Array.isArray(evaluation.spotlightEvaluations)) {
            evaluation.spotlightEvaluations.forEach((spotlight: any) => {
              if (spotlight.validated && !spotlightsMap.has(spotlight.id)) {
                spotlightsMap.set(spotlight.id, spotlight);
              }
            });
          }
        });

        const spotlights = Array.from(spotlightsMap.values());
        
        if (spotlights.length === 0) {
          progressionData.push({
            month: monthKey,
            value: 0,
          });
          continue;
        }

        // Pour chaque spotlight, calculer le nombre de présents + 1 (le streamer)
        let totalParticipants = 0;
        let spotlightCount = 0;

        for (const spotlight of spotlights) {
          // Récupérer les membres présents
          const members = spotlight.members || [];
          const presentCount = members.filter((m: any) => m.present === true).length;
          
          // Ajouter 1 pour le streamer
          const participantsCount = presentCount + 1;
          
          totalParticipants += participantsCount;
          spotlightCount++;
        }

        // Calculer la moyenne
        const averageValue = spotlightCount > 0 ? Math.round((totalParticipants / spotlightCount) * 10) / 10 : 0;

        progressionData.push({
          month: monthKey,
          value: averageValue,
        });
      } catch (error) {
        console.error(`[Spotlight Progression] Erreur pour le mois ${monthKey}:`, error);
        progressionData.push({
          month: monthKey,
          value: 0,
        });
      }
    }

    // Inverser pour avoir les mois dans l'ordre chronologique (du plus ancien au plus récent)
    progressionData.reverse();

    // Formater les mois pour l'affichage
    const monthNames = ["Janv", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    const formattedData = progressionData.map(item => {
      const [year, month] = item.month.split('-');
      const monthIndex = parseInt(month) - 1;
      return {
        month: `${monthNames[monthIndex]} ${year.slice(-2)}`,
        value: item.value,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('[Spotlight Progression API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

