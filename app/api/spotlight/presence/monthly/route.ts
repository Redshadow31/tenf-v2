import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';
import { evaluationRepository, memberRepository, spotlightRepository } from '@/lib/repositories';

/**
 * GET - Récupère les données mensuelles de présence aux spotlights
 * Query params: month (optionnel, format YYYY-MM, défaut: mois en cours)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

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
      monthKey = getCurrentMonthKey();
    }

    // Charger les données du mois depuis Supabase
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    // Récupérer tous les membres (limite élevée pour traitement complet)
    const allMembers = await memberRepository.findAll(1000, 0);
    const activeMembers = allMembers.filter(m => m.isActive !== false);

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
      return NextResponse.json({
        month: monthKey,
        totalSpotlights: 0,
        spotlights: [],
        members: [],
        charts: {
          presenceBySpotlight: [],
          streamerScores: [],
        },
      });
    }

    // Préparer les données pour les graphiques
    const presenceBySpotlight = spotlights.map(spotlight => ({
      id: spotlight.id,
      label: `${new Date(spotlight.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${spotlight.streamerTwitchLogin}`,
      date: spotlight.date,
      streamer: spotlight.streamerTwitchLogin,
      presenceCount: spotlight.members?.filter((m: any) => m.present).length || 0,
    }));

    // Récupérer les évaluations streamer depuis Supabase
    const streamerScores: Array<{ id: string; date: string; streamer: string; score: number; maxScore: number }> = [];
    
    // Pour chaque spotlight, récupérer l'évaluation depuis spotlight_evaluations en parallèle (évite N+1 queries)
    const evaluationPromises = spotlights.map(async (spotlight) => {
      try {
        const evaluation = await spotlightRepository.getEvaluation(spotlight.id);
        
        if (evaluation) {
          return {
            id: spotlight.id,
            date: spotlight.date,
            streamer: spotlight.streamerTwitchLogin,
            score: evaluation.totalScore || 0,
            maxScore: evaluation.maxScore || 20,
          };
        }
      } catch (error) {
        // Ignorer les erreurs
        console.warn(`[Spotlight Presence Monthly] Erreur récupération évaluation pour ${spotlight.id}:`, error);
      }
      return null;
    });
    
    const evaluationResults = await Promise.all(evaluationPromises);
    const streamerScores = evaluationResults.filter((result): result is NonNullable<typeof result> => result !== null);

    // Calculer les statistiques par membre
    const memberStatsMap = new Map<string, {
      twitchLogin: string;
      displayName: string;
      role: string;
      totalSpotlights: number;
      presences: number;
      lastSpotlightDate: string | null;
      spotlightDetails: Array<{
        date: string;
        streamer: string;
        present: boolean;
      }>;
    }>();

    // Initialiser tous les membres actifs
    activeMembers.forEach(member => {
      memberStatsMap.set(member.twitchLogin.toLowerCase(), {
        twitchLogin: member.twitchLogin,
        displayName: member.displayName || member.siteUsername || member.twitchLogin,
        role: member.role,
        totalSpotlights: spotlights.length,
        presences: 0,
        lastSpotlightDate: null,
        spotlightDetails: [],
      });
    });

    // Compter les présences
    spotlights.forEach(spotlight => {
      spotlight.members?.forEach((member: any) => {
        const login = member.twitchLogin.toLowerCase();
        const stats = memberStatsMap.get(login);
        if (stats) {
          if (member.present) {
            stats.presences++;
          }
          stats.spotlightDetails.push({
            date: spotlight.date,
            streamer: spotlight.streamerTwitchLogin,
            present: member.present || false,
          });
          // Mettre à jour la date du dernier spotlight
          if (!stats.lastSpotlightDate || spotlight.date > stats.lastSpotlightDate) {
            stats.lastSpotlightDate = spotlight.date;
          }
        }
      });
    });

    // Convertir en tableau et calculer les taux
    const members = Array.from(memberStatsMap.values())
      .map(stats => ({
        ...stats,
        presenceRate: stats.totalSpotlights > 0 
          ? Math.round((stats.presences / stats.totalSpotlights) * 100) 
          : 0,
      }))
      .sort((a, b) => b.presenceRate - a.presenceRate);

    return NextResponse.json({
      month: monthKey,
      totalSpotlights: spotlights.length,
      spotlights: spotlights.map(s => ({
        id: s.id,
        date: s.date,
        streamerTwitchLogin: s.streamerTwitchLogin,
        moderatorUsername: s.moderatorUsername,
        membersCount: s.members?.filter((m: any) => m.present).length || 0,
      })),
      members,
      charts: {
        presenceBySpotlight,
        streamerScores,
      },
    });
  } catch (error) {
    console.error('[Spotlight Presence Monthly API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

