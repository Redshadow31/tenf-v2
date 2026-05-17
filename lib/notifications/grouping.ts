export type TimeBucketKey = "today" | "week" | "older";

export function getTimeBucket(iso: string): TimeBucketKey {
  const d = new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t)) return "older";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (t >= startOfToday) return "today";
  const diffDays = Math.floor((startOfToday - t) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return "week";
  return "older";
}

export const TIME_BUCKET_LABELS: Record<TimeBucketKey, string> = {
  today: "Aujourd’hui",
  week: "Cette semaine",
  older: "Plus ancien",
};

export const TIME_BUCKET_ORDER: TimeBucketKey[] = ["today", "week", "older"];
