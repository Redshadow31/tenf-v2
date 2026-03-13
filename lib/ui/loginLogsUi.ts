export type LogsPeriod = "today" | "7d" | "30d";

export function periodToDateRange(period: LogsPeriod): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString();
  if (period === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { startDate: start.toISOString(), endDate };
  }
  const days = period === "7d" ? 7 : 30;
  return {
    startDate: new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
    endDate,
  };
}

export function buildRealtimeQuery(params: {
  connectionType?: "discord" | "guest";
  country?: string;
  userSearch?: string;
}): string {
  const query = new URLSearchParams();
  if (params.connectionType) query.set("connectionType", params.connectionType);
  if (params.country) query.set("country", params.country);
  if (params.userSearch) query.set("userSearch", params.userSearch);
  return query.toString();
}
