"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrgChartEntry, OrgChartMemberRef, OrgChartPoleKey, OrgChartRoleKey, OrgChartStatusKey } from "@/lib/staff/orgChartTypes";
import {
  ORG_CHART_POLE_OPTIONS,
  ORG_CHART_ROLE_OPTIONS,
  ORG_CHART_STATUS_OPTIONS,
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

export default function AdminOrganigrammeStaffPage() {
  const [entries, setEntries] = useState<EditableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OrgChartMemberRef[]>([]);

  async function loadEntries() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/staff/org-chart", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur chargement");
      setEntries((data.entries || []) as EditableEntry[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur chargement";
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const q = query.trim();
      if (q.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        setSearching(true);
        const response = await fetch(`/api/admin/staff/org-chart/members?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Erreur recherche");
        if (!cancelled) {
          setSearchResults((data.members || []) as OrgChartMemberRef[]);
        }
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const existingMemberIds = useMemo(() => new Set(entries.map((entry) => entry.memberId)), [entries]);
  const filteredResults = useMemo(
    () => searchResults.filter((member) => !existingMemberIds.has(member.id)),
    [searchResults, existingMemberIds]
  );

  function updateEntry(id: string, patch: Partial<EditableEntry>) {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function addMember(member: OrgChartMemberRef) {
    setEntries((prev) => [createDraftFromMember(member), ...prev]);
    setFeedback(`Membre ajoute en brouillon: ${member.displayName}`);
  }

  async function saveEntry(entry: EditableEntry) {
    try {
      setSavingId(entry.id);
      setFeedback("");
      const isSupport = entry.roleKey === "SOUTIEN_TENF";
      const normalizedPoleKey = isSupport ? (entry.poleKey || null) : (entry.poleKey || "POLE_ANIMATION_EVENTS");
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
      setFeedback(`Enregistre: ${savedEntry.member.displayName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur sauvegarde";
      setFeedback(message);
    } finally {
      setSavingId(null);
    }
  }

  async function removeEntry(entry: EditableEntry) {
    if (entry.id.startsWith("draft-")) {
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      return;
    }

    try {
      setSavingId(entry.id);
      const response = await fetch(`/api/admin/staff/org-chart/${encodeURIComponent(entry.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur suppression");
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      setFeedback(`Supprime: ${entry.member.displayName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur suppression";
      setFeedback(message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-8" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Organigramme staff
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Source de verite: membres existants de la gestion membre. Cette page ajoute uniquement la couche d'affichage public
            (role, statut, pole(s), visibilite). L'ordre public se fait automatiquement par role puis par nom.
          </p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Ajouter un membre existant
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par pseudo Twitch, display name ou Discord"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {filteredResults.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => addMember(member)}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-left transition"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-bg)" }}
                >
                  <span className="text-sm">
                    {member.displayName} ({member.twitchLogin})
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-primary)" }}>
                    Ajouter
                  </span>
                </button>
              ))}
              {!searching && query.trim().length >= 2 && filteredResults.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Aucun membre disponible pour cet ajout.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Entrees organigramme
            </h2>
            <button
              type="button"
              onClick={loadEntries}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Rafraichir
            </button>
          </div>

          {feedback ? (
            <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {feedback}
            </p>
          ) : null}

          {loading ? (
            <p className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Chargement...
            </p>
          ) : entries.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aucune entree pour le moment.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-xl border p-4"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong style={{ color: "var(--color-text)" }}>
                      {entry.member.displayName} ({entry.member.twitchLogin})
                    </strong>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingId === entry.id}
                        onClick={() => saveEntry(entry)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium"
                        style={{ backgroundColor: "var(--color-primary)", color: "white", opacity: savingId === entry.id ? 0.7 : 1 }}
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        disabled={savingId === entry.id}
                        onClick={() => removeEntry(entry)}
                        className="rounded-lg border px-3 py-1.5 text-sm"
                        style={{ borderColor: "var(--color-border)", color: "#ef4444" }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <label className="text-sm">
                      <span style={{ color: "var(--color-text-secondary)" }}>Role affiche</span>
                      <select
                        value={entry.roleKey}
                        onChange={(e) => {
                          const roleKey = e.target.value as OrgChartRoleKey;
                          updateEntry(entry.id, { roleKey, roleLabel: roleLabelFromKey(roleKey) });
                        }}
                        className="mt-1 w-full rounded-lg border px-2 py-2"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}
                      >
                        {ORG_CHART_ROLE_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm">
                      <span style={{ color: "var(--color-text-secondary)" }}>Statut affiche</span>
                      <select
                        value={entry.statusKey}
                        onChange={(e) => {
                          const statusKey = e.target.value as OrgChartStatusKey;
                          updateEntry(entry.id, { statusKey, statusLabel: statusLabelFromKey(statusKey) });
                        }}
                        className="mt-1 w-full rounded-lg border px-2 py-2"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}
                      >
                        {ORG_CHART_STATUS_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm">
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        Pole principal {entry.roleKey === "SOUTIEN_TENF" ? "(optionnel)" : ""}
                      </span>
                      <select
                        value={entry.poleKey || ""}
                        onChange={(e) => {
                          const poleKey = (e.target.value || null) as OrgChartPoleKey | null;
                          updateEntry(entry.id, {
                            poleKey,
                            poleLabel: poleKey ? poleLabelFromKey(poleKey) : null,
                            secondaryPoleKeys: poleKey ? entry.secondaryPoleKeys.filter((key) => key !== poleKey) : entry.secondaryPoleKeys,
                          });
                        }}
                        className="mt-1 w-full rounded-lg border px-2 py-2"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}
                      >
                        {entry.roleKey === "SOUTIEN_TENF" ? <option value="">Aucun pole</option> : null}
                        {ORG_CHART_POLE_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.emoji} {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="text-sm md:col-span-3">
                      <span style={{ color: "var(--color-text-secondary)" }}>Poles secondaires (multi-selection)</span>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {ORG_CHART_POLE_OPTIONS.filter((option) => option.key !== entry.poleKey).map((option) => {
                          const checked = entry.secondaryPoleKeys.includes(option.key);
                          return (
                            <label
                              key={option.key}
                              className="flex items-center gap-2 rounded-lg border px-2 py-2"
                              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const nextSet = new Set(entry.secondaryPoleKeys);
                                  if (e.target.checked) nextSet.add(option.key);
                                  else nextSet.delete(option.key);
                                  updateEntry(entry.id, { secondaryPoleKeys: Array.from(nextSet) });
                                }}
                                disabled={entry.roleKey === "SOUTIEN_TENF" && !entry.poleKey}
                              />
                              <span className="text-sm">
                                {option.emoji} {option.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <label className="mt-6 flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                      <input
                        type="checkbox"
                        checked={entry.isVisible}
                        onChange={(e) => updateEntry(entry.id, { isVisible: e.target.checked })}
                      />
                      Visible publiquement
                    </label>

                    <label className="mt-6 flex items-center gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                      <input
                        type="checkbox"
                        checked={entry.isArchived}
                        onChange={(e) => updateEntry(entry.id, { isArchived: e.target.checked })}
                      />
                      Archive
                    </label>
                  </div>

                  <label className="mt-3 block text-sm">
                    <span style={{ color: "var(--color-text-secondary)" }}>Bio courte (optionnelle)</span>
                    <textarea
                      value={entry.bioShort}
                      onChange={(e) => updateEntry(entry.id, { bioShort: e.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}
                    />
                  </label>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
