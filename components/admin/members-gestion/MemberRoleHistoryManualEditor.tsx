"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { ROLE_BADGE_PICKER_OPTIONS } from "@/lib/roleBadgeSystem";
import {
  TIMELINE_KIND_LABELS,
  TIMELINE_TAG_PRESETS,
  type CreateManualTimelineInput,
  type MemberTimelineKind,
} from "@/lib/admin/members-gestion/memberTimeline";

const defaultForm = (): CreateManualTimelineInput => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return {
    kind: "note",
    changedAt: d.toISOString().slice(0, 16),
    summary: "",
    reason: "",
    fromRole: "",
    toRole: "",
    tags: [],
    isBackfill: true,
  };
};

function entryToForm(entry: import("@/lib/admin/members-gestion/memberTimeline").MemberTimelineEntry): CreateManualTimelineInput {
  const d = new Date(entry.changedAt);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return {
    kind: entry.kind,
    changedAt: d.toISOString().slice(0, 16),
    summary: entry.summary || "",
    reason: entry.reason || "",
    fromRole: entry.fromRole || "",
    toRole: entry.toRole || "",
    tags: entry.tags || [],
    isBackfill: entry.isBackfill ?? false,
  };
}

export default function MemberRoleHistoryManualEditor({
  memberIdentifier,
  onSaved,
  editingEntry,
  onEditCleared,
}: {
  memberIdentifier: string;
  onSaved: (roleHistory: import("@/lib/admin/members-gestion/memberTimeline").MemberTimelineEntry[]) => void;
  editingEntry?: import("@/lib/admin/members-gestion/memberTimeline").MemberTimelineEntry | null;
  onEditCleared?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateManualTimelineInput>(defaultForm);
  const isEdit = Boolean(editingEntry?.id);

  useEffect(() => {
    if (editingEntry) {
      setForm(entryToForm(editingEntry));
      setOpen(true);
      setError(null);
    }
  }, [editingEntry]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const changedAt = new Date(form.changedAt).toISOString();
      const res = await fetch(
        `/api/admin/members/${encodeURIComponent(memberIdentifier)}/role-history`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit ? { id: editingEntry!.id, ...form, changedAt } : { ...form, changedAt },
          ),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Enregistrement impossible");
      onSaved(json.roleHistory);
      setForm(defaultForm());
      setOpen(false);
      onEditCleared?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setOpen(false);
    setForm(defaultForm());
    setError(null);
    onEditCleared?.();
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0e0e10] px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none";
  const labelClass = "mb-1 block text-xs font-semibold text-zinc-400";

  return (
    <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-indigo-100">
          {isEdit ? "Modifier l'événement" : "Événements manuels"}
        </p>
        <button
          type="button"
          onClick={() => (open ? handleCancel() : setOpen(true))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/25"
        >
          {isEdit ? (
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Plus className="h-3.5 w-3.5" aria-hidden />
          )}
          {open ? "Fermer" : isEdit ? "Modifier" : "Ajouter un événement"}
        </button>
      </div>

      {open ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={form.kind}
                onChange={(e) =>
                  setForm((f) => ({ ...f, kind: e.target.value as MemberTimelineKind }))
                }
                className={inputClass}
              >
                {(Object.keys(TIMELINE_KIND_LABELS) as MemberTimelineKind[]).map((k) => (
                  <option key={k} value={k}>
                    {TIMELINE_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="datetime-local"
                value={form.changedAt}
                onChange={(e) => setForm((f) => ({ ...f, changedAt: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
          </div>

          {form.kind === "note" || form.kind === "staff_milestone" ? (
            <div>
              <label className={labelClass}>
                {form.kind === "note" ? "Note" : "Libellé du jalon"}
              </label>
              <textarea
                value={form.summary || ""}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                rows={2}
                className={inputClass}
                placeholder="Ex. Entrée dans le staff en binôme avec @pseudo"
              />
            </div>
          ) : null}

          {form.kind === "role_change" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Rôle précédent</label>
                <select
                  value={form.fromRole || ""}
                  onChange={(e) => setForm((f) => ({ ...f, fromRole: e.target.value }))}
                  className={inputClass}
                  required
                >
                  <option value="">—</option>
                  {ROLE_BADGE_PICKER_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Nouveau rôle</label>
                <select
                  value={form.toRole || ""}
                  onChange={(e) => setForm((f) => ({ ...f, toRole: e.target.value }))}
                  className={inputClass}
                  required
                >
                  <option value="">—</option>
                  {ROLE_BADGE_PICKER_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {form.kind === "status_change" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Statut précédent</label>
                <select
                  value={form.fromRole || ""}
                  onChange={(e) => setForm((f) => ({ ...f, fromRole: e.target.value }))}
                  className={inputClass}
                  required
                >
                  <option value="">—</option>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Nouveau statut</label>
                <select
                  value={form.toRole || ""}
                  onChange={(e) => setForm((f) => ({ ...f, toRole: e.target.value }))}
                  className={inputClass}
                  required
                >
                  <option value="">—</option>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>
            </div>
          ) : null}

          {form.kind === "staff_milestone" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Rôle avant (optionnel)</label>
                <select
                  value={form.fromRole || ""}
                  onChange={(e) => setForm((f) => ({ ...f, fromRole: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {ROLE_BADGE_PICKER_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Rôle après (optionnel)</label>
                <select
                  value={form.toRole || ""}
                  onChange={(e) => setForm((f) => ({ ...f, toRole: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {ROLE_BADGE_PICKER_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div>
            <label className={labelClass}>Détail / motif (optionnel)</label>
            <input
              type="text"
              value={form.reason || ""}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className={inputClass}
              placeholder="Contexte pour l'équipe"
            />
          </div>

          <div>
            <label className={labelClass}>Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {TIMELINE_TAG_PRESETS.map((tag) => {
                const active = form.tags?.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setForm((f) => {
                        const tags = f.tags || [];
                        return {
                          ...f,
                          tags: active ? tags.filter((t) => t !== tag) : [...tags, tag],
                        };
                      })
                    }
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                      active
                        ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                        : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={Boolean(form.isBackfill)}
              onChange={(e) => setForm((f) => ({ ...f, isBackfill: e.target.checked }))}
              className="rounded border-gray-600"
            />
            Ajout rétroactif (donnée saisie après coup)
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isEdit ? (
                <Pencil className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {isEdit ? "Mettre à jour" : "Enregistrer l'événement"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">
          Complète l&apos;historique avec des notes, jalons staff ou changements passés non enregistrés
          automatiquement.
        </p>
      )}
    </div>
  );
}
