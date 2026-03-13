import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as heartbeatPost } from "@/app/api/telemetry/connection/heartbeat/route";

test("heartbeat retourne 400 sans session cookie", async () => {
  const request = new NextRequest("http://localhost/api/telemetry/connection/heartbeat", {
    method: "POST",
    body: JSON.stringify({}),
    headers: {
      "content-type": "application/json",
    },
  });

  const response = await heartbeatPost(request);
  assert.equal(response.status, 400);
});
