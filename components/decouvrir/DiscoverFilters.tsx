"use client";

import { Filter, X } from "lucide-react";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";
import {
  DURATION_OPTIONS,
  filterChipClass,
  QUICK_PRESETS,
  STYLE_OPTIONS,
} from "@/lib/decouvrir/filters";

type DiscoverFiltersProps = {
  languageFilter: string;
  styleFilter: string;
  durationFilter: string;
  availableLanguages: string[];
  filteredCount: number;
  activeFiltersCount: number;
  onLanguageChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onReset: () => void;
  onApplyPreset: (patch: Partial<{ style: string; duration: string }>) => void;
};

export default function DiscoverFilters({
  languageFilter,
  styleFilter,
  durationFilter,
  availableLanguages,
  filteredCount,
  activeFiltersCount,
  onLanguageChange,
  onStyleChange,
  onDurationChange,
  onReset,
  onApplyPreset,
}: DiscoverFiltersProps) {
  const c = DISCOVER_COPY.filters;

  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-white">
          <Filter className="h-5 w-5 shrink-0 text-violet-400" aria-hidden />
          <p className="text-lg font-bold sm:text-xl">{c.title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-medium tabular-nums text-zinc-200">
            {c.results(filteredCount)}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1.5">{c.activeFilters(activeFiltersCount)}</span>
          {activeFiltersCount > 0 ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 font-semibold text-zinc-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            >
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {c.reset}
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-sm text-zinc-500">{c.presetsHelp}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApplyPreset(preset.patch)}
            className="min-h-[44px] rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-left transition hover:border-violet-400/50 hover:bg-violet-500/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          >
            <span className="block text-sm font-bold text-white">{preset.label}</span>
            <span className="text-[11px] text-violet-200/85">{preset.hint}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">{c.lang}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onLanguageChange("all")}
              className={`min-h-[40px] rounded-full px-3.5 py-2 text-xs font-semibold transition ${filterChipClass(languageFilter === "all")}`}
            >
              {c.langAll}
            </button>
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange(lang)}
                className={`min-h-[40px] rounded-full px-3.5 py-2 text-xs font-semibold transition ${filterChipClass(languageFilter === lang)}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">{c.style}</p>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStyleChange(opt.value)}
                className={`min-h-[40px] rounded-full px-3.5 py-2 text-xs font-semibold transition ${filterChipClass(styleFilter === opt.value)}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">{c.duration}</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onDurationChange(opt.value)}
                className={`min-h-[40px] rounded-full px-3.5 py-2 text-xs font-semibold transition ${filterChipClass(durationFilter === opt.value)}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
