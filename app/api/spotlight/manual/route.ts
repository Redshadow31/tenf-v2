import { NextRequest, NextResponse } from 'next/server';
import { 
  saveActiveSpotlight,
  saveSpotlightPresences,
  saveSpotlightEvaluation 
} from '@/lib/spotlightStorage';
import { getCurrentAdmin, isFounder } from '@/lib/admin';
import { getMemberData, loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';
import { cookies } from 'next/headers';

/**
 * POST - Crée un spotlight manuellement (réservé aux fondateurs)
 * Body: {
 *   streamerTwitchLogin: string,
 *   streamerDisplayName?: string,
 *   startedAt: string (ISO),
 *   endsAt: string (ISO),
 *   presences: Array<{ twitchLogin: string, displayName?: string }>,
 *   evaluation?: { criteria: Array, moderatorComments: string } | null
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    // Vérifier que l'utilisateur est authentifié
    if (!admin) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est fondateur
    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: 'Accès refusé. Cette fonctionnalité est réservée aux fondateurs.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      streamerTwitchLogin,
      streamerDisplayName,
      startedAt,
      endsAt,
      presences,
      evaluation,
    } = body;

    // Validation des champs requis
    if (!streamerTwitchLogin) {
      return NextResponse.json(
        { error: 'streamerTwitchLogin est requis' },
        { status: 400 }
      );
    }

    if (!startedAt || !endsAt) {
      return NextResponse.json(
        { error: 'startedAt et endsAt sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que le login Twitch correspond à un membre enregistré
    await loadMemberDataFromStorage();
    const member = getMemberData(streamerTwitchLogin.trim().toLowerCase());
    
    if (!member) {
      const allMembers = getAllMemberData();
      const foundMember = allMembers.find(
        m => m.twitchLogin.toLowerCase() === streamerTwitchLogin.trim().toLowerCase()
      );
      
      if (!foundMember) {
        return NextResponse.json(
          { 
            error: `Le login Twitch "${streamerTwitchLogin}" ne correspond à aucun membre enregistré.` 
          },
          { status: 400 }
        );
      }
    }

    // Validation des dates
    const startDate = new Date(startedAt);
    const endDate = new Date(endsAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Dates invalides' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'L\'heure de fin doit être après l\'heure de début' },
        { status: 400 }
      );
    }

    // Récupérer le username depuis les cookies
    const cookieStore = cookies();
    const username = cookieStore.get('discord_username')?.value || admin.username;

    // Créer le spotlight avec status = completed
    const spotlight = {
      id: `spotlight-manual-${Date.now()}`,
      streamerTwitchLogin: streamerTwitchLogin.trim().toLowerCase(),
      streamerDisplayName: member?.displayName || streamerDisplayName || streamerTwitchLogin,
      startedAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
      status: 'completed' as const,
      moderatorDiscordId: admin.id,
      moderatorUsername: username,
      createdAt: new Date().toISOString(),
      createdBy: admin.id,
    };

    await saveActiveSpotlight(spotlight);

    // Enregistrer les présences
    if (Array.isArray(presences) && presences.length > 0) {
      const presenceEntries = presences.map((p: any) => ({
        twitchLogin: p.twitchLogin,
        displayName: p.displayName,
        addedAt: startDate.toISOString(), // Utiliser la date de début du spotlight
        addedBy: admin.id,
      }));

      await saveSpotlightPresences(spotlight.id, presenceEntries);
    }

    // Enregistrer l'évaluation si fournie
    if (evaluation && evaluation.criteria) {
      const totalScore = evaluation.criteria.reduce(
        (sum: number, crit: any) => sum + (crit.value || 0),
        0
      );
      const maxScore = evaluation.criteria.reduce(
        (sum: number, crit: any) => sum + (crit.maxValue || 0),
        0
      );

      const evaluationEntry = {
        spotlightId: spotlight.id,
        streamerTwitchLogin: spotlight.streamerTwitchLogin,
        criteria: evaluation.criteria,
        totalScore,
        maxScore,
        moderatorComments: evaluation.moderatorComments || '',
        evaluatedAt: new Date().toISOString(),
        evaluatedBy: admin.id,
      };

      await saveSpotlightEvaluation(evaluationEntry);
    }

    // Intégrer directement dans les évaluations mensuelles
    const { loadSectionAData, saveSectionAData, getCurrentMonthKey } = await import('@/lib/evaluationStorage');
    const monthKey = getCurrentMonthKey();
    const sectionAData = await loadSectionAData(monthKey);
    const existingData = sectionAData || {
      month: monthKey,
      spotlights: [],
      events: [],
      raidPoints: {},
      spotlightBonus: {},
      lastUpdated: new Date().toISOString(),
    };

    // Charger tous les membres actifs pour inclure les absents
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData().filter(m => m.isActive !== false);
    
    // Créer un Set des membres présents pour vérification rapide
    const presentMembersSet = new Set(
      (presences || []).map((p: any) => p.twitchLogin.toLowerCase())
    );

    // Créer la liste complète des membres (présents et absents)
    const allMembersList = allMembers.map(member => ({
      twitchLogin: member.twitchLogin,
      present: presentMembersSet.has(member.twitchLogin.toLowerCase()),
      note: undefined,
      comment: undefined,
    }));

    // Créer l'entrée SpotlightEvaluation
    const spotlightEvaluation = {
      id: spotlight.id,
      date: startDate.toISOString().split('T')[0],
      streamerTwitchLogin: spotlight.streamerTwitchLogin,
      moderatorDiscordId: spotlight.moderatorDiscordId,
      moderatorUsername: spotlight.moderatorUsername,
      members: allMembersList,
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
    await saveSectionAData(existingData);

    return NextResponse.json({
      success: true,
      message: 'Spotlight créé avec succès et intégré dans les évaluations mensuelles',
      spotlight: {
        ...spotlight,
        presences: presences || [],
        evaluation: evaluation || null,
      },
    });
  } catch (error) {
    console.error('[Spotlight Manual API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

