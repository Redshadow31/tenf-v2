import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/requireAdmin";
import {
  loadDiscordActivitySalonSettings,
  saveDiscordActivitySalonSettings,
  type DiscordActivitySalonSettings,
} from "@/lib/discordActivitySalonSettingsStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const settings = await loadDiscordActivitySalonSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("[API Discord Salon Settings GET] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const staffNameSubstrings = body.staffNameSubstrings;
    const staffBucketLabel = body.staffBucketLabel;

    const settings: DiscordActivitySalonSettings = {
      staffNameSubstrings: Array.isArray(staffNameSubstrings)
        ? staffNameSubstrings.filter((x: unknown): x is string => typeof x === "string").map((s) => s.trim())
        : [],
      staffBucketLabel:
        typeof staffBucketLabel === "string" && staffBucketLabel.trim()
          ? staffBucketLabel.trim()
          : "Espace staff (hors capture publique)",
    };

    await saveDiscordActivitySalonSettings(settings);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("[API Discord Salon Settings PUT] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
