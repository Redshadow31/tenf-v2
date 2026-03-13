import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  __resetHeartbeatRateLimitStoreForTests,
  getValidHeartbeatSessionId,
  isHeartbeatRateLimited,
} from "@/lib/services/heartbeatGuard";

function makeRequestWithCookie(cookieValue?: string) {
  const headers = new Headers();
  if (cookieValue) {
    headers.set("cookie", `tenf_visit_id=${cookieValue}`);
  }
  return new NextRequest("http://localhost/api/telemetry/connection/heartbeat", {
    headers,
  });
}

test("getValidHeartbeatSessionId refuse sans cookie", () => {
  const request = makeRequestWithCookie(undefined);
  const sessionId = getValidHeartbeatSessionId(request, "abc");
  assert.equal(sessionId, null);
});

test("getValidHeartbeatSessionId refuse mismatch cookie/body", () => {
  const request = makeRequestWithCookie("cookie-session");
  const sessionId = getValidHeartbeatSessionId(request, "other-session");
  assert.equal(sessionId, null);
});

test("getValidHeartbeatSessionId accepte cookie + body cohérent", () => {
  const request = makeRequestWithCookie("cookie-session");
  const sessionId = getValidHeartbeatSessionId(request, "cookie-session");
  assert.equal(sessionId, "cookie-session");
});

test("isHeartbeatRateLimited applique la fenêtre anti-spam", () => {
  __resetHeartbeatRateLimitStoreForTests();
  const sessionId = "s1";
  const base = Date.now();
  assert.equal(isHeartbeatRateLimited(sessionId, base), false);
  assert.equal(isHeartbeatRateLimited(sessionId, base + 500), true);
  assert.equal(isHeartbeatRateLimited(sessionId, base + 21_000), false);
});
