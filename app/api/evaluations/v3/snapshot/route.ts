import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getCurrentMonthKey } from "@/lib/evaluationStorage";
import { buildEvaluationV3Snapshot } from "@/lib/evaluationV3SnapshotBuilder";

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

    const snapshot = await buildEvaluationV3Snapshot(month);

    return NextResponse.json({
      success: true,
      ...snapshot,
    });
  } catch (error) {
    console.error("[API evaluations/v3/snapshot] GET:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
