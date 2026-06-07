export const FORMATIONS_CATALOG_ACCENT = "#8b5cf6";

export type FormationEventItem = {
  id: string;
  title: string;
  date: string;
  category: string;
  description?: string;
  image?: string;
  location?: string;
};

export type PastFormationCatalogItem = {
  key: string;
  title: string;
  sourceEventId: string | null;
};

export type CatalogSortMode = "alpha" | "alpha-desc";
export type CatalogViewMode = "grid" | "list";

export function catalogFirstBucket(title: string): string {
  const t = title.trim();
  if (!t) return "#";
  const c = t.charAt(0).toUpperCase();
  if (/[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÆŒÇ]/u.test(c)) return c;
  return "#";
}

export function catalogHue(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h + title.charCodeAt(i) * (i + 3)) % 360;
  return h;
}

export function calendarUrlForEvent(event: FormationEventItem, origin = ""): string {
  const start = new Date(event.date);
  if (Number.isNaN(start.getTime())) return "/member/formations";
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const formatUtc = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const details = `${event.description || "Formation TENF"}\n\n${origin}/member/formations`;
  const location = event.location || "Discord TENF";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatUtc(start)}/${formatUtc(end)}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildPastCatalogUnique(
  sortedFormations: FormationEventItem[],
  nowTs: number,
): PastFormationCatalogItem[] {
  const byKey = new Map<string, { title: string; sourceEventId: string | null; latestDate: number }>();
  for (const formation of sortedFormations) {
    if (new Date(formation.date).getTime() >= nowTs) continue;
    const key = formation.title.trim().toLowerCase();
    if (!key) continue;
    const ts = new Date(formation.date).getTime();
    const prev = byKey.get(key);
    if (!prev || ts > prev.latestDate) {
      byKey.set(key, {
        title: formation.title,
        sourceEventId: formation.id ? String(formation.id) : null,
        latestDate: ts,
      });
    }
  }
  return Array.from(byKey.entries()).map(([key, v]) => ({
    key,
    title: v.title,
    sourceEventId: v.sourceEventId,
  }));
}
