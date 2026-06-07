"use client";

import type { MutableRefObject } from "react";
import { LayoutGrid, LayoutList, Search } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import DiscoverResults from "@/components/member/engagement/discover/DiscoverResults";
import {
  DISCOVER_ACCENT,
  DISCOVER_FIELD_CLASS,
  ROLE_FILTER_ITEMS,
  type PublicMember,
  type RoleFilterKey,
  type ViewMode,
} from "@/components/member/engagement/discover/discoverUtils";
import type { DiscoverEmptyModel } from "@/components/member/engagement/discover/discoverModel";

type DiscoverExplorerPanelProps = {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: RoleFilterKey;
  onRoleFilterChange: (key: RoleFilterKey) => void;
  roleCounts: Record<RoleFilterKey, number>;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  subtitle?: string;
  members: PublicMember[];
  filteredMembers: PublicMember[];
  highlightLogin: string | null;
  cardRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  onResetFilters: () => void;
  emptyModel: DiscoverEmptyModel;
  hasActiveFilters: boolean;
};

export default function DiscoverExplorerPanel({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  roleCounts,
  viewMode,
  onViewModeChange,
  subtitle,
  members,
  filteredMembers,
  highlightLogin,
  cardRefs,
  onResetFilters,
  emptyModel,
  hasActiveFilters,
}: DiscoverExplorerPanelProps) {
  return (
    <DashboardPanel
      id="discover-explorer"
      tone="violet"
      accentHex={DISCOVER_ACCENT}
      intensity="medium"
      ariaLabelledBy="discover-explorer-title"
      className={`${MEMBER_SCROLL_MT} flex max-h-[min(72vh,52rem)] flex-col`}
    >
      <DashboardPanelHeader
        kicker="Explorer"
        title="Chaînes à découvrir"
        icon={Search}
        tone="violet"
        accentHex="#9146ff"
        titleId="discover-explorer-title"
        badge={
          <span className="text-[11px] font-semibold text-white/50">
            {filteredMembers.length} résultat{filteredMembers.length !== 1 ? "s" : ""}
          </span>
        }
      />

      {subtitle ? (
        <p className="-mt-1 mb-2 text-[11px] leading-relaxed text-white/48">{subtitle}</p>
      ) : null}

      <div className="mb-2 flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pseudo, @login ou rôle…"
            className={`${DISCOVER_FIELD_CLASS} py-2 pl-9`}
          />
        </div>
        <div className="flex shrink-0 rounded-xl border border-white/10 bg-black/25 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("cards")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewMode === "cards" ? "bg-violet-600/35 text-white" : "text-white/45 hover:text-white/75"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            Grille
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewMode === "list" ? "bg-violet-600/35 text-white" : "text-white/45 hover:text-white/75"
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" aria-hidden />
            Liste
          </button>
        </div>
      </div>

      <div className="mb-2 flex shrink-0 flex-wrap gap-1.5">
        {ROLE_FILTER_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onRoleFilterChange(item.key)}
            title={item.hint}
            className={`rounded-full border px-2.5 py-1 text-left text-[11px] font-semibold transition ${
              roleFilter === item.key
                ? "border-violet-400/45 bg-violet-500/18 text-violet-50"
                : "border-white/10 bg-black/25 text-white/50 hover:border-white/18 hover:text-white/80"
            }`}
          >
            {item.label}
            <span className="ml-1 font-normal opacity-75">
              ({item.key === "all" ? roleCounts.all : roleCounts[item.key]})
            </span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [scrollbar-gutter:stable]">
        <DiscoverResults
          embedded
          members={members}
          filteredMembers={filteredMembers}
          viewMode={viewMode}
          highlightLogin={highlightLogin}
          cardRefs={cardRefs}
          onResetFilters={onResetFilters}
          emptyModel={emptyModel}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
    </DashboardPanel>
  );
}
