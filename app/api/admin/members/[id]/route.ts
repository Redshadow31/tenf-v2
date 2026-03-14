import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getAllMemberData, loadMemberDataFromStorage, findMemberByIdentifier } from "@/lib/memberData";
import { getTwitchUsers } from "@/lib/twitch";

function getDiscordDefaultAvatar(discordId?: string): string | undefined {
  if (!discordId) return undefined;
  const numericId = Number.parseInt(discordId, 10);
  if (Number.isNaN(numericId)) return undefined;
  return `https://cdn.discordapp.com/embed/avatars/${numericId % 5}.png`;
}

function getSavedAvatarUrl(member: any): string | undefined {
  const candidate = member?.twitchStatus?.profileImageUrl;
  if (typeof candidate !== "string") return undefined;
  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized : undefined;
}

/**
 * GET - Récupère les données complètes d'un membre pour la fiche 360°
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentification NextAuth + permission read
    const admin = await requirePermission("read");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const { id } = params;
    const decodedId = decodeURIComponent(id);

    // Charger les données depuis le stockage persistant
    await loadMemberDataFromStorage();

    // Essayer de trouver le membre par différents identifiants
    let member = null;
    
    // Essayer d'abord par twitchLogin (identifiant principal)
    member = findMemberByIdentifier({ twitchLogin: decodedId });
    
    // Si pas trouvé, essayer par discordId
    if (!member) {
      member = findMemberByIdentifier({ discordId: decodedId });
    }
    
    // Si toujours pas trouvé, essayer par twitchId (si l'id est numérique)
    if (!member && /^\d+$/.test(decodedId)) {
      member = findMemberByIdentifier({ twitchId: decodedId });
    }
    
    // Si toujours pas trouvé, essayer par displayName
    if (!member) {
      const allMembers = getAllMemberData();
      member = allMembers.find(
        (m) => m.displayName?.toLowerCase() === decodedId.toLowerCase()
      );
    }

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    let fetchedAvatar: string | undefined;
    if (member.twitchLogin) {
      try {
        const twitchUsers = await getTwitchUsers([member.twitchLogin]);
        fetchedAvatar = twitchUsers[0]?.profile_image_url;
      } catch {
        fetchedAvatar = undefined;
      }
    }

    const avatar =
      getSavedAvatarUrl(member) ||
      fetchedAvatar ||
      getDiscordDefaultAvatar(member.discordId) ||
      `https://placehold.co/64x64?text=${(member.displayName || member.twitchLogin || "?").charAt(0).toUpperCase()}`;

    // Retourner les données complètes du membre
    return NextResponse.json({
      member: {
        ...member,
        avatar,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
