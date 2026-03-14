import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';
import { getTwitchUsers } from '@/lib/twitch';
import { buildTwitchAvatarMap, extractUniqueTwitchLogins, resolveMemberAvatar } from '@/lib/memberAvatar';

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
    const includeInactive = searchParams.get("includeInactive") !== "false";
    const includeCommunity = searchParams.get("includeCommunity") !== "false";

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ members: [] });
    }

    const searchTerm = query.toLowerCase().trim();
    const allMembers = getAllMemberData();

    // Rechercher dans displayName, twitchLogin, discordUsername
    const matchingMembers = allMembers.filter((member) => {
      if (!includeInactive && member.isActive === false) return false;
      if (!includeCommunity && member.role === "Communauté") return false;

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
    const limitedMembers = matchingMembers.slice(0, 20);
    const twitchLogins = extractUniqueTwitchLogins(limitedMembers);
    let avatarMap = new Map<string, string>();
    try {
      const twitchUsers = await getTwitchUsers(twitchLogins);
      avatarMap = buildTwitchAvatarMap(twitchUsers);
    } catch {
      avatarMap = new Map<string, string>();
    }

    const results = limitedMembers.map((member) => {
      const login = String(member.twitchLogin || "").toLowerCase();
      const fetchedAvatar = login ? avatarMap.get(login) : undefined;
      return {
      twitchLogin: member.twitchLogin,
      displayName: member.displayName,
      discordId: member.discordId,
      discordUsername: member.discordUsername,
      role: member.role,
      isActive: member.isActive !== false,
      avatar: resolveMemberAvatar(member, fetchedAvatar),
      };
    });

    return NextResponse.json({
      members: results,
      filters: { includeInactive, includeCommunity },
      createSuggestion:
        results.length === 0
          ? {
              twitchLogin: searchTerm,
              role: "Communauté",
              isActive: false,
              message: "Aucun membre trouvé. Vous pouvez créer une fiche Communauté inactive.",
            }
          : undefined,
    });
  } catch (error) {
    console.error('[Admin Members Search API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
