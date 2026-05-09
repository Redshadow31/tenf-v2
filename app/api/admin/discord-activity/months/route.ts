import { NextResponse } from "next/server";
import { loadDiscordActivity } from "@/lib/discordActivityStorage";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET — Liste les mois (YYYY-MM) pour lesquels des données d'activité Discord existent.
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const storage = await loadDiscordActivity();
    const months = Object.keys(storage).filter((k) => /^\d{4}-\d{2}$/.test(k)).sort();

    return NextResponse.json({ success: true, months });
  } catch (error) {
    console.error("[API Discord Activity Months] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
