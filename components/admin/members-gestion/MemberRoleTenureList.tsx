"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { getRoleBadgeClassName } from "@/lib/roleBadgeSystem";
import {
  buildRoleTenureDetails,
  formatDurationFr,
  formatPeriodFr,
  type RoleTenureDetail,
} from "@/lib/admin/members-gestion/roleHistoryAnalytics";
import type { MemberTimelineEntry } from "@/lib/admin/members-gestion/memberTimeline";

function toDateInputValue(d: Date): string {
  const local = new Date(d);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

type MemberRoleTenureListProps = {
  roleHistory?: MemberTimelineEntry[];
  currentRole: string;
  createdAt?: string | null;
  memberIdentifier?: string;
  editable?: boolean;
  onHistoryChange?: (history: MemberTimelineEntry[]) => void;
};

export default function MemberRoleTenureList({
  roleHistory,
  currentRole,
  createdAt,
  memberIdentifier,
  editable,
  onHistoryChange,
}: MemberRoleTenureListProps) {
  const tenures = buildRoleTenureDetails(roleHistory, currentRole, createdAt);
  const tenuresNewestFirst = [...tenures].reverse();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [toOpen, setToOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canMutate = editable && memberIdentifier && onHistoryChange;

  function tenureKey(t: RoleTenureDetail, index: number): string {
    return `${t.role}-${t.from.toISOString()}-${index}`;
  }

  function openEdit(t: RoleTenureDetail, key: string) {
    setEditingKey(key);
    setFromDate(toDateInputValue(t.from));
    setToDate(t.to ? toDateInputValue(t.to) : "");
    setToOpen(!t.to);
    setError(null);
  }

  async function patchEntryDate(entryId: string, isoDate: string) {
    const res = await fetch(
      `/api/admin/members/${encodeURIComponent(memberIdentifier!)}/role-history`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: entryId,
          changedAt: new Date(`${isoDate}T12:00:00`).toISOString(),
        }),
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Mise à jour impossible");
    return json.roleHistory as MemberTimelineEntry[];
  }

  async function handleSaveDates(t: RoleTenureDetail) {
    if (!canMutate) return;
    setSaving(true);
    setError(null);
    try {
      let history = roleHistory || [];
      if (t.startEntryId && fromDate) {
        history = await patchEntryDate(t.startEntryId, fromDate);
      }
      if (t.endEntryId && !toOpen && toDate) {
        history = await patchEntryDate(t.endEntryId, toDate);
      }
      onHistoryChange!(history);
      setEditingKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePeriod(t: RoleTenureDetail) {
    if (!canMutate || !t.startEntryId) return;
    if (
      !window.confirm(
        "Supprimer ce changement de rôle ? Les périodes affichées seront recalculées à partir du journal restant.",
      )
    ) {
      return;
    }
    setDeletingId(t.startEntryId);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/members/${encodeURIComponent(memberIdentifier!)}/role-history?id=${encodeURIComponent(t.startEntryId)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Suppression impossible");
      onHistoryChange!(json.roleHistory);
      if (editingKey) setEditingKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0e0e10] px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none";

  return (
    <section className="rounded-xl border border-white/[0.08] bg-[linear-gradient(160deg,rgba(26,28,40,0.92),rgba(14,15,22,0.98))] p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
        Périodes par rôle
        <span className="rounded-full border border-zinc-500/40 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-normal text-zinc-400">
          Estimé
        </span>
      </h4>
      <p className="mt-1 text-xs text-zinc-500">
        Reconstruction à partir des changements de rôle enregistrés
        {createdAt
          ? ` · fiche créée le ${new Date(createdAt).toLocaleDateString("fr-FR")}`
          : ""}
        . {canMutate ? "Tu peux ajuster les dates ou retirer un changement erroné." : ""}
      </p>

      {error ? (
        <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {tenuresNewestFirst.map((tenure, index) => {
          const key = tenureKey(tenure, index);
          const isEditing = editingKey === key;
          return (
            <li
              key={key}
              className={`relative rounded-xl border p-3 pl-4 ${
                tenure.ongoing
                  ? "border-indigo-400/35 bg-indigo-500/[0.08]"
                  : "border-white/[0.06] bg-black/15"
              }`}
              style={{ borderLeftWidth: 4, borderLeftColor: tenure.isStaff ? "#a78bfa" : "#64748b" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className={getRoleBadgeClassName(tenure.role)}>{tenure.roleLabel}</span>
                  {tenure.isStaffReduced ? (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-400/90">
                      activité réduite / pause
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums text-indigo-200">
                    {formatDurationFr(tenure.durationMs)}
                    {tenure.ongoing ? " · en cours" : ""}
                  </span>
                  {canMutate && tenure.canEditDates ? (
                    <button
                      type="button"
                      onClick={() => (isEditing ? setEditingKey(null) : openEdit(tenure, key))}
                      className="rounded p-1 text-zinc-500 transition hover:bg-indigo-500/20 hover:text-indigo-300"
                      aria-label="Modifier les dates"
                    >
                      {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    </button>
                  ) : null}
                  {canMutate && tenure.canDeletePeriod ? (
                    <button
                      type="button"
                      onClick={() => void handleDeletePeriod(tenure)}
                      disabled={deletingId === tenure.startEntryId}
                      className="rounded p-1 text-zinc-500 transition hover:bg-red-500/20 hover:text-red-300"
                      aria-label="Supprimer la période"
                    >
                      {deletingId === tenure.startEntryId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : null}
                </div>
              </div>

              {isEditing ? (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  {tenure.startEntryId ? (
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold text-zinc-500">Début</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-500">
                      Début lié à la création de fiche (non modifiable ici).
                    </p>
                  )}
                  {tenure.endEntryId ? (
                    <>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-zinc-500">Fin</label>
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className={inputClass}
                          disabled={toOpen}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <input
                          type="checkbox"
                          checked={toOpen}
                          onChange={(e) => setToOpen(e.target.checked)}
                        />
                        Toujours en cours (pas de date de fin)
                      </label>
                    </>
                  ) : tenure.ongoing ? (
                    <p className="text-[10px] text-zinc-500">Période en cours — pas de date de fin.</p>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingKey(null)}
                      className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] text-zinc-400"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveDates(tenure)}
                      className="rounded-lg border border-indigo-400/40 bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                    >
                      {saving ? "…" : "Enregistrer"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-zinc-500">{formatPeriodFr(tenure.from, tenure.to)}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
