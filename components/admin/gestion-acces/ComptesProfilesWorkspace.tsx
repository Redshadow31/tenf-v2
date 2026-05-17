"use client";

import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Pencil,
  Mail,
  ScrollText,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Filter,
  ChevronRight,
  AlertTriangle,
  Copy,
} from "lucide-react";
import {
  ADMIN_ROLE_ORDER,
  ASSIGNABLE_ADMIN_ROLES,
  getAdminRoleToggleClass,
  getRoleDisplayName,
  type AdminRole,
} from "@/lib/adminRoles";

export type ComptesAdminAccess = {
  discordId: string;
  role: AdminRole;
  addedAt: string;
  addedBy: string;
  username?: string;
  adminAlias?: string;
  avatar?: string;
  addedByUsername?: string;
  memberInSupabase?: boolean;
  hasStaffNotificationEmail?: boolean;
  moderationCharterValidated?: boolean;
  moderationCharterValidatedAt?: string | null;
  moderationCharterVersion?: string | null;
};

export type ComplianceFilter = "all" | "attention" | "complete";
export type LayoutView = "grouped" | "table";

const inputClass =
  "w-full min-h-[2.75rem] rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25";

export function profileNeedsAttention(entry: ComptesAdminAccess): boolean {
  return (
    entry.memberInSupabase === false ||
    !entry.hasStaffNotificationEmail ||
    !entry.moderationCharterValidated ||
    !String(entry.adminAlias || "").trim()
  );
}

function isAccessLocked(access: ComptesAdminAccess): boolean {
  return access.role === "FONDATEUR" || (access.addedBy === "system" && new Date(access.addedAt).getTime() === 0);
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case "FONDATEUR":
      return "role-badge role-badge--staff-founder role-badge--animated role-badge--shimmer";
    case "ADMIN_COORDINATEUR":
      return "role-badge role-badge--staff-coordinator role-badge--animated role-badge--shimmer";
    case "MODERATEUR":
    case "MODERATEUR_AUTONOMIE":
      return "role-badge role-badge--staff-moderator role-badge--animated role-badge--shimmer";
    case "MODERATEUR_ACCOMPAGNEMENT":
    case "MODERATEUR_DECOUVERTE":
      return "role-badge role-badge--staff-trainee role-badge--animated role-badge--shimmer";
    case "MODERATEUR_EN_PAUSE":
      return "role-badge role-badge--staff-paused role-badge--animated role-badge--shimmer";
    default:
      return "role-badge role-badge--active-support role-badge--animated role-badge--shimmer";
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

function ProfileCard({
  access,
  selected,
  onSelect,
  onEditAlias,
  onDelete,
  updatingRole,
  onRoleChange,
}: {
  access: ComptesAdminAccess;
  selected: boolean;
  onSelect: () => void;
  onEditAlias: () => void;
  onDelete: () => void;
  updatingRole: boolean;
  onRoleChange: (role: AdminRole) => void;
}) {
  const locked = isAccessLocked(access);
  const attention = profileNeedsAttention(access);

  return (
    <article
      className={`flex flex-col rounded-2xl border bg-zinc-950/60 p-4 shadow-lg transition ${
        selected
          ? "border-violet-500/50 ring-2 ring-violet-500/20"
          : attention
            ? "border-amber-500/25 hover:border-amber-500/40"
            : "border-zinc-800/90 hover:border-zinc-600"
      }`}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 text-left">
        {access.avatar ? (
          <img src={access.avatar} alt="" className="h-14 w-14 shrink-0 rounded-2xl ring-2 ring-zinc-700/80" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 text-lg font-bold text-white">
            {(access.username || "U").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-zinc-50">{access.username || "Inconnu"}</p>
          {access.adminAlias ? (
            <p className="truncate text-sm font-medium text-violet-300">{access.adminAlias}</p>
          ) : (
            <p className="text-xs italic text-zinc-500">Pas de pseudo admin</p>
          )}
          <p className="mt-1 font-mono text-[10px] text-zinc-600">{access.discordId}</p>
        </div>
      </button>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusPill ok={!!access.adminAlias?.trim()} label="Alias" />
        <StatusPill ok={access.hasStaffNotificationEmail === true} label="E-mail" warn={access.memberInSupabase !== false} />
        <StatusPill ok={access.moderationCharterValidated === true} label="Charte" />
        <StatusPill ok={access.memberInSupabase !== false} label="Fiche" warn />
      </div>

      <div className="mt-3 border-t border-zinc-800/80 pt-3" onClick={(e) => e.stopPropagation()}>
        {access.role === "FONDATEUR" ? (
          <span className={getRoleBadgeClass(access.role)}>{getRoleDisplayName(access.role)}</span>
        ) : (
          <select
            value={access.role}
            disabled={updatingRole || locked}
            onChange={(e) => onRoleChange(e.target.value as AdminRole)}
            className={`${inputClass} text-xs`}
          >
            {ASSIGNABLE_ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {getRoleDisplayName(r)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onEditAlias}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-zinc-700/80 bg-zinc-900/70 px-2 py-2 text-xs font-semibold text-zinc-200 hover:border-violet-500/40"
        >
          <Pencil className="h-3.5 w-3.5" />
          Pseudo
        </button>
        {!locked ? (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-950/25 px-2.5 py-2 text-red-300 hover:bg-red-950/45"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

export type ComptesProfilesWorkspaceProps = {
  accessList: ComptesAdminAccess[];
  filteredCount: number;
  groupedByRole: { role: AdminRole; members: ComptesAdminAccess[] }[];
  sortedFilteredList: ComptesAdminAccess[];
  selectedAccess: ComptesAdminAccess | null;
  selectedDiscordId: string | null;
  onSelectProfile: (discordId: string | null) => void;
  roleCounts: Map<AdminRole, number>;
  attentionCount: number;
  loading: boolean;
  tableRefreshing: boolean;
  onRefresh: () => void;
  tableSearch: string;
  onTableSearchChange: (v: string) => void;
  roleFilter: "all" | AdminRole;
  onRoleFilterChange: (v: "all" | AdminRole) => void;
  complianceFilter: ComplianceFilter;
  onComplianceFilterChange: (v: ComplianceFilter) => void;
  aliasFilter: "all" | "with_alias" | "without_alias";
  onAliasFilterChange: (v: "all" | "with_alias" | "without_alias") => void;
  layoutView: LayoutView;
  onLayoutViewChange: (v: LayoutView) => void;
  collapsedRoles: Set<AdminRole>;
  onToggleRoleSection: (role: AdminRole) => void;
  isAdding: boolean;
  onToggleAdding: () => void;
  newDiscordId: string;
  onNewDiscordIdChange: (v: string) => void;
  newRole: AdminRole;
  onNewRoleChange: (v: AdminRole) => void;
  newAdminAlias: string;
  onNewAdminAliasChange: (v: string) => void;
  searchDiscord: string;
  onSearchDiscordChange: (v: string) => void;
  discordMembers: Array<{ id: string; username: string; avatar: string | null }>;
  onSearchDiscord: () => void;
  searchingDiscord: boolean;
  onAddAccess: () => void;
  onPickDiscordMember: (id: string) => void;
  updatingRoleDiscordId: string | null;
  onUpdateRole: (access: ComptesAdminAccess, role: AdminRole) => void;
  onEditAlias: (access: ComptesAdminAccess) => void;
  onDelete: (discordId: string) => void;
  onCopyDiscordId: (id: string) => void;
};

export default function ComptesProfilesWorkspace(props: ComptesProfilesWorkspaceProps) {
  const {
    accessList,
    filteredCount,
    groupedByRole,
    sortedFilteredList,
    selectedAccess,
    onSelectProfile,
    roleCounts,
    attentionCount,
    loading,
    tableRefreshing,
    onRefresh,
    tableSearch,
    onTableSearchChange,
    roleFilter,
    onRoleFilterChange,
    complianceFilter,
    onComplianceFilterChange,
    aliasFilter,
    onAliasFilterChange,
    layoutView,
    onLayoutViewChange,
    collapsedRoles,
    onToggleRoleSection,
    isAdding,
    onToggleAdding,
    newDiscordId,
    onNewDiscordIdChange,
    newRole,
    onNewRoleChange,
    newAdminAlias,
    onNewAdminAliasChange,
    searchDiscord,
    onSearchDiscordChange,
    discordMembers,
    onSearchDiscord,
    searchingDiscord,
    onAddAccess,
    onPickDiscordMember,
    updatingRoleDiscordId,
    onUpdateRole,
    onEditAlias,
    onDelete,
    onCopyDiscordId,
  } = props;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
      {/* Colonne filtres + ajout */}
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
                placeholder="Pseudo, alias, ID…"
                className={`${inputClass} pl-10 text-sm`}
              />
            </div>
            <select
              value={aliasFilter}
              onChange={(e) => onAliasFilterChange(e.target.value as typeof aliasFilter)}
              className={`${inputClass} text-sm`}
            >
              <option value="all">Alias : tous</option>
              <option value="with_alias">Alias définis</option>
              <option value="without_alias">Alias manquants</option>
            </select>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "all" as const, label: "Tous" },
                  { key: "attention" as const, label: `À compléter (${attentionCount})` },
                  { key: "complete" as const, label: "Profils OK" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onComplianceFilterChange(f.key)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    complianceFilter === f.key
                      ? "border-violet-500/50 bg-violet-950/50 text-violet-100"
                      : "border-zinc-700/80 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/55 shadow-xl">
          <div className="border-b border-zinc-800/80 bg-zinc-900/50 p-4">
            <h2 className="text-sm font-bold text-zinc-100">Par rôle</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{accessList.length} comptes au total</p>
          </div>
          <nav className="max-h-[min(50vh,420px)] space-y-0.5 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => onRoleFilterChange("all")}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                roleFilter === "all" ? "bg-violet-950/50 text-violet-100" : "text-zinc-400 hover:bg-zinc-900/80"
              }`}
            >
              Tous les rôles
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs tabular-nums">{accessList.length}</span>
            </button>
            {ADMIN_ROLE_ORDER.map((role) => {
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
                  <span className={`h-2 w-2 shrink-0 rounded-full ${getAdminRoleToggleClass(role).split(" ")[0]}`} />
                  <span className="min-w-0 flex-1 truncate">{getRoleDisplayName(role)}</span>
                  <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs tabular-nums">{count}</span>
                </button>
              );
            })}
          </nav>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/55 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 bg-gradient-to-r from-violet-950/30 to-zinc-900/50 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-50">
              <Plus className="h-4 w-4 text-violet-400" />
              Nouveau profil
            </h2>
            <button
              type="button"
              onClick={onToggleAdding}
              className="rounded-lg border border-violet-500/40 bg-violet-950/40 px-2.5 py-1 text-xs font-bold text-violet-100"
            >
              {isAdding ? "Fermer" : "Ouvrir"}
            </button>
          </div>
          {isAdding && (
            <div className="space-y-3 p-4">
              <input
                type="text"
                value={searchDiscord}
                onChange={(e) => onSearchDiscordChange(e.target.value)}
                placeholder="Recherche Discord…"
                className={inputClass}
                onKeyDown={(e) => e.key === "Enter" && onSearchDiscord()}
              />
              <button
                type="button"
                onClick={onSearchDiscord}
                disabled={searchingDiscord || !searchDiscord.trim()}
                className="w-full rounded-xl border border-violet-600/50 bg-violet-950/50 py-2 text-sm font-bold text-violet-100 disabled:opacity-40"
              >
                {searchingDiscord ? "…" : "Rechercher"}
              </button>
              {discordMembers.length > 0 && (
                <ul className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-zinc-800/80 p-1">
                  {discordMembers.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => onPickDiscordMember(m.id)}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-zinc-200 hover:bg-violet-950/30"
                      >
                        {m.username}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <input
                type="text"
                value={newDiscordId}
                onChange={(e) => onNewDiscordIdChange(e.target.value)}
                placeholder="ID Discord"
                className={`${inputClass} font-mono text-xs`}
              />
              <select value={newRole} onChange={(e) => onNewRoleChange(e.target.value as AdminRole)} className={inputClass}>
                {ASSIGNABLE_ADMIN_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {getRoleDisplayName(r)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newAdminAlias}
                onChange={(e) => onNewAdminAliasChange(e.target.value)}
                placeholder="Pseudo admin (optionnel)"
                maxLength={40}
                className={inputClass}
              />
              <button
                type="button"
                onClick={onAddAccess}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-bold text-white"
              >
                Ajouter
              </button>
            </div>
          )}
        </section>
      </aside>

      {/* Zone principale */}
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-400" />
            <div>
              <p className="text-sm font-bold text-zinc-50">Profils staff</p>
              <p className="text-xs text-zinc-500">
                {filteredCount} affiché{filteredCount !== 1 ? "s" : ""} sur {accessList.length}
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
                onClick={() => onLayoutViewChange("table")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  layoutView === "table" ? "bg-violet-950/60 text-violet-100" : "text-zinc-500"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Tableau
              </button>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={tableRefreshing || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-600/80 px-3 py-2 text-xs font-semibold text-zinc-200 disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${tableRefreshing ? "animate-spin" : ""}`} />
              Rafraîchir
            </button>
          </div>
        </div>

        {selectedAccess ? (
          <section className="rounded-2xl border border-violet-500/30 bg-violet-950/15 p-4 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {selectedAccess.avatar ? (
                  <img src={selectedAccess.avatar} alt="" className="h-16 w-16 rounded-2xl ring-2 ring-violet-500/30" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 text-xl font-bold text-white">
                    {(selectedAccess.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-zinc-50">{selectedAccess.username || "Inconnu"}</h3>
                  <p className="text-sm text-violet-300">{selectedAccess.adminAlias || "— pas de pseudo admin —"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={getRoleBadgeClass(selectedAccess.role)}>{getRoleDisplayName(selectedAccess.role)}</span>
                    <button
                      type="button"
                      onClick={() => onCopyDiscordId(selectedAccess.discordId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/80 px-2 py-0.5 font-mono text-[10px] text-zinc-400 hover:text-violet-200"
                    >
                      <Copy className="h-3 w-3" />
                      {selectedAccess.discordId}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectProfile(null)}
                className="rounded-lg border border-zinc-700/80 p-2 text-zinc-400 hover:text-zinc-100"
                aria-label="Fermer le détail"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
                <p className="text-[10px] font-bold uppercase text-zinc-500">E-mail staff</p>
                <p className="mt-1 text-sm text-zinc-200">
                  {selectedAccess.hasStaffNotificationEmail ? "Renseigné" : "Manquant"}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Charte</p>
                <p className="mt-1 text-sm text-zinc-200">
                  {selectedAccess.moderationCharterValidated ? "Validée" : "Non validée"}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Fiche membre</p>
                <p className="mt-1 text-sm text-zinc-200">
                  {selectedAccess.memberInSupabase === false ? "Absente" : "Présente"}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Ajouté</p>
                <p className="mt-1 text-sm text-zinc-200">
                  {selectedAccess.addedAt && new Date(selectedAccess.addedAt).getTime() > 0
                    ? new Date(selectedAccess.addedAt).toLocaleDateString("fr-FR")
                    : "Initial"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEditAlias(selectedAccess)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-950/40 px-4 py-2 text-sm font-semibold text-violet-100"
              >
                <Pencil className="h-4 w-4" />
                Modifier le pseudo
              </button>
              {!isAccessLocked(selectedAccess) ? (
                <button
                  type="button"
                  onClick={() => onDelete(selectedAccess.discordId)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/35 bg-red-950/30 px-4 py-2 text-sm font-semibold text-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                  Retirer l&apos;accès
                </button>
              ) : null}
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
            <LayoutGrid className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="font-medium text-zinc-300">Aucun profil ne correspond</p>
            <p className="mt-1 text-sm text-zinc-500">Ajuste les filtres ou ajoute un accès.</p>
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
                    <span className={`h-3 w-3 rounded-full ${getAdminRoleToggleClass(role).split(" ")[0]}`} />
                    <span className="flex-1 text-sm font-bold text-zinc-100">{getRoleDisplayName(role)}</span>
                    <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-bold tabular-nums text-zinc-300">
                      {members.length}
                    </span>
                  </button>
                  {!collapsed && (
                    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                      {members.map((access) => (
                        <ProfileCard
                          key={access.discordId}
                          access={access}
                          selected={props.selectedDiscordId === access.discordId}
                          onSelect={() =>
                            onSelectProfile(props.selectedDiscordId === access.discordId ? null : access.discordId)
                          }
                          onEditAlias={() => onEditAlias(access)}
                          onDelete={() => onDelete(access.discordId)}
                          updatingRole={updatingRoleDiscordId === access.discordId}
                          onRoleChange={(r) => onUpdateRole(access, r)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-4 py-3 text-sm text-zinc-400">
            Vue tableau : utilise les cartes « Par rôle » pour une gestion plus rapide. Bascule sur « Par rôle » ci-dessus.
          </p>
        )}
      </div>
    </div>
  );
}
