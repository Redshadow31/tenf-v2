import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getAllMemberData, loadMemberDataFromStorage } from "@/lib/memberData";
import { getTwitchUsers, type TwitchUser } from "@/lib/twitch";
import { buildTwitchAvatarMap, extractUniqueTwitchLogins, resolveMemberAvatar } from "@/lib/memberAvatar";
import { memberRepository } from "@/lib/repositories";

export const dynamic = 'force-dynamic';

const SUPABASE_PAGE_SIZE = 1000;
const SUPABASE_MAX_PAGES = 20;

function normalizeId(value?: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeLogin(value?: string | null): string | undefined {
  const normalized = normalizeId(value);
  return normalized ? normalized.toLowerCase() : undefined;
}

async function fetchAllSupabaseMembers(): Promise<any[]> {
  const allMembers: any[] = [];
  for (let page = 0; page < SUPABASE_MAX_PAGES; page++) {
    const offset = page * SUPABASE_PAGE_SIZE;
    const chunk = await memberRepository.findAll(SUPABASE_PAGE_SIZE, offset);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    allMembers.push(...chunk);
    if (chunk.length < SUPABASE_PAGE_SIZE) break;
  }
  return allMembers;
}

/**
 * GET - Recherche de membres (lecture seule)
 * Filtre par pseudo Twitch, pseudo Discord, displayName, etc.
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification NextAuth + permission read
    const admin = await requirePermission("read");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const includeInactive = searchParams.get("includeInactive") !== "false";
    const includeCommunity = searchParams.get("includeCommunity") !== "false";

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        members: [],
        total: 0,
        message: "La requête doit contenir au moins 2 caractères",
      });
    }

    // Charger les données depuis le stockage persistant (legacy)
    await loadMemberDataFromStorage();
    
    // Recherche globale: fusionner legacy + Supabase pour éviter les trous de recherche.
    const legacyMembers = getAllMemberData();
    const supabaseMembers = await fetchAllSupabaseMembers();

    const mergedByKey = new Map<string, any>();
    const keyByDiscordId = new Map<string, string>();
    const keyByTwitchId = new Map<string, string>();
    const keyByLogin = new Map<string, string>();

    const upsert = (member: any, inGestion: boolean) => {
      const discordId = normalizeId(member?.discordId);
      const twitchId = normalizeId(member?.twitchId);
      const twitchLogin = normalizeLogin(member?.twitchLogin);
      let key =
        (discordId && keyByDiscordId.get(discordId)) ||
        (twitchId && keyByTwitchId.get(twitchId)) ||
        (twitchLogin && keyByLogin.get(twitchLogin));
      if (!key) {
        key =
          (discordId && `discord:${discordId}`) ||
          (twitchId && `twitch:${twitchId}`) ||
          (twitchLogin && `login:${twitchLogin}`) ||
          `fallback:${mergedByKey.size + 1}`;
      }

      const current = mergedByKey.get(key) || {};
      mergedByKey.set(key, {
        ...current,
        ...member,
        // Un membre présent dans Supabase est considéré "intégré gestion".
        inGestion: Boolean(current.inGestion) || inGestion,
      });

      if (discordId) keyByDiscordId.set(discordId, key);
      if (twitchId) keyByTwitchId.set(twitchId, key);
      if (twitchLogin) keyByLogin.set(twitchLogin, key);
    };

    legacyMembers.forEach((member) => upsert(member, false));
    supabaseMembers.forEach((member) => upsert(member, true));
    const allMembers = Array.from(mergedByKey.values());

    // Normaliser la requête pour recherche case-insensitive
    const normalizedQuery = query.toLowerCase().trim();

    // Filtrer les membres
    const matchingMembers = allMembers
      .filter((member) => {
        if (!includeInactive && member.isActive === false) return false;
        if (!includeCommunity && member.role === "Communauté") return false;
        return true;
      })
      .filter((member) => {
        const searchableFields = [
          member.twitchLogin?.toLowerCase() || "",
          member.displayName?.toLowerCase() || "",
          member.discordUsername?.toLowerCase() || "",
          member.discordId?.toLowerCase() || "",
          member.siteUsername?.toLowerCase() || "",
          member.description?.toLowerCase() || "",
        ].filter(Boolean);

        // Vérifier si la requête correspond à au moins un champ
        return searchableFields.some((field) => field.includes(normalizedQuery));
      })
      .slice(0, limit);

    const twitchLogins = extractUniqueTwitchLogins(matchingMembers);

    let twitchUsers: TwitchUser[] = [];
    try {
      twitchUsers = await getTwitchUsers(twitchLogins);
    } catch {
      twitchUsers = [];
    }

    const avatarMap = buildTwitchAvatarMap(twitchUsers);

    const filteredMembers = matchingMembers.map((member) => {
      const normalizedLogin = String(member.twitchLogin || "").toLowerCase();
      const fetchedAvatar = normalizedLogin ? avatarMap.get(normalizedLogin) : undefined;
      const avatar = resolveMemberAvatar(member, fetchedAvatar);

      return {
        id: member.twitchLogin || member.discordId || "",
        twitchLogin: member.twitchLogin,
        displayName: member.displayName,
        siteUsername: member.siteUsername,
        discordUsername: member.discordUsername,
        discordId: member.discordId,
        role: member.role,
        isVip: member.isVip || false,
        isActive: member.isActive !== false,
        twitchUrl: member.twitchUrl,
        badges: member.badges || [],
        description: member.description,
        avatar,
        inGestion: member.inGestion === true,
      };
    });

    return NextResponse.json({
      members: filteredMembers,
      total: filteredMembers.length,
      query: normalizedQuery,
      filters: { includeInactive, includeCommunity },
      createSuggestion:
        filteredMembers.length === 0
          ? {
              twitchLogin: normalizedQuery,
              role: "Communauté",
              isActive: false,
              message: "Aucun membre trouvé. Vous pouvez créer une fiche Communauté inactive.",
            }
          : undefined,
    });
  } catch (error) {
    console.error("Error searching members:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
