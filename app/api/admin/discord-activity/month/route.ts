import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import {
  clearDiscordActivityMonth,
  type DiscordActivityClearScope,
} from "@/lib/discordActivityStorage";
import { cacheDelete, cacheKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidScope(v: string): v is DiscordActivityClearScope {
  return v === "all" || v === "messages" || v === "vocals";
}

/**
 * DELETE — Supprime les données d’activité Discord pour un mois.
 * Query: month=YYYY-MM, scope=all | messages | vocals (défaut: all)
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || "";
    const scopeRaw = (searchParams.get("scope") || "all").toLowerCase();

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Le mois doit être au format YYYY-MM" }, { status: 400 });
    }

    if (!isValidScope(scopeRaw)) {
      return NextResponse.json(
        { error: "scope doit être all, messages ou vocals" },
        { status: 400 }
      );
    }

    await clearDiscordActivityMonth(month, scopeRaw);
    await cacheDelete(cacheKey("api", "admin", "discord-activity", "data", month, "v1"));

    const label =
      scopeRaw === "all"
        ? "toutes les données"
        : scopeRaw === "messages"
          ? "les messages"
          : "les vocaux";

    return NextResponse.json({
      success: true,
      message: `Données supprimées pour ${month} (${label}).`,
    });
  } catch (error) {
    console.error("[API Discord Activity Month DELETE] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
