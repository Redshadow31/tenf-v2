import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  handleGetLoginLogs,
  handleGetLoginLogsMap,
  handleGetLoginLogsRealtime,
  handleGetLoginLogsStats,
} from "@/lib/services/adminLoginLogsRouteHandlers";

const fakeAdmin = {
  id: "1",
  discordId: "1",
  username: "Admin",
  avatar: null,
  role: "FONDATEUR" as const,
};

test("handleGetLoginLogs retourne payload paginé en mode admin", async () => {
  const request = new NextRequest(
    "http://localhost/api/admin/login-logs?page=2&limit=10&country=fr&connectionType=discord"
  );
  let ensured = false;
  let capturedArgs: any = null;

  const response = await handleGetLoginLogs(request, {
    requireAdminFn: async () => fakeAdmin,
    ensureCleanupFn: () => {
      ensured = true;
    },
    getLogsFn: async (args) => {
      capturedArgs = args;
      return { page: 2, limit: 10, total: 1, logs: [{ username: "Nexou" }] };
    },
  });

  assert.equal(ensured, true);
  assert.equal(capturedArgs.page, 2);
  assert.equal(capturedArgs.limit, 10);
  assert.equal(capturedArgs.country, "FR");
  assert.equal(capturedArgs.connectionType, "discord");
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.total, 1);
});

test("handleGetLoginLogsStats retourne 24 heures et compteurs", async () => {
  const request = new NextRequest("http://localhost/api/admin/login-logs/stats?country=fr");

  const response = await handleGetLoginLogsStats(request, {
    requireAdminFn: async () => fakeAdmin,
    ensureCleanupFn: () => undefined,
    getStatsFn: async (args) => {
      assert.equal(args.country, "FR");
      return {
        totalConnections: 3,
        memberConnections: 2,
        guestConnections: 1,
        hourlyConnections: Array.from({ length: 24 }).map((_, hour) => ({ hour, count: hour === 10 ? 3 : 0 })),
      };
    },
  });

  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.totalConnections, 3);
  assert.equal(json.hourlyConnections.length, 24);
});

test("handleGetLoginLogsMap retourne agrégation par pays", async () => {
  const request = new NextRequest("http://localhost/api/admin/login-logs/map?connectionType=guest");

  const response = await handleGetLoginLogsMap(request, {
    requireAdminFn: async () => fakeAdmin,
    ensureCleanupFn: () => undefined,
    getMapFn: async (args) => {
      assert.equal(args.connectionType, "guest");
      return [{ country: "France", countryCode: "FR", latitude: 46.2, longitude: 2.2, connections: 7 }];
    },
  });

  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(Array.isArray(json), true);
  assert.equal(json[0].countryCode, "FR");
});

test("handleGetLoginLogsRealtime retourne sessions actives en mode admin", async () => {
  const request = new Request("http://localhost/api/admin/login-logs/realtime?userSearch=nex");

  const response = await handleGetLoginLogsRealtime(request, {
    requireAdminFn: async () => fakeAdmin,
    ensureCleanupFn: () => undefined,
    getRealtimeFn: async (args) => {
      assert.equal(args.userSearch, "nex");
      return {
        totalActiveConnections: 2,
        activeMembers: 1,
        activeGuests: 1,
        countriesRepresented: 1,
        latestHeartbeatAt: new Date().toISOString(),
        countries: [{ country: "France", countryCode: "FR", active: 2, members: 1, guests: 1 }],
        activeConnections: [],
      };
    },
  });

  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.totalActiveConnections, 2);
  assert.equal(json.countriesRepresented, 1);
});
