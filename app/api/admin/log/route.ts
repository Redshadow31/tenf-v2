import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAdmin";
import { logAction } from "@/lib/logAction";

/**
 * POST - Enregistre une action dans les logs
 * Body:
 * {
 *   action: string,
 *   target: string,
 *   details: Record<string, any>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification NextAuth
    const admin = await requireAuth();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, target, details = {} } = body;

    if (!action || !target) {
      return NextResponse.json(
        { error: "action et target sont requis" },
        { status: 400 }
      );
    }

    // Récupérer l'IP de la requête
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     undefined;

    // Logger l'action
    await logAction(
      admin.discordId,
      admin.username,
      action,
      target,
      details,
      ipAddress
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error logging action:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

