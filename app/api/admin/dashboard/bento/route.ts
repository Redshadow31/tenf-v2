import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { cacheGet, cacheKey, cacheSetWithNamespace } from "@/lib/cache";
import { loadBentoDashboardPayload } from "@/lib/admin/dashboard/loadBentoDashboardPayload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_DASHBOARD_NAMESPACE = "admin_dashboard";
const BENTO_TTL_SECONDS = 60;

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(date = new Date()): string {
  return monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié ou permissions insuffisantes" }, { status: 401 });
    }

    const currentMonth = request.nextUrl.searchParams.get("month") || monthKey();
    const evaluationMonth =
      request.nextUrl.searchParams.get("evaluationMonth") || previousMonthKey();

    const bentoCacheKey = cacheKey(
      "api",
      "admin",
      "dashboard",
      "bento",
      "v1",
      admin.discordId,
      admin.role,
      currentMonth,
      evaluationMonth,
    );

    const cached = await cacheGet<Awaited<ReturnType<typeof loadBentoDashboardPayload>>>(bentoCacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" },
      });
    }

    const payload = await loadBentoDashboardPayload(admin, currentMonth, evaluationMonth);

    await cacheSetWithNamespace(ADMIN_DASHBOARD_NAMESPACE, bentoCacheKey, payload, BENTO_TTL_SECONDS);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("[API Admin Dashboard Bento] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
