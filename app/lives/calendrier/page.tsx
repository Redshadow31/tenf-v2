"use client";

import { useEffect, useMemo, useState } from "react";

type PublicPlanning = {
  id: string;
  date: string;
  time: string;
  liveType: string;
  title?: string;
  twitchLogin: string;
  displayName: string;
};

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

export default function CalendrierLivesPage() {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [items, setItems] = useState<PublicPlanning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadMonth() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/members/public/stream-plannings?month=${monthKey(monthCursor)}`,
          { cache: "no-store" }
        );
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Impossible de charger le calendrier.");
          setItems([]);
          return;
        }

        const nextItems: PublicPlanning[] = data.items || [];
        setItems(nextItems);

        if (nextItems.length > 0) {
          const todayKey = dateKey(new Date());
          const hasToday = nextItems.some((item) => item.date === todayKey);
          setSelectedDateKey(hasToday ? todayKey : nextItems[0].date);
        } else {
          setSelectedDateKey(null);
        }
      } catch (e) {
        setItems([]);
        setError("Erreur de connexion.");
      } finally {
        setLoading(false);
      }
    }

    loadMonth();
  }, [monthCursor]);

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, PublicPlanning[]>();
    for (const item of items) {
      const current = grouped.get(item.date) || [];
      current.push(item);
      grouped.set(item.date, current);
    }
    for (const [, dateItems] of grouped) {
      dateItems.sort((a, b) => a.time.localeCompare(b.time));
    }
    return grouped;
  }, [items]);

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

  const selectedDayItems = selectedDateKey ? itemsByDate.get(selectedDateKey) || [] : [];

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
    <div className="space-y-6">
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "rgba(145,70,255,0.35)", background: "linear-gradient(135deg, rgba(145,70,255,0.12), rgba(145,70,255,0.04))" }}
      >
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
          Calendrier des lives membres
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Vue mensuelle des plannings renseignés par les créateurs TENF. Mois en cours affiché par défaut.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          ← Mois précédent
        </button>
        <h2 className="text-xl font-semibold capitalize" style={{ color: "var(--color-text)" }}>
          {monthCursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </h2>
        <button
          type="button"
          onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          Mois suivant →
        </button>
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {loading ? (
          <div className="text-center py-8" style={{ color: "var(--color-text-secondary)" }}>
            Chargement du calendrier...
          </div>
        ) : error ? (
          <div className="text-center py-8" style={{ color: "#ef4444" }}>
            {error}
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

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDateKey(key)}
                  className="min-h-[110px] rounded-lg border p-1.5 text-left transition-colors"
                  style={{
                    borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor: isSelected ? "rgba(145,70,255,0.14)" : "var(--color-surface)",
                  }}
                >
                  <div className="text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                    {cell.date.getDate()}
                  </div>
                  <div className="text-[11px] leading-snug px-1" style={{ color: "var(--color-text-secondary)" }}>
                    {dayItems.length > 0
                      ? `${dayItems.length} live${dayItems.length > 1 ? "s" : ""} prévu${
                          dayItems.length > 1 ? "s" : ""
                        } ce jour`
                      : "Aucun live prévu"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          {selectedDateKey
            ? `Détail du ${new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}`
            : "Sélectionne un jour pour voir le détail"}
        </h3>

        {!selectedDateKey || selectedDayByTime.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Aucun live planifié sur ce jour.</p>
        ) : (
          <div className="space-y-3">
            {selectedDayByTime.map(([time, timeItems]) => (
              <div
                key={time}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              >
                <div className="text-sm font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  {time} - {timeItems.length} stream{timeItems.length > 1 ? "s" : ""}
                </div>
                <div className="space-y-2">
                  {timeItems.map((item) => (
                    <div key={item.id} className="rounded-md px-3 py-2" style={{ backgroundColor: "var(--color-card)" }}>
                      <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                        {item.displayName}{" "}
                        <span style={{ color: "var(--color-text-secondary)" }}>({item.twitchLogin})</span>
                      </div>
                      <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {item.liveType}
                        {item.title ? ` - ${item.title}` : ""}
                      </div>
                    </div>
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

