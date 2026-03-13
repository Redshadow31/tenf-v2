import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/connection-logs/network";

test("getClientIp priorise les IP publiques", () => {
  const request = new NextRequest("http://localhost", {
    headers: {
      "x-forwarded-for": "10.0.0.2, 198.51.100.20",
    },
  });
  assert.equal(getClientIp(request), "198.51.100.20");
});

test("getClientIp lit le header Netlify quand present", () => {
  const request = new NextRequest("http://localhost", {
    headers: {
      "x-nf-client-connection-ip": "203.0.113.11",
      "x-forwarded-for": "10.0.0.2",
    },
  });
  assert.equal(getClientIp(request), "203.0.113.11");
});
