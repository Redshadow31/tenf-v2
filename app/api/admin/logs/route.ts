import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, isFounder } from "@/lib/admin";
import { getLogs } from "@/lib/logAction";

/**
 * Route API pour récupérer les logs administratifs
 * Accessible uniquement aux fondateurs
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est connecté et est un fondateur
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux fondateurs." },
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

