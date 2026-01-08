import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { loadSectionAData, saveSectionAData, getMonthKey } from '@/lib/evaluationStorage';

/**
 * PUT - Met à jour les données d'un spotlight (date et durée)
 * Body: { date: string (ISO), duration?: string, startedAt?: string (ISO), endsAt?: string (ISO) }
 */
export async function PUT(
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

    const body = await request.json();
    const { date, duration, startedAt, endsAt } = body;

    // Charger les données de section A pour trouver le mois
    // On cherche dans les 24 derniers mois pour être sûr de trouver le spotlight
    const now = new Date();
    const monthsToCheck: string[] = [];
    
    // Générer les 24 derniers mois à vérifier
    for (let i = 0; i < 24; i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsToCheck.push(getMonthKey(checkDate.getFullYear(), checkDate.getMonth() + 1));
    }

    let oldSectionAData = null;
    let oldMonthKey: string | null = null;
    let spotlightIndex = -1;
    let spotlightToMove = null;

    // Chercher le spotlight dans les mois récents
    for (const month of monthsToCheck) {
      const data = await loadSectionAData(month);
      if (data && data.spotlights) {
        const index = data.spotlights.findIndex(s => s.id === spotlightId);
        if (index !== -1) {
          oldSectionAData = data;
          oldMonthKey = month;
          spotlightIndex = index;
          spotlightToMove = { ...data.spotlights[index] };
          break;
        }
      }
    }

    if (!oldSectionAData || spotlightIndex === -1 || !spotlightToMove) {
      return NextResponse.json(
        { error: 'Spotlight non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si la date change et déterminer le nouveau mois
    let newMonthKey: string | null = null;
    if (date) {
      // Vérifier que la nouvelle date est valide
      const newDate = new Date(date);
      if (isNaN(newDate.getTime())) {
        return NextResponse.json(
          { error: 'Date invalide' },
          { status: 400 }
        );
      }
      
      // Calculer le nouveau mois
      newMonthKey = getMonthKey(newDate.getFullYear(), newDate.getMonth() + 1);
      spotlightToMove.date = newDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    } else {
      // Si pas de nouvelle date, utiliser l'ancienne pour déterminer le mois
      const currentDate = new Date(spotlightToMove.date);
      newMonthKey = getMonthKey(currentDate.getFullYear(), currentDate.getMonth() + 1);
    }

    // Stocker startedAt et endsAt pour calculer la durée
    if (startedAt) {
      (spotlightToMove as any).startedAt = startedAt;
    }
    if (endsAt) {
      (spotlightToMove as any).endsAt = endsAt;
    }
    if (duration !== undefined) {
      (spotlightToMove as any).duration = duration;
    }

    // Si le mois a changé, déplacer le spotlight
    if (newMonthKey && newMonthKey !== oldMonthKey) {
      // IMPORTANT: Ajouter d'abord au nouveau mois pour éviter la perte de données
      // 1. Ajouter au nouveau mois
      let newSectionAData = await loadSectionAData(newMonthKey);
      if (!newSectionAData) {
        // Créer les données du mois si elles n'existent pas
        newSectionAData = {
          month: newMonthKey,
          spotlights: [],
          events: [],
          raidPoints: {},
          spotlightBonus: {},
          lastUpdated: new Date().toISOString(),
        };
      }
      
      // Vérifier que le spotlight n'existe pas déjà dans le nouveau mois
      const existingIndex = newSectionAData.spotlights.findIndex(s => s.id === spotlightId);
      if (existingIndex === -1) {
        newSectionAData.spotlights.push(spotlightToMove);
      } else {
        // Si déjà présent, mettre à jour
        newSectionAData.spotlights[existingIndex] = spotlightToMove;
      }
      
      newSectionAData.lastUpdated = new Date().toISOString();
      
      // Sauvegarder le nouveau mois AVANT de supprimer l'ancien
      await saveSectionAData(newSectionAData);
      
      // Vérifier que la sauvegarde a réussi en rechargeant
      const verifyNewData = await loadSectionAData(newMonthKey);
      if (!verifyNewData || !verifyNewData.spotlights.find(s => s.id === spotlightId)) {
        console.error(`[Spotlight Update] ERREUR: Le spotlight ${spotlightId} n'a pas été correctement ajouté au mois ${newMonthKey}`);
        return NextResponse.json(
          { error: 'Erreur lors de l\'ajout au nouveau mois. Le spotlight n\'a pas été supprimé de l\'ancien mois.' },
          { status: 500 }
        );
      }

      // 2. Supprimer du mois ancien (seulement si l'ajout au nouveau mois a réussi)
      oldSectionAData.spotlights.splice(spotlightIndex, 1);
      oldSectionAData.lastUpdated = new Date().toISOString();
      await saveSectionAData(oldSectionAData);
      
      console.log(`[Spotlight Update] Spotlight ${spotlightId} (${spotlightToMove.streamerTwitchLogin}) déplacé de ${oldMonthKey} vers ${newMonthKey}`);
    } else {
      // Même mois, juste mettre à jour
      oldSectionAData.spotlights[spotlightIndex] = spotlightToMove;
      oldSectionAData.lastUpdated = new Date().toISOString();
      await saveSectionAData(oldSectionAData);
    }

    return NextResponse.json({ 
      success: true, 
      spotlight: spotlightToMove,
      message: newMonthKey && newMonthKey !== oldMonthKey 
        ? `Spotlight mis à jour et déplacé de ${oldMonthKey} vers ${newMonthKey}` 
        : 'Spotlight mis à jour avec succès',
      moved: newMonthKey && newMonthKey !== oldMonthKey,
      oldMonth: oldMonthKey,
      newMonth: newMonthKey,
    });
  } catch (error) {
    console.error('[Spotlight Update API] Erreur PUT:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET - Récupère les données d'un spotlight par son ID
 */
export async function GET(
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

    // Chercher le spotlight dans les 24 derniers mois
    const now = new Date();
    const monthsToCheck: string[] = [];
    
    for (let i = 0; i < 24; i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsToCheck.push(getMonthKey(checkDate.getFullYear(), checkDate.getMonth() + 1));
    }

    for (const month of monthsToCheck) {
      const data = await loadSectionAData(month);
      if (data && data.spotlights) {
        const spotlight = data.spotlights.find(s => s.id === spotlightId);
        if (spotlight) {
          return NextResponse.json({ spotlight });
        }
      }
    }

    return NextResponse.json(
      { error: 'Spotlight non trouvé' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[Spotlight Get API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

