import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  handleGetLoginLogs,
  handleGetLoginLogsMap,
  handleGetLoginLogsRealtime,
  handleGetLoginLogsStats,
} from "@/lib/services/adminLoginLogsRouteHandlers";

test("admin login-logs retourne 401 sans session admin", async () => {
  const response = await handleGetLoginLogs(new NextRequest("http://localhost/api/admin/login-logs"), {
    requireAdminFn: async () => null,
    ensureCleanupFn: () => undefined,
    getLogsFn: async () => ({ page: 1, limit: 20, total: 0, logs: [] }),
  });
  assert.equal(response.status, 401);
});

test("admin login-logs/stats retourne 401 sans session admin", async () => {
  const response = await handleGetLoginLogsStats(new NextRequest("http://localhost/api/admin/login-logs/stats"), {
    requireAdminFn: async () => null,
    ensureCleanupFn: () => undefined,
    getStatsFn: async () => ({
      totalConnections: 0,
      memberConnections: 0,
      guestConnections: 0,
      hourlyConnections: [],
    }),
  });
  assert.equal(response.status, 401);
});

test("admin login-logs/map retourne 401 sans session admin", async () => {
  const response = await handleGetLoginLogsMap(new NextRequest("http://localhost/api/admin/login-logs/map"), {
    requireAdminFn: async () => null,
    ensureCleanupFn: () => undefined,
    getMapFn: async () => [],
  });
  assert.equal(response.status, 401);
});

test("admin login-logs/realtime retourne 401 sans session admin", async () => {
  const response = await handleGetLoginLogsRealtime(new Request("http://localhost/api/admin/login-logs/realtime"), {
    requireAdminFn: async () => null,
    ensureCleanupFn: () => undefined,
    getRealtimeFn: async () => ({
      totalActiveConnections: 0,
      activeMembers: 0,
      activeGuests: 0,
      countriesRepresented: 0,
      latestHeartbeatAt: null,
      countries: [],
      activeConnections: [],
    }),
  });
  assert.equal(response.status, 401);
});
