export interface ParsedAdminLogsFilters {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  country?: string;
  userId?: string;
  userSearch?: string;
  connectionType?: "discord" | "guest";
}

function parseIsoDate(value: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parseCountry(value: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return undefined;
  return normalized;
}

function parseShortText(value: string | null, maxLength: number): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function parseConnectionType(value: string | null): "discord" | "guest" | undefined {
  if (value === "discord" || value === "guest") return value;
  return undefined;
}

export function parseAdminLoginLogsFilters(searchParams: URLSearchParams): ParsedAdminLogsFilters {
  const startDate = parseIsoDate(searchParams.get("startDate"));
  const endDate = parseIsoDate(searchParams.get("endDate"));

  let safeStartDate = startDate;
  let safeEndDate = endDate;
  if (safeStartDate && safeEndDate && new Date(safeStartDate) > new Date(safeEndDate)) {
    safeStartDate = safeEndDate;
  }

  return {
    page: parsePositiveInt(searchParams.get("page"), 1, 5000),
    limit: parsePositiveInt(searchParams.get("limit"), 50, 200),
    startDate: safeStartDate,
    endDate: safeEndDate,
    country: parseCountry(searchParams.get("country")),
    userId: parseShortText(searchParams.get("userId"), 128),
    userSearch: parseShortText(searchParams.get("userSearch"), 128),
    connectionType: parseConnectionType(searchParams.get("connectionType")),
  };
}
