/**
 * Compare la date de réunion d’intégration (profil membre) aux dates des sessions
 * planifiées (même jour calendaire, selon l’horloge locale du parseur JS).
 */

export function calendarDayKey(value: string | Date | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type SessionDayIndex = {
  dayKeys: Set<string>;
  titlesByDay: Map<string, string[]>;
};

export function indexIntegrationsByCalendarDay(
  integrations: Array<{ date: string; title?: string | null }>
): SessionDayIndex {
  const titlesByDay = new Map<string, string[]>();
  for (const item of integrations) {
    const k = calendarDayKey(item.date);
    if (!k) continue;
    const title = (item.title && String(item.title).trim()) || "Session d'intégration";
    const list = titlesByDay.get(k) ?? [];
    if (!list.includes(title)) list.push(title);
    titlesByDay.set(k, list);
  }
  return { dayKeys: new Set(titlesByDay.keys()), titlesByDay };
}
