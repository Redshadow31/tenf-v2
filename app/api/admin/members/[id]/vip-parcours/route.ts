import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import {
  addMemberVipMonth,
  getMemberVipMonths,
  removeMemberVipMonth,
} from "@/lib/admin/vip/vipHistoryMutations";
import { getConsecutiveVipMonths, getVipBadgeText } from "@/lib/vipHistory";
import { resolveMemberForFiche } from "@/lib/admin/members-fiche/resolveMemberForFiche";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

/**
 * GET — Parcours VIP d'un membre (mois + badge).
 * POST — Ajoute un mois VIP au parcours.
 * DELETE — Retire un mois VIP du parcours.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const member = await resolveMemberForFiche(decodeURIComponent(params.id));
    if (!member?.twitchLogin) {
      return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
    }

    const login = String(member.twitchLogin).toLowerCase();
    const months = await getMemberVipMonths(login);

    return NextResponse.json({
      twitchLogin: login,
      displayName: member.displayName || login,
      isVip: member.isVip === true,
      months,
      consecutiveMonths: getConsecutiveVipMonths(login),
      badge: getVipBadgeText(login),
    });
  } catch (error) {
    console.error("[API vip-parcours] GET:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const member = await resolveMemberForFiche(decodeURIComponent(params.id));
    if (!member?.twitchLogin) {
      return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const month = String(body?.month || "").trim();
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    const login = String(member.twitchLogin).toLowerCase();
    await addMemberVipMonth(login, month, member.displayName || login);
    const months = await getMemberVipMonths(login);

    return NextResponse.json({
      success: true,
      months,
      consecutiveMonths: getConsecutiveVipMonths(login),
      badge: getVipBadgeText(login),
    });
  } catch (error) {
    console.error("[API vip-parcours] POST:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const member = await resolveMemberForFiche(decodeURIComponent(params.id));
    if (!member?.twitchLogin) {
      return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const month = String(body?.month || "").trim();
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    const login = String(member.twitchLogin).toLowerCase();
    await removeMemberVipMonth(login, month);
    const months = await getMemberVipMonths(login);

    return NextResponse.json({
      success: true,
      months,
      consecutiveMonths: getConsecutiveVipMonths(login),
      badge: getVipBadgeText(login),
    });
  } catch (error) {
    console.error("[API vip-parcours] DELETE:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}
