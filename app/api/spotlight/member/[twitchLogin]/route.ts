import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { evaluationRepository, spotlightRepository } from '@/lib/repositories';

/**
 * GET - Récupère toutes les données spotlight pour un membre spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { twitchLogin: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const twitchLogin = decodeURIComponent(params.twitchLogin).toLowerCase();

    // Récupérer tous les spotlights depuis les évaluations mensuelles
    const allSpotlights: any[] = [];
    const currentYear = new Date().getFullYear();
    
    // Parcourir les 12 derniers mois
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, new Date().getMonth() - month, 1);
      const year = date.getFullYear();
      const monthNum = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${monthNum}`;
      
      try {
        const evaluations = await evaluationRepository.findByMonth(monthKey);
        
        // Agréger les spotlightEvaluations depuis toutes les évaluations
        const spotlightsMap = new Map<string, any>();
        evaluations.forEach(eval => {
          if (eval.spotlightEvaluations && Array.isArray(eval.spotlightEvaluations)) {
            eval.spotlightEvaluations.forEach((spotlight: any) => {
              if (spotlight.validated && !spotlightsMap.has(spotlight.id)) {
                spotlightsMap.set(spotlight.id, spotlight);
              }
            });
          }
        });

        const spotlights = Array.from(spotlightsMap.values());
        
        for (const spotlight of spotlights) {
          // Vérifier si le membre était streamer ou présent
          const isStreamer = spotlight.streamerTwitchLogin.toLowerCase() === twitchLogin;
          const isPresent = spotlight.members?.some(
            (m: any) => m.twitchLogin.toLowerCase() === twitchLogin && m.present
          );
          
          if (isStreamer || isPresent) {
            // Récupérer l'évaluation si disponible
            let evaluation = null;
            try {
              const evalData = await spotlightRepository.getEvaluation(spotlight.id);
              if (evalData) {
                evaluation = {
                  spotlightId: evalData.spotlightId,
                  streamerTwitchLogin: evalData.streamerTwitchLogin,
                  criteria: evalData.criteria,
                  totalScore: evalData.totalScore,
                  maxScore: evalData.maxScore,
                  moderatorComments: evalData.moderatorComments,
                  evaluatedAt: evalData.evaluatedAt.toISOString(),
                  evaluatedBy: evalData.evaluatedBy,
                };
              }
            } catch (error) {
              // Ignorer les erreurs
            }
            
            allSpotlights.push({
              ...spotlight,
              month: monthKey,
              role: isStreamer ? 'streamer' : 'present',
              evaluation,
            });
          }
        }
      } catch (error) {
        // Ignorer les erreurs pour les mois sans données
        console.warn(`[Spotlight Member] Erreur pour le mois ${monthKey}:`, error);
      }
    }

    // Récupérer aussi le spotlight actif/complété depuis Supabase (si présent)
    try {
      const activeSpotlight = await spotlightRepository.findActive();
      
      if (!activeSpotlight) {
        // Essayer de trouver un spotlight complété récent
        const allSpotlightsFromDb = await spotlightRepository.findAll();
        const recentCompleted = allSpotlightsFromDb
          .filter(s => s.status === 'completed')
          .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
        
        if (recentCompleted) {
          const isStreamer = recentCompleted.streamerTwitchLogin.toLowerCase() === twitchLogin;
          
          // Vérifier les présences
          const presences = await spotlightRepository.getPresences(recentCompleted.id);
          const isPresent = presences.some(
            p => p.twitchLogin.toLowerCase() === twitchLogin
          );
          
          if (isStreamer || isPresent) {
            const evaluation = await spotlightRepository.getEvaluation(recentCompleted.id);
            
            allSpotlights.push({
              id: recentCompleted.id,
              date: recentCompleted.startedAt.toISOString().split('T')[0],
              streamerTwitchLogin: recentCompleted.streamerTwitchLogin,
              moderatorUsername: recentCompleted.moderatorUsername,
              members: presences.map(p => ({
                twitchLogin: p.twitchLogin,
                present: true,
              })),
              role: isStreamer ? 'streamer' : 'present',
              status: recentCompleted.status,
              evaluation: evaluation ? {
                spotlightId: evaluation.spotlightId,
                streamerTwitchLogin: evaluation.streamerTwitchLogin,
                criteria: evaluation.criteria,
                totalScore: evaluation.totalScore,
                maxScore: evaluation.maxScore,
                moderatorComments: evaluation.moderatorComments,
                evaluatedAt: evaluation.evaluatedAt.toISOString(),
                evaluatedBy: evaluation.evaluatedBy,
              } : null,
            });
          }
        }
      } else {
        const isStreamer = activeSpotlight.streamerTwitchLogin.toLowerCase() === twitchLogin;
        
        // Vérifier les présences
        const presences = await spotlightRepository.getPresences(activeSpotlight.id);
        const isPresent = presences.some(
          p => p.twitchLogin.toLowerCase() === twitchLogin
        );
        
        if (isStreamer || isPresent) {
          const evaluation = await spotlightRepository.getEvaluation(activeSpotlight.id);
          
          allSpotlights.push({
            id: activeSpotlight.id,
            date: activeSpotlight.startedAt.toISOString().split('T')[0],
            streamerTwitchLogin: activeSpotlight.streamerTwitchLogin,
            moderatorUsername: activeSpotlight.moderatorUsername,
            members: presences.map(p => ({
              twitchLogin: p.twitchLogin,
              present: true,
            })),
            role: isStreamer ? 'streamer' : 'present',
            status: activeSpotlight.status,
            evaluation: evaluation ? {
              spotlightId: evaluation.spotlightId,
              streamerTwitchLogin: evaluation.streamerTwitchLogin,
              criteria: evaluation.criteria,
              totalScore: evaluation.totalScore,
              maxScore: evaluation.maxScore,
              moderatorComments: evaluation.moderatorComments,
              evaluatedAt: evaluation.evaluatedAt.toISOString(),
              evaluatedBy: evaluation.evaluatedBy,
            } : null,
          });
        }
      }
    } catch (error) {
      // Ignorer les erreurs de lecture du spotlight actif
      console.warn('[Spotlight Member] Erreur récupération spotlight actif:', error);
    }

    // Trier par date (plus récent en premier)
    allSpotlights.sort((a, b) => {
      const dateA = new Date(a.date || a.startedAt || 0);
      const dateB = new Date(b.date || b.startedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Calculer les statistiques
    const stats = {
      totalSpotlights: allSpotlights.length,
      asStreamer: allSpotlights.filter(s => s.role === 'streamer').length,
      asPresent: allSpotlights.filter(s => s.role === 'present').length,
      averageScore: 0,
      totalScore: 0,
      evaluationsCount: 0,
    };

    // Calculer la moyenne des scores (si streamer)
    const streamerEvaluations = allSpotlights.filter(
      s => s.role === 'streamer' && s.evaluation
    );
    if (streamerEvaluations.length > 0) {
      stats.totalScore = streamerEvaluations.reduce(
        (sum, s) => sum + (s.evaluation?.totalScore || 0),
        0
      );
      stats.evaluationsCount = streamerEvaluations.length;
      stats.averageScore = stats.totalScore / stats.evaluationsCount;
    }

    return NextResponse.json({
      twitchLogin,
      spotlights: allSpotlights,
      stats,
    });
  } catch (error) {
    console.error('[Spotlight Member API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

