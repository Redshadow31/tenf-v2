"use client";

import {
  ArrowRight,
  BookOpen,
  LayoutGrid,
  Library,
  List,
  Loader2,
  MessageSquarePlus,
  Search,
} from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import {
  catalogHue,
  FORMATIONS_CATALOG_ACCENT,
  type CatalogSortMode,
  type CatalogViewMode,
  type PastFormationCatalogItem,
} from "@/components/member/formations/catalog/formationsCatalogUtils";

type FormationsCatalogArchivePanelProps = {
  loading: boolean;
  filteredCount: number;
  displayedCatalog: PastFormationCatalogItem[];
  catalogQuery: string;
  onCatalogQueryChange: (value: string) => void;
  showInterestedOnly: boolean;
  onShowInterestedOnlyChange: (value: boolean) => void;
  catalogSort: CatalogSortMode;
  onCatalogSortChange: (value: CatalogSortMode) => void;
  catalogViewMode: CatalogViewMode;
  onCatalogViewModeChange: (value: CatalogViewMode) => void;
  catalogLetter: string | null;
  onCatalogLetterChange: (value: string | null) => void;
  catalogLetterChips: Array<[string, number]>;
  pendingTitles: Set<string>;
  submittingTitle: string;
  onSubmitInterest: (title: string, sourceEventId: string | null) => void;
  onOpenRequest: () => void;
};

function ArchiveSkeleton({ grid }: { grid: boolean }) {
  if (grid) {
    return (
      <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      <div className="h-24 rounded-xl bg-white/[0.04]" />
      <div className="h-24 rounded-xl bg-white/[0.04]" />
    </div>
  );
}

export default function FormationsCatalogArchivePanel({
  loading,
  filteredCount,
  displayedCatalog,
  catalogQuery,
  onCatalogQueryChange,
  showInterestedOnly,
  onShowInterestedOnlyChange,
  catalogSort,
  onCatalogSortChange,
  catalogViewMode,
  onCatalogViewModeChange,
  catalogLetter,
  onCatalogLetterChange,
  catalogLetterChips,
  pendingTitles,
  submittingTitle,
  onSubmitInterest,
  onOpenRequest,
}: FormationsCatalogArchivePanelProps) {
  return (
    <DashboardPanel
      id="formations-catalog"
      tone="accent"
      accentHex={FORMATIONS_CATALOG_ACCENT}
      intensity="soft"
      ariaLabelledBy="formations-catalog-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Archive"
        title="Catalogue des anciennes formations"
        icon={Library}
        tone="accent"
        accentHex={FORMATIONS_CATALOG_ACCENT}
        titleId="formations-catalog-title"
        badge={
          <div
            className="flex rounded-lg border border-white/10 p-0.5"
            role="group"
            aria-label="Mode d'affichage"
          >
            <button
              type="button"
              onClick={() => onCatalogViewModeChange("grid")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ${
                catalogViewMode === "grid" ? "bg-violet-500/25 text-violet-100" : "text-white/45"
              }`}
            >
              <LayoutGrid className="h-3 w-3" aria-hidden />
              Grille
            </button>
            <button
              type="button"
              onClick={() => onCatalogViewModeChange("list")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ${
                catalogViewMode === "list" ? "bg-violet-500/25 text-violet-100" : "text-white/45"
              }`}
            >
              <List className="h-3 w-3" aria-hidden />
              Liste
            </button>
          </div>
        }
      />

      <p className="mb-4 text-sm text-white/55">
        Thèmes déjà animés : recherche, tri, pastilles par lettre. Un clic envoie ton intérêt à l&apos;équipe pour de
        futurs créneaux.
      </p>

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onOpenRequest}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-500/25"
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          Formulaire détaillé
        </button>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <div className="relative min-w-0">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            aria-hidden
          />
          <input
            type="search"
            value={catalogQuery}
            onChange={(e) => onCatalogQueryChange(e.target.value)}
            placeholder="Rechercher par titre…"
            className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-white focus:border-violet-400/50 focus:outline-none"
            aria-label="Rechercher dans le catalogue"
          />
        </div>
        <button
          type="button"
          onClick={() => onShowInterestedOnlyChange(!showInterestedOnly)}
          className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            showInterestedOnly
              ? "border-emerald-400/50 bg-emerald-500/12 text-emerald-300"
              : "border-white/10 bg-black/30 text-white/55"
          }`}
        >
          {showInterestedOnly ? "Tout le catalogue" : "Mes demandes uniquement"}
        </button>
        <div className="flex rounded-xl border border-white/10 bg-black/30 p-1" role="group" aria-label="Tri alphabétique">
          <button
            type="button"
            onClick={() => onCatalogSortChange("alpha")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              catalogSort === "alpha" ? "bg-amber-500/20 text-amber-100" : "text-white/45"
            }`}
          >
            A → Z
          </button>
          <button
            type="button"
            onClick={() => onCatalogSortChange("alpha-desc")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              catalogSort === "alpha-desc" ? "bg-amber-500/20 text-amber-100" : "text-white/45"
            }`}
          >
            Z → A
          </button>
        </div>
      </div>

      {!loading && filteredCount > 0 && catalogLetterChips.length > 1 ? (
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">
            Filtrer par première lettre
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCatalogLetterChange(null)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                catalogLetter === null ? "border-violet-400/45 bg-violet-500/20 text-violet-100" : "border-white/10 text-white/70"
              }`}
            >
              Toutes ({filteredCount})
            </button>
            {catalogLetterChips.map(([letter, count]) => (
              <button
                key={letter}
                type="button"
                onClick={() => onCatalogLetterChange(catalogLetter === letter ? null : letter)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums transition ${
                  catalogLetter === letter ? "border-violet-400/45 bg-violet-500/20 text-violet-100" : "border-white/10 text-white/70"
                }`}
              >
                {letter === "#" ? "# · autres" : letter} ({count})
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? (
        <ArchiveSkeleton grid={catalogViewMode === "grid"} />
      ) : filteredCount === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center text-sm text-white/45">
          Aucun résultat — essaie un autre mot-clé ou désactive le filtre « Mes demandes ».
        </div>
      ) : displayedCatalog.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center text-sm text-white/45">
          Rien sous cette lettre — choisis « Toutes » pour réafficher le catalogue filtré.
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/45">
            <p>
              <span className="font-semibold text-violet-200/90">{displayedCatalog.length}</span> thème
              {displayedCatalog.length > 1 ? "s" : ""}
              {catalogLetter ? ` · lettre « ${catalogLetter === "#" ? "#" : catalogLetter} »` : ""}
              {showInterestedOnly ? " · demandes d'intérêt" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {catalogQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => onCatalogQueryChange("")}
                  className="rounded-lg border border-white/10 px-2.5 py-1 font-semibold hover:bg-violet-500/10"
                >
                  Effacer la recherche
                </button>
              ) : null}
              {catalogLetter ? (
                <button
                  type="button"
                  onClick={() => onCatalogLetterChange(null)}
                  className="rounded-lg border border-white/10 px-2.5 py-1 font-semibold hover:bg-violet-500/10"
                >
                  Toutes les lettres
                </button>
              ) : null}
            </div>
          </div>

          {catalogViewMode === "grid" ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {displayedCatalog.map((formation) => {
                const isPending = pendingTitles.has(formation.title);
                const hue = catalogHue(formation.title);
                const initial = formation.title.trim().charAt(0).toUpperCase() || "?";
                return (
                  <li key={formation.key}>
                    <article
                      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                      style={{
                        borderColor: isPending ? "rgba(52,211,153,0.45)" : "rgba(139,92,246,0.28)",
                        backgroundColor: "rgba(0,0,0,0.25)",
                      }}
                    >
                      <div
                        className="relative px-4 pb-3 pt-5"
                        style={{
                          background: `linear-gradient(135deg, hsla(${hue}, 58%, 38%, 0.45) 0%, hsla(${(hue + 52) % 360}, 45%, 22%, 0.25) 55%, transparent 100%)`,
                        }}
                      >
                        <BookOpen
                          className="absolute right-3 top-3 h-16 w-16 text-white/[0.08] transition group-hover:text-white/[0.12]"
                          aria-hidden
                        />
                        <div className="relative flex items-start gap-3">
                          <span
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 text-lg font-bold text-white shadow-lg"
                            style={{
                              borderColor: `hsla(${hue}, 70%, 72%, 0.45)`,
                              background: `linear-gradient(145deg, hsla(${hue}, 55%, 42%, 0.85), hsla(${(hue + 30) % 360}, 50%, 28%, 0.75))`,
                            }}
                          >
                            {initial}
                          </span>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Archive TENF</p>
                            <h4 className="mt-1 text-sm font-bold leading-snug text-white sm:text-base">{formation.title}</h4>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
                        <span
                          className="inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                          style={{
                            borderColor: isPending ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.12)",
                            color: isPending ? "#6ee7b7" : "rgba(255,255,255,0.55)",
                            backgroundColor: isPending ? "rgba(52,211,153,0.12)" : "transparent",
                          }}
                        >
                          {isPending ? "Demande envoyée" : "Ouverte aux demandes"}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSubmitInterest(formation.title, formation.sourceEventId)}
                          disabled={isPending || submittingTitle === formation.title}
                          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            borderColor: isPending ? "rgba(52,211,153,0.5)" : "rgba(167,139,250,0.45)",
                            color: isPending ? "#6ee7b7" : "#ddd6fe",
                            backgroundColor: isPending ? "rgba(52,211,153,0.1)" : "rgba(139,92,246,0.12)",
                          }}
                        >
                          {submittingTitle === formation.title ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {isPending ? "Déjà dans ta liste" : "Ça m'intéresse"}
                          {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
                        </button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="space-y-3">
              {displayedCatalog.map((formation, index) => {
                const isPending = pendingTitles.has(formation.title);
                const hue = catalogHue(formation.title);
                return (
                  <li key={formation.key}>
                    <article
                      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-4 transition hover:border-violet-400/35 md:flex-row md:items-center md:gap-5"
                      style={{
                        borderColor: isPending ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.1)",
                        backgroundColor: isPending ? "rgba(52,211,153,0.07)" : "rgba(0,0,0,0.2)",
                      }}
                    >
                      <div
                        className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl"
                        style={{
                          background: `linear-gradient(180deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 40) % 360}, 60%, 45%))`,
                        }}
                        aria-hidden
                      />
                      <div className="flex min-w-0 flex-1 items-start gap-3 pl-2 md:items-center">
                        <span
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sm font-bold tabular-nums"
                          style={{
                            borderColor: `hsla(${hue}, 50%, 55%, 0.4)`,
                            background: `linear-gradient(135deg, hsla(${hue}, 45%, 32%, 0.5), hsla(${(hue + 35) % 360}, 40%, 22%, 0.4))`,
                            color: "#f5f3ff",
                          }}
                        >
                          #{index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold leading-snug text-white md:text-base">{formation.title}</p>
                          <span
                            className="mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              borderColor: isPending ? "rgba(52,211,153,0.42)" : "rgba(255,255,255,0.12)",
                              color: isPending ? "#34d399" : "rgba(255,255,255,0.55)",
                            }}
                          >
                            {isPending ? "Intérêt enregistré" : "Disponible à la demande"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSubmitInterest(formation.title, formation.sourceEventId)}
                        disabled={isPending || submittingTitle === formation.title}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-65 md:w-auto md:min-w-[11rem]"
                        style={{
                          borderColor: isPending ? "rgba(52,211,153,0.45)" : "rgba(139,92,246,0.45)",
                          color: isPending ? "#34d399" : "#c4b5fd",
                          backgroundColor: isPending ? "rgba(52,211,153,0.08)" : "rgba(139,92,246,0.08)",
                        }}
                      >
                        {submittingTitle === formation.title ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isPending ? "Demande envoyée" : "Cette formation m'intéresse"}
                        {!isPending ? <ArrowRight className="h-3.5 w-3.5 opacity-80" /> : null}
                      </button>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </DashboardPanel>
  );
}
