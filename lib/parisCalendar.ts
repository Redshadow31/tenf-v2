/** Fuseau utilisé pour les stats admin TENF (aligné sur la communauté FR). */
export const TENF_STATS_TIMEZONE = "Europe/Paris";

export function isoToParisYmd(iso: string): { y: number; m: number; d: number } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: TENF_STATS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

export function parisMonthKeyFromDate(d: Date): string {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: TENF_STATS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return s.slice(0, 7);
}

export function parisMonthKeyFromIso(iso: string): string | null {
  const parts = isoToParisYmd(iso);
  if (!parts) return null;
  return `${parts.y}-${String(parts.m).padStart(2, "0")}`;
}
