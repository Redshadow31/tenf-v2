"use client";

import { useMemo, useState } from "react";

export interface StreamPlanningCalendarItem {
  id: string;
  date: string;
  time: string;
  liveType: string;
  title?: string;
}

type Props = {
  plannings: StreamPlanningCalendarItem[];
  emptyMessage?: string;
};

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          className="px-3 py-1.5 rounded-lg border text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          ← Mois précédent
        </button>
        <h3 className="text-lg font-semibold capitalize" style={{ color: "var(--color-text)" }}>
          {monthCursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </h3>
        <button
          type="button"
          onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          className="px-3 py-1.5 rounded-lg border text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
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
                style={{ borderColor: "var(--color-border)", opacity: 0.3 }}
              />
            );
          }

          const key = toDateKey(cell.date);
          const dayEvents = eventsByDate.get(key) || [];

          return (
            <div
              key={cell.key}
              className="min-h-24 rounded-lg border p-1.5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <div className="text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                {cell.date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-md px-1.5 py-1 text-[10px] leading-tight"
                    style={{ backgroundColor: "rgba(145, 70, 255, 0.15)", color: "var(--color-text)" }}
                    title={`${event.time} - ${event.liveType}${event.title ? ` - ${event.title}` : ""}`}
                  >
                    <div className="font-semibold">{event.time}</div>
                    <div className="truncate">{event.liveType}</div>
                    {event.title ? <div className="truncate opacity-90">{event.title}</div> : null}
                  </div>
                ))}
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

