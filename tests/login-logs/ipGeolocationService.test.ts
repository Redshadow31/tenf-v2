import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { resolveIpGeolocation } from "@/lib/services/ipGeolocationService";

function makeRequest(headers?: Record<string, string>) {
  return new NextRequest("http://localhost/api/telemetry/connection", {
    headers: headers || {},
  });
}

test("resolveIpGeolocation utilise les headers infra quand disponibles", async () => {
  const request = makeRequest({
    "x-vercel-ip-country": "FR",
    "x-vercel-ip-country-region": "IDF",
    "x-vercel-ip-city": "Paris",
    "x-vercel-ip-latitude": "48.8566",
    "x-vercel-ip-longitude": "2.3522",
  });

  const result = await resolveIpGeolocation({ request, ipAddress: "1.1.1.1" });
  assert.equal(result.countryCode, "FR");
  assert.equal(result.country, "France");
  assert.equal(result.city, "Paris");
  assert.equal(result.latitude, 48.8566);
  assert.equal(result.longitude, 2.3522);
});

test("resolveIpGeolocation fallback HTTP provider si headers absents", async () => {
  const previousUrl = process.env.IP_GEO_PROVIDER_URL;
  const previousKey = process.env.IP_GEO_API_KEY;
  const previousFetch = global.fetch;
  process.env.IP_GEO_PROVIDER_URL = "https://geo-provider.local/mock";
  process.env.IP_GEO_API_KEY = "dummy";
  // @ts-ignore
  global.fetch = async () =>
    ({
      ok: true,
      json: async () => ({
        country: "France",
        countryCode: "FR",
        region: "IDF",
        city: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
      }),
    }) as any;

  try {
    const result = await resolveIpGeolocation({
      request: makeRequest(),
      ipAddress: "8.8.8.8",
    });
    assert.equal(result.countryCode, "FR");
    assert.equal(result.city, "Paris");
  } finally {
    process.env.IP_GEO_PROVIDER_URL = previousUrl;
    process.env.IP_GEO_API_KEY = previousKey;
    global.fetch = previousFetch;
  }
});

test("resolveIpGeolocation retourne null-safe si provider échoue", async () => {
  const previousUrl = process.env.IP_GEO_PROVIDER_URL;
  const previousFetch = global.fetch;
  process.env.IP_GEO_PROVIDER_URL = "https://geo-provider.local/mock";
  // @ts-ignore
  global.fetch = async () => {
    throw new Error("timeout");
  };

  try {
    const result = await resolveIpGeolocation({
      request: makeRequest(),
      ipAddress: "8.8.4.4",
    });
    assert.deepEqual(result, {
      country: null,
      countryCode: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    });
  } finally {
    process.env.IP_GEO_PROVIDER_URL = previousUrl;
    global.fetch = previousFetch;
  }
});
