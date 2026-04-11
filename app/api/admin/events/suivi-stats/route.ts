import { NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale";
import { requireAdmin } from "@/lib/requireAdmin";
import { loadMergedAdminEventsLite } from "@/lib/admin/mergedAdminEvents";
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

function bump(map: Map<string, number>, key: string, n = 1) {
  map.set(key, (map.get(key) || 0) + n);
}

const MAX_CHART_CATEGORIES = 10;

function collapseToTop(
  rows: { category: string; values: Record<string, number> }[],
  valueKeys: string[]
): { category: string; values: Record<string, number> }[] {
  if (rows.length <= MAX_CHART_CATEGORIES) return rows;

  const score = (r: { category: string; values: Record<string, number> }) =>
    valueKeys.reduce((acc, k) => acc + (r.values[k] || 0), 0);

  const sorted = [...rows].sort((a, b) => score(b) - score(a));
  const head = sorted.slice(0, MAX_CHART_CATEGORIES - 1);
  const tail = sorted.slice(MAX_CHART_CATEGORIES - 1);
  if (!tail.length) return head;
  const autres: Record<string, number> = {};
  for (const k of valueKeys) {
    autres[k] = tail.reduce((acc, r) => acc + (r.values[k] || 0), 0);
  }
  return [...head, { category: "Autres", values: autres }];
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

    const currentByCat = new Map<string, number>();
    const previousByCat = new Map<string, number>();
    const last3ByCatMonth = new Map<string, Map<string, number>>();

    for (const ev of events) {
      const mk = monthKeyParis(ev.date);
      const cat = ev.category || "Non classé";

      if (mk === referenceMonth) {
        bump(currentByCat, cat);
      }
      if (mk === previousMonth) {
        bump(previousByCat, cat);
      }

      if (last3MonthKeys.includes(mk)) {
        if (!last3ByCatMonth.has(cat)) last3ByCatMonth.set(cat, new Map());
        bump(last3ByCatMonth.get(cat)!, mk);
      }
    }

    const allCats = new Set<string>([...currentByCat.keys(), ...previousByCat.keys()]);
    const prevMonthComparison = Array.from(allCats)
      .map((category) => ({
        category,
        current: currentByCat.get(category) || 0,
        previous: previousByCat.get(category) || 0,
      }))
      .sort((a, b) => b.current + b.previous - (a.current + a.previous));

    const currentMonthByCategory = Array.from(currentByCat.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const last3RowsRaw = Array.from(last3ByCatMonth.entries()).map(([category, m]) => {
      const values: Record<string, number> = {};
      for (const k of last3MonthKeys) {
        values[k] = m.get(k) || 0;
      }
      return { category, values };
    });
    const last3ForChart = collapseToTop(last3RowsRaw, last3MonthKeys);

    const comparisonForChart = collapseToTop(
      prevMonthComparison.map((r) => ({
        category: r.category,
        values: { current: r.current, previous: r.previous },
      })),
      ["current", "previous"]
    );

    let totalCurrentMonth = 0;
    for (const v of currentByCat.values()) totalCurrentMonth += v;

    return NextResponse.json({
      timezone: PARIS_TIMEZONE,
      referenceMonth,
      previousMonth,
      last3MonthKeys,
      monthLabels,
      totalCurrentMonth,
      currentMonthByCategory,
      prevMonthComparison,
      comparisonForChart,
      last3ByCategory: last3RowsRaw.sort(
        (a, b) =>
          last3MonthKeys.reduce((s, k) => s + (b.values[k] || 0), 0) -
          last3MonthKeys.reduce((s, k) => s + (a.values[k] || 0), 0)
      ),
      last3ForChart,
      eventCount: events.length,
    });
  } catch (e) {
    console.error("[admin/events/suivi-stats]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
