import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { memberRepository } from "@/lib/repositories";

function normalizeLogin(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié ou permissions insuffisantes" }, { status: 401 });
    }

    const body = await request.json();
    const twitchLogin = normalizeLogin(body?.twitchLogin);
    const displayName = normalizeText(body?.displayName) || twitchLogin;
    const discordId = normalizeText(body?.discordId);
    const discordUsername = normalizeText(body?.discordUsername);

    if (!twitchLogin) {
      return NextResponse.json(
        { error: "Le pseudo Twitch est requis pour forcer l'intégration." },
        { status: 400 }
      );
    }

    const existingByLogin = await memberRepository.findByTwitchLogin(twitchLogin);
    const existingByDiscord = discordId ? await memberRepository.findByDiscordId(discordId) : null;
    if (existingByLogin || existingByDiscord) {
      const existing = existingByLogin || existingByDiscord;
      return NextResponse.json({
        success: true,
        created: false,
        message: "Le membre est déjà intégré dans /admin/membres/gestion.",
        member: {
          twitchLogin: existing?.twitchLogin,
          discordId: existing?.discordId,
          displayName: existing?.displayName,
        },
      });
    }

    const createdMember = await memberRepository.findOrCreateCommunityInactive({
      twitchLogin,
      displayName,
      discordId,
      discordUsername,
      createdBy: admin.discordId,
    });

    return NextResponse.json({
      success: true,
      created: true,
      message: "Intégration forcée effectuée dans la gestion membres.",
      member: {
        twitchLogin: createdMember.twitchLogin,
        discordId: createdMember.discordId,
        displayName: createdMember.displayName,
      },
    });
  } catch (error) {
    console.error("[Force Integration] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur pendant l'intégration forcée." }, { status: 500 });
  }
}
