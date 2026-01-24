import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, isFounder } from '@/lib/admin';
import { spotlightRepository, evaluationRepository, memberRepository } from '@/lib/repositories';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';
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
    if (!isFounder(admin.discordId)) {
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
    const member = await memberRepository.findByTwitchLogin(streamerTwitchLogin.trim().toLowerCase());
    
    if (!member) {
      return NextResponse.json(
        { 
          error: `Le login Twitch "${streamerTwitchLogin}" ne correspond à aucun membre enregistré.` 
        },
        { status: 400 }
      );
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
    const spotlightId = `spotlight-manual-${Date.now()}`;
    const createdSpotlight = await spotlightRepository.create({
      id: spotlightId,
      streamerTwitchLogin: streamerTwitchLogin.trim().toLowerCase(),
      streamerDisplayName: member.displayName || streamerDisplayName || streamerTwitchLogin,
      startedAt: startDate,
      endsAt: endDate,
      status: 'completed',
      moderatorDiscordId: admin.discordId,
      moderatorUsername: username,
      createdAt: new Date(),
      createdBy: admin.discordId,
    });

    // Enregistrer les présences
    if (Array.isArray(presences) && presences.length > 0) {
      const presenceEntries = presences.map((p: any) => ({
        spotlightId: createdSpotlight.id,
        twitchLogin: p.twitchLogin?.toLowerCase() || '',
        displayName: p.displayName,
        addedAt: startDate,
        addedBy: admin.discordId,
      }));

      await spotlightRepository.replacePresences(createdSpotlight.id, presenceEntries);
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

      await spotlightRepository.saveEvaluation({
        spotlightId: createdSpotlight.id,
        streamerTwitchLogin: createdSpotlight.streamerTwitchLogin,
        criteria: evaluation.criteria,
        totalScore,
        maxScore,
        moderatorComments: evaluation.moderatorComments || '',
        evaluatedAt: new Date(),
        evaluatedBy: admin.discordId,
        validated: true,
        validatedAt: new Date(),
      });
    }

    // Intégrer directement dans les évaluations mensuelles
    const monthKey = getCurrentMonthKey();
    const monthDate = `${monthKey}-01`;

    // Charger tous les membres actifs pour inclure les absents
    // Récupérer tous les membres (limite élevée pour traitement complet)
    const allMembers = await memberRepository.findAll(1000, 0);
    const activeMembers = allMembers.filter(m => m.isActive !== false);
    
    // Créer un Set des membres présents pour vérification rapide
    const presentMembersSet = new Set(
      (presences || []).map((p: any) => p.twitchLogin?.toLowerCase()).filter(Boolean)
    );

    // Créer la liste complète des membres (présents et absents)
    const allMembersList = activeMembers.map(m => ({
      twitchLogin: m.twitchLogin,
      present: presentMembersSet.has(m.twitchLogin.toLowerCase()),
      note: undefined,
      comment: undefined,
    }));

    // Créer l'entrée SpotlightEvaluation
    const spotlightEvaluation = {
      id: createdSpotlight.id,
      date: startDate.toISOString().split('T')[0],
      streamerTwitchLogin: createdSpotlight.streamerTwitchLogin,
      moderatorDiscordId: createdSpotlight.moderatorDiscordId,
      moderatorUsername: createdSpotlight.moderatorUsername,
      members: allMembersList,
      validated: true,
      validatedAt: new Date().toISOString(),
      createdAt: createdSpotlight.createdAt.toISOString(),
      createdBy: createdSpotlight.createdBy,
    };

    // Mettre à jour toutes les évaluations du mois pour inclure ce spotlight en parallèle (évite N+1 queries)
    const updatePromises = activeMembers.map(async (member) => {
      let evaluation = await evaluationRepository.findByMemberAndMonth(member.twitchLogin, monthKey);
      
      let spotlightEvaluations = evaluation?.spotlightEvaluations || [];
      
      // Vérifier si ce spotlight existe déjà dans l'évaluation
      const existingIndex = spotlightEvaluations.findIndex((s: any) => s.id === createdSpotlight.id);
      
      if (existingIndex >= 0) {
        // Mettre à jour l'entrée existante
        spotlightEvaluations[existingIndex] = spotlightEvaluation;
      } else {
        // Ajouter la nouvelle entrée
        spotlightEvaluations.push(spotlightEvaluation);
      }

      // Mettre à jour ou créer l'évaluation
      return evaluationRepository.upsert({
        month: new Date(monthDate),
        twitchLogin: member.twitchLogin.toLowerCase(),
        spotlightEvaluations,
        updatedAt: new Date(),
      });
    });
    
    await Promise.all(updatePromises);

    // Récupérer les présences et l'évaluation pour la réponse
    const savedPresences = await spotlightRepository.getPresences(createdSpotlight.id);
    const savedEvaluation = await spotlightRepository.getEvaluation(createdSpotlight.id);

    return NextResponse.json({
      success: true,
      message: 'Spotlight créé avec succès et intégré dans les évaluations mensuelles',
      spotlight: {
        id: createdSpotlight.id,
        streamerTwitchLogin: createdSpotlight.streamerTwitchLogin,
        streamerDisplayName: createdSpotlight.streamerDisplayName,
        startedAt: createdSpotlight.startedAt.toISOString(),
        endsAt: createdSpotlight.endsAt.toISOString(),
        status: createdSpotlight.status,
        moderatorDiscordId: createdSpotlight.moderatorDiscordId,
        moderatorUsername: createdSpotlight.moderatorUsername,
        createdAt: createdSpotlight.createdAt.toISOString(),
        createdBy: createdSpotlight.createdBy,
        presences: savedPresences.map(p => ({
          twitchLogin: p.twitchLogin,
          displayName: p.displayName,
          addedAt: p.addedAt.toISOString(),
          addedBy: p.addedBy,
        })),
        evaluation: savedEvaluation ? {
          spotlightId: savedEvaluation.spotlightId,
          streamerTwitchLogin: savedEvaluation.streamerTwitchLogin,
          criteria: savedEvaluation.criteria,
          totalScore: savedEvaluation.totalScore,
          maxScore: savedEvaluation.maxScore,
          moderatorComments: savedEvaluation.moderatorComments,
          evaluatedAt: savedEvaluation.evaluatedAt.toISOString(),
          evaluatedBy: savedEvaluation.evaluatedBy,
        } : null,
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

