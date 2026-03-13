import { NextRequest } from "next/server";

export interface GeolocationResult {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface GeolocationContext {
  request: NextRequest;
  ipAddress: string | null;
}

interface GeolocationProvider {
  resolve(context: GeolocationContext): Promise<GeolocationResult | null>;
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

class HeaderGeolocationProvider implements GeolocationProvider {
  async resolve(context: GeolocationContext): Promise<GeolocationResult | null> {
    const { request } = context;
    const countryCode = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || null;
    const region = request.headers.get("x-vercel-ip-country-region") || null;
    const city = request.headers.get("x-vercel-ip-city") || null;
    const latitudeRaw = request.headers.get("x-vercel-ip-latitude");
    const longitudeRaw = request.headers.get("x-vercel-ip-longitude");

    if (!countryCode && !region && !city && !latitudeRaw && !longitudeRaw) {
      return null;
    }

    const latitude = latitudeRaw ? Number.parseFloat(latitudeRaw) : null;
    const longitude = longitudeRaw ? Number.parseFloat(longitudeRaw) : null;

    return {
      countryCode,
      country: countryCode ? COUNTRY_NAMES[countryCode] || countryCode : null,
      region,
      city,
      latitude: Number.isFinite(latitude as number) ? latitude : null,
      longitude: Number.isFinite(longitude as number) ? longitude : null,
    };
  }
}

class HttpGeolocationProvider implements GeolocationProvider {
  async resolve(context: GeolocationContext): Promise<GeolocationResult | null> {
    if (!context.ipAddress) return null;
    const baseUrl = process.env.IP_GEO_PROVIDER_URL;
    if (!baseUrl) return null;

    const apiKey = process.env.IP_GEO_API_KEY || "";
    const url = new URL(baseUrl);
    url.searchParams.set("ip", context.ipAddress);
    if (apiKey) {
      url.searchParams.set("apiKey", apiKey);
    }

    try {
      const response = await fetch(url.toString(), { method: "GET", cache: "no-store" });
      if (!response.ok) return null;
      const data = await response.json();
      return {
        country: data?.country || null,
        countryCode: data?.countryCode || data?.country_code || null,
        region: data?.region || null,
        city: data?.city || null,
        latitude: typeof data?.latitude === "number" ? data.latitude : null,
        longitude: typeof data?.longitude === "number" ? data.longitude : null,
      };
    } catch {
      return null;
    }
  }
}

const providers: GeolocationProvider[] = [new HeaderGeolocationProvider(), new HttpGeolocationProvider()];

export async function resolveGeolocation(context: GeolocationContext): Promise<GeolocationResult> {
  for (const provider of providers) {
    const result = await provider.resolve(context);
    if (result) {
      return result;
    }
  }

  return {
    country: null,
    countryCode: null,
    region: null,
    city: null,
    latitude: null,
    longitude: null,
  };
}
