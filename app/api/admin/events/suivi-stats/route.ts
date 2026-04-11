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

/** Somme des taux individuels et nombre d’événements (≥1 inscription) pour une moyenne arithmétique. */
type AvgCell = { sumRate: number; n: number };

function perEventRate(registered: number, present: number): number | null {
  if (registered <= 0) return null;
  return Math.round((100 * present) / registered);
}

function bumpAvg(map: Map<string, Map<string, AvgCell>>, category: string, monthKey: string, rate: number | null) {
  if (rate === null) return;
  if (!map.has(category)) map.set(category, new Map());
  const byM = map.get(category)!;
  const cur = byM.get(monthKey) || { sumRate: 0, n: 0 };
  cur.sumRate += rate;
  cur.n += 1;
  byM.set(monthKey, cur);
}

function avgFromCell(c?: AvgCell): number | null {
  if (!c || c.n === 0) return null;
  return Math.round(c.sumRate / c.n);
}

function mergeAvgCells(a: AvgCell, b: AvgCell): AvgCell {
  return { sumRate: a.sumRate + b.sumRate, n: a.n + b.n };
}

function cellEventTotal(byMonth: Map<string, AvgCell>, monthKeys: string[]): number {
  return monthKeys.reduce((s, mk) => s + (byMonth.get(mk)?.n || 0), 0);
}

const MAX_CHART_CATEGORIES = 10;

/**
 * Garde les types avec le plus d’événements (sur les mois demandés) et regroupe le reste en « Autres ».
 */
function collapseCategoriesByEventVolume(
  byCategoryMonth: Map<string, Map<string, AvgCell>>,
  monthKeys: string[],
  maxCategories: number
): { category: string; byMonth: Map<string, AvgCell> }[] {
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
  const mergedByMonth = new Map<string, AvgCell>();
  for (const mk of monthKeys) {
    mergedByMonth.set(mk, { sumRate: 0, n: 0 });
  }
  for (const row of tail) {
    for (const mk of monthKeys) {
      const acc = mergedByMonth.get(mk)!;
      const add = row.byMonth.get(mk) || { sumRate: 0, n: 0 };
      mergedByMonth.set(mk, mergeAvgCells(acc, add));
    }
  }
  return [...head.map(({ category, byMonth }) => ({ category, byMonth })), { category: "Autres", byMonth: mergedByMonth }];
}

function toAvgRateRow(category: string, byMonth: Map<string, AvgCell>, monthKeys: string[]) {
  const values: Record<string, number | null> = {};
  for (const mk of monthKeys) {
    values[mk] = avgFromCell(byMonth.get(mk));
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
        const [registrations, presences] = await Promise.all([
          eventRepository.getRegistrations(ev.id),
          eventRepository.getPresences(ev.id),
        ]);
        const registered = registrations?.length ?? 0;
        const present = (presences || []).filter((p: any) => p?.present === true).length;
        const rate = perEventRate(registered, present);
        return {
          category: ev.category || "Non classé",
          monthKey: monthKeyParis(ev.date),
          registered,
          rate,
        };
      } catch {
        return {
          category: ev.category || "Non classé",
          monthKey: monthKeyParis(ev.date),
          registered: 0,
          rate: null as number | null,
        };
      }
    });

    const byCategoryMonth = new Map<string, Map<string, AvgCell>>();
    for (const row of perEventStats) {
      bumpAvg(byCategoryMonth, row.category, row.monthKey, row.rate);
    }

    const refRates = perEventStats
      .filter((r) => r.monthKey === referenceMonth && r.rate !== null)
      .map((r) => r.rate as number);
    const globalRefRate = refRates.length ? Math.round(refRates.reduce((a, b) => a + b, 0) / refRates.length) : null;

    const currentMonthByCategory = Array.from(byCategoryMonth.entries())
      .map(([category, byM]) => {
        const c = byM.get(referenceMonth);
        return {
          category,
          eventCount: c?.n ?? 0,
          rate: avgFromCell(c),
        };
      })
      .filter((r) => r.eventCount > 0)
      .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

    const allCats = new Set<string>([...byCategoryMonth.keys()]);
    const prevMonthComparison = Array.from(allCats)
      .map((category) => {
        const byM = byCategoryMonth.get(category)!;
        const cur = byM.get(referenceMonth);
        const prev = byM.get(previousMonth);
        return {
          category,
          currentRate: avgFromCell(cur),
          previousRate: avgFromCell(prev),
          currentEventCount: cur?.n ?? 0,
          previousEventCount: prev?.n ?? 0,
        };
      })
      .filter((r) => r.currentEventCount > 0 || r.previousEventCount > 0)
      .sort((a, b) => b.currentEventCount + b.previousEventCount - (a.currentEventCount + a.previousEventCount));

    const cmpMonths = [referenceMonth, previousMonth];
    const collapsedCmp = collapseCategoriesByEventVolume(byCategoryMonth, cmpMonths, MAX_CHART_CATEGORIES);
    const comparisonForChart = collapsedCmp.map(({ category, byMonth }) => ({
      category,
      values: {
        current: avgFromCell(byMonth.get(referenceMonth)),
        previous: avgFromCell(byMonth.get(previousMonth)),
      },
    }));

    const collapsedLast3 = collapseCategoriesByEventVolume(byCategoryMonth, last3MonthKeys, MAX_CHART_CATEGORIES);
    const last3ForChart = collapsedLast3.map(({ category, byMonth }) => toAvgRateRow(category, byMonth, last3MonthKeys));

    const last3ByCategory = Array.from(byCategoryMonth.entries())
      .map(([category, byMonth]) => toAvgRateRow(category, byMonth, last3MonthKeys))
      .sort(
        (a, b) =>
          last3MonthKeys.reduce((s, mk) => s + (byCategoryMonth.get(b.category)?.get(mk)?.n || 0), 0) -
          last3MonthKeys.reduce((s, mk) => s + (byCategoryMonth.get(a.category)?.get(mk)?.n || 0), 0)
      );

    const eventsRefMonth = events.filter((e) => monthKeyParis(e.date) === referenceMonth).length;
    const eventsRefWithRate = perEventStats.filter((r) => r.monthKey === referenceMonth && r.rate !== null).length;

    return NextResponse.json({
      timezone: PARIS_TIMEZONE,
      referenceMonth,
      previousMonth,
      last3MonthKeys,
      monthLabels,
      metric: "mean_presence_rate_per_event",
      metricDescription:
        "Pour chaque événement avec au moins une inscription : taux = présents / inscriptions. La valeur par type est la moyenne arithmétique de ces taux sur les événements du mois (Europe/Paris).",
      globalCurrentMonth: {
        rate: globalRefRate,
        eventCount: eventsRefWithRate,
      },
      currentMonthByCategory,
      prevMonthComparison,
      comparisonForChart,
      last3ByCategory,
      last3ForChart,
      eventCount: events.length,
      eventsInWindow: eventsInWindow.length,
      eventsReferenceMonth: eventsRefMonth,
      eventsReferenceMonthWithRate: eventsRefWithRate,
    });
  } catch (e) {
    console.error("[admin/events/suivi-stats]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
