"use client";

import { ListFilter, Search, Trash2 } from "lucide-react";
import {
  DashboardBadge,
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";
import {
  formatDateTimeFr,
  getLiveTypeTheme,
  getRelativeDateLabel,
  PLANNING_ACCENT,
  PLANNING_FIELD_CLASS,
  type QuickListFilterMode,
  type StreamPlanning,
} from "@/components/member/planning/planningUtils";

type PlanningQuickListProps = {
  items: StreamPlanning[];
  query: string;
  mode: QuickListFilterMode;
  onQueryChange: (value: string) => void;
  onModeChange: (mode: QuickListFilterMode) => void;
  onDelete: (id: string) => void;
};

const FILTER_MODES: { id: QuickListFilterMode; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "upcoming7", label: "7 jours" },
  { id: "past", label: "Passés" },
];

export default function PlanningQuickList({
  items,
  query,
  mode,
  onQueryChange,
  onModeChange,
  onDelete,
}: PlanningQuickListProps) {
  return (
    <DashboardPanel tone="violet" accentHex={PLANNING_ACCENT} intensity="soft" ariaLabelledBy="planning-list-title">
      <DashboardPanelHeader
        kicker="Liste"
        title="Créneaux"
        icon={ListFilter}
        tone="violet"
        accentHex={PLANNING_ACCENT}
        titleId="planning-list-title"
        badge={
          <DashboardBadge tone="violet" accentHex={PLANNING_ACCENT}>
            {items.length} résultat{items.length > 1 ? "s" : ""}
          </DashboardBadge>
        }
      />

      <div className="space-y-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className={`${PLANNING_FIELD_CLASS} pl-9`}
            placeholder="Rechercher…"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTER_MODES.map((filter) => {
            const active = mode === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onModeChange(filter.id)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  active
                    ? "border-violet-400/45 bg-violet-500/18 text-violet-100"
                    : "border-white/10 text-white/50 hover:border-white/18 hover:text-white/75"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {items.length === 0 ? (
          <DashboardInnerCard className="py-6 text-center text-xs text-white/50">
            Aucun live ne correspond à ta recherche.
          </DashboardInnerCard>
        ) : (
          <ul className="max-h-[min(32rem,55vh)] space-y-1.5 overflow-y-auto pr-0.5">
            {items.map((planning) => {
              const theme = getLiveTypeTheme(planning.liveType);
              return (
                <li key={planning.id}>
                  <DashboardInnerCard hover={false} className="!p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              borderColor: theme.badgeBorder,
                              backgroundColor: theme.badgeBg,
                              color: theme.badgeText,
                            }}
                          >
                            {planning.liveType}
                          </span>
                          <span className="text-[11px] font-bold text-white">
                            {new Date(planning.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            · {planning.time}
                          </span>
                        </div>
                        {planning.title ? (
                          <p className="mt-1 truncate text-xs font-medium text-white/85">{planning.title}</p>
                        ) : null}
                        <p className="mt-0.5 text-[10px] text-white/40">
                          {getRelativeDateLabel(planning.date)} · ajouté {formatDateTimeFr(planning.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDelete(planning.id)}
                        className="shrink-0 rounded-lg border border-red-500/35 bg-red-500/10 p-1.5 text-red-200 transition hover:bg-red-500/18"
                        aria-label={`Supprimer le live du ${planning.date}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </DashboardInnerCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardPanel>
  );
}
