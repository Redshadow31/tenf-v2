import { NextRequest } from "next/server";

const HEARTBEAT_MIN_INTERVAL_MS = 20_000;

declare global {
  // eslint-disable-next-line no-var
  var __tenfHeartbeatLastBySession: Map<string, number> | undefined;
}

function getStore(): Map<string, number> {
  if (!globalThis.__tenfHeartbeatLastBySession) {
    globalThis.__tenfHeartbeatLastBySession = new Map<string, number>();
  }
  return globalThis.__tenfHeartbeatLastBySession;
}

export function getValidHeartbeatSessionId(request: NextRequest, fromBody: unknown): string | null {
  const cookieSession = request.cookies.get("tenf_visit_id")?.value;
  const bodySession = typeof fromBody === "string" ? fromBody.trim() : "";

  if (!cookieSession) return null;
  if (bodySession && cookieSession !== bodySession) return null;
  return cookieSession;
}

export function isHeartbeatRateLimited(sessionId: string, now = Date.now()): boolean {
  const store = getStore();
  const last = store.get(sessionId) || 0;
  if (now - last < HEARTBEAT_MIN_INTERVAL_MS) {
    return true;
  }
  store.set(sessionId, now);
  return false;
}

export function __resetHeartbeatRateLimitStoreForTests() {
  const store = getStore();
  store.clear();
}
