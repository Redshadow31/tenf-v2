import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getLoginLogsMapData } from "@/lib/services/connectionLogService";
import { ensureConnectionLogsCleanupScheduler } from "@/lib/services/cleanupService";
import { parseAdminLoginLogsFilters } from "@/lib/services/adminLoginLogsQuery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteDeps = {
  requireAdminFn: typeof requireAdmin;
  ensureCleanupFn: typeof ensureConnectionLogsCleanupScheduler;
  getMapFn: typeof getLoginLogsMapData;
};

const defaultDeps: RouteDeps = {
  requireAdminFn: requireAdmin,
  ensureCleanupFn: ensureConnectionLogsCleanupScheduler,
  getMapFn: getLoginLogsMapData,
};

export async function handleGetLoginLogsMap(
  request: NextRequest,
  deps: RouteDeps = defaultDeps
) {
  try {
    deps.ensureCleanupFn();
    const admin = await deps.requireAdminFn();
    if (!admin) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filters = parseAdminLoginLogsFilters(searchParams);

    const payload = await deps.getMapFn({
      startDate: filters.startDate,
      endDate: filters.endDate,
      country: filters.country,
      userId: filters.userId,
      connectionType: filters.connectionType,
    });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin/login-logs/map] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleGetLoginLogsMap(request);
}
