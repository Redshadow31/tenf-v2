import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { evaluationRepository, memberRepository } from '@/lib/repositories';

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

    // Chercher le spotlight dans les 24 derniers mois
    const now = new Date();
    let oldMonthKey: string | null = null;
    let spotlightToMove: any = null;

    // Chercher le spotlight dans les mois récents
    for (let i = 0; i < 24; i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      
      try {
        const evaluations = await evaluationRepository.findByMonth(monthKey);
        
        // Chercher le spotlight dans toutes les évaluations
        for (const eval of evaluations) {
          if (eval.spotlightEvaluations && Array.isArray(eval.spotlightEvaluations)) {
            const spotlight = eval.spotlightEvaluations.find((s: any) => s.id === spotlightId);
            if (spotlight) {
              oldMonthKey = monthKey;
              spotlightToMove = { ...spotlight };
              break;
            }
          }
        }
        
        if (spotlightToMove) break;
      } catch (error) {
        // Ignorer les erreurs
      }
    }

    if (!spotlightToMove) {
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
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      newMonthKey = `${year}-${month}`;
      spotlightToMove.date = newDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    } else {
      // Si pas de nouvelle date, utiliser l'ancienne pour déterminer le mois
      const currentDate = new Date(spotlightToMove.date);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      newMonthKey = `${year}-${month}`;
    }

    // Stocker startedAt et endsAt pour calculer la durée
    if (startedAt) {
      spotlightToMove.startedAt = startedAt;
    }
    if (endsAt) {
      spotlightToMove.endsAt = endsAt;
    }
    if (duration !== undefined) {
      spotlightToMove.duration = duration;
    }

    // Mettre à jour le spotlight dans toutes les évaluations concernées
    // Si le mois a changé, déplacer le spotlight de l'ancien mois vers le nouveau
    // Récupérer tous les membres (limite élevée pour traitement complet)
    const allMembers = await memberRepository.findAll(1000, 0);
    const activeMembers = allMembers.filter(m => m.isActive !== false);

    if (newMonthKey && newMonthKey !== oldMonthKey) {
      // Déplacer le spotlight : supprimer de l'ancien mois, ajouter au nouveau mois
      
      // 1. Supprimer de l'ancien mois
      if (oldMonthKey) {
        const oldEvaluations = await evaluationRepository.findByMonth(oldMonthKey);
        for (const eval of oldEvaluations) {
          if (eval.spotlightEvaluations && Array.isArray(eval.spotlightEvaluations)) {
            const updatedSpotlights = eval.spotlightEvaluations.filter(
              (s: any) => s.id !== spotlightId
            );
            
            if (updatedSpotlights.length !== eval.spotlightEvaluations.length) {
              // Le spotlight a été trouvé et supprimé
              await evaluationRepository.update(eval.id, {
                spotlightEvaluations: updatedSpotlights,
                updatedAt: new Date(),
              });
            }
          }
        }
      }

      // 2. Ajouter au nouveau mois en parallèle (évite N+1 queries)
      const newMonthDate = `${newMonthKey}-01`;
      const updatePromises = activeMembers.map(async (member) => {
        let evaluation = await evaluationRepository.findByMemberAndMonth(member.twitchLogin, newMonthKey);
        
        let spotlightEvaluations = evaluation?.spotlightEvaluations || [];
        
        // Vérifier si ce spotlight existe déjà dans l'évaluation
        const existingIndex = spotlightEvaluations.findIndex((s: any) => s.id === spotlightId);
        
        if (existingIndex >= 0) {
          // Mettre à jour l'entrée existante
          spotlightEvaluations[existingIndex] = spotlightToMove;
        } else {
          // Ajouter la nouvelle entrée
          spotlightEvaluations.push(spotlightToMove);
        }

        // Mettre à jour ou créer l'évaluation
        return evaluationRepository.upsert({
          month: new Date(newMonthDate),
          twitchLogin: member.twitchLogin.toLowerCase(),
          spotlightEvaluations,
          updatedAt: new Date(),
        });
      });
      
      await Promise.all(updatePromises);
      
      console.log(`[Spotlight Update] Spotlight ${spotlightId} (${spotlightToMove.streamerTwitchLogin}) déplacé de ${oldMonthKey} vers ${newMonthKey}`);
    } else {
      // Même mois, juste mettre à jour
      const evaluations = await evaluationRepository.findByMonth(newMonthKey || oldMonthKey || '');
      
      // Mettre à jour toutes les évaluations en parallèle (évite N+1 queries)
      const updatePromises = evaluations.map(async (eval) => {
        if (eval.spotlightEvaluations && Array.isArray(eval.spotlightEvaluations)) {
          const spotlightIndex = eval.spotlightEvaluations.findIndex((s: any) => s.id === spotlightId);
          
          if (spotlightIndex >= 0) {
            const updatedSpotlights = [...eval.spotlightEvaluations];
            updatedSpotlights[spotlightIndex] = spotlightToMove;
            
            return evaluationRepository.update(eval.id, {
              spotlightEvaluations: updatedSpotlights,
              updatedAt: new Date(),
            });
          }
        }
      });
      
      await Promise.all(updatePromises.filter(Boolean));
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
    
    for (let i = 0; i < 24; i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      
      try {
        const evaluations = await evaluationRepository.findByMonth(monthKey);
        
        // Chercher le spotlight dans toutes les évaluations
        for (const eval of evaluations) {
          if (eval.spotlightEvaluations && Array.isArray(eval.spotlightEvaluations)) {
            const spotlight = eval.spotlightEvaluations.find((s: any) => s.id === spotlightId);
            if (spotlight) {
              return NextResponse.json({ spotlight });
            }
          }
        }
      } catch (error) {
        // Ignorer les erreurs
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

