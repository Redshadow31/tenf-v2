import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import {
  addMemberVipMonth,
  getMergedVipHistoryByMonth,
  removeMemberVipMonth,
} from "@/lib/admin/vip/vipHistoryMutations";
import { memberRepository } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function monthOptions(count = 60): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return options;
}

/**
 * GET — Historique VIP agrégé par mois (admin).
 * POST — Ajoute un membre VIP à un mois.
 * DELETE — Retire un membre VIP d'un mois.
 */
export async function GET() {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const byMonth = await getMergedVipHistoryByMonth(monthOptions());
    const monthKeys = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));
    const stats = {
      monthCount: monthKeys.length,
      totalEntries: monthKeys.reduce((sum, key) => sum + (byMonth[key]?.length || 0), 0),
    };

    return NextResponse.json({ byMonth, monthKeys, stats });
  } catch (error) {
    console.error("[API admin/vip-history] GET:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const login = String(body?.login || body?.twitchLogin || "")
      .toLowerCase()
      .trim();
    const month = String(body?.month || "").trim();

    if (!login || !month) {
      return NextResponse.json(
        { error: "login et month sont requis" },
        { status: 400 }
      );
    }

    const member = await memberRepository.findByTwitchLogin(login);
    await addMemberVipMonth(login, month, member?.displayName || login);

    return NextResponse.json({
      success: true,
      message: `VIP enregistré pour ${login} — ${month}`,
    });
  } catch (error) {
    console.error("[API admin/vip-history] POST:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const login = String(body?.login || body?.twitchLogin || "")
      .toLowerCase()
      .trim();
    const month = String(body?.month || "").trim();

    if (!login || !month) {
      return NextResponse.json(
        { error: "login et month sont requis" },
        { status: 400 }
      );
    }

    await removeMemberVipMonth(login, month);

    return NextResponse.json({
      success: true,
      message: `VIP retiré pour ${login} — ${month}`,
    });
  } catch (error) {
    console.error("[API admin/vip-history] DELETE:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}
