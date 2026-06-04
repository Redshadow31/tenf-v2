"use client";

import { Cake, Radio, Search, Sparkles, UserPlus, X } from "lucide-react";
import type { LivesQuickFilter, LivesSortMode } from "@/components/lives/livesDiscoveryTypes";
import styles from "@/components/lives/lives-discovery.module.css";
import theme from "@/components/lives/lives-theme.module.css";

type LivesFiltersProps = {
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
  /** Intégré dans le bloc unifié (sans carte séparée). */
  embedded?: boolean;
};

const SORT_OPTIONS: { value: LivesSortMode; label: string }[] = [
  { value: "tenf", label: "Priorité TENF" },
  { value: "viewers", label: "Viewers" },
  { value: "recent", label: "Plus long en live" },
  { value: "alpha", label: "A → Z" },
];

export default function LivesFilters({
  search,
  onSearchChange,
  selectedGame,
  onGameChange,
  selectedRole,
  onRoleChange,
  games,
  gameCounts,
  roles,
  quickFilter,
  onQuickFilterChange,
  quickFilterCounts,
  showNotFollowedFilter,
  sortMode,
  onSortModeChange,
  filteredCount,
  totalLiveCount,
  embedded = false,
}: LivesFiltersProps) {
  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedGame !== "all" ||
    selectedRole !== "all" ||
    quickFilter !== "all";

  const resetFilters = () => {
    onSearchChange("");
    onGameChange("all");
    onRoleChange("all");
    onQuickFilterChange("all");
  };

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (search.trim()) {
    activeChips.push({ key: "search", label: `« ${search.trim()} »`, onRemove: () => onSearchChange("") });
  }
  if (selectedGame !== "all") {
    activeChips.push({ key: "game", label: selectedGame, onRemove: () => onGameChange("all") });
  }
  if (selectedRole !== "all") {
    activeChips.push({ key: "role", label: selectedRole, onRemove: () => onRoleChange("all") });
  }
  if (quickFilter === "spotlight") {
    activeChips.push({ key: "qf", label: "Spotlight", onRemove: () => onQuickFilterChange("all") });
  }
  if (quickFilter === "celebrations") {
    activeChips.push({ key: "qf", label: "Célébrations", onRemove: () => onQuickFilterChange("all") });
  }
  if (quickFilter === "not_followed") {
    activeChips.push({ key: "qf", label: "Pas encore follow", onRemove: () => onQuickFilterChange("all") });
  }

  const quickPills: {
    id: LivesQuickFilter;
    label: string;
    icon: typeof Radio;
    red?: boolean;
    hidden?: boolean;
  }[] = [
    { id: "all", label: "Tous", icon: Radio },
    { id: "spotlight", label: "Spotlight", icon: Sparkles },
    { id: "celebrations", label: "Célébrations", icon: Cake },
    { id: "not_followed", label: "À découvrir", icon: UserPlus, red: true, hidden: !showNotFollowedFilter },
  ];

  const sectionClass = embedded
    ? `${styles.filtersBlock} space-y-4`
    : `space-y-4 rounded-2xl border p-6`;

  return (
    <section className={sectionClass} aria-labelledby="lives-filters-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="lives-filters-title"
            className="font-bold tracking-tight"
            style={{ color: "var(--color-text)", fontSize: "clamp(1rem, 0.95rem + 0.3vw, 1.25rem)" }}
          >
            Affiner ta sélection
          </h2>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            Pseudo, jeu en direct maintenant, rôle TENF ou raccourcis communautaires.
          </p>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className={`${theme.btnSecondary} shrink-0 px-3 py-1.5 text-xs`}
          >
            <X className="h-3 w-3" aria-hidden />
            Tout effacer
          </button>
        ) : null}
      </div>

      <div className={styles.matchBanner} role="status" aria-live="polite">
        <span>
          <span className={styles.matchCount}>{filteredCount}</span>
          <span style={{ color: "var(--color-text-secondary)" }}>
            {" "}
            live{filteredCount !== 1 ? "s" : ""} affiché{filteredCount !== 1 ? "s" : ""}
          </span>
        </span>
        <span className="hidden h-4 w-px bg-white/15 sm:inline-block" aria-hidden />
        <span className="text-zinc-400">
          sur <strong className="text-zinc-200">{totalLiveCount}</strong> en direct TENF
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300/90">Raccourcis</p>
        <div className={styles.pillRow}>
          {quickPills
            .filter((p) => !p.hidden)
            .map((pill) => {
              const Icon = pill.icon;
              const active = quickFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => onQuickFilterChange(pill.id)}
                  className={`${styles.quickPill} ${pill.red ? styles.quickPillRed : ""} ${active ? styles.quickPillActive : ""}`}
                  aria-pressed={active}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {pill.label}
                  <span className="rounded-full bg-black/25 px-1.5 py-0.5 text-[10px] tabular-nums opacity-90">
                    {quickFilterCounts[pill.id]}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Actifs</span>
          {activeChips.map((chip) => (
            <span key={`${chip.key}-${chip.label}`} className={styles.chip}>
              {chip.label}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={chip.onRemove}
                aria-label={`Retirer le filtre ${chip.label}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1.5 md:col-span-2 xl:col-span-2">
          <span
            className="text-xs font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Rechercher un streamer
          </span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              aria-hidden
            />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Pseudo Twitch ou nom d'affichage…"
              aria-label="Rechercher un streamer par pseudo ou nom"
              className={`${theme.field} py-2.5 pl-9 pr-3 text-sm ${search ? theme.fieldActive : ""}`}
            />
          </div>
        </label>

        <label className="space-y-1.5">
          <span
            className="text-xs font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Jeu / catégorie
          </span>
          <select
            value={selectedGame}
            onChange={(event) => onGameChange(event.target.value)}
            aria-label="Filtrer les lives par jeu ou catégorie"
            className={`${theme.field} px-3 py-2.5 text-sm ${selectedGame !== "all" ? theme.fieldActive : ""}`}
          >
            <option value="all">Toutes ({totalLiveCount})</option>
            {games.map((game) => (
              <option key={game} value={game}>
                {game} ({gameCounts[game] ?? 0})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span
            className="text-xs font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Rôle TENF
          </span>
          <select
            value={selectedRole}
            onChange={(event) => onRoleChange(event.target.value)}
            aria-label="Filtrer les lives par rôle dans la communauté TENF"
            className={`${theme.field} px-3 py-2.5 text-sm ${selectedRole !== "all" ? theme.fieldActive : ""}`}
          >
            <option value="all">Tous les rôles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 md:col-span-2 xl:col-span-4 xl:max-w-xs">
          <span
            className="text-xs font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Ordre d&apos;affichage
          </span>
          <select
            value={sortMode}
            onChange={(event) => onSortModeChange(event.target.value as LivesSortMode)}
            aria-label="Choisir l'ordre d'affichage des lives"
            className={`${theme.field} px-3 py-2.5 text-sm ${sortMode !== "tenf" ? theme.fieldSortActive : ""}`}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
