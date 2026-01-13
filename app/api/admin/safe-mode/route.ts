import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, isFounder, isSafeModeEnabled, setSafeMode } from "@/lib/admin";
import { logAction } from "@/lib/logAction";

/**
 * Route API pour gérer le Safe Mode
 * GET: Récupère l'état du Safe Mode
 * POST: Active/désactive le Safe Mode (fondateurs uniquement)
 */
export async function GET(request: NextRequest) {
  try {
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

    const enabled = isSafeModeEnabled();

    return NextResponse.json({ safeModeEnabled: enabled });
  } catch (error) {
    console.error("Error fetching safe mode status:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (!isFounder(admin.id)) {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les fondateurs peuvent modifier le Safe Mode." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Le paramètre 'enabled' doit être un booléen" },
        { status: 400 }
      );
    }

    const success = setSafeMode(enabled, admin.id);

    if (!success) {
      return NextResponse.json(
        { error: "Impossible de modifier le Safe Mode" },
        { status: 500 }
      );
    }

    // Logger l'action
    await logAction(
      admin.id,
      admin.username,
      enabled ? "Activation du Safe Mode" : "Désactivation du Safe Mode",
      "Système",
      { enabled }
    );

    return NextResponse.json({ 
      success: true, 
      safeModeEnabled: enabled,
      message: `Safe Mode ${enabled ? "activé" : "désactivé"} avec succès`
    });
  } catch (error) {
    console.error("Error updating safe mode:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}















