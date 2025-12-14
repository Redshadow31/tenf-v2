import { NextRequest, NextResponse } from 'next/server';
import { getActiveSpotlight, createActiveSpotlight, getSpotlightData } from '@/lib/spotlightStorage';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { getMemberData, loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';
import { cookies } from 'next/headers';

/**
 * GET - Récupère le spotlight actif
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const spotlight = await getActiveSpotlight();
    
    if (!spotlight) {
      return NextResponse.json({ spotlight: null });
    }

    // Récupérer les données complètes
    const data = await getSpotlightData(spotlight.id);
    
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

    // Vérifier qu'il n'y a pas déjà un spotlight actif (pas annulé ni complété)
    const existing = await getActiveSpotlight();
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
    const finalModeratorDiscordId = moderatorDiscordId || admin.id;
    const finalModeratorUsername = moderatorUsername || admin.username;

    // Vérifier que le login Twitch correspond à un membre enregistré
    await loadMemberDataFromStorage();
    const member = getMemberData(streamerTwitchLogin.trim().toLowerCase());
    
    if (!member) {
      // Essayer aussi avec getAllMemberData pour être sûr
      const allMembers = getAllMemberData();
      const foundMember = allMembers.find(
        m => m.twitchLogin.toLowerCase() === streamerTwitchLogin.trim().toLowerCase()
      );
      
      if (!foundMember) {
        return NextResponse.json(
          { 
            error: `Le login Twitch "${streamerTwitchLogin}" ne correspond à aucun membre enregistré. Veuillez vérifier le nom de la chaîne dans la page Gestion Membres.` 
          },
          { status: 400 }
        );
      }
    }

    // Utiliser le displayName du membre si disponible
    const finalDisplayName = member?.displayName || streamerDisplayName || streamerTwitchLogin;

    const spotlight = await createActiveSpotlight(
      streamerTwitchLogin.trim().toLowerCase(),
      finalDisplayName,
      finalModeratorDiscordId,
      finalModeratorUsername,
      admin.id
    );

    return NextResponse.json({ spotlight });
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

    const spotlight = await getActiveSpotlight();
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

    const { saveActiveSpotlight } = await import('@/lib/spotlightStorage');
    const updated = { ...spotlight, status };
    await saveActiveSpotlight(updated);

    return NextResponse.json({ spotlight: updated });
  } catch (error) {
    console.error('[Spotlight API] Erreur PATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

