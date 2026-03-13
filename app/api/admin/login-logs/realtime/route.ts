import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { getRealtimeLoginLogs } from "@/lib/services/connectionLogService";
import { ensureConnectionLogsCleanupScheduler } from "@/lib/services/cleanupService";
import { parseAdminLoginLogsFilters } from "@/lib/services/adminLoginLogsQuery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteDeps = {
  requireAdminFn: typeof requireAdmin;
  ensureCleanupFn: typeof ensureConnectionLogsCleanupScheduler;
  getRealtimeFn: typeof getRealtimeLoginLogs;
};

const defaultDeps: RouteDeps = {
  requireAdminFn: requireAdmin,
  ensureCleanupFn: ensureConnectionLogsCleanupScheduler,
  getRealtimeFn: getRealtimeLoginLogs,
};

export async function handleGetLoginLogsRealtime(
  request: Request,
  deps: RouteDeps = defaultDeps
) {
  try {
    deps.ensureCleanupFn();
    const admin = await deps.requireAdminFn();
    if (!admin) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filters = parseAdminLoginLogsFilters(searchParams);

    const payload = await deps.getRealtimeFn({
      connectionType: filters.connectionType,
      country: filters.country,
      userSearch: filters.userSearch,
    });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin/login-logs/realtime] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleGetLoginLogsRealtime(request);
}
