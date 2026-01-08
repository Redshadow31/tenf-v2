import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { deleteAllSpotlightData } from '@/lib/spotlightStorage';
import { loadSectionAData, saveSectionAData, getMonthKey } from '@/lib/evaluationStorage';

/**
 * DELETE - Supprime un spotlight et toutes ses données associées
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { spotlightId: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { spotlightId } = params;

    if (!spotlightId) {
      return NextResponse.json(
        { error: 'spotlightId requis' },
        { status: 400 }
      );
    }

    // 1. Supprimer les données du spotlight (évaluation, présences)
    await deleteAllSpotlightData(spotlightId);

    // 2. Supprimer le spotlight de la section A (évaluation mensuelle)
    // Chercher dans les mois récents
    const now = new Date();
    const monthsToCheck: string[] = [];
    
    // Générer les 3 derniers mois à vérifier
    for (let i = 0; i < 3; i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsToCheck.push(getMonthKey(checkDate.getFullYear(), checkDate.getMonth() + 1));
    }

    let deletedFromSectionA = false;

    for (const month of monthsToCheck) {
      const sectionAData = await loadSectionAData(month);
      if (sectionAData && sectionAData.spotlights) {
        const initialLength = sectionAData.spotlights.length;
        sectionAData.spotlights = sectionAData.spotlights.filter(s => s.id !== spotlightId);
        
        if (sectionAData.spotlights.length < initialLength) {
          // Le spotlight a été trouvé et supprimé
          sectionAData.lastUpdated = new Date().toISOString();
          await saveSectionAData(sectionAData);
          deletedFromSectionA = true;
          break; // Sortir de la boucle une fois trouvé
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Spotlight supprimé avec succès',
      deletedFromSectionA,
    });
  } catch (error) {
    console.error('[Spotlight Delete API] Erreur DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

