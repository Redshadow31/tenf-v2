import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getAllMemberData, loadMemberDataFromStorage, findMemberByIdentifier } from "@/lib/memberData";

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

    // Retourner les données complètes du membre
    return NextResponse.json({
      member,
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
