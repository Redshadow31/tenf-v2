"use client";

import Link from "next/link";
import { Dice5, RefreshCcw, Rocket, Sparkles, Tv2 } from "lucide-react";
import CommunityStatsSection from "@/components/lives/CommunityStatsSection";
import LivesFilters from "@/components/lives/LivesFilters";
import type { LivesQuickFilter, LivesSortMode } from "@/components/lives/livesDiscoveryTypes";
import styles from "@/components/lives/lives-discovery.module.css";
import theme from "@/components/lives/lives-theme.module.css";

type LivesDiscoveryPanelProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedGame: string;
  onGameChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  games: string[];
  gameCounts: Record<string, number>;
  roles: string[];
  quickFilter: LivesQuickFilter;
  onQuickFilterChange: (value: LivesQuickFilter) => void;
  quickFilterCounts: Record<LivesQuickFilter, number>;
  showNotFollowedFilter: boolean;
  sortMode: LivesSortMode;
  onSortModeChange: (value: LivesSortMode) => void;
  filteredCount: number;
  totalLiveCount: number;
  totalMembers: number | null;
  activeMembers: number | null;
  topGameLabel: string | null;
  topGameCount: number;
  lastSyncedLabel: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onScrollToLives: () => void;
  onPickRandomLive: () => void;
  onPickRandomRaid: () => void;
  randomDisabled: boolean;
  spotlightDisplayName?: string | null;
};

export default function LivesDiscoveryPanel(props: LivesDiscoveryPanelProps) {
  const {
    lastSyncedLabel,
    isRefreshing,
    onRefresh,
    onScrollToLives,
    onPickRandomLive,
    onPickRandomRaid,
    randomDisabled,
    spotlightDisplayName,
    filteredCount,
    totalLiveCount,
    topGameLabel,
    topGameCount,
    ...filterStatsProps
  } = props;

  return (
    <div className={styles.discoveryZone}>
      <div className={styles.discoveryMain}>
        <div className={`${theme.panel} ${theme.panelPadding}`}>
          <div className={theme.panelOrbViolet} aria-hidden />
          <div className={theme.panelOrbRed} aria-hidden />

          <div className={`${theme.panelInner} ${styles.unifiedInner}`}>
            <LivesFilters
              {...filterStatsProps}
              filteredCount={filteredCount}
              totalLiveCount={totalLiveCount}
              embedded
            />

            <hr className={theme.divider} />

            <CommunityStatsSection
              embedded
              filteredLiveCount={filteredCount}
              totalLiveCount={totalLiveCount}
              totalMembers={filterStatsProps.totalMembers}
              activeMembers={filterStatsProps.activeMembers}
              topGameLabel={topGameLabel}
              topGameCount={topGameCount}
              onScrollToLives={onScrollToLives}
            />
          </div>
        </div>
      </div>

      <aside className={styles.discoveryRail} aria-label="Actions et synchronisation">
        <div className={`${theme.glassCard} ${theme.glassCardViolet} p-4`}>
          <p className={styles.railLabel}>Synchronisation</p>
          <p className="mt-2 text-sm font-medium text-violet-100/90">{lastSyncedLabel}</p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`${theme.btnSecondary} mt-3 w-full ${isRefreshing ? styles.refreshBtnSpinning : ""}`}
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
            {isRefreshing ? "Actualisation…" : "Rafraîchir les lives"}
          </button>
        </div>

        {spotlightDisplayName ? (
          <div className={`${theme.glassCard} ${theme.glassCardViolet} p-4`}>
            <p className={`${styles.railLabel} flex items-center gap-1.5`}>
              <Sparkles className="h-3 w-3 text-amber-200" aria-hidden />
              Spotlight
            </p>
            <p className="mt-2 text-sm font-bold text-white">{spotlightDisplayName}</p>
            <p className="mt-1 text-xs text-violet-200/70">Chaîne mise en avant ce soir.</p>
          </div>
        ) : null}

        {topGameLabel && topGameCount > 0 ? (
          <div className={`${theme.glassCard} ${theme.glassCardRed} p-4`}>
            <p className={styles.railLabel} style={{ color: "#fca5a5" }}>
              Tendance live
            </p>
            <p className="mt-2 text-sm font-bold text-white">{topGameLabel}</p>
            <p className="text-xs text-red-200/70">
              {topGameCount} streamer{topGameCount > 1 ? "s" : ""} en ce moment
            </p>
          </div>
        ) : null}

        <div className={`${theme.glassCard} ${theme.glassCardViolet} p-4`}>
          <p className={styles.railLabel}>Explorer</p>
          <button
            type="button"
            onClick={onPickRandomRaid}
            disabled={randomDisabled}
            className={`${theme.btnPrimary} mt-2 w-full text-sm`}
          >
            <Rocket className="h-4 w-4" aria-hidden />
            Raid aléatoire
          </button>
          <button
            type="button"
            onClick={onPickRandomLive}
            disabled={randomDisabled}
            className={`${theme.btnSecondary} mt-2 w-full text-sm`}
          >
            <Dice5 className="h-4 w-4" aria-hidden />
            Live au hasard
          </button>
          <button type="button" onClick={onScrollToLives} className={`${theme.btnSecondary} mt-2 w-full text-xs`}>
            <Tv2 className="h-3.5 w-3.5" aria-hidden />
            Aller à la grille
          </button>
          <Link href="/membres" className={`${theme.btnSecondary} mt-2 w-full text-xs`}>
            Annuaire membres
          </Link>
        </div>
      </aside>
    </div>
  );
}
