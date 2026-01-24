import { NextRequest, NextResponse } from 'next/server';
import { spotlightRepository } from '@/lib/repositories';
import { memberRepository } from '@/lib/repositories';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';

/**
 * GET - Récupère le spotlight actif
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const spotlight = await spotlightRepository.findActive();
    
    if (!spotlight) {
      return NextResponse.json({ spotlight: null });
    }

    // Récupérer les données complètes (présences et évaluation)
    const presences = await spotlightRepository.getPresences(spotlight.id);
    const evaluation = await spotlightRepository.getEvaluation(spotlight.id);

    // Formater les données pour compatibilité avec le frontend
    const data = {
      spotlight: {
        ...spotlight,
        startedAt: spotlight.startedAt instanceof Date ? spotlight.startedAt.toISOString() : spotlight.startedAt,
        endsAt: spotlight.endsAt instanceof Date ? spotlight.endsAt.toISOString() : spotlight.endsAt,
        createdAt: spotlight.createdAt instanceof Date ? spotlight.createdAt.toISOString() : spotlight.createdAt,
      },
      presences: presences.map(p => ({
        ...p,
        addedAt: p.addedAt instanceof Date ? p.addedAt.toISOString() : p.addedAt,
      })),
      evaluation: evaluation ? {
        ...evaluation,
        evaluatedAt: evaluation.evaluatedAt instanceof Date ? evaluation.evaluatedAt.toISOString() : evaluation.evaluatedAt,
        validatedAt: evaluation.validatedAt ? (evaluation.validatedAt instanceof Date ? evaluation.validatedAt.toISOString() : evaluation.validatedAt) : undefined,
      } : undefined,
      validated: evaluation?.validated || false,
      validatedAt: evaluation?.validatedAt ? (evaluation.validatedAt instanceof Date ? evaluation.validatedAt.toISOString() : evaluation.validatedAt) : undefined,
    };
    
    return NextResponse.json({ spotlight: data });
  } catch (error) {
    console.error('[Spotlight API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Lance un nouveau spotlight
 * Body: { streamerTwitchLogin: string, streamerDisplayName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Vérifier qu'il n'y a pas déjà un spotlight actif
    const existing = await spotlightRepository.findActive();
    if (existing && existing.status === 'active') {
      return NextResponse.json(
        { error: 'Un spotlight est déjà en cours' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { streamerTwitchLogin, streamerDisplayName, moderatorDiscordId, moderatorUsername } = body;

    if (!streamerTwitchLogin) {
      return NextResponse.json(
        { error: 'streamerTwitchLogin est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le modérateur est fourni ou utiliser l'admin actuel
    const finalModeratorDiscordId = moderatorDiscordId || admin.discordId;
    const finalModeratorUsername = moderatorUsername || admin.username;

    // Vérifier que le login Twitch correspond à un membre enregistré
    const member = await memberRepository.findByTwitchLogin(streamerTwitchLogin.trim().toLowerCase());
    
    if (!member) {
      return NextResponse.json(
        { 
          error: `Le login Twitch "${streamerTwitchLogin}" ne correspond à aucun membre enregistré. Veuillez vérifier le nom de la chaîne dans la page Gestion Membres.` 
        },
        { status: 400 }
      );
    }

    // Utiliser le displayName du membre si disponible
    const finalDisplayName = member.displayName || streamerDisplayName || streamerTwitchLogin;

    // Créer le spotlight
    const now = new Date();
    const endsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 heures
    const spotlightId = `spotlight-${Date.now()}`;

    const spotlight = await spotlightRepository.create({
      id: spotlightId,
      streamerTwitchLogin: streamerTwitchLogin.trim().toLowerCase(),
      streamerDisplayName: finalDisplayName,
      startedAt: now,
      endsAt: endsAt,
      status: 'active',
      moderatorDiscordId: finalModeratorDiscordId,
      moderatorUsername: finalModeratorUsername,
      createdAt: now,
      createdBy: admin.discordId,
    });

    // Formater pour compatibilité avec le frontend
    const formattedSpotlight = {
      ...spotlight,
      startedAt: spotlight.startedAt instanceof Date ? spotlight.startedAt.toISOString() : spotlight.startedAt,
      endsAt: spotlight.endsAt instanceof Date ? spotlight.endsAt.toISOString() : spotlight.endsAt,
      createdAt: spotlight.createdAt instanceof Date ? spotlight.createdAt.toISOString() : spotlight.createdAt,
    };

    return NextResponse.json({ spotlight: formattedSpotlight });
  } catch (error) {
    console.error('[Spotlight API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Met à jour le statut du spotlight
 * Body: { status: 'active' | 'completed' | 'cancelled' }
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'status invalide' },
        { status: 400 }
      );
    }

    const updated = await spotlightRepository.update(spotlight.id, { status });

    // Formater pour compatibilité avec le frontend
    const formattedSpotlight = {
      ...updated,
      startedAt: updated.startedAt instanceof Date ? updated.startedAt.toISOString() : updated.startedAt,
      endsAt: updated.endsAt instanceof Date ? updated.endsAt.toISOString() : updated.endsAt,
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
    };

    return NextResponse.json({ spotlight: formattedSpotlight });
  } catch (error) {
    console.error('[Spotlight API] Erreur PATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

