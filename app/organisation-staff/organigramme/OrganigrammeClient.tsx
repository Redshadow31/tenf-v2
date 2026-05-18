"use client";

import Link from "next/link";
import {
  OrganigrammeLeftRail,
  OrganigrammeRightRail,
  type OrganigrammeRailCounts,
} from "@/components/organisation-staff/OrganigrammePublicRails";
import {
  ArrowRight,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  HeartHandshake,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  PauseCircle,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  getStaffPoleDefinition,
  getStaffRoleDefinition,
  STAFF_NOMENCLATURE_EXPLAINER,
} from "@/lib/staff/staffNomenclature";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrgChartEntry, OrgChartPoleKey, OrgChartStatusKey } from "@/lib/staff/orgChartTypes";
import { ORG_CHART_POLE_OPTIONS, poleLabelFromKey, poleTagFromKey, roleLabelFromKey } from "@/lib/staff/orgChartTypes";
import {
  countOrgChartByFilter,
  matchesOrgChartFilter,
  ORG_CHART_FILTERS,
  ORG_CHART_QUICK_TILES,
  orgChartFilterIcon,
  type OrgChartFilterKey,
} from "@/lib/staff/orgChartFilters";

type Audience = "public" | "member";
type ViewMode = "cards" | "compact";

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
  // Pôles historiques (conservés pour la rétrocompatibilité des données)
  POLE_ANIMATION_EVENTS: "#ec4899",
  POLE_COMMUNICATION_VISUALS: "#06b6d4",
  POLE_FORMATION_COORD_MEMBERS: "#f97316",
  POLE_FORMATION_COORD_STAFF: "#f59e0b",
  POLE_TECH_BOTS: "#a855f7",
  POLE_ACCUEIL_INTEGRATION: "#f97316",
  // Nouveaux pôles introduits par la refonte
  POLE_VISION_PILOTAGE: "#3b82f6",
  POLE_COORDINATION: "#6366f1",
  POLE_VIE_STAFF: "#0ea5e9",
  POLE_VEILLE_SITUATIONS_SENSIBLES: "#ef4444",
};

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
    roleLabelFromKey(entry.roleKey),
    entry.statusLabel,
    entry.poleLabel || "",
    entry.poleKey ? poleLabelFromKey(entry.poleKey) : "",
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

const STATUS_VISUAL: Record<
  OrgChartStatusKey,
  { label: string; accent: string; bg: string }
> = {
  ACTIVE: { label: "Actif", accent: "#22c55e", bg: "rgba(34,197,94,0.14)" },
  TRAINING: { label: "En formation", accent: "#f59e0b", bg: "rgba(245,158,11,0.14)" },
  PAUSED: { label: "En pause", accent: "#94a3b8", bg: "rgba(148,163,184,0.14)" },
  SUPPORT: { label: "Soutien", accent: "#38bdf8", bg: "rgba(56,189,248,0.14)" },
};

/** Pôles uniques (évite les doublons legacy ex. Parcours Membres ×2). */
function collectUniquePoleKeys(entry: OrgChartEntry): OrgChartPoleKey[] {
  const keys: OrgChartPoleKey[] = [];
  if (entry.poleKey) keys.push(entry.poleKey);
  for (const k of entry.secondaryPoleKeys) {
    if (!keys.includes(k)) keys.push(k);
  }
  const seenLabels = new Set<string>();
  return keys.filter((k) => {
    const label = poleLabelFromKey(k);
    if (seenLabels.has(label)) return false;
    seenLabels.add(label);
    return true;
  });
}

function formatBioParagraphs(bio: string): string[] {
  const trimmed = bio.trim();
  if (!trimmed) return [];
  const blocks = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (blocks.length > 1) return blocks;
  if (trimmed.length > 220 && trimmed.includes(". ")) {
    return trimmed.split(/(?<=\.)\s+(?=[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜŸ])/u).map((p) => p.trim()).filter(Boolean);
  }
  return [trimmed];
}

type OrgProfileModalMeta = {
  roleDef: ReturnType<typeof getStaffRoleDefinition>;
  poleKeys: OrgChartPoleKey[];
  poleDefs: NonNullable<ReturnType<typeof getStaffPoleDefinition>>[];
  accent: string;
  statusVisual: (typeof STATUS_VISUAL)[OrgChartStatusKey];
  bioParagraphs: string[];
};

function OrgStaffProfileModal({
  entry,
  meta,
  twitchUrl,
  onClose,
}: {
  entry: OrgChartEntry;
  meta: OrgProfileModalMeta;
  twitchUrl: string | null;
  onClose: () => void;
}) {
  const RoleIcon = meta.roleDef?.Icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6 org-modal-backdrop"
      style={{ backgroundColor: "rgba(2, 6, 23, 0.78)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="org-modal org-modal-panel flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border sm:max-h-[88vh] sm:rounded-3xl"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-modal-title"
      >
        <div
          className="org-modal-hero relative shrink-0 overflow-hidden px-6 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8"
          style={{
            background: `linear-gradient(145deg, color-mix(in srgb, ${meta.accent} 28%, transparent) 0%, rgba(15,23,42,0.92) 42%, var(--color-card) 100%)`,
          }}
        >
          <div
            className="org-modal-glow pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-60"
            style={{ background: `radial-gradient(circle, ${meta.accent}55 0%, transparent 70%)` }}
            aria-hidden
          />
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded-xl border p-2.5 transition hover:scale-105 hover:bg-white/10"
            style={{ borderColor: "color-mix(in srgb, var(--color-border) 80%, white)", color: "var(--color-text-secondary)" }}
            aria-label="Fermer"
            onClick={onClose}
          >
            <X size={20} />
          </button>

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
            <div className="relative shrink-0">
              {entry.member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.member.avatarUrl}
                  alt=""
                  className="org-modal-avatar h-24 w-24 rounded-2xl border-2 object-cover shadow-2xl sm:h-28 sm:w-28"
                  style={{ borderColor: meta.accent }}
                />
              ) : (
                <div
                  className="org-modal-avatar flex h-24 w-24 items-center justify-center rounded-2xl border-2 text-3xl font-bold shadow-2xl sm:h-28 sm:w-28"
                  style={{ borderColor: meta.accent, color: "var(--color-text)" }}
                >
                  {initials(entry)}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2"
                style={{ borderColor: "var(--color-card)", backgroundColor: meta.statusVisual.accent }}
                title={meta.statusVisual.label}
                aria-hidden
              />
            </div>

            <div className="min-w-0 flex-1 pr-12 sm:pr-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: meta.accent }}>
                Profil staff TENF
              </p>
              <h2 id="org-modal-title" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--color-text)" }}>
                {entry.member.displayName}
              </h2>
              <p className="mt-1 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                @{entry.member.twitchLogin}
              </p>
              {entry.member.discordUsername ? (
                <p
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  <MessageCircle size={14} className="opacity-80" aria-hidden />
                  Discord · {entry.member.discordUsername}
                </p>
              ) : null}
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: `${meta.accent}55`, color: meta.accent, backgroundColor: `${meta.accent}18` }}
            >
              {RoleIcon ? <RoleIcon size={14} aria-hidden /> : null}
              {roleLabelFromKey(entry.roleKey)}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                borderColor: `${meta.statusVisual.accent}44`,
                color: meta.statusVisual.accent,
                backgroundColor: meta.statusVisual.bg,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.statusVisual.accent }} aria-hidden />
              {entry.statusLabel || meta.statusVisual.label}
            </span>
            {meta.poleKeys.map((poleKey) => {
              const tag = poleTagFromKey(poleKey);
              const color = POLE_ACCENTS[poleKey] || meta.accent;
              return (
                <span
                  key={poleKey}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{ borderColor: `${color}55`, color, backgroundColor: `${color}14` }}
                >
                  {tag.emoji} {tag.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
          <div className="grid gap-5 lg:grid-cols-5">
            {meta.roleDef ? (
              <section
                className="org-modal-card rounded-2xl border p-4 sm:p-5 lg:col-span-2"
                style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(15,23,42,0.35)" }}
              >
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--color-text)" }}>
                  <Shield size={16} style={{ color: meta.accent }} aria-hidden />
                  Rôle dans TENF
                </h3>
                <p className="mt-2 text-sm font-medium" style={{ color: meta.accent }}>
                  {meta.roleDef.short}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {meta.roleDef.description}
                </p>
              </section>
            ) : null}

            <section
              className={`org-modal-card rounded-2xl border p-4 sm:p-5 ${meta.roleDef ? "lg:col-span-3" : "lg:col-span-5"}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(15,23,42,0.2)" }}
            >
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--color-text)" }}>
                <Sparkles size={16} className="text-amber-300/90" aria-hidden />
                À propos
              </h3>
              {meta.bioParagraphs.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {meta.bioParagraphs.map((paragraph, index) => (
                    <p key={index} className="text-sm leading-relaxed sm:text-[15px]" style={{ color: "var(--color-text-secondary)" }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-relaxed italic" style={{ color: "var(--color-text-secondary)" }}>
                  Ce profil n&apos;a pas encore de bio publique. Passe sur sa chaîne Twitch pour découvrir son univers de stream.
                </p>
              )}
            </section>
          </div>

          {meta.poleDefs.length > 0 ? (
            <section className="mt-6">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--color-text)" }}>
                Pôles &amp; missions
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {meta.poleDefs.map((pole) => {
                  const PoleIcon = pole.Icon;
                  return (
                    <article
                      key={pole.key}
                      className="org-modal-pole rounded-2xl border p-4 transition hover:-translate-y-0.5"
                      style={{
                        borderColor: `${pole.accent}40`,
                        background: `linear-gradient(160deg, ${pole.accent}12 0%, rgba(15,23,42,0.4) 100%)`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                          style={{ backgroundColor: `${pole.accent}22`, color: pole.accent }}
                        >
                          {PoleIcon ? <PoleIcon size={20} aria-hidden /> : pole.emoji}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                            {pole.emoji} {pole.label}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                            {pole.tagline}
                          </p>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1.5 pl-1">
                        {pole.missions.slice(0, 3).map((mission) => (
                          <li key={mission} className="flex gap-2 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                            <span style={{ color: pole.accent }} aria-hidden>
                              •
                            </span>
                            {mission}
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div
            className="org-modal-footer mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {twitchUrl ? (
                <a
                  href={twitchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="org-modal-cta-twitch group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
                >
                  <LayoutDashboard size={18} className="opacity-90" aria-hidden />
                  Voir la chaîne Twitch
                  <ExternalLink size={16} className="opacity-80 transition group-hover:translate-x-0.5" aria-hidden />
                </a>
              ) : null}
              <Link
                href="/organisation-staff"
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-white/5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Comprendre l&apos;organisation
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-white/5 sm:shrink-0"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Fermer
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed sm:text-left" style={{ color: "var(--color-text-secondary)" }}>
            <kbd className="rounded border px-1 py-0.5 text-[10px]" style={{ borderColor: "var(--color-border)" }}>
              Échap
            </kbd>{" "}
            pour fermer · Les échanges staff passent par les salons Discord TENF
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrganigrammeClient({ entries }: { entries: OrgChartEntry[] }) {
  const [audience, setAudience] = useState<Audience>("public");
  const [activeFilter, setActiveFilter] = useState<OrgChartFilterKey>("all");
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
        .filter((entry) => matchesOrgChartFilter(entry, activeFilter))
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

  const isModeratorRole = (entry: OrgChartEntry) =>
    entry.roleKey === "MODERATEUR" ||
    entry.roleKey === "MODERATEUR_AUTONOMIE" ||
    entry.roleKey === "MODERATEUR_ACCOMPAGNEMENT" ||
    entry.roleKey === "MODERATEUR_DECOUVERTE" ||
    entry.roleKey === "MODERATEUR_EN_FORMATION" ||
    entry.roleKey === "MODERATEUR_EN_PAUSE";

  const isSupportRole = (entry: OrgChartEntry) =>
    entry.roleKey === "SOUTIEN_TENF" ||
    entry.roleKey === "CONTRIBUTEUR_INVITE" ||
    entry.statusKey === "SUPPORT";

  const groupedAll = useMemo(
    () => ({
      founders: sortByMemberName(baseEntries.filter((entry) => entry.roleKey === "FONDATEUR")),
      adminCoordinators: sortByMemberName(baseEntries.filter((entry) => entry.roleKey === "ADMIN_COORDINATEUR")),
      moderators: sortByMemberName(baseEntries.filter(isModeratorRole)),
      support: sortByMemberName(baseEntries.filter(isSupportRole)),
    }),
    [baseEntries]
  );

  const grouped = useMemo(
    () => ({
      founders: sortByMemberName(visibleEntries.filter((entry) => entry.roleKey === "FONDATEUR")),
      adminCoordinators: sortByMemberName(visibleEntries.filter((entry) => entry.roleKey === "ADMIN_COORDINATEUR")),
      moderators: sortByMemberName(visibleEntries.filter(isModeratorRole)),
      support: sortByMemberName(visibleEntries.filter(isSupportRole)),
    }),
    [visibleEntries]
  );

  const sections: Array<{ key: string; title: string; items: OrgChartEntry[] }> = [
    { key: "founders", title: "Fondateurs TENF", items: grouped.founders },
    { key: "adminCoordinators", title: "Coordinateurs TENF", items: grouped.adminCoordinators },
    { key: "moderators", title: "Modération", items: grouped.moderators },
    { key: "support", title: "Soutien & invités", items: grouped.support },
  ].filter((section) => section.items.length > 0);

  const totalVisible = visibleEntries.length;

  const resetFilters = useCallback(() => {
    setActiveFilter("all");
    setPoleFilter("all");
    setSearchQuery("");
  }, []);

  const applyQuickFilter = (key: OrgChartFilterKey) => {
    setActiveFilter(key);
    setPoleFilter("all");
  };

  const scrollToSection = (key: string) => {
    const el = document.getElementById(`org-${key}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!selectedEntry) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEntry(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [selectedEntry]);

  const twitchUrl = selectedEntry?.member.twitchLogin
    ? `https://www.twitch.tv/${encodeURIComponent(selectedEntry.member.twitchLogin)}`
    : null;

  const modalMeta = useMemo(() => {
    if (!selectedEntry) return null;
    const roleDef = getStaffRoleDefinition(selectedEntry.roleKey);
    const poleKeys = collectUniquePoleKeys(selectedEntry);
    const poleDefs = poleKeys
      .map((key) => getStaffPoleDefinition(key))
      .filter((def): def is NonNullable<typeof def> => Boolean(def));
    const primaryPoleKey = selectedEntry.poleKey ?? poleKeys[0];
    const accent =
      roleDef?.accent ||
      (primaryPoleKey ? POLE_ACCENTS[primaryPoleKey] : undefined) ||
      "#6366f1";
    const statusVisual = STATUS_VISUAL[selectedEntry.statusKey] ?? STATUS_VISUAL.ACTIVE;
    const bioParagraphs = formatBioParagraphs(selectedEntry.bioShort);
    return { roleDef, poleKeys, poleDefs, accent, statusVisual, bioParagraphs };
  }, [selectedEntry]);

  const railCounts: OrganigrammeRailCounts = useMemo(
    () => ({
      founders: groupedAll.founders.length,
      adminCoordinators: groupedAll.adminCoordinators.length,
      moderators: groupedAll.moderators.length,
      support: groupedAll.support.length,
      total: baseEntries.length,
    }),
    [groupedAll, baseEntries.length]
  );

  const quickTiles = useMemo(
    () =>
      ORG_CHART_QUICK_TILES.map((tile) => ({
        ...tile,
        count: countOrgChartByFilter(baseEntries, tile.filter),
      })),
    [baseEntries],
  );

  return (
    <main className="org-page relative min-h-screen w-full overflow-x-hidden py-6 sm:py-8 lg:py-10" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="org-bg-mesh" aria-hidden="true" />
      <div className="org-bg-glow org-bg-glow-left" aria-hidden="true" />
      <div className="org-bg-glow org-bg-glow-right" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[min(100%,1920px)] px-[clamp(0.65rem,1.35vw,1.85rem)]">
        <nav
          className="org-fade-up mb-6 flex flex-wrap items-center gap-2 text-sm"
          aria-label="Fil d'Ariane"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <Link href="/" className="transition hover:underline" style={{ color: "var(--color-text-secondary)" }}>
            Accueil
          </Link>
          <ChevronRight size={14} className="opacity-50" aria-hidden />
          <Link href="/organisation-staff" className="transition hover:underline" style={{ color: "var(--color-text-secondary)" }}>
            Staff &amp; organisation
          </Link>
          <ChevronRight size={14} className="opacity-50" aria-hidden />
          <span style={{ color: "var(--color-text)" }}>Organigramme</span>
        </nav>

        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-3xl border p-8 sm:p-10 lg:p-12 org-fade-up mb-8 lg:mb-10"
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
              <p className="mt-4 max-w-3xl text-base leading-relaxed md:text-lg xl:max-w-none" style={{ color: "var(--color-text-secondary)" }}>
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

        <div className="org-workspace grid grid-cols-1 gap-6 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2.4fr)_minmax(250px,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[minmax(240px,18rem)_minmax(0,1fr)_minmax(280px,22rem)] xl:gap-6 2xl:grid-cols-[minmax(260px,20rem)_minmax(0,1fr)_minmax(300px,24rem)]">
          <aside className="hidden lg:block lg:sticky lg:top-20 lg:z-10 lg:self-start lg:pr-1">
            <OrganigrammeLeftRail
              audience={audience}
              sections={sections.map((s) => ({ key: s.key, title: s.title, count: s.items.length }))}
              activeFilter={activeFilter}
              onScrollToSection={scrollToSection}
              onApplyFilter={applyQuickFilter}
              onReset={resetFilters}
            />
          </aside>

          <div className="min-w-0 space-y-8">
            <details
              className="org-fade-up rounded-2xl border p-4 lg:hidden"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
            >
              <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Guide, structure &amp; navigation
              </summary>
              <div className="mt-4">
                <OrganigrammeLeftRail
                  audience={audience}
                  sections={sections.map((s) => ({ key: s.key, title: s.title, count: s.items.length }))}
                  activeFilter={activeFilter}
                  onScrollToSection={scrollToSection}
                  onApplyFilter={applyQuickFilter}
                  onReset={resetFilters}
                />
              </div>
            </details>

            <section
              className="org-fade-up rounded-2xl border p-5 md:p-6 lg:hidden"
              style={{
                borderColor: "rgba(168,85,247,0.28)",
                background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(2,6,23,0.55) 50%, rgba(59,130,246,0.06))",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                Comprendre en 30 secondes
              </p>
              <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {STAFF_NOMENCLATURE_EXPLAINER.intro}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {STAFF_NOMENCLATURE_EXPLAINER.examples.map((ex) => (
                  <p
                    key={ex}
                    className="rounded-xl border px-3 py-2.5 text-xs leading-relaxed"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "rgba(2,6,23,0.35)" }}
                  >
                    {ex}
                  </p>
                ))}
              </div>
            </section>

        {/* Carte rapide — filtres visuels */}
        <section className="org-panel-quick org-fade-up relative overflow-hidden rounded-3xl border border-white/[0.07] p-6 shadow-[0_24px_56px_rgba(0,0,0,0.28)] md:p-8">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.35), transparent 68%)" }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" aria-hidden />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-300">
                <Zap className="h-3.5 w-3.5" aria-hidden />
                Carte rapide
              </p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl" style={{ color: "var(--color-text)" }}>
                Un clic = un focus sur un palier de rôle TENF
              </h2>
              <p className="mt-1.5 max-w-xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Compteurs en temps réel selon la nomenclature staff (fondateurs, coordinateurs, paliers modération, appui).
              </p>
            </div>
            <button
              type="button"
              onClick={() => applyQuickFilter("all")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition hover:border-violet-400/35 hover:bg-violet-500/10"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <RotateCcw size={14} aria-hidden />
              Tout afficher
            </button>
          </div>
          <div className="relative mt-6 flex gap-3 overflow-x-auto pb-1 pt-1 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 sm:snap-none lg:grid-cols-3 2xl:grid-cols-6 2xl:gap-4">
            {quickTiles.map((tile) => {
              const active = activeFilter === tile.filter && poleFilter === "all" && !searchQuery.trim();
              const TileIcon = tile.Icon;
              return (
                <button
                  key={tile.filter}
                  type="button"
                  onClick={() => applyQuickFilter(tile.filter)}
                  className={`org-quick-tile group relative flex min-h-[8.25rem] min-w-[11.5rem] snap-center flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-1 md:min-w-0 ${active ? "org-quick-tile--active" : ""}`}
                  style={{
                    borderColor: active ? `${tile.accent}99` : "rgba(148,163,184,0.18)",
                    background: active
                      ? `linear-gradient(152deg, ${tile.accent}30 0%, rgba(15,23,42,0.9) 48%, rgba(2,6,23,0.96) 100%)`
                      : "linear-gradient(152deg, rgba(30,41,59,0.55) 0%, rgba(2,6,23,0.72) 100%)",
                    boxShadow: active
                      ? `0 16px 42px ${tile.accent}28, inset 0 1px 0 ${tile.accent}66`
                      : "inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    className="absolute inset-x-0 top-0 h-[3px] opacity-90"
                    style={{ background: `linear-gradient(90deg, transparent, ${tile.accent}, transparent)` }}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]"
                      style={{ backgroundColor: `${tile.accent}22`, color: tile.accent }}
                    >
                      <TileIcon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                    </span>
                    {active ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: `${tile.accent}33`, color: tile.accent }}
                      >
                        Actif
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-bold tabular-nums leading-none" style={{ color: "var(--color-text)" }}>
                      {tile.count}
                    </span>
                    <span className="mt-2 block text-sm font-semibold leading-snug" style={{ color: "var(--color-text)" }}>
                      {tile.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      {tile.hint}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recherche + filtres */}
        <section className="org-panel-filters org-fade-up org-filters relative overflow-hidden rounded-3xl border border-white/[0.07] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.26)] md:p-6">
          <div
            className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)" }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/35 to-transparent" aria-hidden />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <label htmlFor="org-search" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-300">
                <Search className="h-3.5 w-3.5" aria-hidden />
                Recherche live
              </label>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  id="org-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Prénom, pseudo Twitch, pôle, mot dans la bio…"
                  className="org-search-input w-full rounded-2xl border py-3.5 pl-11 pr-11 text-sm outline-none transition focus:ring-2 focus:ring-violet-500/40"
                  style={{
                    borderColor: "rgba(148,163,184,0.22)",
                    backgroundColor: "rgba(2,6,23,0.55)",
                    color: "var(--color-text)",
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
            <div className="org-view-toggle flex shrink-0 gap-1 rounded-2xl border border-white/10 bg-black/25 p-1">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${viewMode === "cards" ? "shadow-md" : ""}`}
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
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${viewMode === "compact" ? "shadow-md" : ""}`}
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

          <div className="org-filter-block relative mt-6 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <Shield className="h-3.5 w-3.5 text-violet-400" aria-hidden />
              Rôle
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ORG_CHART_FILTERS.map((filter) => {
                const active = activeFilter === filter.key;
                const RoleIcon = orgChartFilterIcon(filter.key);
                return (
                  <button
                    key={filter.key}
                    type="button"
                    title={filter.description}
                    onClick={() => setActiveFilter(filter.key)}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition hover:brightness-110"
                    style={{
                      borderColor: active ? "color-mix(in srgb, var(--color-primary) 70%, transparent)" : "rgba(148,163,184,0.22)",
                      background: active
                        ? "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 65%, #6366f1))"
                        : "rgba(2,6,23,0.35)",
                      color: active ? "white" : "var(--color-text)",
                      boxShadow: active ? "0 8px 24px rgba(99,102,241,0.25)" : undefined,
                    }}
                  >
                    {RoleIcon ? <RoleIcon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden /> : null}
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="org-filter-block relative mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden />
              Pôle (principal ou secondaire)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPoleFilter("all")}
                className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition hover:brightness-110 sm:text-sm"
                style={{
                  borderColor: poleFilter === "all" ? "color-mix(in srgb, var(--color-primary) 70%, transparent)" : "rgba(148,163,184,0.22)",
                  background: poleFilter === "all"
                    ? "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 65%, #6366f1))"
                    : "rgba(2,6,23,0.35)",
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
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition hover:brightness-110 sm:text-sm"
                    style={{
                      borderColor: active ? accent : "rgba(148,163,184,0.22)",
                      backgroundColor: active ? `${accent}40` : "rgba(2,6,23,0.35)",
                      color: active ? "var(--color-text)" : "var(--color-text-secondary)",
                      boxShadow: active ? `0 6px 20px ${accent}33, inset 0 0 0 1px ${accent}66` : undefined,
                    }}
                  >
                    <span aria-hidden>{pole.emoji}</span>
                    {pole.label.replace(/^Pôle /, "")}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="org-filter-footer relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5"
            style={{ borderColor: "rgba(59,130,246,0.22)", background: "linear-gradient(90deg, rgba(59,130,246,0.08), rgba(99,102,241,0.05))" }}
          >
            <p className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {totalVisible === 0 ? (
                <span>Aucun résultat — essaie d&apos;élargir les filtres.</span>
              ) : (
                <>
                  <span
                    className="inline-flex min-w-[2.25rem] items-center justify-center rounded-xl px-2.5 py-1 text-sm font-bold tabular-nums text-white shadow-md"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), #6366f1)" }}
                  >
                    {totalVisible}
                  </span>
                  <span>
                    profil{totalVisible > 1 ? "s" : ""} correspond{totalVisible > 1 ? "ent" : ""} à ta sélection
                  </span>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold transition hover:border-violet-400/35 hover:bg-violet-500/10"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <RotateCcw size={15} aria-hidden />
              Réinitialiser tout
            </button>
          </div>
        </section>

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
                    ? "org-staff-cards flex flex-wrap justify-center gap-3 sm:gap-4"
                    : "flex flex-col gap-2"
                }
              >
                {section.items.map((entry, index) =>
                  viewMode === "cards" ? (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className="org-staff-card group relative w-full min-w-0 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 org-card"
                      style={{
                        borderColor:
                          section.key === "support" ? "rgba(34,197,94,0.35)" : "var(--color-border)",
                        background:
                          section.key === "support"
                            ? "linear-gradient(135deg, rgba(22,163,74,0.14), rgba(15,23,42,0.85) 35%, rgba(2,6,23,0.95) 100%)"
                            : "linear-gradient(180deg, color-mix(in srgb, var(--color-card) 100%, transparent) 0%, rgba(2,6,23,0.92) 100%)",
                        animationDelay: `${Math.min(index * 45, 300)}ms`,
                        boxShadow: `inset 0 3px 0 0 ${SECTION_META[section.key]?.accent || "var(--color-primary)"}`,
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
                          {roleLabelFromKey(entry.roleKey)}
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
                          {poleLabelFromKey(entry.poleKey)}
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
                            {roleLabelFromKey(entry.roleKey)}
                          </span>
                          {entry.poleKey ? (
                            <span className="rounded-md px-2 py-0.5 text-[11px]" style={{ backgroundColor: "rgba(59,130,246,0.12)", color: "var(--color-primary)" }}>
                              {poleLabelFromKey(entry.poleKey)}
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

            <details
              className="org-fade-up rounded-2xl border p-4 lg:hidden"
              style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.45)" }}
            >
              <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Légende, stats &amp; aide
              </summary>
              <div className="mt-4">
                <OrganigrammeRightRail
                  counts={railCounts}
                  poleFilter={poleFilter}
                  poleAccents={POLE_ACCENTS}
                  totalVisible={totalVisible}
                  activeFilter={activeFilter}
                  onPoleFilter={setPoleFilter}
                  onReset={resetFilters}
                />
              </div>
            </details>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-20 lg:z-10 lg:self-start lg:pl-1">
            <OrganigrammeRightRail
              counts={railCounts}
              poleFilter={poleFilter}
              poleAccents={POLE_ACCENTS}
              totalVisible={totalVisible}
              activeFilter={activeFilter}
              onPoleFilter={setPoleFilter}
              onReset={resetFilters}
            />
          </aside>
        </div>
      </div>

      {selectedEntry && modalMeta ? (
        <OrgStaffProfileModal
          entry={selectedEntry}
          meta={modalMeta}
          twitchUrl={twitchUrl}
          onClose={() => setSelectedEntry(null)}
        />
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

        .org-page {
          width: 100%;
        }

        .org-workspace {
          width: 100%;
        }

        .org-bg-glow-left {
          left: max(-80px, calc(50% - 52rem));
          top: 12%;
          width: min(420px, 28vw);
          height: min(420px, 40vh);
          background: rgba(59, 130, 246, 0.4);
        }

        .org-bg-glow-right {
          right: max(-80px, calc(50% - 52rem));
          bottom: 8%;
          width: min(420px, 28vw);
          height: min(420px, 40vh);
          background: rgba(124, 58, 237, 0.38);
          animation-delay: 1.2s;
        }

        @media (min-width: 1024px) {
          .org-workspace > aside {
            border-radius: 1rem;
            border: 1px solid color-mix(in srgb, var(--color-border) 85%, transparent);
            background: linear-gradient(
              180deg,
              rgba(2, 6, 23, 0.55) 0%,
              rgba(2, 6, 23, 0.28) 100%
            );
            padding: 0.65rem;
          }
        }

        .org-fade-up {
          opacity: 0;
          transform: translateY(10px);
          animation: orgFadeUp 0.55s ease forwards;
        }

        .org-panel-quick {
          background: linear-gradient(
            165deg,
            rgba(59, 130, 246, 0.1) 0%,
            rgba(15, 23, 42, 0.92) 42%,
            rgba(2, 6, 23, 0.98) 100%
          );
        }

        .org-panel-filters {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(2, 6, 23, 0.97) 100%);
          backdrop-filter: blur(14px);
        }

        .org-filters {
          position: sticky;
          top: 12px;
          z-index: 20;
        }

        .org-search-input:focus {
          border-color: color-mix(in srgb, var(--color-primary) 55%, transparent) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
        }

        .org-quick-tile--active {
          transform: translateY(-2px);
        }

        /* Jusqu'à 4 cartes par ligne (xl+), lignes incomplètes centrées */
        .org-staff-card {
          max-width: 320px;
        }
        @media (min-width: 640px) {
          .org-staff-cards {
            --org-card-gap: 1rem;
          }
          .org-staff-card {
            max-width: none;
            width: calc((100% - var(--org-card-gap)) / 2);
          }
        }
        @media (min-width: 1024px) {
          .org-staff-card {
            width: calc((100% - 2 * var(--org-card-gap)) / 3);
          }
        }
        @media (min-width: 1280px) {
          .org-staff-card {
            width: calc((100% - 3 * var(--org-card-gap)) / 4);
          }
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
          backdrop-filter: blur(12px) saturate(1.1);
        }

        .org-modal {
          box-shadow: 0 25px 60px rgba(2, 6, 23, 0.55);
        }

        .org-modal-panel {
          animation: orgModalIn 0.38s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .org-modal-avatar {
          box-shadow: 0 18px 36px rgba(2, 6, 23, 0.45);
        }

        .org-modal-card {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .org-modal-pole:hover {
          box-shadow: 0 14px 32px rgba(2, 6, 23, 0.35);
        }

        .org-modal-cta-twitch {
          background: linear-gradient(135deg, #9146ff 0%, #772ce8 52%, #5c16c5 100%);
          box-shadow: 0 12px 28px rgba(145, 70, 255, 0.38);
        }

        .org-modal-cta-twitch:hover {
          box-shadow: 0 16px 36px rgba(145, 70, 255, 0.48);
        }

        @keyframes orgModalIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
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
