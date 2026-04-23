import { NextRequest, NextResponse } from 'next/server';
import { loadMemberDataFromStorage, getAllMemberData, type MemberData } from '@/lib/memberData';
import { memberRepository } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

function toSearchMemberPayload(member: MemberData) {
  return {
    discordId: member.discordId,
    displayName: member.displayName,
    twitchLogin: member.twitchLogin,
    discordUsername: member.discordUsername,
    role: member.role,
    isActive: member.isActive !== false,
  };
}

/**
 * GET - Recherche de membres pour autocomplétion
 * Query params: ?q=searchTerm
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const includeInactive = searchParams.get("includeInactive") !== "false";
    const includeCommunity = searchParams.get("includeCommunity") !== "false";
    
    if (query.length < 2) {
      return NextResponse.json({ members: [] });
    }
    
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Fonction de normalisation pour la recherche
    const normalize = (text: string | undefined | null): string => {
      if (!text) return "";
      return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    };

    const blobMatches = allMembers
      .filter(member => {
        if (!includeInactive && member.isActive === false) return false;
        if (!includeCommunity && member.role === "Communauté") return false;
        return true;
      })
      .filter(member => {
        const displayName = normalize(member.displayName);
        const twitchLogin = normalize(member.twitchLogin);
        const discordUsername = normalize(member.discordUsername);
        const discordId = member.discordId || '';
        
        return displayName.includes(normalizedQuery) ||
               twitchLogin.includes(normalizedQuery) ||
               discordUsername.includes(normalizedQuery) ||
               discordId.includes(query); // Discord ID sans normalisation
      });

    let supabaseMatches: MemberData[] = [];
    try {
      supabaseMatches = await memberRepository.searchMembersForAutocomplete(query, {
        includeInactive,
        includeCommunity,
        limit: 24,
      });
    } catch (supabaseErr) {
      console.warn("[members/search] Supabase indisponible ou erreur:", supabaseErr);
    }

    /** Supabase en premier (fiche admin à jour), puis legacy pour les logins absents de la base. */
    const byLogin = new Map<string, ReturnType<typeof toSearchMemberPayload>>();
    for (const member of supabaseMatches) {
      const login = String(member.twitchLogin || "").trim().toLowerCase();
      if (!login) continue;
      byLogin.set(login, toSearchMemberPayload(member));
    }
    for (const member of blobMatches) {
      const login = String(member.twitchLogin || "").trim().toLowerCase();
      if (!login || byLogin.has(login)) continue;
      byLogin.set(login, toSearchMemberPayload(member));
    }

    const matches = Array.from(byLogin.values()).slice(0, 20);
    
    return NextResponse.json({
      members: matches,
      filters: { includeInactive, includeCommunity },
      createSuggestion:
        matches.length === 0
          ? {
              twitchLogin: normalizedQuery,
              role: "Communauté",
              isActive: false,
              message: "Aucun membre trouvé. Une fiche Communauté inactive peut être créée par un admin.",
            }
          : undefined,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche de membres:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

