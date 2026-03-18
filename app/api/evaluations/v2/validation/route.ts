import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getCurrentMonthKey } from "@/lib/evaluationStorage";
import {
  loadEvaluationV2ValidationMeta,
  saveEvaluationV2ValidationMeta,
  type EvaluationV2System,
} from "@/lib/evaluationV2ValidationStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMonth(raw: string | null): string {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;
  return getCurrentMonthKey();
}

function parseSystem(raw: string | null): EvaluationV2System {
  return raw === "new" ? "new" : "legacy";
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) return NextResponse.json({ error: "Non autorise" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const month = parseMonth(searchParams.get("month"));
    const system = parseSystem(searchParams.get("system"));

    const meta = await loadEvaluationV2ValidationMeta(month, system);
    return NextResponse.json({
      success: true,
      month,
      system,
      validation: meta,
    });
  } catch (error) {
    console.error("[API evaluations/v2/validation] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requirePermission("validate");
    if (!admin) return NextResponse.json({ error: "Non autorise" }, { status: 403 });

    const body = await request.json();
    const month = parseMonth(body?.month || null);
    const system = parseSystem(body?.system || null);
    const action = String(body?.action || "").trim();
    const validated = body?.validated === true;
    const validationNote = typeof body?.validationNote === "string" ? body.validationNote.trim() : "";
    const current = await loadEvaluationV2ValidationMeta(month, system);

    const now = new Date().toISOString();
    const meta = {
      month,
      system,
      validated: current?.validated === true,
      validationStage: current?.validationStage || "none",
      dataPrevalidatedAt: current?.dataPrevalidatedAt,
      dataPrevalidatedBy: current?.dataPrevalidatedBy,
      dataPrevalidatedByUsername: current?.dataPrevalidatedByUsername,
      staffValidatedAt: current?.staffValidatedAt || current?.validatedAt,
      staffValidatedBy: current?.staffValidatedBy || current?.validatedBy,
      staffValidatedByUsername: current?.staffValidatedByUsername || current?.validatedByUsername,
      frozen: current?.frozen === true,
      frozenAt: current?.frozenAt,
      frozenBy: current?.frozenBy,
      frozenByUsername: current?.frozenByUsername,
      validatedAt: current?.validatedAt,
      validatedBy: current?.validatedBy,
      validatedByUsername: current?.validatedByUsername,
      validationNote: validationNote || current?.validationNote,
      updatedAt: now,
    };

    if (action === "set_data_prevalidated") {
      meta.validationStage = "data_prevalidated";
      meta.dataPrevalidatedAt = now;
      meta.dataPrevalidatedBy = admin.discordId;
      meta.dataPrevalidatedByUsername = admin.username;
      meta.validated = false;
      meta.validatedAt = undefined;
      meta.validatedBy = undefined;
      meta.validatedByUsername = undefined;
      meta.staffValidatedAt = undefined;
      meta.staffValidatedBy = undefined;
      meta.staffValidatedByUsername = undefined;
    } else if (action === "set_staff_validated") {
      meta.validationStage = "staff_validated";
      if (!meta.dataPrevalidatedAt) {
        meta.dataPrevalidatedAt = now;
        meta.dataPrevalidatedBy = admin.discordId;
        meta.dataPrevalidatedByUsername = admin.username;
      }
      meta.staffValidatedAt = now;
      meta.staffValidatedBy = admin.discordId;
      meta.staffValidatedByUsername = admin.username;
      meta.validated = true;
      meta.validatedAt = now;
      meta.validatedBy = admin.discordId;
      meta.validatedByUsername = admin.username;
    } else if (action === "clear_validation") {
      meta.validationStage = "none";
      meta.dataPrevalidatedAt = undefined;
      meta.dataPrevalidatedBy = undefined;
      meta.dataPrevalidatedByUsername = undefined;
      meta.staffValidatedAt = undefined;
      meta.staffValidatedBy = undefined;
      meta.staffValidatedByUsername = undefined;
      meta.validated = false;
      meta.validatedAt = undefined;
      meta.validatedBy = undefined;
      meta.validatedByUsername = undefined;
      meta.frozen = false;
      meta.frozenAt = undefined;
      meta.frozenBy = undefined;
      meta.frozenByUsername = undefined;
    } else if (action === "set_frozen") {
      if (meta.validationStage !== "staff_validated" || !meta.validated) {
        return NextResponse.json(
          { error: "Le gel du mois est possible uniquement apres validation staff" },
          { status: 400 },
        );
      }
      meta.frozen = true;
      meta.frozenAt = now;
      meta.frozenBy = admin.discordId;
      meta.frozenByUsername = admin.username;
    } else if (action === "unset_frozen") {
      meta.frozen = false;
      meta.frozenAt = undefined;
      meta.frozenBy = undefined;
      meta.frozenByUsername = undefined;
    } else {
      // Compat mode (ancien appel)
      meta.validationStage = validated ? "staff_validated" : "none";
      meta.validated = validated;
      meta.validatedAt = validated ? now : undefined;
      meta.validatedBy = validated ? admin.discordId : undefined;
      meta.validatedByUsername = validated ? admin.username : undefined;
      meta.staffValidatedAt = validated ? now : undefined;
      meta.staffValidatedBy = validated ? admin.discordId : undefined;
      meta.staffValidatedByUsername = validated ? admin.username : undefined;
      if (!validated) {
        meta.frozen = false;
        meta.frozenAt = undefined;
        meta.frozenBy = undefined;
        meta.frozenByUsername = undefined;
      }
    }

    await saveEvaluationV2ValidationMeta(meta);
    return NextResponse.json({
      success: true,
      month,
      system,
      validation: meta,
    });
  } catch (error) {
    console.error("[API evaluations/v2/validation] PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
