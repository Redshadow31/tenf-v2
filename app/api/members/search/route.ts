import { NextRequest, NextResponse } from 'next/server';
import { loadMemberDataFromStorage, getAllMemberData } from '@/lib/memberData';

/**
 * GET - Recherche de membres pour autocomplétion
 * Query params: ?q=searchTerm
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    if (query.length < 2) {
      return NextResponse.json({ members: [] });
    }
    
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Filtrer les membres qui correspondent à la recherche
    const matches = allMembers
      .filter(member => {
        const displayName = (member.displayName || '').toLowerCase();
        const twitchLogin = (member.twitchLogin || '').toLowerCase();
        const discordUsername = (member.discordUsername || '').toLowerCase();
        
        return displayName.includes(normalizedQuery) ||
               twitchLogin.includes(normalizedQuery) ||
               discordUsername.includes(normalizedQuery);
      })
      .slice(0, 20) // Limiter à 20 résultats
      .map(member => ({
        discordId: member.discordId,
        displayName: member.displayName,
        twitchLogin: member.twitchLogin,
        discordUsername: member.discordUsername,
      }));
    
    return NextResponse.json({ members: matches });
  } catch (error) {
    console.error("Erreur lors de la recherche de membres:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

