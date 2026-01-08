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
    // On essaie le mois courant et les mois précédents/récents
    const now = new Date();
    const monthsToCheck: string[] = [];
    
    // Générer les 3 derniers mois à vérifier
    for (let i = 0; i < 3; i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsToCheck.push(getMonthKey(checkDate.getFullYear(), checkDate.getMonth() + 1));
    }

    let sectionAData = null;
    let monthKey: string | null = null;
    let spotlightIndex = -1;

    // Chercher le spotlight dans les mois récents
    for (const month of monthsToCheck) {
      const data = await loadSectionAData(month);
      if (data && data.spotlights) {
        const index = data.spotlights.findIndex(s => s.id === spotlightId);
        if (index !== -1) {
          sectionAData = data;
          monthKey = month;
          spotlightIndex = index;
          break;
        }
      }
    }

    if (!sectionAData || spotlightIndex === -1) {
      return NextResponse.json(
        { error: 'Spotlight non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le spotlight
    const spotlight = sectionAData.spotlights[spotlightIndex];
    
    if (date) {
      // Vérifier que la nouvelle date est valide
      const newDate = new Date(date);
      if (isNaN(newDate.getTime())) {
        return NextResponse.json(
          { error: 'Date invalide' },
          { status: 400 }
        );
      }
      spotlight.date = newDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    }

    // Stocker startedAt et endsAt pour calculer la durée
    // On peut les stocker dans un champ personnalisé ou utiliser une structure étendue
    // Pour l'instant, on stocke la durée directement si fournie
    if (startedAt) {
      (spotlight as any).startedAt = startedAt;
    }
    if (endsAt) {
      (spotlight as any).endsAt = endsAt;
    }
    if (duration !== undefined) {
      (spotlight as any).duration = duration;
    }

    // Mettre à jour lastUpdated
    sectionAData.lastUpdated = new Date().toISOString();

    // Sauvegarder les modifications
    await saveSectionAData(sectionAData);

    return NextResponse.json({ 
      success: true, 
      spotlight,
      message: 'Spotlight mis à jour avec succès' 
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

    // Chercher le spotlight dans les mois récents
    const now = new Date();
    const monthsToCheck: string[] = [];
    
    for (let i = 0; i < 3; i++) {
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

