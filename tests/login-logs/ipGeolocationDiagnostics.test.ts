import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { resolveIpGeolocationWithDiagnostics } from "@/lib/services/ipGeolocationService";

test("resolveIpGeolocationWithDiagnostics retourne missing_ip sans IP ni headers geo", async () => {
  const request = new NextRequest("http://localhost/api/telemetry/connection");
  const result = await resolveIpGeolocationWithDiagnostics({
    request,
    ipAddress: null,
    ipReason: "missing_ip",
  });
  assert.equal(result.diagnostics.status, "missing_ip");
  assert.equal(result.geo.countryCode, null);
});

test("resolveIpGeolocationWithDiagnostics utilise headers Netlify", async () => {
  const request = new NextRequest("http://localhost/api/telemetry/connection", {
    headers: {
      "x-country": "FR",
      "x-city": "Paris",
      "x-region": "IDF",
      "x-latitude": "48.8566",
      "x-longitude": "2.3522",
    },
  });
  const result = await resolveIpGeolocationWithDiagnostics({
    request,
    ipAddress: "203.0.113.10",
  });
  assert.equal(result.diagnostics.status, "resolved");
  assert.equal(result.geo.countryCode, "FR");
  assert.equal(result.geo.city, "Paris");
});
