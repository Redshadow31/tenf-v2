"use client";

import { CalendarDays, Download, Filter, Search, SlidersHorizontal } from "lucide-react";
import { MembersHubPanel } from "@/components/admin/members-hub/MembersHubPanel";
import type { EvaluationDCopyModel } from "@/lib/admin/evaluation-d/evaluationDCopyModel";
import {
  evalDChipClass,
  evalDFocusRing,
  evalDInputClass,
  evalDKickerClass,
  evalDTitleClass,
  evalDZoneClass,
} from "@/lib/admin/evaluation-d/evaluationDStyles";
import type { EvaluationDPreset } from "@/lib/admin/evaluation-d/evaluationDTypes";

type Props = {
  copy: EvaluationDCopyModel;
  selectedMonth: string;
  monthOptions: string[];
  formatMonthKey: (key: string) => string;
  onMonthChange: (value: string) => void;
  selectedPreset: EvaluationDPreset;
  onPresetChange: (value: EvaluationDPreset) => void;
  showActiveOnly: boolean;
  onShowActiveOnlyChange: (value: boolean) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  compactMode: boolean;
  onCompactModeToggle: () => void;
  showAdvancedColumns: boolean;
  onAdvancedColumnsToggle: () => void;
  onExportCsv: () => void;
};

export default function EvaluationDToolbar({
  copy,
  selectedMonth,
  monthOptions,
  formatMonthKey,
  onMonthChange,
  selectedPreset,
  onPresetChange,
  showActiveOnly,
  onShowActiveOnlyChange,
  searchQuery,
  onSearchChange,
  compactMode,
  onCompactModeToggle,
  showAdvancedColumns,
  onAdvancedColumnsToggle,
  onExportCsv,
}: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" intensity="medium" className="min-w-0">
      <p className={evalDKickerClass}>{copy.toolbar.kicker}</p>
      <h2 className={`${evalDTitleClass} mt-1 text-[clamp(0.9rem,1.1vw,1rem)]`}>{copy.toolbar.title}</h2>
      <p className="mt-1 text-xs text-zinc-500">{copy.toolbar.intro}</p>

      <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
        <div className={`${evalDZoneClass} min-w-0`}>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-violet-300/80">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            Période & vue rapide
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={evalDKickerClass}>Mois</span>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className={`${evalDInputClass} w-full ${evalDFocusRing}`}
              >
                {monthOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatMonthKey(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className={evalDKickerClass}>Preset</span>
              <select
                value={selectedPreset}
                onChange={(e) => onPresetChange(e.target.value as EvaluationDPreset)}
                className={`${evalDInputClass} w-full ${evalDFocusRing}`}
              >
                <option value="all">Tous les profils</option>
                <option value="surveiller">À surveiller</option>
                <option value="vip">VIP</option>
                <option value="manual">Overrides manuels</option>
                <option value="bonus">Avec bonus</option>
              </select>
            </label>
          </div>
        </div>

        <div className={`${evalDZoneClass} min-w-0`}>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
            <Filter className="h-3.5 w-3.5" aria-hidden />
            Recherche & affichage tableau
          </p>
          <div className="space-y-3">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
              <input
                type="search"
                placeholder={copy.toolbar.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`${evalDInputClass} w-full pl-10 ${evalDFocusRing}`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/40 px-3 py-2 text-xs font-medium text-zinc-300">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => onShowActiveOnlyChange(e.target.checked)}
                  className="rounded border-white/20 text-violet-500 focus:ring-violet-400/40"
                />
                Actifs seulement
              </label>
              <button type="button" onClick={onCompactModeToggle} className={evalDChipClass(compactMode)}>
                <SlidersHorizontal className="mr-1 inline h-3 w-3" aria-hidden />
                Compact
              </button>
              <button type="button" onClick={onAdvancedColumnsToggle} className={evalDChipClass(showAdvancedColumns)}>
                Colonnes +
              </button>
              <button
                type="button"
                onClick={onExportCsv}
                className={`ml-auto inline-flex items-center gap-2 rounded-xl border border-sky-400/35 bg-sky-600/20 px-3 py-2 text-xs font-bold text-sky-100 transition hover:bg-sky-600/30 ${evalDFocusRing}`}
              >
                <Download className="h-4 w-4" aria-hidden />
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </MembersHubPanel>
  );
}
