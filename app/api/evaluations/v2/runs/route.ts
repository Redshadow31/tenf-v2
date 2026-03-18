import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getCurrentMonthKey } from "@/lib/evaluationStorage";
import { loadEvaluationV2RunLogs, type EvaluationV2System } from "@/lib/evaluationV2RunLogStorage";

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
    const limitRaw = Number(searchParams.get("limit") || 20);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 20;

    const logs = await loadEvaluationV2RunLogs(month, system);
    return NextResponse.json({
      success: true,
      month,
      system,
      count: logs.length,
      logs: logs.slice(0, limit),
    });
  } catch (error) {
    console.error("[API evaluations/v2/runs] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
