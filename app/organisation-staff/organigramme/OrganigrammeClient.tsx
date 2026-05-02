"use client";

import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrgChartEntry, OrgChartPoleKey } from "@/lib/staff/orgChartTypes";
import { ORG_CHART_POLE_OPTIONS, poleTagFromKey } from "@/lib/staff/orgChartTypes";

type FilterKey = "all" | "direction" | "mod_active" | "mod_training" | "mod_pause" | "support";
type Audience = "public" | "member";
type ViewMode = "cards" | "compact";

const FILTERS: Array<{ key: FilterKey; label: string; description: string }> = [
  { key: "all", label: "Toute l'équipe", description: "Vue complète des profils publics" },
  { key: "direction", label: "Direction", description: "Fondateurs et admin coordinateurs" },
  { key: "mod_active", label: "Modération active", description: "Modérateurs en fonction" },
  { key: "mod_training", label: "En formation", description: "Montée en compétences modération" },
  { key: "mod_pause", label: "En pause", description: "Hiatus tout en restant liés à TENF" },
  { key: "support", label: "Soutien TENF", description: "Engagement sans modération active" },
];

const SECTION_META: Record<string, { subtitle: string; accent: string }> = {
  founders: {
    subtitle: "Vision et cap communautaire",
    accent: "rgba(59,130,246,0.35)",
  },
  adminCoordinators: {
    subtitle: "Coordination des projets et des équipes",
    accent: "rgba(99,102,241,0.35)",
  },
  moderators: {
    subtitle: "Encadrement, sécurité et accompagnement",
    accent: "rgba(168,85,247,0.35)",
  },
  support: {
    subtitle: "Soutien transversal et dynamique communautaire",
    accent: "rgba(34,197,94,0.35)",
  },
};

const POLE_ACCENTS: Record<OrgChartPoleKey, string> = {
  POLE_ANIMATION_EVENTS: "#ec4899",
  POLE_COMMUNICATION_VISUALS: "#3b82f6",
  POLE_FORMATION_COORD_MEMBERS: "#eab308",
  POLE_FORMATION_COORD_STAFF: "#f59e0b",
  POLE_TECH_BOTS: "#a855f7",
  POLE_ACCUEIL_INTEGRATION: "#f97316",
};

function matchesFilter(entry: OrgChartEntry, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "direction") {
    return entry.roleKey === "FONDATEUR" || entry.roleKey === "ADMIN_COORDINATEUR";
  }
  if (filter === "mod_active") return entry.roleKey === "MODERATEUR";
  if (filter === "mod_training") return entry.roleKey === "MODERATEUR_EN_FORMATION";
  if (filter === "mod_pause") return entry.roleKey === "MODERATEUR_EN_PAUSE";
  return entry.roleKey === "SOUTIEN_TENF" || entry.statusKey === "SUPPORT";
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function entryMatchesSearch(entry: OrgChartEntry, q: string): boolean {
  if (!q.trim()) return true;
  const n = normalize(q.trim());
  const hay = [
    entry.member.displayName,
    entry.member.twitchLogin,
    entry.bioShort,
    entry.roleLabel,
    entry.statusLabel,
    entry.poleLabel || "",
    ...entry.secondaryPoleKeys.map((k) => poleTagFromKey(k).label),
  ]
    .filter(Boolean)
    .join(" ");
  return normalize(hay).includes(n);
}

function initials(entry: OrgChartEntry) {
  const base = entry.member.displayName || entry.member.twitchLogin || "?";
  return base.slice(0, 1).toUpperCase();
}

export default function OrganigrammeClient({ entries }: { entries: OrgChartEntry[] }) {
  const [audience, setAudience] = useState<Audience>("public");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [poleFilter, setPoleFilter] = useState<OrgChartPoleKey | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedEntry, setSelectedEntry] = useState<OrgChartEntry | null>(null);

  const baseEntries = useMemo(
    () => [...entries].filter((entry) => entry.isVisible && !entry.isArchived),
    [entries]
  );

  const filteredByRoleAndPole = useMemo(
    () =>
      baseEntries
        .filter((entry) => matchesFilter(entry, activeFilter))
        .filter((entry) =>
          poleFilter === "all"
            ? true
            : (entry.poleKey ? entry.poleKey === poleFilter : false) || entry.secondaryPoleKeys.includes(poleFilter)
        ),
    [baseEntries, activeFilter, poleFilter]
  );

  const visibleEntries = useMemo(
    () => filteredByRoleAndPole.filter((entry) => entryMatchesSearch(entry, searchQuery)),
    [filteredByRoleAndPole, searchQuery]
  );

  const sortByMemberName = (items: OrgChartEntry[]) =>
    [...items].sort((a, b) =>
      (a.member.displayName || a.member.twitchLogin || "").localeCompare(b.member.displayName || b.member.twitchLogin || "", "fr", {
        sensitivity: "base",
      })
    );

  const groupedAll = useMemo(
    () => ({
      founders: sortByMemberName(baseEntries.filter((entry) => entry.roleKey === "FONDATEUR")),
      adminCoordinators: sortByMemberName(baseEntries.filter((entry) => entry.roleKey === "ADMIN_COORDINATEUR")),
      moderators: sortByMemberName(
        baseEntries.filter(
          (entry) =>
            entry.roleKey === "MODERATEUR" ||
            entry.roleKey === "MODERATEUR_EN_FORMATION" ||
            entry.roleKey === "MODERATEUR_EN_PAUSE"
        )
      ),
      support: sortByMemberName(baseEntries.filter((entry) => entry.roleKey === "SOUTIEN_TENF" || entry.statusKey === "SUPPORT")),
    }),
    [baseEntries]
  );

  const grouped = useMemo(
    () => ({
      founders: sortByMemberName(visibleEntries.filter((entry) => entry.roleKey === "FONDATEUR")),
      adminCoordinators: sortByMemberName(visibleEntries.filter((entry) => entry.roleKey === "ADMIN_COORDINATEUR")),
      moderators: sortByMemberName(
        visibleEntries.filter(
          (entry) =>
            entry.roleKey === "MODERATEUR" ||
            entry.roleKey === "MODERATEUR_EN_FORMATION" ||
            entry.roleKey === "MODERATEUR_EN_PAUSE"
        )
      ),
      support: sortByMemberName(visibleEntries.filter((entry) => entry.roleKey === "SOUTIEN_TENF" || entry.statusKey === "SUPPORT")),
    }),
    [visibleEntries]
  );

  const sections: Array<{ key: string; title: string; items: OrgChartEntry[] }> = [
    { key: "founders", title: "Fondateurs", items: grouped.founders },
    { key: "adminCoordinators", title: "Admin coordinateurs", items: grouped.adminCoordinators },
    { key: "moderators", title: "Modérateurs TENF", items: grouped.moderators },
    { key: "support", title: "Soutien TENF", items: grouped.support },
  ].filter((section) => section.items.length > 0);

  const totalVisible = visibleEntries.length;

  const resetFilters = useCallback(() => {
    setActiveFilter("all");
    setPoleFilter("all");
    setSearchQuery("");
  }, []);

  const applyQuickFilter = (key: FilterKey) => {
    setActiveFilter(key);
    setPoleFilter("all");
  };

  const scrollToSection = (key: string) => {
    const el = document.getElementById(`org-${key}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!selectedEntry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEntry(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedEntry]);

  const twitchUrl = selectedEntry?.member.twitchLogin
    ? `https://www.twitch.tv/${encodeURIComponent(selectedEntry.member.twitchLogin)}`
    : null;

  const quickTiles: Array<{ filter: FilterKey; label: string; count: number; hint: string }> = [
    { filter: "direction", label: "Direction", count: groupedAll.founders.length + groupedAll.adminCoordinators.length, hint: "Cap & coordination" },
    { filter: "mod_active", label: "Modération active", count: groupedAll.moderators.filter((e) => e.roleKey === "MODERATEUR").length, hint: "Au quotidien" },
    {
      filter: "mod_training",
      label: "En formation",
      count: groupedAll.moderators.filter((e) => e.roleKey === "MODERATEUR_EN_FORMATION").length,
      hint: "Apprentissage",
    },
    {
      filter: "mod_pause",
      label: "En pause",
      count: groupedAll.moderators.filter((e) => e.roleKey === "MODERATEUR_EN_PAUSE").length,
      hint: "Disponibilités",
    },
    { filter: "support", label: "Soutien TENF", count: groupedAll.support.length, hint: "Hors modération active" },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden py-10 sm:py-12" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="org-bg-mesh" aria-hidden="true" />
      <div className="org-bg-glow org-bg-glow-left" aria-hidden="true" />
      <div className="org-bg-glow org-bg-glow-right" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-3xl border p-8 sm:p-10 lg:p-14 org-fade-up"
          style={{
            borderColor: "var(--color-border)",
            background:
              "radial-gradient(120% 130% at 10% 0%, rgba(59,130,246,0.22), rgba(15,23,42,0.15) 38%, rgba(2,6,23,0.78) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 38%, transparent), transparent 70%)" }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                Carte vivante · Staff TENF
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-5xl md:leading-tight" style={{ color: "var(--color-text)" }}>
                Organigramme interactif
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
                Explore les rôles, les pôles et les profils publics alimentés depuis l&apos;administration. Filtre, recherche,
                change de vue : conçu pour les curieux comme pour les membres qui veulent identifier un interlocuteur.
              </p>

              <div
                className="mt-8 inline-flex rounded-2xl border p-1"
                style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.35)" }}
                role="tablist"
                aria-label="Profil de lecture"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={audience === "public"}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: audience === "public" ? "var(--color-primary)" : "transparent",
                    color: audience === "public" ? "white" : "var(--color-text-secondary)",
                  }}
                  onClick={() => setAudience("public")}
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={16} aria-hidden />
                    Grand public
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={audience === "member"}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: audience === "member" ? "var(--color-primary)" : "transparent",
                    color: audience === "member" ? "white" : "var(--color-text-secondary)",
                  }}
                  onClick={() => setAudience("member")}
                >
                  <span className="inline-flex items-center gap-2">
                    <Users size={16} aria-hidden />
                    Membre TENF
                  </span>
                </button>
              </div>

              <div
                className="mt-4 rounded-2xl border px-4 py-4 sm:px-5"
                style={{ borderColor: "rgba(59,130,246,0.28)", backgroundColor: "rgba(15,23,42,0.5)" }}
              >
                {audience === "public" ? (
                  <p className="text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    <strong style={{ color: "var(--color-text)" }}>Vue transparente :</strong> seuls les profils marqués visibles
                    apparaissent. Clique une carte pour ouvrir le détail ; utilise la carte rapide ci-dessous pour isoler une
                    famille de rôles.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    <strong style={{ color: "var(--color-text)" }}>Pour toi sur Discord :</strong> repère le pôle ou le statut,
                    puis vérifie les salons dédiés pour contacter l&apos;équipe. La recherche fouille aussi dans les bios courtes.
                  </p>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/organisation-staff"
                  className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Organisation &amp; pôles
                  <ArrowRight size={16} aria-hidden />
                </Link>
                {audience === "member" ? (
                  <Link
                    href="/member/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: "var(--color-primary)", color: "white", boxShadow: "0 12px 28px rgba(59,130,246,0.22)" }}
                  >
                    <LayoutDashboard size={16} aria-hidden />
                    Espace membre
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="org-stat-card org-stat-card-lg col-span-2">
                <span className="org-stat-label">Profils affichés (filtres actifs)</span>
                <strong className="org-stat-value text-3xl">{totalVisible}</strong>
              </div>
              <div className="org-stat-card">
                <span className="org-stat-label">Direction</span>
                <strong className="org-stat-value">{groupedAll.founders.length + groupedAll.adminCoordinators.length}</strong>
              </div>
              <div className="org-stat-card">
                <span className="org-stat-label">Modération</span>
                <strong className="org-stat-value">{groupedAll.moderators.length}</strong>
              </div>
              <div className="org-stat-card">
                <span className="org-stat-label">Soutien TENF</span>
                <strong className="org-stat-value">{groupedAll.support.length}</strong>
              </div>
              <div className="org-stat-card">
                <span className="org-stat-label">Total catalogue</span>
                <strong className="org-stat-value">{baseEntries.length}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Carte rapide — filtres visuels */}
        <section className="org-fade-up space-y-4 rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Carte rapide
              </p>
              <h2 className="text-xl font-bold md:text-2xl" style={{ color: "var(--color-text)" }}>
                Un clic = un focus sur une famille de rôles
              </h2>
            </div>
            <button
              type="button"
              onClick={() => applyQuickFilter("all")}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              <RotateCcw size={14} aria-hidden />
              Tout afficher
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:pb-0 md:snap-none">
            {quickTiles.map((tile) => {
              const active = activeFilter === tile.filter && poleFilter === "all" && !searchQuery.trim();
              return (
                <button
                  key={tile.filter}
                  type="button"
                  onClick={() => applyQuickFilter(tile.filter)}
                  className="org-quick-tile min-w-[200px] snap-center rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 md:min-w-0"
                  style={{
                    borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor: active ? "color-mix(in srgb, var(--color-primary) 18%, transparent)" : "rgba(2,6,23,0.35)",
                    boxShadow: active ? "0 14px 32px rgba(59,130,246,0.15)" : undefined,
                  }}
                >
                  <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                    {tile.count}
                  </span>
                  <span className="mt-1 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {tile.label}
                  </span>
                  <span className="mt-1 block text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {tile.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recherche + filtres */}
        <section className="rounded-2xl border p-5 org-fade-up org-filters" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <label htmlFor="org-search" className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Recherche live
              </label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }} aria-hidden />
                <input
                  id="org-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Prénom, pseudo Twitch, pôle, mot dans la bio…"
                  className="w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none ring-offset-2 focus:ring-2"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg)",
                    color: "var(--color-text)",
                    ["--tw-ring-color" as string]: "var(--color-primary)",
                  }}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5"
                    style={{ color: "var(--color-text-secondary)" }}
                    aria-label="Effacer la recherche"
                    onClick={() => setSearchQuery("")}
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 gap-2 rounded-xl border p-1" style={{ borderColor: "var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm"
                style={{
                  backgroundColor: viewMode === "cards" ? "var(--color-primary)" : "transparent",
                  color: viewMode === "cards" ? "white" : "var(--color-text-secondary)",
                }}
                aria-pressed={viewMode === "cards"}
              >
                <LayoutGrid size={16} aria-hidden />
                Grille
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm"
                style={{
                  backgroundColor: viewMode === "compact" ? "var(--color-primary)" : "transparent",
                  color: viewMode === "compact" ? "white" : "var(--color-text-secondary)",
                }}
                aria-pressed={viewMode === "compact"}
              >
                <LayoutList size={16} aria-hidden />
                Compact
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
              Rôle
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FILTERS.map((filter) => {
                const active = activeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    title={filter.description}
                    onClick={() => setActiveFilter(filter.key)}
                    className="rounded-full border px-4 py-2 text-sm transition"
                    style={{
                      borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                      backgroundColor: active ? "var(--color-primary)" : "transparent",
                      color: active ? "white" : "var(--color-text)",
                    }}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
              Pôle (principal ou secondaire)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPoleFilter("all")}
                className="rounded-full border px-3 py-2 text-xs font-semibold sm:text-sm"
                style={{
                  borderColor: poleFilter === "all" ? "var(--color-primary)" : "var(--color-border)",
                  backgroundColor: poleFilter === "all" ? "var(--color-primary)" : "transparent",
                  color: poleFilter === "all" ? "white" : "var(--color-text)",
                }}
              >
                Tous les pôles
              </button>
              {ORG_CHART_POLE_OPTIONS.map((pole) => {
                const active = poleFilter === pole.key;
                const accent = POLE_ACCENTS[pole.key];
                return (
                  <button
                    key={pole.key}
                    type="button"
                    onClick={() => setPoleFilter(pole.key)}
                    className="rounded-full border px-3 py-2 text-xs font-semibold transition sm:text-sm"
                    style={{
                      borderColor: active ? accent : "var(--color-border)",
                      backgroundColor: active ? `${accent}33` : "transparent",
                      color: active ? "var(--color-text)" : "var(--color-text-secondary)",
                      boxShadow: active ? `0 0 0 1px ${accent}55` : undefined,
                    }}
                  >
                    <span aria-hidden>{pole.emoji}</span> {pole.label.replace(/^Pôle /, "")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {totalVisible === 0 ? (
                <span>Aucun résultat — essaie d&apos;élargir les filtres.</span>
              ) : (
                <span>
                  <strong style={{ color: "var(--color-text)" }}>{totalVisible}</strong> profil{totalVisible > 1 ? "s" : ""} correspond
                  {totalVisible > 1 ? "ent" : ""} à ta sélection.
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              <RotateCcw size={15} aria-hidden />
              Réinitialiser tout
            </button>
          </div>
        </section>

        {/* Saut de section */}
        {sections.length > 1 ? (
          <nav
            className="org-fade-up flex flex-wrap gap-2 rounded-2xl border p-3"
            style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.35)" }}
            aria-label="Aller à une section"
          >
            <span className="flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wide sm:w-auto" style={{ color: "var(--color-text-secondary)" }}>
              <Shield size={14} aria-hidden />
              Sections
            </span>
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => scrollToSection(s.key)}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:bg-white/5"
                style={{ borderColor: SECTION_META[s.key]?.accent || "var(--color-border)", color: "var(--color-text)" }}
              >
                {s.title} ({s.items.length})
              </button>
            ))}
          </nav>
        ) : null}

        {sections.length === 0 ? (
          <section className="rounded-2xl border p-10 text-center org-fade-up" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Aucun profil ne correspond à ces critères
            </p>
            <p className="mt-2 max-w-md mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              Élargis la recherche ou réinitialise les filtres pour retrouver l&apos;organigramme complet.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
            >
              Réinitialiser
            </button>
          </section>
        ) : (
          sections.map((section) => (
            <section key={section.key} id={`org-${section.key}`} className="scroll-mt-28 space-y-4 org-fade-up">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
                    {section.title}
                  </h2>
                  <p className="mt-1 text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    {SECTION_META[section.key]?.subtitle}
                  </p>
                </div>
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: SECTION_META[section.key]?.accent || "var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {section.items.length} profil{section.items.length > 1 ? "s" : ""}
                </span>
              </div>

              <div
                className={
                  viewMode === "cards"
                    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-2"
                }
              >
                {section.items.map((entry, index) =>
                  viewMode === "cards" ? (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className="group rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 org-card"
                      style={{
                        borderColor:
                          section.key === "support" ? "rgba(34,197,94,0.35)" : "var(--color-border)",
                        background:
                          section.key === "support"
                            ? "linear-gradient(135deg, rgba(22,163,74,0.14), rgba(15,23,42,0.85) 35%, rgba(2,6,23,0.95) 100%)"
                            : "var(--color-card)",
                        animationDelay: `${Math.min(index * 45, 300)}ms`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {entry.member.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.member.avatarUrl}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-full border object-cover ring-2 ring-transparent transition group-hover:ring-blue-500/35"
                            style={{ borderColor: "var(--color-border)" }}
                          />
                        ) : (
                          <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-lg font-semibold"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          >
                            {initials(entry)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-semibold" style={{ color: "var(--color-text)" }}>
                            {entry.member.displayName}
                          </h3>
                          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            @{entry.member.twitchLogin}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className="rounded-full border px-2 py-1 text-xs"
                          style={{
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-secondary)",
                            backgroundColor: "rgba(148,163,184,0.08)",
                          }}
                        >
                          {entry.roleLabel}
                        </span>
                        <span
                          className="rounded-full border px-2 py-1 text-xs"
                          style={{
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-secondary)",
                            backgroundColor: "rgba(148,163,184,0.08)",
                          }}
                        >
                          {entry.statusLabel}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {entry.bioShort || "Membre actif de l'organisation TENF."}
                      </p>
                      {entry.poleKey ? (
                        <p
                          className="mt-3 text-xs font-semibold"
                          style={{
                            color: section.key === "support" ? "#86efac" : POLE_ACCENTS[entry.poleKey] || "var(--color-primary)",
                          }}
                        >
                          {entry.poleLabel}
                        </p>
                      ) : null}
                      {entry.secondaryPoleKeys.length > 0 ? (
                        <p className="mt-1 text-xs org-secondary-poles" style={{ color: "var(--color-text-secondary)" }}>
                          Multi-pôle : {entry.secondaryPoleKeys.map((pole) => poleTagFromKey(pole).label).join(" · ")}
                        </p>
                      ) : null}
                    </button>
                  ) : (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className="group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition hover:bg-white/[0.04] org-card"
                      style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: "var(--color-card)",
                        animationDelay: `${Math.min(index * 25, 200)}ms`,
                      }}
                    >
                      {entry.member.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.member.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full border object-cover" style={{ borderColor: "var(--color-border)" }} />
                      ) : (
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        >
                          {initials(entry)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                          <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                            {entry.member.displayName}
                          </span>
                          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            @{entry.member.twitchLogin}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="rounded-md px-2 py-0.5 text-[11px]" style={{ backgroundColor: "rgba(148,163,184,0.12)", color: "var(--color-text-secondary)" }}>
                            {entry.roleLabel}
                          </span>
                          {entry.poleLabel ? (
                            <span className="rounded-md px-2 py-0.5 text-[11px]" style={{ backgroundColor: "rgba(59,130,246,0.12)", color: "var(--color-primary)" }}>
                              {entry.poleLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <ArrowRight className="shrink-0 opacity-40 group-hover:opacity-100" size={18} style={{ color: "var(--color-text-secondary)" }} aria-hidden />
                    </button>
                  )
                )}
              </div>
            </section>
          ))
        )}
      </div>

      {selectedEntry ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 org-modal-backdrop"
          style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
          onClick={() => setSelectedEntry(null)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border p-0 sm:rounded-2xl org-modal"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="org-modal-title"
          >
            <div
              className="relative overflow-hidden px-6 pb-5 pt-8 sm:pt-7"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 22%, transparent), rgba(15,23,42,0.95) 55%, var(--color-card) 100%)",
              }}
            >
              <button
                type="button"
                className="absolute right-4 top-4 rounded-lg border p-2 transition hover:bg-white/10"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                aria-label="Fermer"
                onClick={() => setSelectedEntry(null)}
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-4 pr-10">
                {selectedEntry.member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedEntry.member.avatarUrl}
                    alt=""
                    className="h-20 w-20 rounded-full border-2 object-cover shadow-lg"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                ) : (
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full border-2 text-2xl font-bold shadow-lg"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    {initials(selectedEntry)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 id="org-modal-title" className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                    {selectedEntry.member.displayName}
                  </h3>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    @{selectedEntry.member.twitchLogin}
                  </p>
                  {selectedEntry.member.discordUsername ? (
                    <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      Discord · {selectedEntry.member.discordUsername}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 pb-6 pt-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  {selectedEntry.roleLabel}
                </span>
                <span className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  {selectedEntry.statusLabel}
                </span>
                {selectedEntry.poleLabel && selectedEntry.poleKey ? (
                  <span
                    className="rounded-full border px-2.5 py-1 text-xs font-medium"
                    style={{
                      borderColor: POLE_ACCENTS[selectedEntry.poleKey] || "var(--color-border)",
                      color: POLE_ACCENTS[selectedEntry.poleKey] || "var(--color-text-secondary)",
                      backgroundColor: selectedEntry.poleKey ? `${POLE_ACCENTS[selectedEntry.poleKey]}18` : undefined,
                    }}
                  >
                    {selectedEntry.poleLabel}
                  </span>
                ) : null}
                {selectedEntry.secondaryPoleKeys.map((pole) => {
                  const tag = poleTagFromKey(pole);
                  return (
                    <span
                      key={pole}
                      className="rounded-full border px-2.5 py-1 text-xs font-medium"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                    >
                      {tag.emoji} {tag.label}
                    </span>
                  );
                })}
              </div>

              <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {selectedEntry.bioShort || "Aucune bio courte renseignée pour ce profil."}
              </p>

              <div className="flex flex-wrap gap-2">
                {twitchUrl ? (
                  <a
                    href={twitchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:flex-none"
                    style={{ backgroundColor: "#9146ff", color: "white" }}
                  >
                    Chaîne Twitch
                    <ExternalLink size={15} aria-hidden />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold sm:flex-none"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Fermer
                </button>
              </div>
              <p className="text-center text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                Échap pour fermer · Les contacts directs passent par les salons Discord TENF
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .org-bg-mesh {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.3;
          background-image:
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.12), transparent 35%),
            radial-gradient(circle at 80% 10%, rgba(99, 102, 241, 0.1), transparent 30%),
            radial-gradient(circle at 70% 70%, rgba(168, 85, 247, 0.08), transparent 35%);
        }

        .org-bg-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.2;
          animation: orgFloat 8s ease-in-out infinite;
        }

        .org-bg-glow-left {
          left: -120px;
          top: 160px;
          background: rgba(59, 130, 246, 0.35);
        }

        .org-bg-glow-right {
          right: -120px;
          bottom: 120px;
          background: rgba(124, 58, 237, 0.35);
          animation-delay: 1.2s;
        }

        .org-fade-up {
          opacity: 0;
          transform: translateY(10px);
          animation: orgFadeUp 0.55s ease forwards;
        }

        .org-filters {
          position: sticky;
          top: 12px;
          z-index: 20;
          backdrop-filter: blur(10px);
        }

        .org-card {
          opacity: 0;
          transform: translateY(8px);
          animation: orgCardIn 0.45s ease forwards;
          box-shadow: 0 14px 30px rgba(2, 6, 23, 0.25);
        }

        .org-card:hover {
          box-shadow: 0 18px 38px rgba(2, 6, 23, 0.38);
        }

        .org-stat-card {
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 12px 14px;
          background: rgba(2, 6, 23, 0.28);
        }

        .org-stat-card-lg {
          padding: 14px 16px;
        }

        .org-stat-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-text-secondary);
        }

        .org-stat-value {
          display: block;
          margin-top: 6px;
          font-size: 22px;
          line-height: 1;
          color: var(--color-text);
        }

        .org-secondary-poles {
          opacity: 0.85;
        }

        .org-modal-backdrop {
          backdrop-filter: blur(8px);
        }

        .org-modal {
          box-shadow: 0 25px 60px rgba(2, 6, 23, 0.55);
        }

        .org-quick-tile:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        @keyframes orgFadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orgCardIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orgFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-14px);
          }
        }
      `}</style>
    </main>
  );
}
