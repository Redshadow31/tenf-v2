"use client";

import { X } from "lucide-react";
import type { FollowLayoutVariant, FollowSummary, StateFilter } from "./types";
import { STATE_FILTER_ARIA, STATE_FILTER_LABELS } from "./types";

export type FollowFilterBarProps = {
  variant: FollowLayoutVariant;
  stateFilter: StateFilter;
  summary: FollowSummary;
  onChange: (next: StateFilter) => void;
};

/**
 * Chips de filtre + bouton "Réinitialiser" (visible si filtre actif).
 * a11y :
 *  - role="toolbar" + aria-label sur le conteneur.
 *  - aria-pressed sur chaque chip.
 *  - aria-label individuel explicite (STATE_FILTER_ARIA).
 *  - focus visible.
 */
export default function FollowFilterBar({
  variant,
  stateFilter,
  summary,
  onChange,
}: FollowFilterBarProps) {
  const hubLayout = variant === "hub";

  const chips: Array<{ id: StateFilter; count: number }> = [
    { id: "all", count: summary.totalMembers },
    { id: "ok", count: summary.calculableMembers },
    { id: "not_linked", count: summary.notLinkedCount },
    { id: "impossible", count: summary.impossibleCount },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Filtrer les résultats par état de calcul"
      className={`mb-4 flex flex-wrap items-center gap-2 ${
        hubLayout ? "rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2" : ""
      }`}
    >
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Filtre&nbsp;:
      </span>
      {chips.map(({ id, count }) => {
        const active = stateFilter === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            aria-label={STATE_FILTER_ARIA[id]}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/50 ${
              active
                ? hubLayout
                  ? "border-pink-400/55 bg-pink-500/20 text-pink-50"
                  : "border-white/50 bg-white/10 text-white"
                : hubLayout
                ? "border-white/10 bg-white/[0.04] text-slate-300 hover:border-pink-400/25 hover:text-slate-100"
                : "border-neutral-700 text-gray-300 hover:text-white"
            }`}
          >
            <span>{STATE_FILTER_LABELS[id]}</span>
            <span
              className={`rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                active ? "bg-black/30 text-white" : hubLayout ? "bg-white/[0.06] text-slate-400" : "bg-white/10"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
      {stateFilter !== "all" ? (
        <button
          type="button"
          onClick={() => onChange("all")}
          className="ml-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/45"
          aria-label="Réinitialiser le filtre d'état"
        >
          <X className="h-3 w-3" aria-hidden />
          Réinitialiser
        </button>
      ) : null}
    </div>
  );
}
