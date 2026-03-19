import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { memberRepository } from "@/lib/repositories";
import {
  getArchivedMemberEntries,
  purgeArchivedMemberEntry,
  restoreArchivedMemberEntry,
} from "@/lib/memberData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const archives = await getArchivedMemberEntries();
    return NextResponse.json({
      archives: archives.map((entry) => ({
        twitchLogin: entry.twitchLogin,
        deletedAt: entry.deletedAt,
        deletedBy: entry.deletedBy,
        deleteReason: entry.deleteReason,
        snapshot: entry.snapshot,
      })),
    });
  } catch (error) {
    console.error("[members/archives][GET] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = String(body?.action || "");
    const twitchLogin = String(body?.twitchLogin || "").trim().toLowerCase();

    if (!twitchLogin || (action !== "restore" && action !== "purge")) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    if (action === "restore") {
      const restored = await restoreArchivedMemberEntry(twitchLogin, admin.discordId);
      if (!restored) {
        return NextResponse.json({ error: "Archive introuvable" }, { status: 404 });
      }

      const payload = {
        twitchLogin: restored.twitchLogin,
        twitchId: restored.twitchId,
        twitchUrl: restored.twitchUrl || `https://www.twitch.tv/${restored.twitchLogin}`,
        discordId: restored.discordId,
        discordUsername: restored.discordUsername,
        displayName: restored.displayName || restored.siteUsername || restored.twitchLogin,
        siteUsername: restored.siteUsername,
        role: "Communauté" as const,
        isVip: Boolean(restored.isVip),
        isActive: false,
        badges: restored.badges || [],
        listId: restored.listId,
        roleManuallySet: restored.roleManuallySet,
        twitchStatus: restored.twitchStatus,
        description: restored.description,
        customBio: restored.customBio,
        instagram: restored.instagram,
        tiktok: restored.tiktok,
        twitter: restored.twitter,
        birthday: restored.birthday,
        twitchAffiliateDate: restored.twitchAffiliateDate,
        shadowbanLives: restored.shadowbanLives === true,
        profileValidationStatus: restored.profileValidationStatus || "valide",
        integrationDate: restored.integrationDate,
        onboardingStatus: restored.onboardingStatus,
        mentorTwitchLogin: restored.mentorTwitchLogin,
        primaryLanguage: restored.primaryLanguage,
        timezone: restored.timezone,
        countryCode: restored.countryCode,
        lastReviewAt: restored.lastReviewAt,
        nextReviewAt: restored.nextReviewAt,
        roleHistory: restored.roleHistory,
        parrain: restored.parrain,
        createdAt: restored.createdAt || new Date(),
        updatedAt: new Date(),
        updatedBy: admin.discordId,
      };

      const existing = await memberRepository.findByTwitchLogin(twitchLogin);
      const member = existing
        ? await memberRepository.update(twitchLogin, payload as any)
        : await memberRepository.create(payload as any);

      return NextResponse.json({ success: true, member });
    }

    // purge
    try {
      await memberRepository.hardDelete(twitchLogin);
    } catch {
      // Déjà absent de Supabase, ce n'est pas bloquant.
    }

    const purged = await purgeArchivedMemberEntry(twitchLogin);
    if (!purged) {
      return NextResponse.json({ error: "Archive introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[members/archives][POST] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
