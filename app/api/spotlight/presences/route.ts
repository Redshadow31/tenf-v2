import { NextRequest, NextResponse } from 'next/server';
import { 
  getActiveSpotlight, 
  getSpotlightPresences, 
  saveSpotlightPresences,
  addSpotlightPresence 
} from '@/lib/spotlightStorage';
import { getDiscordUser } from '@/lib/discord';
import { hasAdminDashboardAccess } from '@/lib/admin';

/**
 * GET - Récupère les présences du spotlight actif
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getDiscordUser();
    if (!user || !hasAdminDashboardAccess(user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const spotlight = await getActiveSpotlight();
    if (!spotlight) {
      return NextResponse.json({ presences: [] });
    }

    const presences = await getSpotlightPresences(spotlight.id);
    return NextResponse.json({ presences });
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
    const user = await getDiscordUser();
    if (!user || !hasAdminDashboardAccess(user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const spotlight = await getActiveSpotlight();
    if (!spotlight) {
      return NextResponse.json(
        { error: 'Aucun spotlight actif' },
        { status: 404 }
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

    await addSpotlightPresence(spotlight.id, twitchLogin, displayName, user.id);

    const presences = await getSpotlightPresences(spotlight.id);
    return NextResponse.json({ presences });
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
    const user = await getDiscordUser();
    if (!user || !hasAdminDashboardAccess(user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const spotlight = await getActiveSpotlight();
    if (!spotlight) {
      return NextResponse.json(
        { error: 'Aucun spotlight actif' },
        { status: 404 }
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

    await saveSpotlightPresences(spotlight.id, presences);

    return NextResponse.json({ 
      success: true, 
      presences,
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


