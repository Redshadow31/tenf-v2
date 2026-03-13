import { expect, test } from "@playwright/test";

test.describe("Admin logs security and accessibility", () => {
  test("redirects anonymous user from admin logs page", async ({ page }) => {
    await page.goto("/admin/audit-logs/connexions");
    await expect(page).toHaveURL(/\/auth\/login|\/api\/auth\/signin/);
  });

  test("redirects anonymous user from admin realtime page", async ({ page }) => {
    await page.goto("/admin/audit-logs/temps-reel");
    await expect(page).toHaveURL(/\/auth\/login|\/api\/auth\/signin/);
  });

  test("protects admin API endpoints for anonymous user", async ({ request }) => {
    const [logsRes, statsRes, mapRes, realtimeRes] = await Promise.all([
      request.get("/api/admin/login-logs"),
      request.get("/api/admin/login-logs/stats"),
      request.get("/api/admin/login-logs/map"),
      request.get("/api/admin/login-logs/realtime"),
    ]);

    expect(logsRes.status()).toBe(401);
    expect(statsRes.status()).toBe(401);
    expect(mapRes.status()).toBe(401);
    expect(realtimeRes.status()).toBe(401);
  });

  test("heartbeat requires session cookie and supports valid flow", async ({ request }) => {
    const invalidHeartbeat = await request.post("/api/telemetry/connection/heartbeat", {
      data: {},
    });
    expect(invalidHeartbeat.status()).toBe(400);

    const registerRes = await request.post("/api/telemetry/connection", {
      data: {
        path: "/",
        source: "heartbeat",
      },
    });
    expect(registerRes.ok()).toBeTruthy();
    const registerJson = await registerRes.json();
    expect(typeof registerJson.sessionId).toBe("string");
    const sessionId = registerJson.sessionId as string;

    const heartbeatRes = await request.post("/api/telemetry/connection/heartbeat", {
      headers: {
        Cookie: `tenf_visit_id=${sessionId}`,
      },
      data: {
        sessionKey: sessionId,
        path: "/membres",
      },
    });

    expect([200, 202]).toContain(heartbeatRes.status());
  });
});
