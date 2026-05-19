import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { cacheGet, cacheSet, cacheDelete, cacheKey } from "@/lib/cache";
import { replaceMonthInVipHistory } from "@/lib/vipHistory";
import { readVipMonthLogins, writeVipMonthData, type VipMonthData } from "@/lib/vipMonthStore";
import { vipRepository } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIP_MONTH_CURRENT_TTL_SECONDS = 60;
const VIP_MONTH_HISTORICAL_TTL_SECONDS = 600;

/**
 * POST - Sauvegarde les VIP du mois dans un blob spécial
 * Body: { month: string, vipLogins: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { month, vipLogins } = body;

    if (!month || !Array.isArray(vipLogins)) {
      return NextResponse.json(
        { error: "month (string) et vipLogins (array) sont requis" },
        { status: 400 }
      );
    }

    // Valider le format du mois
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    const normalizedLogins = vipLogins
      .map((login: string) => String(login).toLowerCase().trim())
      .filter(Boolean);

    const vipMonthData: VipMonthData = {
      month,
      vipLogins: normalizedLogins,
      savedAt: new Date().toISOString(),
      savedBy: admin.discordId,
    };

    await writeVipMonthData(vipMonthData);
    replaceMonthInVipHistory(month, normalizedLogins);

    let supabaseCount = 0;
    try {
      supabaseCount = await vipRepository.replaceMonth(month, normalizedLogins);
    } catch (syncError) {
      console.error(`[VIP Month Save] Sync Supabase échouée pour ${month}:`, syncError);
    }

    await cacheDelete(cacheKey("api", "vip-month", "save", "get", month, "v1"));

    return NextResponse.json({
      success: true,
      message: `VIP du mois ${month} enregistrés avec succès`,
      count: normalizedLogins.length,
      supabaseCount,
      month,
    });
  } catch (error) {
    console.error('[API VIP Month Save] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET - Récupère les VIP du mois depuis le blob
 * Query params: ?month=YYYY-MM
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month || !month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const ttlSeconds =
        month === currentMonth ? VIP_MONTH_CURRENT_TTL_SECONDS : VIP_MONTH_HISTORICAL_TTL_SECONDS;
      const cacheKeyStr = cacheKey("api", "vip-month", "save", "get", month, "v1");
      const cached = await cacheGet<VipMonthData | { month: string; vipLogins: string[]; savedAt: null }>(
        cacheKeyStr
      );
      if (cached) {
        return NextResponse.json(cached);
      }

      const logins = await readVipMonthLogins(month);
      const vipMonthData: VipMonthData | null =
        logins.length > 0
          ? {
              month,
              vipLogins: logins,
              savedAt: new Date().toISOString(),
            }
          : null;

      if (!vipMonthData) {
        const emptyPayload = {
          month,
          vipLogins: [],
          savedAt: null,
        };
        await cacheSet(cacheKeyStr, emptyPayload, ttlSeconds);
        return NextResponse.json(emptyPayload);
      }

      await cacheSet(cacheKeyStr, vipMonthData, ttlSeconds);
      return NextResponse.json(vipMonthData);
    } catch (error) {
      console.error(`[VIP Month GET] Erreur récupération pour ${month}:`, error);
      return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
    }
  } catch (error) {
    console.error('[API VIP Month GET] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

