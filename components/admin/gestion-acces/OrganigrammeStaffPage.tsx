"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import OrganigrammeStaffWorkspace, {
  orgChartEntryNeedsAttention,
  type OrgChartLayoutView,
  type OrgChartVisibilityFilter,
} from "@/components/admin/gestion-acces/OrganigrammeStaffWorkspace";
import { administrationSiteHubNav } from "@/lib/admin/gestionAccesNav";
import { ORG_CHART_ROLE_OPTIONS } from "@/lib/staff/orgChartTypes";
import type {
  OrgChartEntry,
  OrgChartMemberRef,
  OrgChartPoleKey,
  OrgChartRoleKey,
  OrgChartStatusKey,
} from "@/lib/staff/orgChartTypes";
import {
  poleLabelFromKey,
  roleLabelFromKey,
  statusLabelFromKey,
} from "@/lib/staff/orgChartTypes";

type EditableEntry = OrgChartEntry;

function createDraftFromMember(member: OrgChartMemberRef): EditableEntry {
  const roleKey: OrgChartRoleKey = "MODERATEUR";
  const statusKey: OrgChartStatusKey = "ACTIVE";
  const poleKey: OrgChartPoleKey = "POLE_ANIMATION_EVENTS";
  const now = new Date().toISOString();
  return {
    id: `draft-${member.id}`,
    memberId: member.id,
    roleKey,
    roleLabel: roleLabelFromKey(roleKey),
    statusKey,
    statusLabel: statusLabelFromKey(statusKey),
    poleKey,
    poleLabel: poleLabelFromKey(poleKey),
    secondaryPoleKeys: [],
    bioShort: "",
    displayOrder: 0,
    isVisible: true,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    member,
  };
}

const ROLE_ORDER = ORG_CHART_ROLE_OPTIONS.map((o) => o.key);

export default function OrganigrammeStaffPage() {
  const [entries, setEntries] = useState<EditableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addQuery, setAddQuery] = useState("");
  const [addSearching, setAddSearching] = useState(false);
  const [addResults, setAddResults] = useState<OrgChartMemberRef[]>([]);
  const [tableSearch, setTableSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | OrgChartRoleKey>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<OrgChartVisibilityFilter>("all");
  const [poleFilter, setPoleFilter] = useState<"all" | OrgChartPoleKey>("all");
  const [layoutView, setLayoutView] = useState<OrgChartLayoutView>("grouped");
  const [collapsedRoles, setCollapsedRoles] = useState<Set<OrgChartRoleKey>>(new Set());
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadEntries = useCallback(async (soft = false) => {
    try {
      if (!soft) setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/staff/org-chart", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur chargement");
      setEntries((data.entries || []) as EditableEntry[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur chargement";
      setError(message);
    } finally {
      if (!soft) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const q = addQuery.trim();
      if (q.length < 2) {
        setAddResults([]);
        return;
      }
      try {
        setAddSearching(true);
        const response = await fetch(`/api/admin/staff/org-chart/members?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Erreur recherche");
        if (!cancelled) setAddResults((data.members || []) as OrgChartMemberRef[]);
      } catch {
        if (!cancelled) setAddResults([]);
      } finally {
        if (!cancelled) setAddSearching(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [addQuery]);

  const existingMemberIds = useMemo(() => new Set(entries.map((e) => e.memberId)), [entries]);

  const filteredAddResults = useMemo(
    () => addResults.filter((m) => !existingMemberIds.has(m.id)),
    [addResults, existingMemberIds],
  );

  const metrics = useMemo(() => {
    const visible = entries.filter((e) => e.isVisible && !e.isArchived).length;
    const hidden = entries.filter((e) => !e.isVisible && !e.isArchived).length;
    const archived = entries.filter((e) => e.isArchived).length;
    const drafts = entries.filter((e) => e.id.startsWith("draft-")).length;
    const attention = entries.filter(orgChartEntryNeedsAttention).length;
    return { total: entries.length, visible, hidden, archived, drafts, attention };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return entries.filter((entry) => {
      if (roleFilter !== "all" && entry.roleKey !== roleFilter) return false;
      if (poleFilter !== "all") {
        const inPole =
          entry.poleKey === poleFilter || entry.secondaryPoleKeys.includes(poleFilter);
        if (!inPole) return false;
      }
      if (visibilityFilter === "visible" && (!entry.isVisible || entry.isArchived)) return false;
      if (visibilityFilter === "hidden" && (entry.isVisible || entry.isArchived)) return false;
      if (visibilityFilter === "archived" && !entry.isArchived) return false;
      if (visibilityFilter === "drafts" && !entry.id.startsWith("draft-")) return false;
      if (visibilityFilter === "attention" && !orgChartEntryNeedsAttention(entry)) return false;
      if (!q) return true;
      const hay = [
        entry.member.displayName,
        entry.member.twitchLogin,
        entry.member.discordUsername,
        entry.roleLabel,
        entry.poleLabel,
        entry.bioShort,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [entries, roleFilter, poleFilter, visibilityFilter, tableSearch]);

  const roleCounts = useMemo(() => {
    const counts = new Map<OrgChartRoleKey, number>();
    for (const role of ROLE_ORDER) counts.set(role, 0);
    for (const entry of entries) {
      counts.set(entry.roleKey, (counts.get(entry.roleKey) ?? 0) + 1);
    }
    return counts;
  }, [entries]);

  const sortedFilteredList = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const roleA = ROLE_ORDER.indexOf(a.roleKey);
      const roleB = ROLE_ORDER.indexOf(b.roleKey);
      if (roleA !== roleB) return roleA - roleB;
      return (a.member.displayName || "").localeCompare(b.member.displayName || "", "fr", { sensitivity: "base" });
    });
  }, [filteredEntries]);

  const groupedByRole = useMemo(() => {
    const groups = new Map<OrgChartRoleKey, EditableEntry[]>();
    for (const role of ROLE_ORDER) groups.set(role, []);
    for (const entry of sortedFilteredList) {
      const bucket = groups.get(entry.roleKey);
      if (bucket) bucket.push(entry);
      else groups.set(entry.roleKey, [entry]);
    }
    return ROLE_ORDER.map((role) => ({
      role,
      members: groups.get(role) ?? [],
    })).filter((g) => g.members.length > 0);
  }, [sortedFilteredList]);

  const selectedEntry = useMemo(
    () => entries.find((e) => e.id === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );

  const attentionCount = metrics.attention;

  function updateEntry(id: string, patch: Partial<EditableEntry>) {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function addMember(member: OrgChartMemberRef) {
    const draft = createDraftFromMember(member);
    setEntries((prev) => [draft, ...prev]);
    setSelectedEntryId(draft.id);
    setIsAdding(false);
    setAddQuery("");
    setSuccess(`Brouillon créé pour ${member.displayName} — pense à enregistrer.`);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function saveEntry(entry: EditableEntry) {
    try {
      setSavingId(entry.id);
      setError(null);
      const isSupport = entry.roleKey === "SOUTIEN_TENF";
      const normalizedPoleKey = isSupport ? entry.poleKey || null : entry.poleKey || "POLE_ANIMATION_EVENTS";
      const normalizedPoleLabel = normalizedPoleKey ? poleLabelFromKey(normalizedPoleKey) : null;
      const normalizedSecondaryPoles = entry.secondaryPoleKeys.filter((pole) => pole !== normalizedPoleKey);

      const endpoint = entry.id.startsWith("draft-")
        ? "/api/admin/staff/org-chart"
        : `/api/admin/staff/org-chart/${encodeURIComponent(entry.id)}`;
      const method = entry.id.startsWith("draft-") ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: entry.memberId,
          roleKey: entry.roleKey,
          roleLabel: entry.roleLabel,
          statusKey: entry.statusKey,
          statusLabel: entry.statusLabel,
          poleKey: normalizedPoleKey,
          poleLabel: normalizedPoleLabel,
          secondaryPoleKeys: normalizedSecondaryPoles,
          bioShort: entry.bioShort,
          displayOrder: entry.displayOrder,
          isVisible: entry.isVisible,
          isArchived: entry.isArchived,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur sauvegarde");

      const savedEntry = data.entry as EditableEntry;
      setEntries((prev) => prev.map((item) => (item.id === entry.id ? savedEntry : item)));
      setSelectedEntryId(savedEntry.id);
      setSuccess(`Enregistré : ${savedEntry.member.displayName}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur sauvegarde";
      setError(message);
    } finally {
      setSavingId(null);
    }
  }

  async function removeEntry(entry: EditableEntry) {
    if (entry.id.startsWith("draft-")) {
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      setSelectedEntryId((id) => (id === entry.id ? null : id));
      return;
    }

    try {
      setSavingId(entry.id);
      setError(null);
      const response = await fetch(`/api/admin/staff/org-chart/${encodeURIComponent(entry.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur suppression");
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      setSelectedEntryId((id) => (id === entry.id ? null : id));
      setSuccess(`Supprimé : ${entry.member.displayName}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur suppression";
      setError(message);
    } finally {
      setSavingId(null);
    }
  }

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadEntries(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadEntries]);

  const toggleRoleSection = (role: OrgChartRoleKey) => {
    setCollapsedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const metricCards = useMemo(
    () => [
      {
        key: "all" as const,
        label: "Toutes les entrées",
        value: metrics.total,
        accent: "text-zinc-50",
        hint: "Organigramme staff complet",
      },
      {
        key: "visible" as const,
        label: "Visibles public",
        value: metrics.visible,
        accent: "text-emerald-200",
        hint: "Affichées sur le site",
      },
      {
        key: "attention" as const,
        label: "À vérifier",
        value: metrics.attention,
        accent: "text-amber-200",
        hint: "Brouillons, pôle ou visibilité",
      },
      {
        key: "archived" as const,
        label: "Archivées",
        value: metrics.archived,
        accent: "text-zinc-400",
        hint: "Hors organigramme actif",
      },
    ],
    [metrics],
  );

  return (
    <div
      className="relative min-h-[calc(100dvh-4rem)] w-full min-w-0 overflow-x-hidden pb-[clamp(1.5rem,4vw,2.5rem)]"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_45%_at_50%_-8%,rgba(124,58,237,0.12),transparent)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(9,9,11,0.55))]" />

      <AdminHeader
        title="Organigramme staff"
        navLinks={administrationSiteHubNav("/admin/gestion-acces/organigramme-staff")}
      />

      <div className="relative z-[1] mx-auto w-full max-w-[min(100%,1680px)] px-[clamp(0.75rem,2.5vw,1.75rem)] py-[clamp(0.75rem,2vw,1.5rem)]">
        {error ? (
          <div
            className="animate-fade-in mb-[clamp(0.75rem,2vw,1.25rem)] flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-950/35 p-[clamp(0.75rem,2vw,1rem)] shadow-lg shadow-red-950/25 backdrop-blur-md"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-100">{error}</p>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1.5 text-red-400 transition hover:bg-red-950/60 hover:text-red-200"
              onClick={() => setError(null)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        {success ? (
          <div
            className="animate-fade-in mb-[clamp(0.75rem,2vw,1.25rem)] flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-[clamp(0.75rem,2vw,1rem)] shadow-lg shadow-emerald-950/25 backdrop-blur-md"
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <p className="min-w-0 flex-1 text-sm text-zinc-100">{success}</p>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-950/50 hover:text-emerald-200"
              onClick={() => setSuccess(null)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        <header className="mb-[clamp(1rem,2.5vw,1.75rem)] overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-zinc-950/80 to-zinc-950/90 p-[clamp(1rem,2.5vw,1.5rem)] shadow-2xl shadow-violet-950/20 ring-1 ring-violet-500/10 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-950/35 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-200/90">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" aria-hidden />
                Administration du site
              </div>
              <h1 className="bg-gradient-to-r from-zinc-50 via-zinc-200 to-violet-200 bg-clip-text text-[length:clamp(1.375rem,1.1rem+1.2vw,2rem)] font-bold tracking-tight text-transparent">
                Organigramme staff
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                Source de vérité pour l&apos;affichage public : rôle, statut, pôle(s) et visibilité. Les membres proviennent de la
                gestion membres — cette page ajoute uniquement la couche organigramme. Tri public automatique par rôle puis par nom.
              </p>
            </div>
            <Link
              href="/organisation-staff/organigramme"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-950/50 px-5 text-sm font-bold text-violet-100 shadow-md shadow-violet-950/30 transition hover:bg-violet-900/60"
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              Voir l&apos;organigramme public
            </Link>
          </div>

          <div className="mt-[clamp(1rem,2.5vw,1.35rem)] grid grid-cols-2 gap-[clamp(0.5rem,1.5vw,0.75rem)] sm:grid-cols-4">
            {metricCards.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  if (m.key === "visible") setVisibilityFilter("visible");
                  else if (m.key === "archived") setVisibilityFilter("archived");
                  else if (m.key === "attention") setVisibilityFilter("attention");
                  else {
                    setVisibilityFilter("all");
                    setRoleFilter("all");
                    setPoleFilter("all");
                  }
                }}
                className={`rounded-xl border p-3 text-left transition hover:border-violet-500/40 hover:bg-violet-950/20 ${
                  (m.key === "visible" && visibilityFilter === "visible") ||
                  (m.key === "archived" && visibilityFilter === "archived") ||
                  (m.key === "attention" && visibilityFilter === "attention") ||
                  (m.key === "all" && visibilityFilter === "all" && roleFilter === "all")
                    ? "border-violet-500/50 bg-violet-950/35"
                    : "border-zinc-800/90 bg-zinc-900/40"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{m.label}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${m.accent}`}>{m.value}</p>
                <p className="mt-1 text-[10px] text-zinc-600">{m.hint}</p>
              </button>
            ))}
          </div>
        </header>

        <OrganigrammeStaffWorkspace
          entries={entries}
          filteredCount={filteredEntries.length}
          groupedByRole={groupedByRole}
          sortedFilteredList={sortedFilteredList}
          selectedEntry={selectedEntry}
          selectedEntryId={selectedEntryId}
          onSelectEntry={setSelectedEntryId}
          roleCounts={roleCounts}
          attentionCount={attentionCount}
          loading={loading}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tableSearch={tableSearch}
          onTableSearchChange={setTableSearch}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          visibilityFilter={visibilityFilter}
          onVisibilityFilterChange={setVisibilityFilter}
          poleFilter={poleFilter}
          onPoleFilterChange={setPoleFilter}
          layoutView={layoutView}
          onLayoutViewChange={setLayoutView}
          collapsedRoles={collapsedRoles}
          onToggleRoleSection={toggleRoleSection}
          isAdding={isAdding}
          onToggleAdding={() => setIsAdding((v) => !v)}
          addQuery={addQuery}
          onAddQueryChange={setAddQuery}
          addSearching={addSearching}
          addResults={filteredAddResults}
          onPickMember={addMember}
          savingId={savingId}
          onSave={(entry) => void saveEntry(entry)}
          onRemove={(entry) => void removeEntry(entry)}
          onUpdateEntry={updateEntry}
        />
      </div>
    </div>
  );
}
