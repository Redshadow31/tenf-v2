import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';
import { calculateSpotlightPoints } from '@/lib/evaluationSynthesisHelpers';
import { memberRepository, evaluationRepository } from '@/lib/repositories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Calcule les points Spotlight selon la logique de la page A :
 * Points = (nombre de présences / nombre total de spotlights) * 5, arrondi
 * Utilise les mêmes données que /api/spotlight/presence/monthly
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const monthKey = monthParam || getCurrentMonthKey();

    // Charger les évaluations du mois depuis Supabase
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    
    // Charger tous les membres actifs depuis Supabase
    // Récupérer tous les membres actifs (limite élevée)
    const allMembers = await memberRepository.findAll(1000, 0);
    const activeMembers = allMembers.filter(m => m.isActive !== false);

    // Extraire les spotlights validés depuis les évaluations
    const allSpotlights: any[] = [];
    evaluations.forEach((evaluation) => {
      if (evaluation.spotlightEvaluations && Array.isArray(evaluation.spotlightEvaluations)) {
        evaluation.spotlightEvaluations.forEach((se: any) => {
          if (se.validated) {
            // Vérifier si ce spotlight n'est pas déjà dans la liste
            const exists = allSpotlights.some(s => s.id === se.id);
            if (!exists) {
              allSpotlights.push(se);
            }
          }
        });
      }
    });

    // Si aucun spotlight trouvé dans les évaluations, essayer de récupérer depuis l'API de présence mensuelle
    // Cette API utilise la même logique mais peut avoir des données plus récentes
    if (allSpotlights.length === 0) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://teamnewfamily.netlify.app';
        const presenceResponse = await fetch(`${baseUrl}/api/spotlight/presence/monthly?month=${monthKey}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (presenceResponse.ok) {
          const presenceData = await presenceResponse.json();
          const spotlightsFromPresence = presenceData.spotlights || [];
          const membersFromPresence = presenceData.members || [];
          
          // Construire les spotlights depuis les données de présence
          if (spotlightsFromPresence.length > 0) {
            // Créer un map des membres avec leurs détails de présence
            const memberPresenceMap = new Map<string, any>();
            membersFromPresence.forEach((m: any) => {
              memberPresenceMap.set(m.twitchLogin.toLowerCase(), m);
            });

            // Construire les spotlights avec leurs membres
            spotlightsFromPresence.forEach((spotlight: any) => {
              const spotlightMembers: any[] = [];
              
              // Pour chaque membre actif, vérifier s'il était présent à ce spotlight
              activeMembers.forEach(member => {
                const memberPresence = memberPresenceMap.get(member.twitchLogin.toLowerCase());
                const isPresent = memberPresence?.spotlightDetails?.some((detail: any) => 
                  detail.date === spotlight.date && 
                  detail.streamer === spotlight.streamerTwitchLogin &&
                  detail.present === true
                ) || false;

                spotlightMembers.push({
                  twitchLogin: member.twitchLogin,
                  present: isPresent,
                });
              });

              allSpotlights.push({
                id: spotlight.id || `spotlight-${spotlight.date}-${spotlight.streamerTwitchLogin}`,
                date: spotlight.date,
                streamerTwitchLogin: spotlight.streamerTwitchLogin,
                members: spotlightMembers,
                validated: true, // Considérer comme validé si présent dans l'API de présence
              });
            });
            
            console.log(`[API Evaluations Spotlights Points] Récupéré ${allSpotlights.length} spotlights depuis presence/monthly pour ${monthKey}`);
          }
        }
      } catch (error) {
        console.warn('[API Evaluations Spotlights Points] Erreur lors de la récupération depuis presence/monthly:', error);
      }
    } else {
      console.log(`[API Evaluations Spotlights Points] Récupéré ${allSpotlights.length} spotlights depuis evaluations pour ${monthKey}`);
    }

    if (allSpotlights.length === 0) {
      console.warn(`[API Evaluations Spotlights Points] Aucun spotlight trouvé pour le mois ${monthKey}`);
      return NextResponse.json({ success: true, points: {}, month: monthKey });
    }

    const totalSpotlights = allSpotlights.length;

    // Calculer les statistiques par membre
    const memberStatsMap = new Map<string, { presences: number; totalSpotlights: number }>();

    // Initialiser tous les membres actifs
    activeMembers.forEach((member) => {
      if (member.twitchLogin) {
        memberStatsMap.set(member.twitchLogin.toLowerCase(), {
          presences: 0,
          totalSpotlights: totalSpotlights,
        });
      }
    });

    // Compter les présences depuis les spotlightEvaluations
    allSpotlights.forEach((spotlight: any) => {
      spotlight.members?.forEach((member: any) => {
        const login = member.twitchLogin?.toLowerCase();
        const stats = memberStatsMap.get(login);
        if (stats && member.present) {
          stats.presences++;
        }
      });
    });

    // Calculer les points pour chaque membre
    const pointsMap: Record<string, number> = {};
    memberStatsMap.forEach((stats, login) => {
      const points = calculateSpotlightPoints(stats.presences, stats.totalSpotlights);
      pointsMap[login] = points;
    });

    return NextResponse.json({ success: true, points: pointsMap, month: monthKey });
  } catch (error) {
    console.error('[API Evaluations Spotlights Points GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

