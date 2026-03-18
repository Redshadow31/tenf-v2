import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import {
  getEvaluationV2OverridesBySystem,
  upsertEvaluationV2OverrideBySystem,
} from "@/lib/evaluationV2ManualStorage";
import { getCurrentMonthKey } from "@/lib/evaluationStorage";
import { clamp, round2 } from "@/lib/evaluationV2Helpers";
import { loadEvaluationV2ValidationMeta } from "@/lib/evaluationV2ValidationStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMonth(raw: string | null): string {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;
  return getCurrentMonthKey();
}

function parseSystem(raw: string | null): "legacy" | "new" {
  return raw === "new" ? "new" : "legacy";
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseMonth(searchParams.get("month"));
    const system = parseSystem(searchParams.get("system"));
    const overrides = await getEvaluationV2OverridesBySystem(month, system);

    return NextResponse.json({
      success: true,
      month,
      system,
      count: Object.keys(overrides).length,
      overrides,
    });
  } catch (error) {
    console.error("[API evaluations/v2/manual-overrides] GET error:", error);
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
    const month = parseMonth(body?.month || null);
    const system = parseSystem(body?.system || null);
    const twitchLogin = String(body?.twitchLogin || "").toLowerCase().trim();

    const validation = await loadEvaluationV2ValidationMeta(month, system);
    if (validation?.frozen) {
      return NextResponse.json(
        { error: "Le mois est gele: les overrides manuels sont verrouilles" },
        { status: 409 },
      );
    }

    if (!twitchLogin) {
      return NextResponse.json({ error: "twitchLogin est requis" }, { status: 400 });
    }

    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    const normalized = {
      twitchLogin,
      bloc1: body?.bloc1 !== undefined && body?.bloc1 !== null ? round2(clamp(Number(body.bloc1), 0, 5)) : undefined,
      bloc2: body?.bloc2 !== undefined && body?.bloc2 !== null ? round2(clamp(Number(body.bloc2), 0, 5)) : undefined,
      bloc3: body?.bloc3 !== undefined && body?.bloc3 !== null ? round2(clamp(Number(body.bloc3), 0, 5)) : undefined,
      bloc4: body?.bloc4 !== undefined && body?.bloc4 !== null ? round2(clamp(Number(body.bloc4), 0, 5)) : undefined,
      bonus: body?.bonus !== undefined && body?.bonus !== null ? round2(clamp(Number(body.bonus), 0, 5)) : undefined,
      reason,
      updatedBy: admin.discordId,
    };

    const hasManualScore =
      normalized.bloc1 !== undefined ||
      normalized.bloc2 !== undefined ||
      normalized.bloc3 !== undefined ||
      normalized.bloc4 !== undefined ||
      normalized.bonus !== undefined;

    if (hasManualScore && !normalized.reason) {
      return NextResponse.json(
        { error: "La raison est obligatoire lorsqu'une note est modifiée manuellement" },
        { status: 400 },
      );
    }

    const updated = await upsertEvaluationV2OverrideBySystem(month, normalized, system);
    return NextResponse.json({
      success: true,
      month,
      system,
      override: updated,
    });
  } catch (error) {
    console.error("[API evaluations/v2/manual-overrides] PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

