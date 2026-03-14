"use client";

import { useEffect, useMemo, useState } from "react";

type PublicPlanning = {
  id: string;
  date: string;
  time: string;
  endTime?: string;
  liveType: string;
  title?: string;
  twitchLogin: string;
  displayName: string;
  avatarUrl?: string;
  twitchUrl?: string;
};

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const QUICK_RANGES = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Cette semaine" },
  { key: "weekend", label: "Ce week-end" },
  { key: "month", label: "Vue calendrier" },
] as const;

type QuickRange = (typeof QUICK_RANGES)[number]["key"];
type ViewMode = "calendar" | "agenda";

function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeekMonday(date: Date): Date {
  const day = (date.getDay() + 6) % 7;
  return addDays(startOfDay(date), -day);
}

function parseDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildGoogleCalendarUrl(item: PublicPlanning): string {
  const start = parseDateTime(item.date, item.time);
  const end = item.endTime ? parseDateTime(item.date, item.endTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const title = `${item.displayName} - ${item.title || item.liveType || "Live TENF"}`;
  const description = [
    item.title ? `Titre: ${item.title}` : null,
    item.liveType ? `Categorie: ${item.liveType}` : null,
    `Chaine: ${item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`}`,
    "Decouvert sur le calendrier TENF.",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details: description,
    location: item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getAvatarFallback(name: string): string {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  return `https://placehold.co/80x80?text=${encodeURIComponent(initial)}`;
}

export default function CalendrierLivesPage() {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [itemsByMonth, setItemsByMonth] = useState<Record<string, PublicPlanning[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState<QuickRange>("month");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  const todayDate = useMemo(() => startOfDay(new Date()), []);
  const todayKey = useMemo(() => dateKey(todayDate), [todayDate]);

  const rangeBounds = useMemo(() => {
    if (activeRange === "today") {
      return { start: startOfDay(todayDate), end: endOfDay(todayDate) };
    }

    if (activeRange === "week") {
      const start = startOfWeekMonday(todayDate);
      const end = endOfDay(addDays(start, 6));
      return { start, end };
    }

    if (activeRange === "weekend") {
      const weekStart = startOfWeekMonday(todayDate);
      const saturday = addDays(weekStart, 5);
      const sunday = addDays(weekStart, 6);
      return { start: startOfDay(saturday), end: endOfDay(sunday) };
    }

    const start = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const end = endOfDay(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0));
    return { start, end };
  }, [activeRange, monthCursor, todayDate]);

  const requiredMonths = useMemo(() => {
    const keys = new Set<string>();
    keys.add(monthKey(monthCursor));
    keys.add(monthKey(rangeBounds.start));
    keys.add(monthKey(rangeBounds.end));
    keys.add(monthKey(todayDate));
    return [...keys];
  }, [monthCursor, rangeBounds.end, rangeBounds.start, todayDate]);

  useEffect(() => {
    async function loadMonths() {
      setLoading(true);
      setError(null);

      try {
        const missingMonths = requiredMonths.filter((key) => !itemsByMonth[key]);
        if (missingMonths.length === 0) {
          setLoading(false);
          return;
        }

        const responses = await Promise.all(
          missingMonths.map(async (key) => {
            const response = await fetch(`/api/members/public/stream-plannings?month=${key}`, { cache: "no-store" });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || "Impossible de charger le calendrier.");
            }
            return { key, items: (data.items || []) as PublicPlanning[] };
          })
        );

        setItemsByMonth((prev) => {
          const next = { ...prev };
          for (const entry of responses) {
            next[entry.key] = entry.items;
          }
          return next;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de connexion.");
      } finally {
        setLoading(false);
      }
    }

    loadMonths();
  }, [itemsByMonth, requiredMonths]);

  const allLoadedItems = useMemo(() => Object.values(itemsByMonth).flat(), [itemsByMonth]);

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, PublicPlanning[]>();
    for (const item of allLoadedItems) {
      const when = parseDateTime(item.date, item.time);
      if (when < rangeBounds.start || when > rangeBounds.end) {
        continue;
      }
      const current = grouped.get(item.date) || [];
      current.push(item);
      grouped.set(item.date, current);
    }
    for (const [, dateItems] of grouped) {
      dateItems.sort((a, b) => a.time.localeCompare(b.time));
    }
    return grouped;
  }, [allLoadedItems, rangeBounds.end, rangeBounds.start]);

  const monthCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offsetMonday = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((offsetMonday + daysInMonth) / 7) * 7;

    const cells: Array<{ key: string; date: Date | null }> = [];
    for (let i = 0; i < totalCells; i += 1) {
      const day = i - offsetMonday + 1;
      if (day < 1 || day > daysInMonth) {
        cells.push({ key: `empty-${i}`, date: null });
      } else {
        const date = new Date(year, month, day);
        cells.push({ key: dateKey(date), date });
      }
    }
    return cells;
  }, [monthCursor]);

  const allRangeItems = useMemo(() => [...itemsByDate.values()].flat(), [itemsByDate]);

  const dateDensity = useMemo(() => {
    const entries = [...itemsByDate.entries()].map(([key, dayItems]) => ({ key, count: dayItems.length }));
    entries.sort((a, b) => b.count - a.count);
    return entries;
  }, [itemsByDate]);

  const topDate = dateDensity[0];
  const topDateItems = topDate ? itemsByDate.get(topDate.key) || [] : [];

  const uniqueCreators = useMemo(
    () => new Set(allRangeItems.map((item) => item.twitchLogin.toLowerCase())).size,
    [allRangeItems]
  );

  const uniqueCategories = useMemo(
    () => new Set(allRangeItems.map((item) => item.liveType.trim()).filter(Boolean)).size,
    [allRangeItems]
  );

  const upcomingLives = useMemo(() => {
    const nowMs = Date.now();
    return allRangeItems
      .map((item) => ({ ...item, atMs: parseDateTime(item.date, item.time).getTime() }))
      .filter((item) => item.atMs >= nowMs)
      .sort((a, b) => a.atMs - b.atMs)
      .slice(0, 5);
  }, [allRangeItems]);

  useEffect(() => {
    if (selectedDateKey && itemsByDate.has(selectedDateKey)) return;

    if (itemsByDate.has(todayKey)) {
      setSelectedDateKey(todayKey);
      return;
    }

    const nextDate = [...itemsByDate.keys()].sort()[0] || null;
    setSelectedDateKey(nextDate);
  }, [itemsByDate, selectedDateKey, todayKey]);

  const selectedDayItems = selectedDateKey ? itemsByDate.get(selectedDateKey) || [] : [];
  const selectedDayLabel = selectedDateKey
    ? new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : null;
  const highlightedCreators = topDateItems.slice(0, 4).map((item) => item.displayName);

  const selectedDayByTime = useMemo(() => {
    const grouped = new Map<string, PublicPlanning[]>();
    for (const item of selectedDayItems) {
      const current = grouped.get(item.time) || [];
      current.push(item);
      grouped.set(item.time, current);
    }
    return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [selectedDayItems]);

  return (
    <div className="relative space-y-6 pb-20 md:pb-6">
      <section
        className="relative overflow-hidden rounded-2xl border p-6 md:p-8 lg:p-10"
        style={{
          borderColor: "rgba(145, 70, 255, 0.3)",
          background: "linear-gradient(120deg, rgba(21, 21, 26, 0.97) 0%, rgba(36, 21, 54, 0.9) 60%, rgba(30, 18, 35, 0.92) 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="pointer-events-none absolute -left-14 -top-16 h-44 w-44 rounded-full opacity-60 blur-3xl animate-pulse"
          style={{ background: "rgba(145,70,255,0.35)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 right-8 h-40 w-40 rounded-full opacity-40 blur-3xl"
          style={{ background: "rgba(236,72,153,0.25)" }}
        />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl" style={{ color: "var(--color-text)" }}>
              Calendrier des lives membres
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed md:text-[1.05rem]" style={{ color: "var(--color-text-secondary)" }}>
              Explore les prochains rendez-vous TENF, decouvre de nouveaux createurs et organise ta semaine avec la communaute.
              <br />
              Plus les plannings sont visibles, plus l'entraide et la decouverte grandissent.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveRange("today");
                  setViewMode("agenda");
                  setSelectedDateKey(todayKey);
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-[1px]"
                style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 8px 22px rgba(145,70,255,0.28)" }}
              >
                Voir aujourd'hui
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRange("week");
                  setViewMode("agenda");
                }}
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Mode agenda semaine
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-xl border p-4 transition-all duration-300 hover:-translate-y-[1px]" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.025)" }}>
              <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
                Lives prevus
              </p>
              <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {allRangeItems.length}
              </p>
            </div>
            <div className="rounded-xl border p-4 transition-all duration-300 hover:-translate-y-[1px]" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.025)" }}>
              <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
                Createurs participants
              </p>
              <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {uniqueCreators}
              </p>
            </div>
            <div className="rounded-xl border p-4 transition-all duration-300 hover:-translate-y-[1px]" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.025)" }}>
              <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
                Jeux / categories
              </p>
              <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {uniqueCategories}
              </p>
            </div>
            <div className="rounded-xl border p-4 transition-all duration-300 hover:-translate-y-[1px]" style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.025)" }}>
              <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
                Journee la plus active
              </p>
              <p className="mt-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {topDate
                  ? new Date(`${topDate.key}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                  : "A definir"}
                {topDate ? ` - ${topDate.count} live${topDate.count > 1 ? "s" : ""}` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_RANGES.map((range) => {
            const isActive = activeRange === range.key;
            return (
              <button
                key={range.key}
                type="button"
                onClick={() => {
                  setActiveRange(range.key);
                  if (range.key === "month") {
                    setViewMode("calendar");
                  } else {
                    setViewMode("agenda");
                  }
                }}
                className="rounded-xl border px-3 py-2 text-sm font-medium transition-all hover:-translate-y-[1px]"
                style={{
                  borderColor: isActive ? "rgba(145, 70, 255, 0.65)" : "var(--color-border)",
                  color: isActive ? "var(--color-text)" : "var(--color-text-secondary)",
                  backgroundColor: isActive ? "rgba(145,70,255,0.14)" : "var(--color-card)",
                  boxShadow: isActive ? "0 8px 18px rgba(145,70,255,0.18)" : "none",
                }}
              >
                {range.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className="rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: viewMode === "calendar" ? "rgba(145,70,255,0.65)" : "var(--color-border)",
              color: viewMode === "calendar" ? "var(--color-text)" : "var(--color-text-secondary)",
            }}
          >
            Vue calendrier
          </button>
          <button
            type="button"
            onClick={() => setViewMode("agenda")}
            className="rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: viewMode === "agenda" ? "rgba(145,70,255,0.65)" : "var(--color-border)",
              color: viewMode === "agenda" ? "var(--color-text)" : "var(--color-text-secondary)",
            }}
          >
            Vue timeline
          </button>
        </div>
      </div>

      <div
        className="rounded-xl border px-3 py-2 text-sm"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "rgba(255,255,255,0.015)",
          color: "var(--color-text-secondary)",
        }}
      >
        Filtre actif:{" "}
        <span style={{ color: "var(--color-text)" }}>
          {QUICK_RANGES.find((range) => range.key === activeRange)?.label}
        </span>{" "}
        • Mode: <span style={{ color: "var(--color-text)" }}>{viewMode === "calendar" ? "Calendrier mensuel" : "Agenda timeline"}</span>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border p-4 md:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              A ne pas manquer
            </h2>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Prochains lives
            </span>
          </div>
          {upcomingLives.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aucun live a venir sur la plage selectionnee.
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingLives.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedDateKey(item.date)}
                  className="group flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all duration-300 hover:-translate-y-[1px]"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.avatarUrl || getAvatarFallback(item.displayName)}
                      alt={item.displayName}
                      className="h-9 w-9 rounded-full border object-cover"
                      style={{ borderColor: "var(--color-border)" }}
                      onError={(event) => {
                        (event.currentTarget as HTMLImageElement).src = getAvatarFallback(item.displayName);
                      }}
                    />
                    <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {item.displayName}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {new Date(`${item.date}T00:00:00`).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      - {item.time} - {item.liveType}
                    </p>
                    </div>
                  </div>
                  <span className="rounded-full border px-2 py-1 text-[11px] transition-transform duration-300 group-hover:translate-x-0.5" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                    @{item.twitchLogin}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className="rounded-2xl border p-4 md:p-5"
          style={{
            borderColor: "rgba(145,70,255,0.35)",
            background: "linear-gradient(135deg, rgba(145,70,255,0.14), rgba(145,70,255,0.04))",
            boxShadow: "0 12px 28px rgba(145,70,255,0.12)",
          }}
        >
          <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "var(--color-text-secondary)" }}>
            Soiree la plus active
          </p>
          <h3 className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            {topDate
              ? new Date(`${topDate.key}T00:00:00`).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })
              : "Aucune activite marquee"}
          </h3>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {topDate
              ? `${topDate.count} lives prevus avec ${new Set(topDateItems.map((item) => item.twitchLogin)).size} createurs.`
              : "Ajoute des plannings pour faire emerger les prochaines soirees fortes."}
          </p>
          {highlightedCreators.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {highlightedCreators.map((creator) => (
                <span
                  key={creator}
                  className="rounded-full border px-2 py-1 text-[11px]"
                  style={{ borderColor: "rgba(145,70,255,0.45)", color: "var(--color-text)" }}
                >
                  {creator}
                </span>
              ))}
            </div>
          ) : null}
          {topDate ? (
            <button
              type="button"
              onClick={() => setSelectedDateKey(topDate.key)}
              className="mt-4 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-[1px]"
              style={{ backgroundColor: "var(--color-primary)", boxShadow: "0 8px 22px rgba(145,70,255,0.25)" }}
            >
              Voir le detail de cette journee
            </button>
          ) : null}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          className="px-3 py-2 rounded-lg border text-sm transition-colors hover:bg-white/5"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          ← Mois precedent
        </button>
        <h2 className="text-xl font-semibold capitalize" style={{ color: "var(--color-text)" }}>
          {monthCursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </h2>
        <button
          type="button"
          onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          className="px-3 py-2 rounded-lg border text-sm transition-colors hover:bg-white/5"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          Mois suivant →
        </button>
      </div>

      <div className="rounded-xl border p-4 md:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {loading ? (
          <div className="text-center py-8" style={{ color: "var(--color-text-secondary)" }}>
            Chargement du calendrier...
          </div>
        ) : error ? (
          <div className="text-center py-8" style={{ color: "#ef4444" }}>
            {error}
          </div>
        ) : viewMode === "agenda" ? (
          <div className="space-y-3">
            {[...itemsByDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dayKey, dayItems]) => (
              <div
                key={dayKey}
                className="rounded-xl border p-3 md:p-4 transition-all duration-300"
                style={{
                  borderColor: selectedDateKey === dayKey ? "rgba(145,70,255,0.55)" : "var(--color-border)",
                  backgroundColor: selectedDateKey === dayKey ? "rgba(145,70,255,0.08)" : "var(--color-surface)",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedDateKey(dayKey)}
                    className="text-left"
                  >
                    <p className="text-sm font-semibold capitalize" style={{ color: "var(--color-text)" }}>
                      {new Date(`${dayKey}T00:00:00`).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {dayItems.length} live{dayItems.length > 1 ? "s" : ""}
                    </p>
                  </button>
                </div>
                <div className="space-y-2 border-l pl-2" style={{ borderColor: "rgba(145,70,255,0.28)" }}>
                  {dayItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2 transition-all duration-300 hover:border-[rgba(145,70,255,0.45)]" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          <span className="mr-2 rounded-md border px-1.5 py-0.5 text-[11px]" style={{ borderColor: "rgba(145,70,255,0.45)", color: "var(--color-text-secondary)" }}>
                            {item.time}
                          </span>
                          {item.displayName}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {item.liveType}
                        </p>
                      </div>
                      <a
                        href={item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/5"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      >
                        Voir la chaine
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {itemsByDate.size === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Aucun live planifie sur cette plage.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-semibold py-2" style={{ color: "var(--color-text-secondary)" }}>
                {day}
              </div>
            ))}

            {monthCells.map((cell) => {
              if (!cell.date) {
                return (
                  <div
                    key={cell.key}
                    className="min-h-[110px] rounded-lg border"
                    style={{ borderColor: "var(--color-border)", opacity: 0.25 }}
                  />
                );
              }

              const key = dateKey(cell.date);
              const dayItems = itemsByDate.get(key) || [];
              const isSelected = selectedDateKey === key;
              const isToday = key === todayKey;
              const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
              const isTopDay = key === topDate?.key;
              const densityClass =
                dayItems.length >= 4
                  ? "Forte activite"
                  : dayItems.length >= 2
                    ? "Jour actif"
                    : dayItems.length === 1
                      ? "1 live"
                      : "Calme";

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDateKey(key)}
                  className="group min-h-[124px] rounded-xl border p-2 text-left transition-all duration-300 hover:-translate-y-[1px]"
                  style={{
                    borderColor: isSelected ? "rgba(145,70,255,0.65)" : isTopDay ? "rgba(145,70,255,0.45)" : "var(--color-border)",
                    backgroundColor: isSelected ? "rgba(145,70,255,0.14)" : isTopDay ? "rgba(145,70,255,0.08)" : "var(--color-surface)",
                    boxShadow: isTopDay ? "0 10px 20px rgba(145,70,255,0.15)" : "0 4px 12px rgba(0,0,0,0.12)",
                  }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                      {cell.date.getDate()}
                    </div>
                    <div className="flex items-center gap-1">
                      {isToday ? (
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                          Aujourd'hui
                        </span>
                      ) : null}
                      {isWeekend ? (
                        <span className="rounded-full border px-1.5 py-0.5 text-[10px]" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                          WE
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mb-1 text-[11px] font-medium" style={{ color: dayItems.length > 0 ? "var(--color-text)" : "var(--color-text-secondary)" }}>
                    {dayItems.length} live{dayItems.length > 1 ? "s" : ""}
                  </div>
                  <div className="line-clamp-2 text-[11px] leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                    {dayItems.length > 0
                      ? dayItems
                          .slice(0, 2)
                          .map((item) => `${item.time} ${item.displayName}`)
                          .join(" • ")
                      : "Aucun live prevu"}
                  </div>
                  <div className="mt-2">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px]"
                      style={{
                        borderColor: "var(--color-border)",
                        color: dayItems.length > 1 ? "var(--color-text)" : "var(--color-text-secondary)",
                        backgroundColor: dayItems.length > 2 ? "rgba(145,70,255,0.14)" : "transparent",
                      }}
                    >
                      {densityClass}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="rounded-xl border p-4"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          {selectedDateKey ? `Detail du ${selectedDayLabel}` : "Selectionne un jour pour voir le detail"}
        </h3>
        {selectedDateKey ? (
          <div className="mb-3 inline-flex rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: "rgba(145,70,255,0.45)", color: "var(--color-text-secondary)" }}>
            {selectedDayItems.length} live{selectedDayItems.length > 1 ? "s" : ""} programme{selectedDayItems.length > 1 ? "s" : ""}
          </div>
        ) : null}

        {!selectedDateKey || selectedDayByTime.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucun live planifié sur ce jour.</p>
        ) : (
          <div className="space-y-3">
            {selectedDayByTime.map(([time, timeItems]) => (
              <div key={time}>
                <div className="mb-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {time} - {timeItems.length} stream{timeItems.length > 1 ? "s" : ""}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {timeItems.map((item) => (
                    <article
                      key={item.id}
                      className="group rounded-xl border p-3 transition-all duration-300 hover:-translate-y-[1px] hover:border-[rgba(145,70,255,0.45)]"
                      style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={item.avatarUrl || getAvatarFallback(item.displayName)}
                          alt={item.displayName}
                          className="h-11 w-11 rounded-full border object-cover"
                          style={{ borderColor: "var(--color-border)" }}
                          onError={(event) => {
                            (event.currentTarget as HTMLImageElement).src = getAvatarFallback(item.displayName);
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                            {item.displayName}
                          </div>
                          <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            @{item.twitchLogin}
                          </div>
                          <div className="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px]" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                            {item.liveType}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {item.title || "Live communautaire TENF"}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={item.twitchUrl || `https://www.twitch.tv/${item.twitchLogin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-95"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        >
                          Voir la chaine
                        </a>
                        <a
                          href={buildGoogleCalendarUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        >
                          Ajouter au calendrier Google
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

