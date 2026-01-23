import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { spotlightRepository, evaluationRepository, memberRepository } from '@/lib/repositories';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';

/**
 * POST - Finalise un spotlight et l'intègre dans le système d'évaluation mensuelle
 * Body: { month?: string } (optionnel, utilise le mois en cours si non fourni)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const spotlight = await spotlightRepository.findActive();
    if (!spotlight) {
      return NextResponse.json(
        { error: 'Aucun spotlight actif' },
        { status: 404 }
      );
    }

    // Vérifier que le spotlight n'est pas annulé
    if (spotlight.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Ce spotlight a été annulé et ne peut pas être finalisé' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const monthParam = body.month;

    // Déterminer le mois - utiliser la date du spotlight si aucun mois n'est fourni
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
      // Utiliser la date du spotlight pour déterminer le mois
      const spotlightDate = spotlight.startedAt;
      const year = spotlightDate.getFullYear();
      const month = String(spotlightDate.getMonth() + 1).padStart(2, '0');
      monthKey = `${year}-${month}`;
    }

    // Récupérer les données du spotlight
    const presences = await spotlightRepository.getPresences(spotlight.id);
    const evaluation = await spotlightRepository.getEvaluation(spotlight.id);

    // Charger tous les membres actifs pour inclure les absents
    const allMembers = await memberRepository.findAll();
    const activeMembers = allMembers.filter(m => m.isActive !== false);
    
    // Créer un Set des membres présents pour vérification rapide
    const presentMembersSet = new Set(
      presences.map(p => p.twitchLogin.toLowerCase())
    );

    // Créer la liste complète des membres (présents et absents)
    const allMembersList = activeMembers.map(member => ({
      twitchLogin: member.twitchLogin,
      present: presentMembersSet.has(member.twitchLogin.toLowerCase()),
      note: undefined,
      comment: undefined,
    }));

    // Créer l'entrée SpotlightEvaluation
    const spotlightEvaluation = {
      id: spotlight.id,
      date: spotlight.startedAt.toISOString().split('T')[0],
      streamerTwitchLogin: spotlight.streamerTwitchLogin,
      moderatorDiscordId: spotlight.moderatorDiscordId,
      moderatorUsername: spotlight.moderatorUsername,
      members: allMembersList,
      validated: true,
      validatedAt: new Date().toISOString(),
      createdAt: spotlight.createdAt.toISOString(),
      createdBy: spotlight.createdBy,
    };

    // Mettre à jour toutes les évaluations du mois pour inclure ce spotlight
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    const monthDate = `${monthKey}-01`;

    // Pour chaque membre actif, mettre à jour son évaluation
    for (const member of activeMembers) {
      let evaluation = await evaluationRepository.findByMemberAndMonth(member.twitchLogin, monthKey);
      
      let spotlightEvaluations = evaluation?.spotlightEvaluations || [];
      
      // Vérifier si ce spotlight existe déjà dans l'évaluation
      const existingIndex = spotlightEvaluations.findIndex((s: any) => s.id === spotlight.id);
      
      if (existingIndex >= 0) {
        // Mettre à jour l'entrée existante
        spotlightEvaluations[existingIndex] = spotlightEvaluation;
      } else {
        // Ajouter la nouvelle entrée
        spotlightEvaluations.push(spotlightEvaluation);
      }

      // Mettre à jour ou créer l'évaluation
      await evaluationRepository.upsert({
        month: new Date(monthDate),
        twitchLogin: member.twitchLogin.toLowerCase(),
        spotlightEvaluations,
        updatedAt: new Date(),
      });
    }

    // Marquer le spotlight comme complété
    await spotlightRepository.update(spotlight.id, { status: 'completed' });

    return NextResponse.json({ 
      success: true,
      message: 'Spotlight finalisé et intégré dans les évaluations mensuelles',
      spotlight: spotlightEvaluation,
    });
  } catch (error) {
    console.error('[Spotlight Finalize API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


