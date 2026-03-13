import { NextRequest, NextResponse } from 'next/server';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';
import { requireUser } from '@/lib/requireUser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les données du membre connecté (pour pré-remplir les formulaires)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const userId = sessionUser?.discordId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();

    // Trouver le membre par Discord ID
    const allMembers = getAllMemberData();
    const member = allMembers.find(m => m.discordId === userId);

    if (!member) {
      return NextResponse.json({
        twitchLogin: null,
        displayName: null,
      });
    }

    return NextResponse.json({
      twitchLogin: member.twitchLogin || member.displayName || null,
      displayName: member.displayName || null,
    });
  } catch (error) {
    console.error('[Academy User Data API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
