import test from "node:test";
import assert from "node:assert/strict";
import { isSessionRecentlyActive } from "@/lib/connectionLogs";

test("isSessionRecentlyActive true pour une activité < 5 min", () => {
  const now = Date.now();
  const lastSeenAt = new Date(now - 2 * 60 * 1000).toISOString();
  assert.equal(isSessionRecentlyActive(lastSeenAt, 5), true);
});

test("isSessionRecentlyActive false pour une activité > 5 min", () => {
  const now = Date.now();
  const lastSeenAt = new Date(now - 7 * 60 * 1000).toISOString();
  assert.equal(isSessionRecentlyActive(lastSeenAt, 5), false);
});
