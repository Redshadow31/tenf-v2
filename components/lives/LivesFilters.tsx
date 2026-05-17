import { Search, X } from "lucide-react";
import type { CSSProperties } from "react";

type LivesFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedGame: string;
  onGameChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  games: string[];
  roles: string[];
};

export default function LivesFilters({
  search,
  onSearchChange,
  selectedGame,
  onGameChange,
  selectedRole,
  onRoleChange,
  games,
  roles,
}: LivesFiltersProps) {
  const sectionStyle: CSSProperties = {
    padding: "clamp(1rem, 2vw, 1.5rem)",
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-card)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  };
  const hasActiveFilters =
    search.trim().length > 0 || selectedGame !== "all" || selectedRole !== "all";

  const resetFilters = () => {
    onSearchChange("");
    onGameChange("all");
    onRoleChange("all");
  };

  return (
    <section className="space-y-3 rounded-2xl border" style={sectionStyle} aria-labelledby="lives-filters-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="lives-filters-title"
            className="font-bold tracking-tight"
            style={{ color: "var(--color-text)", fontSize: "clamp(1rem, 0.95rem + 0.3vw, 1.2rem)" }}
          >
            Affiner ta sélection
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">
            Recherche par pseudo, ou filtre par jeu et rôle pour cibler ce qui te plaît.
          </p>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-400/35 hover:bg-violet-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          >
            <X className="h-3 w-3" aria-hidden />
            Réinitialiser les filtres
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1.5">
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
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#9146ff] focus-visible:ring-2 focus-visible:ring-violet-500/30"
              style={{
                borderColor: search ? "rgba(145,70,255,0.6)" : "var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            />
          </div>
        </label>

        <label className="space-y-1.5">
          <span
            className="text-xs font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Filtre par jeu / catégorie
          </span>
          <select
            value={selectedGame}
            onChange={(event) => onGameChange(event.target.value)}
            aria-label="Filtrer les lives par jeu ou catégorie"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[#9146ff] focus-visible:ring-2 focus-visible:ring-violet-500/30"
            style={{
              borderColor: selectedGame !== "all" ? "rgba(145,70,255,0.6)" : "var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          >
            <option value="all">Toutes les catégories</option>
            {games.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span
            className="text-xs font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Filtre par rôle TENF
          </span>
          <select
            value={selectedRole}
            onChange={(event) => onRoleChange(event.target.value)}
            aria-label="Filtrer les lives par rôle dans la communauté TENF"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[#9146ff] focus-visible:ring-2 focus-visible:ring-violet-500/30"
            style={{
              borderColor: selectedRole !== "all" ? "rgba(145,70,255,0.6)" : "var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          >
            <option value="all">Tous les rôles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
