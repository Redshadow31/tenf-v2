import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getAuditLogs, type AuditLog } from "@/lib/adminAudit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ACTIONS = new Set([
  "evaluation.override_final_note",
  "evaluation.bonus.update",
  "update_member_status",
]);

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const limitParam = Number(searchParams.get("limit") || "200");
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(500, limitParam)) : 200;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Le parametre "month" est requis au format YYYY-MM' },
        { status: 400 }
      );
    }

    const logs = await getAuditLogs(month);
    const filtered = logs
      .filter((log) => ALLOWED_ACTIONS.has(log.action))
      .slice(0, limit)
      .map((log: AuditLog) => ({
        id: log.id,
        timestamp: log.timestamp,
        action: log.action,
        actorDiscordId: log.actorDiscordId,
        actorUsername: log.actorUsername,
        resourceId: log.resourceId,
        metadata: log.metadata || {},
        previousValue: log.previousValue,
        newValue: log.newValue,
      }));

    return NextResponse.json({
      success: true,
      month,
      count: filtered.length,
      logs: filtered,
    });
  } catch (error) {
    console.error("[API Evaluations Synthesis Overrides] Erreur:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
