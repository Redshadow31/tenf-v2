"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HomeTimelineEntry = { date: string; label: string };

type HomeTimelineInteractiveProps = {
  events: HomeTimelineEntry[];
};

export default function HomeTimelineInteractive({ events }: HomeTimelineInteractiveProps) {
  const [index, setIndex] = useState(events.length - 1);

  const current = events[index];
  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => Math.max(0, Math.min(events.length - 1, i + dir)));
    },
    [events.length]
  );

  if (!current) {
    return null;
  }

  return (
    <div className="home-timeline-interactive rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_70%,var(--color-bg))] p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
        <div className="flex min-h-[120px] flex-1 flex-col justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Repère sélectionné</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--color-text)] sm:text-3xl">{current.date}</p>
          <p className="home-muted mt-3 text-sm leading-relaxed sm:text-base">{current.label}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index <= 0}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold disabled:opacity-40"
              aria-label="Étape précédente"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Avant
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={index >= events.length - 1}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold disabled:opacity-40"
              aria-label="Étape suivante"
            >
              Après
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Frise — clique une date</p>
          <div className="flex flex-wrap gap-2">
            {events.map((event, i) => (
              <button
                key={event.date}
                type="button"
                onClick={() => setIndex(i)}
                className={`rounded-full px-3 py-1.5 text-left text-[11px] font-bold transition sm:text-xs ${
                  i === index
                    ? "bg-[color-mix(in_srgb,var(--color-primary)_28%,var(--color-card))] text-[var(--color-text)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
                    : "bg-[color-mix(in_srgb,var(--color-bg)_40%,var(--color-card))] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                {event.date}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
