import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getAllMemberData, loadMemberDataFromStorage } from "@/lib/memberData";

export const dynamic = 'force-dynamic';

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
    const filteredMembers = allMembers
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
      .slice(0, limit)
      .map((member) => ({
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
      }));

    return NextResponse.json({
      members: filteredMembers,
      total: filteredMembers.length,
      query: normalizedQuery,
    });
  } catch (error) {
    console.error("Error searching members:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
