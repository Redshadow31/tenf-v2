"use client";

import { Filter, Search, X } from "lucide-react";
import {
  NOTIFICATION_CATEGORY_LABELS,
  type NotificationCategoryUI,
} from "@/lib/notifications/classification";

export type ReadStateFilter = "all" | "unread" | "read";

export type CategoryFilter = "all" | NotificationCategoryUI;

type NotificationsFiltersProps = {
  query: string;
  onQueryChange: (next: string) => void;
  readState: ReadStateFilter;
  onReadStateChange: (next: ReadStateFilter) => void;
  category: CategoryFilter;
  onCategoryChange: (next: CategoryFilter) => void;
  availableCategories: NotificationCategoryUI[];
  showReset: boolean;
  onReset: () => void;
};

const READ_STATE_LABELS: Record<ReadStateFilter, string> = {
  all: "Toutes",
  unread: "Non lues",
  read: "Lues",
};

export default function NotificationsFilters({
  query,
  onQueryChange,
  readState,
  onReadStateChange,
  category,
  onCategoryChange,
  availableCategories,
  showReset,
  onReset,
}: NotificationsFiltersProps) {
  return (
    <section
      className="rounded-2xl border px-[clamp(0.75rem,1vw,1rem)] py-[clamp(0.65rem,0.9vw,0.9rem)]"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      aria-label="Filtres des notifications"
    >
      <div className="flex flex-col gap-[clamp(0.5rem,0.75vw,0.85rem)] xl:flex-row xl:items-center">
        <label className="relative flex min-w-0 flex-1 items-center">
          <span className="sr-only">Rechercher dans mes notifications</span>
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-500" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher dans le titre ou le contenu…"
            className="w-full rounded-xl border px-9 py-2 text-[clamp(0.85rem,0.95vw,0.95rem)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "rgba(0,0,0,0.24)",
              color: "var(--color-text)",
            }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </label>

        <div
          role="group"
          aria-label="État de lecture"
          className="inline-flex shrink-0 rounded-xl border p-1"
          style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(0,0,0,0.2)" }}
        >
          {(Object.keys(READ_STATE_LABELS) as ReadStateFilter[]).map((key) => {
            const active = readState === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onReadStateChange(key)}
                aria-pressed={active}
                className={
                  "min-h-[36px] rounded-lg px-3 py-1.5 text-[clamp(0.75rem,0.85vw,0.85rem)] font-semibold transition " +
                  (active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200")
                }
              >
                {READ_STATE_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>

      {availableCategories.length > 0 ? (
        <div className="mt-[clamp(0.5rem,0.7vw,0.75rem)] flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-zinc-500">
            <Filter className="h-3 w-3" aria-hidden />
            Catégories
          </span>
          <button
            type="button"
            onClick={() => onCategoryChange("all")}
            aria-pressed={category === "all"}
            className={
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition " +
              (category === "all"
                ? "border-violet-400/55 bg-violet-500/15 text-white"
                : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-violet-400/35 hover:text-white")
            }
          >
            Toutes
          </button>
          {availableCategories.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                aria-pressed={active}
                className={
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition " +
                  (active
                    ? "border-violet-400/55 bg-violet-500/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-violet-400/35 hover:text-white")
                }
              >
                {NOTIFICATION_CATEGORY_LABELS[cat]}
              </button>
            );
          })}
          {showReset ? (
            <button
              type="button"
              onClick={onReset}
              className="ml-auto rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 transition hover:border-violet-400/35 hover:text-white"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
