import {
  type PageActivityAuthFilter,
  type PageActivityEventType,
  type PageActivityFilters,
  type PageActivityZone,
} from "@/lib/services/pageActivityService";

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parseIsoDate(value: string | null): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function parseZone(value: string | null): PageActivityZone | undefined {
  if (value === "public" || value === "admin") return value;
  return undefined;
}

function parseAuthState(value: string | null): PageActivityAuthFilter {
  if (value === "authenticated" || value === "guest") return value;
  return "all";
}

function parseEventType(value: string | null): PageActivityEventType | undefined {
  if (value === "page_view" || value === "click") return value;
  return undefined;
}

function parseShortText(value: string | null, max = 128): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  return normalized.slice(0, max);
}

function defaultMonthlyStartDate(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
}

function defaultMonthlyEndDate(): string {
  return new Date().toISOString();
}

export function parseAdminPageActivityFilters(searchParams: URLSearchParams): PageActivityFilters {
  let startDate = parseIsoDate(searchParams.get("startDate")) || defaultMonthlyStartDate();
  let endDate = parseIsoDate(searchParams.get("endDate")) || defaultMonthlyEndDate();
  if (new Date(startDate) > new Date(endDate)) {
    startDate = endDate;
  }

  return {
    page: parsePositiveInt(searchParams.get("page"), 1, 5000),
    limit: parsePositiveInt(searchParams.get("limit"), 25, 200),
    startDate,
    endDate,
    zone: parseZone(searchParams.get("zone")),
    path: parseShortText(searchParams.get("path"), 256),
    userSearch: parseShortText(searchParams.get("userSearch"), 128),
    authState: parseAuthState(searchParams.get("authState")),
    eventType: parseEventType(searchParams.get("eventType")),
  };
}
