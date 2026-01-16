import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { hasPermission } from "@/lib/adminRoles";
import { getAllMemberData, loadMemberDataFromStorage, findMemberByIdentifier } from "@/lib/memberData";

/**
 * GET - Récupère les données complètes d'un membre pour la fiche 360°
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les permissions : read minimum
    if (!hasPermission(admin.id, "read")) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
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
