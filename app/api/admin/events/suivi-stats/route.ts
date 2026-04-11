import { NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale";
import { requireAdmin } from "@/lib/requireAdmin";
import { loadMergedAdminEventsLite } from "@/lib/admin/mergedAdminEvents";
import { eventRepository } from "@/lib/repositories";
import { PARIS_TIMEZONE } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function monthKeyParis(d: Date): string {
  return formatInTimeZone(d, PARIS_TIMEZONE, "yyyy-MM");
}

function monthLabelParis(ym: string): string {
  const d = parseISO(`${ym}-01T12:00:00`);
  return formatInTimeZone(d, PARIS_TIMEZONE, "MMM yyyy", { locale: fr });
}

function addCalendarMonths(ym: string, delta: number): string {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** Somme des présents et nombre d’événements (tous les événements du type sur le mois). */
type PresenceCell = { sumPresent: number; events: number };

function bumpPresence(map: Map<string, Map<string, PresenceCell>>, category: string, monthKey: string, present: number) {
  if (!map.has(category)) map.set(category, new Map());
  const byM = map.get(category)!;
  const cur = byM.get(monthKey) || { sumPresent: 0, events: 0 };
  cur.sumPresent += present;
  cur.events += 1;
  byM.set(monthKey, cur);
}

function avgPresentPerEvent(c?: PresenceCell): number | null {
  if (!c || c.events === 0) return null;
  return Math.round((c.sumPresent * 10) / c.events) / 10;
}

function mergePresenceCells(a: PresenceCell, b: PresenceCell): PresenceCell {
  return { sumPresent: a.sumPresent + b.sumPresent, events: a.events + b.events };
}

function cellEventTotal(byMonth: Map<string, PresenceCell>, monthKeys: string[]): number {
  return monthKeys.reduce((s, mk) => s + (byMonth.get(mk)?.events || 0), 0);
}

const MAX_CHART_CATEGORIES = 10;

function collapseCategoriesByEventVolume(
  byCategoryMonth: Map<string, Map<string, PresenceCell>>,
  monthKeys: string[],
  maxCategories: number
): { category: string; byMonth: Map<string, PresenceCell> }[] {
  const scored = Array.from(byCategoryMonth.entries()).map(([category, byMonth]) => ({
    category,
    byMonth,
    score: cellEventTotal(byMonth, monthKeys),
  }));
  scored.sort((a, b) => b.score - a.score);
  if (scored.length <= maxCategories) {
    return scored.map(({ category, byMonth }) => ({ category, byMonth }));
  }
  const head = scored.slice(0, maxCategories - 1);
  const tail = scored.slice(maxCategories - 1);
  const mergedByMonth = new Map<string, PresenceCell>();
  for (const mk of monthKeys) {
    mergedByMonth.set(mk, { sumPresent: 0, events: 0 });
  }
  for (const row of tail) {
    for (const mk of monthKeys) {
      const acc = mergedByMonth.get(mk)!;
      const add = row.byMonth.get(mk) || { sumPresent: 0, events: 0 };
      mergedByMonth.set(mk, mergePresenceCells(acc, add));
    }
  }
  return [...head.map(({ category, byMonth }) => ({ category, byMonth })), { category: "Autres", byMonth: mergedByMonth }];
}

function toAvgRow(category: string, byMonth: Map<string, PresenceCell>, monthKeys: string[]) {
  const values: Record<string, number | null> = {};
  for (const mk of monthKeys) {
    values[mk] = avgPresentPerEvent(byMonth.get(mk));
  }
  return { category, values };
}

async function mapInChunks<T, R>(items: T[], chunkSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const part = await Promise.all(chunk.map(fn));
    out.push(...part);
  }
  return out;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié ou accès refusé" }, { status: 401 });
    }

    const events = await loadMergedAdminEventsLite();
    const now = new Date();
    const referenceMonth = formatInTimeZone(now, PARIS_TIMEZONE, "yyyy-MM");
    const previousMonth = addCalendarMonths(referenceMonth, -1);
    const last3MonthKeys = [addCalendarMonths(referenceMonth, -2), addCalendarMonths(referenceMonth, -1), referenceMonth];

    const monthLabels: Record<string, string> = {};
    for (const mk of new Set([referenceMonth, previousMonth, ...last3MonthKeys])) {
      monthLabels[mk] = monthLabelParis(mk);
    }

    const windowMonthSet = new Set([referenceMonth, previousMonth, ...last3MonthKeys]);
    const eventsInWindow = events.filter((ev) => windowMonthSet.has(monthKeyParis(ev.date)));

    const perEventStats = await mapInChunks(eventsInWindow, 20, async (ev) => {
      try {
        const presences = await eventRepository.getPresences(ev.id);
        const present = (presences || []).filter((p: any) => p?.present === true).length;
        return {
          category: ev.category || "Non classé",
          monthKey: monthKeyParis(ev.date),
          present,
        };
      } catch {
        return {
          category: ev.category || "Non classé",
          monthKey: monthKeyParis(ev.date),
          present: 0,
        };
      }
    });

    const byCategoryMonth = new Map<string, Map<string, PresenceCell>>();
    for (const row of perEventStats) {
      bumpPresence(byCategoryMonth, row.category, row.monthKey, row.present);
    }

    const refRows = perEventStats.filter((r) => r.monthKey === referenceMonth);
    const globalSumPresent = refRows.reduce((s, r) => s + r.present, 0);
    const globalEventCount = refRows.length;
    const globalAvgPresent =
      globalEventCount > 0 ? Math.round((globalSumPresent * 10) / globalEventCount) / 10 : null;

    const currentMonthByCategory = Array.from(byCategoryMonth.entries())
      .map(([category, byM]) => {
        const c = byM.get(referenceMonth) || { sumPresent: 0, events: 0 };
        return {
          category,
          eventCount: c.events,
          totalPresent: c.sumPresent,
          avgPresent: avgPresentPerEvent(c),
        };
      })
      .filter((r) => r.eventCount > 0)
      .sort((a, b) => (b.avgPresent ?? -1) - (a.avgPresent ?? -1));

    const allCats = new Set<string>([...byCategoryMonth.keys()]);
    const prevMonthComparison = Array.from(allCats)
      .map((category) => {
        const byM = byCategoryMonth.get(category)!;
        const cur = byM.get(referenceMonth) || { sumPresent: 0, events: 0 };
        const prev = byM.get(previousMonth) || { sumPresent: 0, events: 0 };
        return {
          category,
          currentAvg: avgPresentPerEvent(cur),
          previousAvg: avgPresentPerEvent(prev),
          currentEventCount: cur.events,
          previousEventCount: prev.events,
        };
      })
      .filter((r) => r.currentEventCount > 0 || r.previousEventCount > 0)
      .sort((a, b) => b.currentEventCount + b.previousEventCount - (a.currentEventCount + a.previousEventCount));

    const cmpMonths = [referenceMonth, previousMonth];
    const collapsedCmp = collapseCategoriesByEventVolume(byCategoryMonth, cmpMonths, MAX_CHART_CATEGORIES);
    const comparisonForChart = collapsedCmp.map(({ category, byMonth }) => ({
      category,
      values: {
        current: avgPresentPerEvent(byMonth.get(referenceMonth)),
        previous: avgPresentPerEvent(byMonth.get(previousMonth)),
      },
    }));

    const collapsedLast3 = collapseCategoriesByEventVolume(byCategoryMonth, last3MonthKeys, MAX_CHART_CATEGORIES);
    const last3ForChart = collapsedLast3.map(({ category, byMonth }) => toAvgRow(category, byMonth, last3MonthKeys));

    const last3ByCategory = Array.from(byCategoryMonth.entries())
      .map(([category, byMonth]) => toAvgRow(category, byMonth, last3MonthKeys))
      .sort(
        (a, b) =>
          last3MonthKeys.reduce((s, mk) => s + (byCategoryMonth.get(b.category)?.get(mk)?.events || 0), 0) -
          last3MonthKeys.reduce((s, mk) => s + (byCategoryMonth.get(a.category)?.get(mk)?.events || 0), 0)
      );

    const eventsRefMonth = events.filter((e) => monthKeyParis(e.date) === referenceMonth).length;

    return NextResponse.json({
      timezone: PARIS_TIMEZONE,
      referenceMonth,
      previousMonth,
      last3MonthKeys,
      monthLabels,
      metric: "mean_present_count_per_event",
      metricDescription:
        "Pour chaque type et chaque mois : moyenne = total des présents (lignes « présent ») ÷ nombre d’événements de ce type sur le mois (Europe/Paris). Tous les événements du type sont comptés au dénominateur.",
      globalCurrentMonth: {
        avgPresent: globalAvgPresent,
        eventCount: globalEventCount,
        totalPresent: globalSumPresent,
      },
      currentMonthByCategory,
      prevMonthComparison,
      comparisonForChart,
      last3ByCategory,
      last3ForChart,
      eventCount: events.length,
      eventsInWindow: eventsInWindow.length,
      eventsReferenceMonth: eventsRefMonth,
    });
  } catch (e) {
    console.error("[admin/events/suivi-stats]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
