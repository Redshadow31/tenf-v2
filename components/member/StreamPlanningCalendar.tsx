"use client";

import { useMemo, useState } from "react";

export interface StreamPlanningCalendarItem {
  id: string;
  date: string;
  time: string;
  liveType: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

type Props = {
  plannings: StreamPlanningCalendarItem[];
  emptyMessage?: string;
};

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type LiveTypeTheme = {
  eventBackground: string;
  eventBorder: string;
  badgeBackground: string;
  badgeBorder: string;
  textColor: string;
  glow: string;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function pickThemeByLiveType(liveType: string): LiveTypeTheme {
  const normalized = normalizeText(liveType);

  if (normalized.includes("valorant") || normalized.includes("fps")) {
    return {
      eventBackground: "linear-gradient(135deg, rgba(239, 68, 68, 0.30), rgba(244, 63, 94, 0.12))",
      eventBorder: "rgba(251, 113, 133, 0.55)",
      badgeBackground: "rgba(239, 68, 68, 0.28)",
      badgeBorder: "rgba(251, 113, 133, 0.65)",
      textColor: "#ffe4e6",
      glow: "0 8px 28px rgba(251, 113, 133, 0.20)",
    };
  }

  if (normalized.includes("league") || normalized.includes("lol")) {
    return {
      eventBackground: "linear-gradient(135deg, rgba(56, 189, 248, 0.28), rgba(59, 130, 246, 0.12))",
      eventBorder: "rgba(125, 211, 252, 0.55)",
      badgeBackground: "rgba(56, 189, 248, 0.24)",
      badgeBorder: "rgba(125, 211, 252, 0.65)",
      textColor: "#e0f2fe",
      glow: "0 8px 28px rgba(56, 189, 248, 0.22)",
    };
  }

  if (normalized.includes("irl") || normalized.includes("faq")) {
    return {
      eventBackground: "linear-gradient(135deg, rgba(16, 185, 129, 0.30), rgba(45, 212, 191, 0.10))",
      eventBorder: "rgba(110, 231, 183, 0.60)",
      badgeBackground: "rgba(16, 185, 129, 0.24)",
      badgeBorder: "rgba(110, 231, 183, 0.65)",
      textColor: "#d1fae5",
      glow: "0 8px 28px rgba(16, 185, 129, 0.20)",
    };
  }

  if (normalized.includes("just chatting") || normalized.includes("chat")) {
    return {
      eventBackground: "linear-gradient(135deg, rgba(168, 85, 247, 0.32), rgba(99, 102, 241, 0.12))",
      eventBorder: "rgba(196, 181, 253, 0.60)",
      badgeBackground: "rgba(168, 85, 247, 0.24)",
      badgeBorder: "rgba(196, 181, 253, 0.65)",
      textColor: "#ede9fe",
      glow: "0 8px 30px rgba(168, 85, 247, 0.24)",
    };
  }

  if (normalized.includes("vod") || normalized.includes("review") || normalized.includes("analyse")) {
    return {
      eventBackground: "linear-gradient(135deg, rgba(245, 158, 11, 0.28), rgba(234, 88, 12, 0.10))",
      eventBorder: "rgba(253, 186, 116, 0.60)",
      badgeBackground: "rgba(245, 158, 11, 0.24)",
      badgeBorder: "rgba(253, 186, 116, 0.65)",
      textColor: "#ffedd5",
      glow: "0 8px 28px rgba(245, 158, 11, 0.18)",
    };
  }

  if (normalized.includes("communaute") || normalized.includes("community")) {
    return {
      eventBackground: "linear-gradient(135deg, rgba(14, 165, 233, 0.28), rgba(168, 85, 247, 0.10))",
      eventBorder: "rgba(147, 197, 253, 0.58)",
      badgeBackground: "rgba(14, 165, 233, 0.24)",
      badgeBorder: "rgba(147, 197, 253, 0.65)",
      textColor: "#e0f2fe",
      glow: "0 8px 28px rgba(14, 165, 233, 0.18)",
    };
  }

  return {
    eventBackground: "linear-gradient(135deg, rgba(145, 70, 255, 0.28), rgba(59, 130, 246, 0.10))",
    eventBorder: "rgba(167, 139, 250, 0.58)",
    badgeBackground: "rgba(145, 70, 255, 0.24)",
    badgeBorder: "rgba(167, 139, 250, 0.65)",
    textColor: "#ede9fe",
    glow: "0 8px 30px rgba(145, 70, 255, 0.22)",
  };
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function StreamPlanningCalendar({
  plannings,
  emptyMessage = "Aucun planning de stream pour le moment.",
}: Props) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, StreamPlanningCalendarItem[]>();
    for (const planning of plannings) {
      const key = planning.date;
      const current = grouped.get(key) || [];
      current.push(planning);
      grouped.set(key, current);
    }
    for (const [, items] of grouped) {
      items.sort((a, b) => a.time.localeCompare(b.time));
    }
    return grouped;
  }, [plannings]);

  const typeStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const planning of plannings) {
      const current = map.get(planning.liveType) || 0;
      map.set(planning.liveType, current + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [plannings]);

  const monthData = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const offsetMonday = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((offsetMonday + daysInMonth) / 7) * 7;

    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < totalCells; i += 1) {
      const dayIndex = i - offsetMonday + 1;
      if (dayIndex < 1 || dayIndex > daysInMonth) {
        cells.push({ date: null, key: `empty-${i}` });
      } else {
        const date = new Date(year, month, dayIndex);
        cells.push({ date, key: toDateKey(date) });
      }
    }

    return { cells };
  }, [monthCursor]);

  if (plannings.length === 0) {
    return <p className="text-center py-8" style={{ color: "var(--color-text-secondary)" }}>{emptyMessage}</p>;
  }

  const todayKey = toDateKey(new Date());

  return (
    <div
      className="space-y-4 rounded-2xl border p-4 md:p-5"
      style={{
        borderColor: "rgba(145, 70, 255, 0.28)",
        background:
          "radial-gradient(circle at 8% 0%, rgba(145, 70, 255, 0.12), transparent 38%), radial-gradient(circle at 95% 0%, rgba(14, 165, 233, 0.11), transparent 36%), linear-gradient(180deg, rgba(2, 6, 23, 0.35), rgba(2, 6, 23, 0.12))",
      }}
    >
      <div
        className="rounded-xl border px-3 py-3 md:px-4 md:py-3"
        style={{
          borderColor: "rgba(145, 70, 255, 0.26)",
          background: "linear-gradient(125deg, rgba(145, 70, 255, 0.22), rgba(59, 130, 246, 0.08) 52%, rgba(14, 165, 233, 0.10))",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Apercu du mois
          </h4>
          <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {plannings.length} live{plannings.length > 1 ? "s" : ""} planifie{plannings.length > 1 ? "s" : ""}
          </div>
        </div>
        {typeStats.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {typeStats.map(([liveType, count]) => {
              const theme = pickThemeByLiveType(liveType);
              return (
                <div
                  key={liveType}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
                  style={{
                    borderColor: theme.badgeBorder,
                    background: theme.badgeBackground,
                    color: theme.textColor,
                  }}
                >
                  <span className="truncate max-w-[120px]">{liveType}</span>
                  <span className="opacity-90">x{count}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          className="px-3 py-1.5 rounded-lg border text-sm transition-colors"
          style={{
            borderColor: "rgba(148, 163, 184, 0.35)",
            color: "var(--color-text-secondary)",
            backgroundColor: "rgba(2, 6, 23, 0.32)",
          }}
        >
          ← Mois précédent
        </button>
        <h3 className="text-lg font-semibold capitalize" style={{ color: "var(--color-text)" }}>
          {monthCursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </h3>
        <button
          type="button"
          onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          className="px-3 py-1.5 rounded-lg border text-sm transition-colors"
          style={{
            borderColor: "rgba(148, 163, 184, 0.35)",
            color: "var(--color-text-secondary)",
            backgroundColor: "rgba(2, 6, 23, 0.32)",
          }}
        >
          Mois suivant →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="text-center text-xs font-semibold py-2" style={{ color: "var(--color-text-secondary)" }}>
            {day}
          </div>
        ))}

        {monthData.cells.map((cell) => {
          if (!cell.date) {
            return (
              <div
                key={cell.key}
                className="min-h-24 rounded-lg border"
                style={{ borderColor: "var(--color-border)", opacity: 0.18 }}
              />
            );
          }

          const key = toDateKey(cell.date);
          const dayEvents = eventsByDate.get(key) || [];
          const isToday = key === todayKey;

          return (
            <div
              key={cell.key}
              className="min-h-24 rounded-lg border p-1.5 transition-colors"
              style={{
                borderColor: isToday ? "rgba(147, 197, 253, 0.55)" : "var(--color-border)",
                backgroundColor: isToday ? "rgba(59, 130, 246, 0.08)" : "var(--color-surface)",
                boxShadow: isToday ? "inset 0 0 0 1px rgba(56, 189, 248, 0.35)" : "none",
              }}
            >
              <div
                className="text-xs font-semibold mb-1"
                style={{ color: isToday ? "#bae6fd" : "var(--color-text)" }}
              >
                {cell.date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const theme = pickThemeByLiveType(event.liveType);
                  return (
                    <div
                      key={event.id}
                      className="rounded-md border px-1.5 py-1 text-[10px] leading-tight"
                      style={{
                        background: theme.eventBackground,
                        borderColor: theme.eventBorder,
                        color: theme.textColor,
                        boxShadow: theme.glow,
                      }}
                      title={`${event.time} - ${event.liveType}${event.title ? ` - ${event.title}` : ""}`}
                    >
                      <div className="font-semibold">{event.time}</div>
                      <div className="truncate">{event.liveType}</div>
                      {event.title ? <div className="truncate opacity-90">{event.title}</div> : null}
                    </div>
                  );
                })}
                {dayEvents.length > 3 ? (
                  <div className="text-[10px] px-1" style={{ color: "var(--color-text-secondary)" }}>
                    +{dayEvents.length - 3} autre(s)
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

