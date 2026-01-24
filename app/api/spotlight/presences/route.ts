import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { spotlightRepository } from '@/lib/repositories';

/**
 * GET - Récupère les présences du spotlight actif
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const spotlight = await spotlightRepository.findActive();
    if (!spotlight) {
      return NextResponse.json({ presences: [] });
    }

    const presences = await spotlightRepository.getPresences(spotlight.id);
    
    // Convertir au format attendu par le frontend
    const formattedPresences = presences.map(p => ({
      twitchLogin: p.twitchLogin,
      displayName: p.displayName,
      addedAt: p.addedAt.toISOString(),
      addedBy: p.addedBy,
    }));

    return NextResponse.json({ presences: formattedPresences });
  } catch (error) {
    console.error('[Spotlight Presences API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Ajoute une présence
 * Body: { twitchLogin: string, displayName?: string }
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
        { error: 'Ce spotlight a été annulé' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { twitchLogin, displayName } = body;

    if (!twitchLogin) {
      return NextResponse.json(
        { error: 'twitchLogin est requis' },
        { status: 400 }
      );
    }

    await spotlightRepository.addPresence({
      spotlightId: spotlight.id,
      twitchLogin: twitchLogin.toLowerCase(),
      displayName,
      addedBy: admin.discordId,
      addedAt: new Date(),
    });

    const presences = await spotlightRepository.getPresences(spotlight.id);
    
    // Convertir au format attendu par le frontend
    const formattedPresences = presences.map(p => ({
      twitchLogin: p.twitchLogin,
      displayName: p.displayName,
      addedAt: p.addedAt.toISOString(),
      addedBy: p.addedBy,
    }));

    return NextResponse.json({ presences: formattedPresences });
  } catch (error) {
    console.error('[Spotlight Presences API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Sauvegarde toutes les présences (validation finale)
 * Body: { presences: SpotlightPresence[] }
 */
export async function PUT(request: NextRequest) {
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
        { error: 'Ce spotlight a été annulé' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { presences } = body;

    if (!Array.isArray(presences)) {
      return NextResponse.json(
        { error: 'presences doit être un tableau' },
        { status: 400 }
      );
    }

    // Convertir les présences au format attendu par le repository
    const presenceRecords = presences.map((p: any) => ({
      spotlightId: spotlight.id,
      twitchLogin: p.twitchLogin?.toLowerCase() || '',
      displayName: p.displayName,
      addedBy: p.addedBy || admin.discordId,
      addedAt: p.addedAt ? new Date(p.addedAt) : new Date(),
    }));

    await spotlightRepository.replacePresences(spotlight.id, presenceRecords);

    const updatedPresences = await spotlightRepository.getPresences(spotlight.id);
    
    // Convertir au format attendu par le frontend
    const formattedPresences = updatedPresences.map(p => ({
      twitchLogin: p.twitchLogin,
      displayName: p.displayName,
      addedAt: p.addedAt.toISOString(),
      addedBy: p.addedBy,
    }));

    return NextResponse.json({ 
      success: true, 
      presences: formattedPresences,
      message: 'Présences enregistrées avec succès' 
    });
  } catch (error) {
    console.error('[Spotlight Presences API] Erreur PUT:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime une présence
 * Body: { twitchLogin: string }
 */
export async function DELETE(request: NextRequest) {
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
        { error: 'Ce spotlight a été annulé' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { twitchLogin } = body;

    if (!twitchLogin) {
      return NextResponse.json(
        { error: 'twitchLogin est requis' },
        { status: 400 }
      );
    }

    // Supprimer la présence
    await spotlightRepository.deletePresence(spotlight.id, twitchLogin);

    // Récupérer les présences mises à jour
    const presences = await spotlightRepository.getPresences(spotlight.id);
    
    // Convertir au format attendu par le frontend
    const formattedPresences = presences.map(p => ({
      twitchLogin: p.twitchLogin,
      displayName: p.displayName,
      addedAt: p.addedAt.toISOString(),
      addedBy: p.addedBy,
    }));

    return NextResponse.json({ 
      success: true, 
      presences: formattedPresences,
      message: 'Présence supprimée avec succès' 
    });
  } catch (error) {
    console.error('[Spotlight Presences API] Erreur DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


