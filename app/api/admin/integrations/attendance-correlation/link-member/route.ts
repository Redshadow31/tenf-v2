import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { memberRepository } from "@/lib/repositories";
import { relinkRegistrationTwitchLoginAcrossIntegrations } from "@/lib/integrationStorage";

function normalizeLogin(value?: string): string {
  return String(value || "").trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié ou accès refusé" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sourceTwitchLogin = normalizeLogin(body?.sourceTwitchLogin);
    const targetMemberTwitchLogin = normalizeLogin(body?.targetMemberTwitchLogin);

    if (!sourceTwitchLogin || !targetMemberTwitchLogin) {
      return NextResponse.json(
        { error: "sourceTwitchLogin et targetMemberTwitchLogin sont requis." },
        { status: 400 }
      );
    }

    if (sourceTwitchLogin === targetMemberTwitchLogin) {
      return NextResponse.json({
        success: true,
        message: "Le login source correspond déjà à la fiche membre.",
        updated: 0,
        integrationsTouched: 0,
      });
    }

    const targetMember = await memberRepository.findByTwitchLogin(targetMemberTwitchLogin);
    if (!targetMember) {
      return NextResponse.json({ error: "Membre cible introuvable dans l'annuaire." }, { status: 404 });
    }

    const { updated, integrationsTouched } = await relinkRegistrationTwitchLoginAcrossIntegrations(
      sourceTwitchLogin,
      targetMemberTwitchLogin
    );

    if (updated === 0) {
      return NextResponse.json(
        { error: "Aucune inscription d'intégration trouvée pour ce login Twitch source." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sourceTwitchLogin,
      targetMemberTwitchLogin,
      updated,
      integrationsTouched,
      message: `${updated} inscription(s) rattachée(s) à @${targetMemberTwitchLogin}.`,
    });
  } catch (error) {
    console.error("[Attendance Correlation Link Member] POST error:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
