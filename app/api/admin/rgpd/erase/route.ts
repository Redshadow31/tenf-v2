import { NextRequest, NextResponse } from "next/server";
import { eraseMemberRgpdData } from "@/lib/admin/rgpd/memberRgpdService";
import { logAction } from "@/lib/admin/logger";
import { requireRole } from "@/lib/requireAdmin";
import { invalidateAdminDashboardCache } from "@/lib/admin/dashboardSummary";

export const dynamic = "force-dynamic";

const CONFIRM_PHRASE = "SUPPRIMER RGPD";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole("FONDATEUR");
    if (!admin) {
      return NextResponse.json(
        { error: "Action réservée aux fondateurs TENF." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const twitchLogin = typeof body?.twitchLogin === "string" ? body.twitchLogin.trim().toLowerCase() : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const confirmPhrase = typeof body?.confirmPhrase === "string" ? body.confirmPhrase.trim() : "";

    if (!twitchLogin) {
      return NextResponse.json({ error: "twitchLogin requis." }, { status: 400 });
    }
    if (reason.length < 10) {
      return NextResponse.json(
        { error: "Motif obligatoire (10 caractères minimum) — ex. demande RGPD du membre." },
        { status: 400 }
      );
    }
    if (confirmPhrase !== CONFIRM_PHRASE) {
      return NextResponse.json(
        { error: `Saisissez exactement « ${CONFIRM_PHRASE} » pour confirmer.` },
        { status: 400 }
      );
    }

    const exportBefore = await import("@/lib/admin/rgpd/memberRgpdService").then((m) =>
      m.exportMemberRgpdData(twitchLogin)
    );

    const result = await eraseMemberRgpdData(twitchLogin, reason, admin.discordId);
    if (!result) {
      return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });
    }

    await logAction({
      action: "rgpd.member.erase",
      resourceType: "member",
      resourceId: twitchLogin,
      previousValue: exportBefore,
      metadata: {
        reason,
        deleted: result.deleted,
        warnings: result.warnings,
        sourcePage: "/admin/gestion-acces/rgpd",
        adminDiscordId: admin.discordId,
      },
    });
    await invalidateAdminDashboardCache();

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[admin/rgpd/erase] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
