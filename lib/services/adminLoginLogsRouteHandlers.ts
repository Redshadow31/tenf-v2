import { NextRequest, NextResponse } from "next/server";
import type { AuthenticatedAdmin } from "@/lib/requireAdmin";
import { parseAdminLoginLogsFilters } from "@/lib/services/adminLoginLogsQuery";
import {
  getLoginLogsMapData,
  getDailyMemberLoginLogs,
  getLoginLogsStats,
  getPaginatedLoginLogs,
  getRealtimeLoginLogs,
} from "@/lib/services/connectionLogService";
import { ensureConnectionLogsCleanupScheduler } from "@/lib/services/cleanupService";
import { requireAdmin } from "@/lib/requireAdmin";

type RequireAdminFn = () => Promise<AuthenticatedAdmin | null>;
type EnsureCleanupFn = () => void;

export type LoginLogsRouteDeps = {
  requireAdminFn: RequireAdminFn;
  ensureCleanupFn: EnsureCleanupFn;
  getLogsFn: typeof getPaginatedLoginLogs;
};

export type LoginLogsStatsRouteDeps = {
  requireAdminFn: RequireAdminFn;
  ensureCleanupFn: EnsureCleanupFn;
  getStatsFn: typeof getLoginLogsStats;
};

export type LoginLogsMapRouteDeps = {
  requireAdminFn: RequireAdminFn;
  ensureCleanupFn: EnsureCleanupFn;
  getMapFn: typeof getLoginLogsMapData;
};

export type LoginLogsRealtimeRouteDeps = {
  requireAdminFn: RequireAdminFn;
  ensureCleanupFn: EnsureCleanupFn;
  getRealtimeFn: typeof getRealtimeLoginLogs;
};

export type LoginLogsMembersDailyRouteDeps = {
  requireAdminFn: RequireAdminFn;
  ensureCleanupFn: EnsureCleanupFn;
  getDailyMembersFn: typeof getDailyMemberLoginLogs;
};

export const loginLogsRouteDeps: LoginLogsRouteDeps = {
  requireAdminFn: requireAdmin,
  ensureCleanupFn: ensureConnectionLogsCleanupScheduler,
  getLogsFn: getPaginatedLoginLogs,
};

export const loginLogsStatsRouteDeps: LoginLogsStatsRouteDeps = {
  requireAdminFn: requireAdmin,
  ensureCleanupFn: ensureConnectionLogsCleanupScheduler,
  getStatsFn: getLoginLogsStats,
};

export const loginLogsMapRouteDeps: LoginLogsMapRouteDeps = {
  requireAdminFn: requireAdmin,
  ensureCleanupFn: ensureConnectionLogsCleanupScheduler,
  getMapFn: getLoginLogsMapData,
};

export const loginLogsRealtimeRouteDeps: LoginLogsRealtimeRouteDeps = {
  requireAdminFn: requireAdmin,
  ensureCleanupFn: ensureConnectionLogsCleanupScheduler,
  getRealtimeFn: getRealtimeLoginLogs,
};

export const loginLogsMembersDailyRouteDeps: LoginLogsMembersDailyRouteDeps = {
  requireAdminFn: requireAdmin,
  ensureCleanupFn: ensureConnectionLogsCleanupScheduler,
  getDailyMembersFn: getDailyMemberLoginLogs,
};

export async function handleGetLoginLogs(request: NextRequest, deps: LoginLogsRouteDeps) {
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

export async function handleGetLoginLogsStats(request: NextRequest, deps: LoginLogsStatsRouteDeps) {
  try {
    deps.ensureCleanupFn();
    const admin = await deps.requireAdminFn();
    if (!admin) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filters = parseAdminLoginLogsFilters(searchParams);

    const payload = await deps.getStatsFn({
      startDate: filters.startDate,
      endDate: filters.endDate,
      country: filters.country,
      userId: filters.userId,
      connectionType: filters.connectionType,
    });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin/login-logs/stats] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function handleGetLoginLogsMap(request: NextRequest, deps: LoginLogsMapRouteDeps) {
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

export async function handleGetLoginLogsRealtime(
  request: Request,
  deps: LoginLogsRealtimeRouteDeps
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

export async function handleGetLoginLogsMembersDaily(
  request: NextRequest,
  deps: LoginLogsMembersDailyRouteDeps
) {
  try {
    deps.ensureCleanupFn();
    const admin = await deps.requireAdminFn();
    if (!admin) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filters = parseAdminLoginLogsFilters(searchParams);
    const payload = await deps.getDailyMembersFn({
      startDate: filters.startDate,
      endDate: filters.endDate,
      country: filters.country,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin/login-logs/members-daily] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
