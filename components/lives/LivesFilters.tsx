import type { LivesSortOption } from "@/components/lives/types";

type LivesFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedGame: string;
  onGameChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  sortBy: LivesSortOption;
  onSortChange: (value: LivesSortOption) => void;
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
  sortBy,
  onSortChange,
  games,
  roles,
}: LivesFiltersProps) {
  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
            Rechercher un streamer
          </span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Pseudo ou nom"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[#9146ff]"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
            Filtre par jeu
          </span>
          <select
            value={selectedGame}
            onChange={(event) => onGameChange(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[#9146ff]"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
          >
            <option value="all">Tous les jeux</option>
            {games.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
            Filtre par role TENF
          </span>
          <select
            value={selectedRole}
            onChange={(event) => onRoleChange(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[#9146ff]"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
          >
            <option value="all">Tous les roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
            Tri
          </span>
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as LivesSortOption)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[#9146ff]"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
          >
            <option value="alpha">Ordre alphabetique</option>
            <option value="recent">Recemment lance</option>
            <option value="viewers">Nombre de viewers</option>
            <option value="duration">Duree du live</option>
          </select>
        </label>
      </div>
    </section>
  );
}
