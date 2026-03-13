import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getPaginatedLoginLogs } from "@/lib/services/connectionLogService";
import { ensureConnectionLogsCleanupScheduler } from "@/lib/services/cleanupService";
import { parseAdminLoginLogsFilters } from "@/lib/services/adminLoginLogsQuery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteDeps = {
  requireAdminFn: typeof requireAdmin;
  ensureCleanupFn: typeof ensureConnectionLogsCleanupScheduler;
  getLogsFn: typeof getPaginatedLoginLogs;
};

const defaultDeps: RouteDeps = {
  requireAdminFn: requireAdmin,
  ensureCleanupFn: ensureConnectionLogsCleanupScheduler,
  getLogsFn: getPaginatedLoginLogs,
};

export async function handleGetLoginLogs(
  request: NextRequest,
  deps: RouteDeps = defaultDeps
) {
  try {
    deps.ensureCleanupFn();
    const admin = await deps.requireAdminFn();
    if (!admin) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filters = parseAdminLoginLogsFilters(searchParams);

    const payload = await deps.getLogsFn({
      page: filters.page,
      limit: filters.limit,
      startDate: filters.startDate,
      endDate: filters.endDate,
      country: filters.country,
      userId: filters.userId,
      userSearch: filters.userSearch,
      connectionType: filters.connectionType,
    });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin/login-logs] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleGetLoginLogs(request);
}
