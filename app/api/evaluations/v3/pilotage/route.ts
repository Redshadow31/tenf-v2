import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getCurrentMonthKey } from "@/lib/evaluationStorage";
import { loadEvaluationV3Pilotage, upsertEvaluationV3PilotagePillars } from "@/lib/evaluationV3PilotageStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMonth(raw: string | null): string {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;
  return getCurrentMonthKey();
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseMonth(searchParams.get("month"));
    const data = await loadEvaluationV3Pilotage(month);

    return NextResponse.json({
      success: true,
      month,
      lastUpdated: data?.lastUpdated || null,
      entries: data?.entries || {},
    });
  } catch (error) {
    console.error("[API evaluations/v3/pilotage] GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const month = parseMonth(typeof body?.month === "string" ? body.month : null);
    const twitchLogin = String(body?.twitchLogin || "")
      .toLowerCase()
      .trim();
    if (!twitchLogin) {
      return NextResponse.json({ error: "twitchLogin est requis" }, { status: 400 });
    }

    const reason = typeof body?.pillarsReason === "string" ? body.pillarsReason.trim() : "";
    if (!reason) {
      return NextResponse.json({ error: "pillarsReason est obligatoire (traçabilité)" }, { status: 400 });
    }

    const parseNullableInt = (v: unknown): number | null | undefined => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const n = Math.floor(Number(v));
      return Number.isFinite(n) ? Math.max(0, n) : undefined;
    };

    const entry = await upsertEvaluationV3PilotagePillars(month, {
      twitchLogin,
      raidsDoneOverride: parseNullableInt(body?.raidsDoneOverride),
      raidsOtherSupport: body?.raidsOtherSupport === undefined ? undefined : Boolean(body.raidsOtherSupport),
      eventsPresentOverride: parseNullableInt(body?.eventsPresentOverride),
      spotlightPresentOverride: parseNullableInt(body?.spotlightPresentOverride),
      regularityMonthsOverride:
        body?.regularityMonthsOverride === undefined
          ? undefined
          : body?.regularityMonthsOverride === null
            ? null
            : Math.max(0, Math.min(3, Math.floor(Number(body.regularityMonthsOverride)))),
      bonusStaff: body?.bonusStaff === undefined ? undefined : Number(body.bonusStaff),
      malusStaff: body?.malusStaff === undefined ? undefined : Number(body.malusStaff),
      pillarsReason: reason,
      pillarsStaffNote: typeof body?.pillarsStaffNote === "string" ? body.pillarsStaffNote : undefined,
      updatedBy: admin.discordId || admin.username || "admin",
    });

    return NextResponse.json({ success: true, month, entry });
  } catch (error) {
    console.error("[API evaluations/v3/pilotage] PUT:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
