import { NextRequest } from "next/server";
import { hashIpAddress } from "@/lib/connection-logs/network";

export interface IpGeolocationResult {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface IpGeolocationContext {
  request: NextRequest;
  ipAddress: string | null;
}

interface IpGeolocationProvider {
  resolve(context: IpGeolocationContext): Promise<IpGeolocationResult | null>;
}

const COUNTRY_NAMES: Record<string, string> = {
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  CA: "Canada",
  US: "Etats-Unis",
  DE: "Allemagne",
  ES: "Espagne",
  IT: "Italie",
  GB: "Royaume-Uni",
  PT: "Portugal",
  DZ: "Algerie",
  MA: "Maroc",
  TN: "Tunisie",
  CM: "Cameroun",
  SN: "Senegal",
};

class HeaderIpGeolocationProvider implements IpGeolocationProvider {
  async resolve(context: IpGeolocationContext): Promise<IpGeolocationResult | null> {
    const { request } = context;
    const netlifyGeoRaw = request.headers.get("x-nf-geo");
    let netlifyGeo: Record<string, unknown> | null = null;
    if (netlifyGeoRaw) {
      try {
        netlifyGeo = JSON.parse(netlifyGeoRaw) as Record<string, unknown>;
      } catch {
        netlifyGeo = null;
      }
    }
    const geoAny = netlifyGeo as any;

    const countryCode =
      request.headers.get("x-country") ||
      request.headers.get("x-country-code") ||
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      (typeof geoAny?.country?.code === "string" ? geoAny.country.code : null) ||
      null;
    const region =
      request.headers.get("x-region") ||
      request.headers.get("x-vercel-ip-country-region") ||
      (typeof geoAny?.subdivision?.name === "string" ? geoAny.subdivision.name : null) ||
      null;
    const city =
      request.headers.get("x-city") ||
      request.headers.get("x-vercel-ip-city") ||
      (typeof geoAny?.city === "string" ? geoAny.city : null) ||
      null;
    const latitudeRaw =
      request.headers.get("x-latitude") ||
      request.headers.get("x-vercel-ip-latitude") ||
      (typeof geoAny?.latitude === "number" ? String(geoAny.latitude) : null);
    const longitudeRaw =
      request.headers.get("x-longitude") ||
      request.headers.get("x-vercel-ip-longitude") ||
      (typeof geoAny?.longitude === "number" ? String(geoAny.longitude) : null);

    if (!countryCode && !region && !city && !latitudeRaw && !longitudeRaw) return null;

    const latitude = latitudeRaw ? Number.parseFloat(latitudeRaw) : null;
    const longitude = longitudeRaw ? Number.parseFloat(longitudeRaw) : null;

    return {
      country: countryCode ? COUNTRY_NAMES[countryCode] || countryCode : null,
      countryCode: countryCode ? countryCode.toUpperCase() : null,
      region,
      city,
      latitude: Number.isFinite(latitude as number) ? latitude : null,
      longitude: Number.isFinite(longitude as number) ? longitude : null,
    };
  }
}

class HttpIpGeolocationProvider implements IpGeolocationProvider {
  async resolve(context: IpGeolocationContext): Promise<IpGeolocationResult | null> {
    if (!context.ipAddress) return null;
    const baseUrl = process.env.IP_GEO_PROVIDER_URL;
    if (!baseUrl) return null;

    const apiKey = process.env.IP_GEO_API_KEY || "";
    const timeoutMs = Number.parseInt(process.env.IP_GEO_TIMEOUT_MS || "1200", 10);
    const url = new URL(baseUrl);
    url.searchParams.set("ip", context.ipAddress);
    if (apiKey) url.searchParams.set("apiKey", apiKey);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const data = await response.json();
      const countryCodeValue = data?.countryCode || data?.country_code || data?.country?.code || null;
      const countryValue = data?.country || data?.country_name || data?.country?.name || null;
      const latitudeRaw = data?.latitude ?? data?.lat ?? data?.location?.lat ?? null;
      const longitudeRaw = data?.longitude ?? data?.lon ?? data?.location?.lng ?? data?.location?.lon ?? null;
      const latitudeValue =
        typeof latitudeRaw === "number"
          ? latitudeRaw
          : typeof latitudeRaw === "string"
          ? Number.parseFloat(latitudeRaw)
          : null;
      const longitudeValue =
        typeof longitudeRaw === "number"
          ? longitudeRaw
          : typeof longitudeRaw === "string"
          ? Number.parseFloat(longitudeRaw)
          : null;
      return {
        country: typeof countryValue === "string" ? countryValue : null,
        countryCode: typeof countryCodeValue === "string" ? countryCodeValue.toUpperCase() : null,
        region: typeof data?.region === "string" ? data.region : null,
        city: typeof data?.city === "string" ? data.city : null,
        latitude: Number.isFinite(latitudeValue as number) ? (latitudeValue as number) : null,
        longitude: Number.isFinite(longitudeValue as number) ? (longitudeValue as number) : null,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

const providers: IpGeolocationProvider[] = [new HeaderIpGeolocationProvider(), new HttpIpGeolocationProvider()];

function logGeoDebug(stage: string, context: IpGeolocationContext, result: IpGeolocationResult | null): void {
  if (process.env.LOG_IP_GEO_DEBUG !== "1") return;
  console.info("[ip-geolocation]", {
    stage,
    ipHash: hashIpAddress(context.ipAddress),
    hasIp: Boolean(context.ipAddress),
    countryCode: result?.countryCode || null,
    country: result?.country || null,
  });
}

export async function resolveIpGeolocation(context: IpGeolocationContext): Promise<IpGeolocationResult> {
  for (const provider of providers) {
    const result = await provider.resolve(context);
    if (result) {
      logGeoDebug("resolved", context, result);
      return result;
    }
  }
  const fallback = {
    country: null,
    countryCode: null,
    region: null,
    city: null,
    latitude: null,
    longitude: null,
  };
  logGeoDebug("fallback-null", context, fallback);
  return fallback;
}
