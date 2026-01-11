import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
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
    
    // Vérifier que l'utilisateur est connecté (getCurrentAdmin charge déjà le cache Blobs)
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // getCurrentAdmin() de lib/adminAuth charge le cache Blobs et retourne null si l'utilisateur n'a pas de rôle admin
    // Donc si on arrive ici, l'utilisateur a déjà un rôle admin (hardcodé ou Blobs)

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

