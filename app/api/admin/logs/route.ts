import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, hasAdminDashboardAccess } from "@/lib/admin";
import { getLogs, initializeLogs } from "@/lib/logAction";
import { getAllMemberData, loadMemberDataFromStorage } from "@/lib/memberData";

/**
 * Route API pour récupérer les logs administratifs
 * Accessible uniquement aux fondateurs
 */
export async function GET(request: NextRequest) {
  try {
    // Initialiser les logs
    await initializeLogs();
    
    // Vérifier que l'utilisateur est connecté
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Charger les données pour vérifier le rôle dans memberData
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const userMember = allMembers.find(m => m.discordId === admin.id);
    const userRole = userMember?.role;

    // Vérifier l'accès : Fondateurs, Admins, ou Admin Adjoint
    if (!hasAdminDashboardAccess(admin.id, userRole)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs, admins et admin adjoints." },
        { status: 403 }
      );
    }

    // Récupérer le paramètre limit depuis la query string
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Récupérer les logs
    const logs = await getLogs(limit);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

