"use client";

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Filter,
  LayoutGrid,
  List,
  Network,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { getAdminRoleToggleClass, type AdminRole } from "@/lib/adminRoles";
import type { OrgChartEntry, OrgChartMemberRef, OrgChartPoleKey, OrgChartRoleKey } from "@/lib/staff/orgChartTypes";
import {
  ORG_CHART_POLE_OPTIONS,
  ORG_CHART_ROLE_OPTIONS,
  ORG_CHART_STATUS_OPTIONS,
  poleLabelFromKey,
  poleTagFromKey,
  roleLabelFromKey,
  statusLabelFromKey,
} from "@/lib/staff/orgChartTypes";

export type OrgChartVisibilityFilter = "all" | "visible" | "hidden" | "archived" | "drafts" | "attention";
export type OrgChartLayoutView = "grouped" | "list";

const inputClass =
  "w-full min-h-[2.75rem] rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25";

const POLE_DOT: Record<string, string> = {
  POLE_VISION_PILOTAGE: "bg-blue-500",
  POLE_COORDINATION: "bg-indigo-500",
  POLE_VIE_STAFF: "bg-sky-500",
  POLE_FORMATION_COORD_STAFF: "bg-amber-500",
  POLE_ACCUEIL_INTEGRATION: "bg-orange-500",
  POLE_ANIMATION_EVENTS: "bg-pink-500",
  POLE_COMMUNICATION_VISUALS: "bg-cyan-500",
  POLE_TECH_BOTS: "bg-purple-500",
  POLE_VEILLE_SITUATIONS_SENSIBLES: "bg-red-500",
};

export function orgChartEntryNeedsAttention(entry: OrgChartEntry): boolean {
  if (entry.id.startsWith("draft-")) return true;
  if (entry.isArchived && entry.isVisible) return true;
  if (entry.roleKey !== "SOUTIEN_TENF" && !entry.poleKey) return true;
  return false;
}

function getRoleBadgeClass(roleKey: OrgChartRoleKey): string {
  switch (roleKey) {
    case "FONDATEUR":
      return "role-badge role-badge--staff-founder role-badge--animated";
    case "ADMIN_COORDINATEUR":
      return "role-badge role-badge--staff-coordinator role-badge--animated";
    case "MODERATEUR":
    case "MODERATEUR_AUTONOMIE":
      return "role-badge role-badge--staff-moderator role-badge--animated";
    case "MODERATEUR_ACCOMPAGNEMENT":
    case "MODERATEUR_DECOUVERTE":
      return "role-badge role-badge--staff-trainee role-badge--animated";
    case "MODERATEUR_EN_PAUSE":
      return "role-badge role-badge--staff-paused role-badge--animated";
    default:
      return "role-badge role-badge--active-support role-badge--animated";
  }
}

function StatusPill({ ok, label, warn }: { ok: boolean; label: string; warn?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${
        ok
          ? "border-emerald-800/50 bg-emerald-950/40 text-emerald-200"
          : warn
            ? "border-amber-800/50 bg-amber-950/35 text-amber-200"
            : "border-zinc-700/80 bg-zinc-900/60 text-zinc-500"
      }`}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : warn ? <AlertTriangle className="h-3 w-3" /> : null}
      {label}
    </span>
  );
}

function MemberAvatar({ entry, size = "md" }: { entry: OrgChartEntry; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-14 w-14 text-lg";
  const name = entry.member.displayName || entry.member.twitchLogin || "?";
  if (entry.member.avatarUrl) {
    return <img src={entry.member.avatarUrl} alt="" className={`${dim} shrink-0 rounded-2xl object-cover ring-2 ring-zinc-700/80`} />;
  }
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 font-bold text-white`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function EntrySummaryCard({
  entry,
  selected,
  onSelect,
  saving,
}: {
  entry: OrgChartEntry;
  selected: boolean;
  onSelect: () => void;
  saving: boolean;
}) {
  const attention = orgChartEntryNeedsAttention(entry);
  const isDraft = entry.id.startsWith("draft-");
  const pole = entry.poleKey ? poleTagFromKey(entry.poleKey) : null;

  return (
    <article
      className={`flex flex-col rounded-2xl border bg-zinc-950/60 p-4 shadow-lg transition ${
        selected
          ? "border-violet-500/50 ring-2 ring-violet-500/20"
          : attention
            ? "border-amber-500/25 hover:border-amber-500/40"
            : "border-zinc-800/90 hover:border-zinc-600"
      } ${saving ? "opacity-60" : ""}`}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 text-left">
        <MemberAvatar entry={entry} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-zinc-50">{entry.member.displayName}</p>
          <p className="truncate text-sm text-zinc-400">@{entry.member.twitchLogin}</p>
          {entry.member.discordUsername ? (
            <p className="mt-0.5 truncate text-[10px] text-zinc-600">{entry.member.discordUsername}</p>
          ) : null}
        </div>
      </button>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusPill ok={entry.isVisible && !entry.isArchived} label="Public" warn={entry.isArchived} />
        <StatusPill ok={!!entry.poleKey || entry.roleKey === "SOUTIEN_TENF"} label="Pôle" />
        <StatusPill ok={!isDraft} label="Sauvé" warn={isDraft} />
        {entry.isArchived ? (
          <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
            <Archive className="h-3 w-3" />
            Archivé
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={getRoleBadgeClass(entry.roleKey)}>{roleLabelFromKey(entry.roleKey)}</span>
        {pole ? (
          <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-900/50 px-2 py-0.5 text-[10px] text-zinc-300">
            {pole.emoji} {pole.label}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export type OrganigrammeStaffWorkspaceProps = {
  entries: OrgChartEntry[];
  filteredCount: number;
  groupedByRole: { role: OrgChartRoleKey; members: OrgChartEntry[] }[];
  sortedFilteredList: OrgChartEntry[];
  selectedEntry: OrgChartEntry | null;
  selectedEntryId: string | null;
  onSelectEntry: (id: string | null) => void;
  roleCounts: Map<OrgChartRoleKey, number>;
  attentionCount: number;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  tableSearch: string;
  onTableSearchChange: (v: string) => void;
  roleFilter: "all" | OrgChartRoleKey;
  onRoleFilterChange: (v: "all" | OrgChartRoleKey) => void;
  visibilityFilter: OrgChartVisibilityFilter;
  onVisibilityFilterChange: (v: OrgChartVisibilityFilter) => void;
  poleFilter: "all" | OrgChartPoleKey;
  onPoleFilterChange: (v: "all" | OrgChartPoleKey) => void;
  layoutView: OrgChartLayoutView;
  onLayoutViewChange: (v: OrgChartLayoutView) => void;
  collapsedRoles: Set<OrgChartRoleKey>;
  onToggleRoleSection: (role: OrgChartRoleKey) => void;
  isAdding: boolean;
  onToggleAdding: () => void;
  addQuery: string;
  onAddQueryChange: (v: string) => void;
  addSearching: boolean;
  addResults: OrgChartMemberRef[];
  onPickMember: (member: OrgChartMemberRef) => void;
  savingId: string | null;
  onSave: (entry: OrgChartEntry) => void;
  onRemove: (entry: OrgChartEntry) => void;
  onUpdateEntry: (id: string, patch: Partial<OrgChartEntry>) => void;
};

export default function OrganigrammeStaffWorkspace(props: OrganigrammeStaffWorkspaceProps) {
  const {
    entries,
    filteredCount,
    groupedByRole,
    sortedFilteredList,
    selectedEntry,
    onSelectEntry,
    roleCounts,
    attentionCount,
    loading,
    refreshing,
    onRefresh,
    tableSearch,
    onTableSearchChange,
    roleFilter,
    onRoleFilterChange,
    visibilityFilter,
    onVisibilityFilterChange,
    poleFilter,
    onPoleFilterChange,
    layoutView,
    onLayoutViewChange,
    collapsedRoles,
    onToggleRoleSection,
    isAdding,
    onToggleAdding,
    addQuery,
    onAddQueryChange,
    addSearching,
    addResults,
    onPickMember,
    savingId,
    onSave,
    onRemove,
    onUpdateEntry,
  } = props;

  const selected = selectedEntry;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <section className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/55 shadow-xl">
          <div className="border-b border-zinc-800/80 bg-zinc-900/50 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-100">
              <Filter className="h-4 w-4 text-violet-400" />
              Filtres
            </h2>
          </div>
          <div className="space-y-3 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                value={tableSearch}
                onChange={(e) => onTableSearchChange(e.target.value)}
                placeholder="Pseudo, Twitch, Discord…"
                className={`${inputClass} pl-10 text-sm`}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "all" as const, label: "Tous" },
                  { key: "visible" as const, label: "Publics" },
                  { key: "hidden" as const, label: "Masqués" },
                  { key: "archived" as const, label: "Archivés" },
                  { key: "drafts" as const, label: `Brouillons (${entries.filter((e) => e.id.startsWith("draft-")).length})` },
                  { key: "attention" as const, label: `À vérifier (${attentionCount})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onVisibilityFilterChange(f.key)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    visibilityFilter === f.key
                      ? "border-violet-500/50 bg-violet-950/50 text-violet-100"
                      : "border-zinc-700/80 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {attentionCount > 0 ? (
              <p className="text-[11px] text-amber-300/90">
                {attentionCount} entrée{attentionCount > 1 ? "s" : ""} à vérifier (brouillon, pôle ou visibilité).
              </p>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/55 shadow-xl">
          <div className="border-b border-zinc-800/80 bg-zinc-900/50 p-4">
            <h2 className="text-sm font-bold text-zinc-100">Par rôle affiché</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{entries.length} entrées au total</p>
          </div>
          <nav className="max-h-[min(40vh,360px)] space-y-0.5 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => onRoleFilterChange("all")}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                roleFilter === "all" ? "bg-violet-950/50 text-violet-100" : "text-zinc-400 hover:bg-zinc-900/80"
              }`}
            >
              Tous les rôles
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs tabular-nums">{entries.length}</span>
            </button>
            {ORG_CHART_ROLE_OPTIONS.map(({ key: role }) => {
              const count = roleCounts.get(role) ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onRoleFilterChange(role)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    roleFilter === role ? "bg-violet-950/50 text-violet-100" : "text-zinc-400 hover:bg-zinc-900/80"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${getAdminRoleToggleClass(role as AdminRole).split(" ")[0]}`}
                  />
                  <span className="min-w-0 flex-1 truncate">{roleLabelFromKey(role)}</span>
                  <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs tabular-nums">{count}</span>
                </button>
              );
            })}
          </nav>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/55 shadow-xl">
          <div className="border-b border-zinc-800/80 bg-zinc-900/50 p-4">
            <h2 className="text-sm font-bold text-zinc-100">Par pôle</h2>
          </div>
          <nav className="max-h-[min(35vh,280px)] space-y-0.5 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => onPoleFilterChange("all")}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                poleFilter === "all" ? "bg-violet-950/50 text-violet-100" : "text-zinc-400 hover:bg-zinc-900/80"
              }`}
            >
              Tous les pôles
            </button>
            {ORG_CHART_POLE_OPTIONS.map((pole) => (
              <button
                key={pole.key}
                type="button"
                onClick={() => onPoleFilterChange(pole.key)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                  poleFilter === pole.key ? "bg-violet-950/50 text-violet-100" : "text-zinc-400 hover:bg-zinc-900/80"
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${POLE_DOT[pole.key] || "bg-zinc-500"}`} />
                <span className="min-w-0 flex-1 truncate">
                  {pole.emoji} {pole.label}
                </span>
              </button>
            ))}
          </nav>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/55 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 bg-gradient-to-r from-violet-950/30 to-zinc-900/50 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-50">
              <UserPlus className="h-4 w-4 text-violet-400" />
              Ajouter un membre
            </h2>
            <button
              type="button"
              onClick={onToggleAdding}
              className="rounded-lg border border-violet-500/40 bg-violet-950/40 px-2.5 py-1 text-xs font-bold text-violet-100"
            >
              {isAdding ? "Fermer" : "Ouvrir"}
            </button>
          </div>
          {isAdding ? (
            <div className="space-y-3 p-4">
              <p className="text-[11px] leading-relaxed text-zinc-500">
                Membre déjà présent dans la gestion membres. Recherche par pseudo Twitch, display name ou Discord (min. 2 caractères).
              </p>
              <input
                type="text"
                value={addQuery}
                onChange={(e) => onAddQueryChange(e.target.value)}
                placeholder="Rechercher…"
                className={inputClass}
              />
              {addSearching ? <p className="text-xs text-zinc-500">Recherche…</p> : null}
              {addQuery.trim().length >= 2 && !addSearching && addResults.length === 0 ? (
                <p className="text-xs text-zinc-500">Aucun membre disponible pour cet ajout.</p>
              ) : null}
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-zinc-800/80 p-1">
                {addResults.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => onPickMember(member)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-200 hover:bg-violet-950/30"
                    >
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-800/50 text-xs font-bold text-white">
                          {(member.displayName || "?").charAt(0)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{member.displayName}</span>
                        <span className="block truncate text-[10px] text-zinc-500">@{member.twitchLogin}</span>
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-violet-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <Link
          href="/organisation-staff/organigramme"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-950/50 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-violet-500/40 hover:text-violet-200"
        >
          <ExternalLink className="h-4 w-4" />
          Aperçu public
        </Link>
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-violet-400" />
            <div>
              <p className="text-sm font-bold text-zinc-50">Entrées organigramme</p>
              <p className="text-xs text-zinc-500">
                {filteredCount} affiché{filteredCount !== 1 ? "s" : ""} sur {entries.length}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-zinc-700/80 p-0.5">
              <button
                type="button"
                onClick={() => onLayoutViewChange("grouped")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  layoutView === "grouped" ? "bg-violet-950/60 text-violet-100" : "text-zinc-500"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Par rôle
              </button>
              <button
                type="button"
                onClick={() => onLayoutViewChange("list")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  layoutView === "list" ? "bg-violet-950/60 text-violet-100" : "text-zinc-500"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Liste
              </button>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-600/80 px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Rafraîchir
            </button>
          </div>
        </div>

        {selected ? (
          <section className="rounded-2xl border border-violet-500/30 bg-violet-950/15 p-4 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <MemberAvatar entry={selected} size="lg" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-zinc-50">{selected.member.displayName}</h3>
                  <p className="text-sm text-zinc-400">@{selected.member.twitchLogin}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={getRoleBadgeClass(selected.roleKey)}>{roleLabelFromKey(selected.roleKey)}</span>
                    {selected.id.startsWith("draft-") ? (
                      <span className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                        Brouillon
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectEntry(null)}
                className="rounded-lg border border-zinc-700/80 p-2 text-zinc-400 hover:text-zinc-100"
                aria-label="Fermer le détail"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">Rôle affiché</span>
                <select
                  value={selected.roleKey}
                  onChange={(e) => {
                    const roleKey = e.target.value as OrgChartRoleKey;
                    onUpdateEntry(selected.id, { roleKey, roleLabel: roleLabelFromKey(roleKey) });
                  }}
                  className={inputClass}
                >
                  {ORG_CHART_ROLE_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">Statut affiché</span>
                <select
                  value={selected.statusKey}
                  onChange={(e) => {
                    const statusKey = e.target.value as OrgChartEntry["statusKey"];
                    onUpdateEntry(selected.id, {
                      statusKey,
                      statusLabel: statusLabelFromKey(statusKey),
                    });
                  }}
                  className={inputClass}
                >
                  {ORG_CHART_STATUS_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                  Pôle principal {selected.roleKey === "SOUTIEN_TENF" ? "(optionnel)" : ""}
                </span>
                <select
                  value={selected.poleKey || ""}
                  onChange={(e) => {
                    const poleKey = (e.target.value || null) as OrgChartPoleKey | null;
                    onUpdateEntry(selected.id, {
                      poleKey,
                      poleLabel: poleKey ? poleLabelFromKey(poleKey) : null,
                      secondaryPoleKeys: poleKey
                        ? selected.secondaryPoleKeys.filter((key) => key !== poleKey)
                        : selected.secondaryPoleKeys,
                    });
                  }}
                  className={inputClass}
                >
                  {selected.roleKey === "SOUTIEN_TENF" ? <option value="">Aucun pôle</option> : null}
                  {ORG_CHART_POLE_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.emoji} {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Pôles secondaires
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ORG_CHART_POLE_OPTIONS.filter((option) => option.key !== selected.poleKey).map((option) => {
                  const checked = selected.secondaryPoleKeys.includes(option.key);
                  return (
                    <label
                      key={option.key}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                        checked ? "border-violet-500/40 bg-violet-950/25 text-zinc-100" : "border-zinc-800/80 text-zinc-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const nextSet = new Set(selected.secondaryPoleKeys);
                          if (e.target.checked) nextSet.add(option.key);
                          else nextSet.delete(option.key);
                          onUpdateEntry(selected.id, { secondaryPoleKeys: Array.from(nextSet) });
                        }}
                        disabled={selected.roleKey === "SOUTIEN_TENF" && !selected.poleKey}
                        className="rounded"
                      />
                      <span>
                        {option.emoji} {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={selected.isVisible}
                  onChange={(e) => onUpdateEntry(selected.id, { isVisible: e.target.checked })}
                  className="rounded"
                />
                {selected.isVisible ? <Eye className="h-4 w-4 text-emerald-400" /> : <EyeOff className="h-4 w-4 text-zinc-500" />}
                Visible publiquement
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={selected.isArchived}
                  onChange={(e) => onUpdateEntry(selected.id, { isArchived: e.target.checked })}
                  className="rounded"
                />
                <Archive className="h-4 w-4 text-zinc-500" />
                Archivé
              </label>
            </div>

            <label className="mt-4 block text-sm">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">Bio courte (optionnelle)</span>
              <textarea
                value={selected.bioShort}
                onChange={(e) => onUpdateEntry(selected.id, { bioShort: e.target.value })}
                rows={3}
                className={`${inputClass} resize-y`}
                placeholder="Quelques mots pour l’organigramme public…"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={savingId === selected.id}
                onClick={() => onSave(selected)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {savingId === selected.id ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                disabled={savingId === selected.id}
                onClick={() => onRemove(selected)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/35 bg-red-950/30 px-4 py-2.5 text-sm font-semibold text-red-200 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          </section>
        ) : null}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-zinc-900/60" />
            ))}
          </div>
        ) : sortedFilteredList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="font-medium text-zinc-300">Aucune entrée ne correspond</p>
            <p className="mt-1 text-sm text-zinc-500">Ajuste les filtres ou ajoute un membre depuis la colonne de gauche.</p>
          </div>
        ) : layoutView === "grouped" ? (
          <div className="space-y-6">
            {groupedByRole.map(({ role, members }) => {
              const collapsed = collapsedRoles.has(role);
              return (
                <section key={role} className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/40">
                  <button
                    type="button"
                    onClick={() => onToggleRoleSection(role)}
                    className="flex w-full items-center gap-3 border-b border-zinc-800/80 bg-zinc-900/50 px-4 py-3 text-left transition hover:bg-zinc-900/80"
                  >
                    <ChevronRight className={`h-5 w-5 text-zinc-500 transition ${collapsed ? "" : "rotate-90"}`} />
                    <span className={`h-3 w-3 rounded-full ${getAdminRoleToggleClass(role as AdminRole).split(" ")[0]}`} />
                    <span className="flex-1 text-sm font-bold text-zinc-100">{roleLabelFromKey(role)}</span>
                    <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-bold tabular-nums text-zinc-300">
                      {members.length}
                    </span>
                  </button>
                  {!collapsed ? (
                    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                      {members.map((entry) => (
                        <EntrySummaryCard
                          key={entry.id}
                          entry={entry}
                          selected={props.selectedEntryId === entry.id}
                          onSelect={() =>
                            onSelectEntry(props.selectedEntryId === entry.id ? null : entry.id)
                          }
                          saving={savingId === entry.id}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedFilteredList.map((entry) => (
              <EntrySummaryCard
                key={entry.id}
                entry={entry}
                selected={props.selectedEntryId === entry.id}
                onSelect={() => onSelectEntry(props.selectedEntryId === entry.id ? null : entry.id)}
                saving={savingId === entry.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
