import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getAllMemberData, loadMemberDataFromStorage } from "@/lib/memberData";
import { getTwitchUsers, type TwitchUser } from "@/lib/twitch";

export const dynamic = 'force-dynamic';

function getDiscordDefaultAvatar(discordId?: string): string | undefined {
  if (!discordId) return undefined;
  const numericId = Number.parseInt(discordId, 10);
  if (Number.isNaN(numericId)) return undefined;
  return `https://cdn.discordapp.com/embed/avatars/${numericId % 5}.png`;
}

function isUsableTwitchAvatar(url?: string): boolean {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return !normalized.includes("placehold.co") && !normalized.includes("text=twitch");
}

function getSavedAvatarUrl(member: any): string | undefined {
  const candidate = member?.twitchStatus?.profileImageUrl;
  if (typeof candidate !== "string") return undefined;
  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized : undefined;
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

    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();
    
    // Récupérer tous les membres
    const allMembers = getAllMemberData();

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

    const twitchLogins = Array.from(
      new Set(
        matchingMembers
          .map((member) => member.twitchLogin)
          .filter((login): login is string => typeof login === "string" && login.trim().length > 0)
      )
    );

    let twitchUsers: TwitchUser[] = [];
    try {
      twitchUsers = await getTwitchUsers(twitchLogins);
    } catch {
      twitchUsers = [];
    }

    const avatarMap = new Map(
      twitchUsers
        .filter((user: TwitchUser) => isUsableTwitchAvatar(user.profile_image_url))
        .map((user: TwitchUser) => [user.login.toLowerCase(), user.profile_image_url] as const)
    );

    const filteredMembers = matchingMembers.map((member) => {
      const normalizedLogin = String(member.twitchLogin || "").toLowerCase();
      const savedAvatar = getSavedAvatarUrl(member);
      const fetchedAvatar = normalizedLogin ? avatarMap.get(normalizedLogin) : undefined;
      const avatar =
        (isUsableTwitchAvatar(savedAvatar) ? savedAvatar : undefined) ||
        fetchedAvatar ||
        savedAvatar ||
        getDiscordDefaultAvatar(member.discordId) ||
        `https://placehold.co/64x64?text=${(member.displayName || member.twitchLogin || "?").charAt(0).toUpperCase()}`;

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
