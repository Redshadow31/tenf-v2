import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getLogs, initializeLogs } from "@/lib/logAction";
import { getAllMemberData, loadMemberDataFromStorage } from "@/lib/memberData";

/**
 * Route API pour récupérer les logs administratifs
 * Accessible uniquement aux admins
 */
export async function GET(request: NextRequest) {
  try {
    // Initialiser les logs
    await initializeLogs();
    
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé" },
        { status: 401 }
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

