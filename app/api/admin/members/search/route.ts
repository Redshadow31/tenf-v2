import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Recherche des membres par nom, Twitch login ou Discord username
 * Query: ?q=searchTerm
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ members: [] });
    }

    const searchTerm = query.toLowerCase().trim();
    const allMembers = getAllMemberData();

    // Rechercher dans displayName, twitchLogin, discordUsername
    const filteredMembers = allMembers.filter((member) => {
      const displayName = (member.displayName || '').toLowerCase();
      const twitchLogin = (member.twitchLogin || '').toLowerCase();
      const discordUsername = (member.discordUsername || '').toLowerCase();
      
      return (
        displayName.includes(searchTerm) ||
        twitchLogin.includes(searchTerm) ||
        discordUsername.includes(searchTerm)
      );
    });

    // Limiter à 20 résultats
    const results = filteredMembers.slice(0, 20).map((member) => ({
      twitchLogin: member.twitchLogin,
      displayName: member.displayName,
      discordId: member.discordId,
      discordUsername: member.discordUsername,
      role: member.role,
    }));

    return NextResponse.json({ members: results });
  } catch (error) {
    console.error('[Admin Members Search API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
