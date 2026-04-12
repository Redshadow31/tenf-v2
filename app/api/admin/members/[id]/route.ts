import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getAllMemberData, loadMemberDataFromStorage, findMemberByIdentifier, getArchivedMemberEntries } from "@/lib/memberData";
import { fetchCanonicalTwitchAvatarForLogin, resolveMemberAvatar } from "@/lib/memberAvatar";
import { memberRepository } from "@/lib/repositories";

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
    
    // Si toujours pas trouvé, essayer par displayName ou pseudo site (aligné fiche 360 / recherche)
    if (!member) {
      const idLower = decodedId.toLowerCase();
      const allMembers = getAllMemberData();
      member =
        allMembers.find(
          (m) =>
            m.displayName?.toLowerCase() === idLower ||
            m.siteUsername?.toLowerCase() === idLower
        ) || null;
    }

    // Fallback archives (profil supprimé mais conservé dans l'onglet Archivé)
    if (!member) {
      const archives = await getArchivedMemberEntries();
      const decodedLower = decodedId.toLowerCase();
      const archive = archives.find((entry) => {
        const snap = entry.snapshot;
        return (
          (snap.twitchLogin || "").toLowerCase() === decodedLower ||
          (snap.discordId || "").toLowerCase() === decodedLower ||
          (snap.twitchId || "").toLowerCase() === decodedLower ||
          (snap.displayName || "").toLowerCase() === decodedLower
        );
      });

      if (archive) {
        member = {
          ...archive.snapshot,
          archived: true,
          archivedAt: archive.deletedAt,
          archivedBy: archive.deletedBy,
          archiveReason: archive.deleteReason,
        } as any;
      }
    }

    // Membres uniquement Supabase (recherche admin « legacy + Supabase ») — absents du JSON memberData
    if (!member) {
      const idLower = decodedId.toLowerCase();
      member =
        (await memberRepository.findByTwitchLogin(idLower)) ||
        (await memberRepository.findByDiscordId(decodedId)) ||
        (await memberRepository.findByTwitchId(decodedId)) ||
        (await memberRepository.findByDisplayNameOrSiteUsernameExactCI(decodedId));
    }

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    const fetchedAvatar = await fetchCanonicalTwitchAvatarForLogin(member.twitchLogin);
    const avatar = resolveMemberAvatar(member, fetchedAvatar);

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
