import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { loadDiscordActivity } from "@/lib/discordActivityStorage";
import { loadDiscordActivitySalonSettings } from "@/lib/discordActivitySalonSettingsStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET — Données salons existantes pour un mois (assistant d’import).
 * Query: month=YYYY-MM
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const month = new URL(request.url).searchParams.get("month") || "";
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Le mois doit être au format YYYY-MM" }, { status: 400 });
    }

    const storage = await loadDiscordActivity();
    const data = storage[month];
    const settings = await loadDiscordActivitySalonSettings();

    return NextResponse.json({
      success: true,
      month,
      messagesByChannel: data?.messagesByChannel ?? {},
      vocalsMinutesByChannel: data?.vocalsMinutesByChannel ?? {},
      salonStaffNormalizedKeysMessages: data?.salonStaffNormalizedKeysMessages ?? [],
      salonStaffNormalizedKeysVocals: data?.salonStaffNormalizedKeysVocals ?? [],
      staffNameSubstrings: settings.staffNameSubstrings,
      staffBucketLabel: settings.staffBucketLabel,
    });
  } catch (error) {
    console.error("[API Discord Activity Month Salons] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
