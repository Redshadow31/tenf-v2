"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { getRoleBadgeClassName, ROLE_BADGE_PICKER_OPTIONS } from "@/lib/roleBadgeSystem";
import {
  formatPeriodRangeFr,
  periodDurationMs,
  STAFF_PERIOD_TYPE_LABELS,
  type CreateStaffPeriodInput,
  type StaffPeriod,
  type StaffPeriodType,
} from "@/lib/admin/members-gestion/staffPeriods";
import { formatDurationFr } from "@/lib/admin/members-gestion/roleHistoryAnalytics";

const defaultForm = (): CreateStaffPeriodInput & { toOpen: boolean } => {
  const d = new Date();
  return {
    type: "staff_role",
    label: "",
    role: "",
    from: d.toISOString().slice(0, 10),
    to: null,
    notes: "",
    toOpen: false,
  };
};

export default function MemberStaffPeriodsEditor({
  memberIdentifier,
  staffPeriods,
  onPeriodsChange,
}: {
  memberIdentifier: string;
  staffPeriods: StaffPeriod[];
  onPeriodsChange: (periods: StaffPeriod[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const sorted = [...staffPeriods].sort(
    (a, b) => new Date(b.from).getTime() - new Date(a.from).getTime(),
  );

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0e0e10] px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none";
  const labelClass = "mb-1 block text-xs font-semibold text-zinc-400";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/members/${encodeURIComponent(memberIdentifier)}/staff-periods`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: form.type,
            label: form.label,
            role: form.role || undefined,
            from: form.from,
            to: form.toOpen ? form.to || null : null,
            notes: form.notes || undefined,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Enregistrement impossible");
      onPeriodsChange(json.staffPeriods);
      setForm(defaultForm());
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer cette période confirmée ?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/members/${encodeURIComponent(memberIdentifier)}/staff-periods?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Suppression impossible");
      onPeriodsChange(json.staffPeriods);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden />
          <h4 className="text-sm font-semibold text-emerald-100">Périodes staff confirmées</h4>
          {staffPeriods.length > 0 ? (
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
              {staffPeriods.length} période{staffPeriods.length > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25"
        >
          <Plus className="h-3.5 w-3.5" />
          {open ? "Fermer" : "Confirmer une période"}
        </button>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Ces dates officielles remplacent les durées estimées pour le cumul staff et les KPIs
        ci-dessus.
      </p>

      {error ? (
        <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as StaffPeriodType }))
                }
                className={inputClass}
              >
                {(Object.keys(STAFF_PERIOD_TYPE_LABELS) as StaffPeriodType[]).map((t) => (
                  <option key={t} value={t}>
                    {STAFF_PERIOD_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Libellé court</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className={inputClass}
                placeholder="Ex. Modérateur junior"
                required
              />
            </div>
          </div>

          {form.type === "staff_role" ? (
            <div>
              <label className={labelClass}>Rôle TENF</label>
              <select
                value={form.role || ""}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
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
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Début</label>
              <input
                type="date"
                value={form.from}
                onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Fin (optionnelle)</label>
              <input
                type="date"
                value={form.to || ""}
                onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
                className={inputClass}
                disabled={!form.toOpen}
              />
              <label className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
                <input
                  type="checkbox"
                  checked={!form.toOpen}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      toOpen: !e.target.checked,
                      to: e.target.checked ? null : f.to,
                    }))
                  }
                />
                Toujours en cours
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className={inputClass}
              placeholder="Contexte, décision comité…"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Enregistrer la période
            </button>
          </div>
        </form>
      ) : null}

      {sorted.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {sorted.map((period) => (
            <li
              key={period.id}
              className="rounded-xl border border-emerald-400/20 bg-black/20 px-3 py-2.5"
              style={{ borderLeftWidth: 4, borderLeftColor: "#34d399" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                      Confirmé
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                      {STAFF_PERIOD_TYPE_LABELS[period.type]}
                    </span>
                  </div>
                  <p className="mt-1 font-medium text-white">{period.label}</p>
                  {period.role ? (
                    <span className={`mt-1 inline-block ${getRoleBadgeClassName(period.role)}`}>
                      {period.role}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums text-emerald-200">
                    {formatDurationFr(periodDurationMs(period))}
                    {!period.to ? " · en cours" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(period.id)}
                    disabled={deletingId === period.id}
                    className="rounded p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-300"
                    aria-label="Supprimer la période"
                  >
                    {deletingId === period.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">{formatPeriodRangeFr(period)}</p>
              {period.notes ? (
                <p className="mt-1 text-xs italic text-zinc-400">{period.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-center text-xs text-zinc-500">
          Aucune période confirmée — les KPIs staff restent estimés via l&apos;historique des rôles.
        </p>
      )}
    </section>
  );
}
