import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { loadSectionAData, getCurrentMonthKey } from '@/lib/evaluationStorage';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';

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

    // Charger les données du mois
    await loadMemberDataFromStorage();
    const sectionAData = await loadSectionAData(monthKey);
    const allMembers = getAllMemberData();

    if (!sectionAData || !sectionAData.spotlights || sectionAData.spotlights.length === 0) {
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

    const spotlights = sectionAData.spotlights.filter(s => s.validated);

    // Préparer les données pour les graphiques
    const presenceBySpotlight = spotlights.map(spotlight => ({
      id: spotlight.id,
      label: `${new Date(spotlight.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${spotlight.streamerTwitchLogin}`,
      date: spotlight.date,
      streamer: spotlight.streamerTwitchLogin,
      presenceCount: spotlight.members?.filter((m: any) => m.present).length || 0,
    }));

    // Récupérer les évaluations streamer depuis le stockage spotlight
    const streamerScores: Array<{ id: string; date: string; streamer: string; score: number; maxScore: number }> = [];
    
    // Pour chaque spotlight, essayer de récupérer l'évaluation
    for (const spotlight of spotlights) {
      try {
        const { getStore } = await import('@netlify/blobs');
        const isNetlify = typeof getStore === 'function' || 
                          !!process.env.NETLIFY || 
                          !!process.env.NETLIFY_DEV;
        
        if (isNetlify) {
          const store = getStore('tenf-spotlights');
          const evaluation = await store.get(`${spotlight.id}/evaluation.json`, { type: 'json' }).catch(() => null);
          
          if (evaluation) {
            streamerScores.push({
              id: spotlight.id,
              date: spotlight.date,
              streamer: spotlight.streamerTwitchLogin,
              score: evaluation.totalScore || 0,
              maxScore: evaluation.maxScore || 20,
            });
          }
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }

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

    // Initialiser tous les membres
    allMembers.forEach(member => {
      if (member.isActive !== false) {
        memberStatsMap.set(member.twitchLogin.toLowerCase(), {
          twitchLogin: member.twitchLogin,
          displayName: member.displayName,
          role: member.role,
          totalSpotlights: spotlights.length,
          presences: 0,
          lastSpotlightDate: null,
          spotlightDetails: [],
        });
      }
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

