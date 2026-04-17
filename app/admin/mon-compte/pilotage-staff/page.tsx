"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  Users,
} from "lucide-react";

type EventRow = {
  id: string;
  title: string;
  category: string;
  startsAt: string;
  location: string | null;
  isPublished: boolean;
  lead: {
    primaryDiscordId: string;
    secondaryDiscordId: string | null;
    notes: string | null;
  } | null;
};

type LaneRow = {
  laneKey: string;
  primaryDiscordId: string;
  secondaryDiscordId: string | null;
  notes: string | null;
};

type ScheduledRow = {
  id: string;
  category: string;
  title: string;
  scheduledAt: string | null;
  endsAt: string | null;
  primaryDiscordId: string | null;
  secondaryDiscordId: string | null;
  status: string;
  notes: string | null;
  sortOrder: number;
};

const LANE_LABELS: Record<string, string> = {
  discord_points: "Points Discord (suivi / relevés)",
  raids: "Raids (coordination)",
  member_integration: "Intégration des nouveaux membres",
  member_profile_verification: "Vérification des fiches / infos membres",
};

const CATEGORY_OPTIONS = [
  { value: "integration_meeting", label: "Réunion d’intégration" },
  { value: "action", label: "Action / point projet" },
  { value: "raid_window", label: "Fenêtre ou orga raids" },
  { value: "other", label: "Autre" },
] as const;

const STATUS_OPTIONS = ["planned", "in_progress", "done", "cancelled"] as const;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-[#0a0c10]";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export default function PilotageStaffPage() {
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [lanes, setLanes] = useState<LaneRow[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledRow[]>([]);
  const [savingBulk, setSavingBulk] = useState(false);

  const [newItem, setNewItem] = useState({
    category: "integration_meeting" as string,
    title: "",
    scheduledAt: "",
    endsAt: "",
    primaryDiscordId: "",
    secondaryDiscordId: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/me/staff-pilotage", { cache: "no-store" });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j?.error === "string" ? j.error : "Chargement impossible");
      }
      const j = (await res.json()) as {
        upcomingEvents?: EventRow[];
        laneOwners?: LaneRow[];
        scheduledItems?: ScheduledRow[];
      };
      setEvents(Array.isArray(j.upcomingEvents) ? j.upcomingEvents : []);
      setLanes(Array.isArray(j.laneOwners) ? j.laneOwners : []);
      setScheduled(Array.isArray(j.scheduledItems) ? j.scheduledItems : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateEventLead(
    eventId: string,
    patch: Partial<{ primary: string; secondary: string; notes: string }>
  ) {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const lead = ev.lead || { primaryDiscordId: "", secondaryDiscordId: null, notes: null };
        return {
          ...ev,
          lead: {
            primaryDiscordId: patch.primary !== undefined ? patch.primary : lead.primaryDiscordId,
            secondaryDiscordId:
              patch.secondary !== undefined ? patch.secondary || null : lead.secondaryDiscordId,
            notes: patch.notes !== undefined ? patch.notes || null : lead.notes,
          },
        };
      })
    );
  }

  function updateLane(laneKey: string, patch: Partial<{ primary: string; secondary: string; notes: string }>) {
    setLanes((prev) =>
      prev.map((l) => {
        if (l.laneKey !== laneKey) return l;
        return {
          ...l,
          primaryDiscordId: patch.primary !== undefined ? patch.primary : l.primaryDiscordId,
          secondaryDiscordId: patch.secondary !== undefined ? patch.secondary || null : l.secondaryDiscordId,
          notes: patch.notes !== undefined ? patch.notes || null : l.notes,
        };
      })
    );
  }

  async function saveEventsAndLanes() {
    setSavingBulk(true);
    setError(null);
    setMessage(null);
    try {
      const eventLeads = events.map((ev) => ({
        eventId: ev.id,
        primaryDiscordId: ev.lead?.primaryDiscordId ?? "",
        secondaryDiscordId: ev.lead?.secondaryDiscordId,
        notes: ev.lead?.notes,
      }));
      const laneOwners = lanes.map((l) => ({
        laneKey: l.laneKey,
        primaryDiscordId: l.primaryDiscordId,
        secondaryDiscordId: l.secondaryDiscordId,
        notes: l.notes,
      }));
      const res = await fetch("/api/admin/me/staff-pilotage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventLeads, laneOwners }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j?.error === "string" ? j.error : "Enregistrement refusé");
      setMessage("Responsables événements et pôles opérationnels enregistrés.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingBulk(false);
    }
  }

  async function addScheduled() {
    setError(null);
    setMessage(null);
    try {
      const toIso = (v: string) => {
        if (!v.trim()) return null;
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
      };
      const res = await fetch("/api/admin/me/staff-pilotage/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newItem.category,
          title: newItem.title,
          scheduledAt: toIso(newItem.scheduledAt),
          endsAt: toIso(newItem.endsAt),
          primaryDiscordId: newItem.primaryDiscordId || null,
          secondaryDiscordId: newItem.secondaryDiscordId || null,
          notes: newItem.notes || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j?.error === "string" ? j.error : "Création refusée");
      setNewItem({
        category: "integration_meeting",
        title: "",
        scheduledAt: "",
        endsAt: "",
        primaryDiscordId: "",
        secondaryDiscordId: "",
        notes: "",
      });
      setMessage("Entrée de planning ajoutée.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function removeScheduled(id: string) {
    if (!window.confirm("Supprimer cette entrée du planning ?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/me/staff-pilotage/scheduled/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j?.error === "string" ? j.error : "Suppression refusée");
      }
      setMessage("Entrée supprimée.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function patchScheduled(id: string, body: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/me/staff-pilotage/scheduled/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j?.error === "string" ? j.error : "Mise à jour refusée");
      }
      setMessage("Planning mis à jour.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-500/30 bg-amber-950/20 p-8 text-center">
        <p className="text-amber-100">Cette page est réservée aux comptes avec accès administrateur avancé.</p>
        <Link
          href="/admin/mon-compte"
          className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:underline ${focusRing}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour Mon compte
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        <p className="text-sm">Chargement du pilotage staff…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/admin/mon-compte"
            className={`mb-3 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 ${focusRing}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Mon compte
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Pilotage staff</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Affecte 1–2 responsables par événement, définit les référents pour les points Discord, les raids,
            l’intégration et la vérification des fiches membres, et planifie les réunions d’intégration et actions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className={`inline-flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:border-amber-500/40 ${focusRing}`}
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/35 bg-red-950/30 px-4 py-3 text-sm text-red-100">{error}</div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      )}

      {/* Pôles opérationnels */}
      <section className="rounded-3xl border border-white/10 bg-[#080a12]/90 p-6 shadow-xl">
        <div className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Référents opérationnels</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Discord ID (chiffres) du staff principal et optionnellement d’un co-référent. Laisser vide puis enregistrer
          supprime l’affectation sur ce pôle.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {lanes.map((lane) => (
            <div key={lane.laneKey} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-semibold text-amber-100/95">{LANE_LABELS[lane.laneKey] || lane.laneKey}</p>
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Responsable principal
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white"
                value={lane.primaryDiscordId}
                onChange={(e) => updateLane(lane.laneKey, { primary: e.target.value })}
                placeholder="Discord ID"
              />
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Co-référent (optionnel)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white"
                value={lane.secondaryDiscordId ?? ""}
                onChange={(e) => updateLane(lane.laneKey, { secondary: e.target.value })}
                placeholder="Discord ID"
              />
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Notes
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white"
                value={lane.notes ?? ""}
                onChange={(e) => updateLane(lane.laneKey, { notes: e.target.value })}
                placeholder="Précisions, outillage, fréquence…"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Événements */}
      <section className="rounded-3xl border border-white/10 bg-[#080a12]/90 p-6 shadow-xl">
        <div className="flex items-center gap-2 text-white">
          <Calendar className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Responsables par événement</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Événements à venir (et récents). Jusqu’à deux personnes responsables par événement.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="pb-2 pr-3">Événement</th>
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2 pr-3">Resp. 1</th>
                <th className="pb-2 pr-3">Resp. 2</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-white/5 align-top">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-zinc-100">{ev.title}</p>
                    <p className="text-xs text-zinc-500">{ev.category}</p>
                  </td>
                  <td className="py-3 pr-3 text-xs text-zinc-400 whitespace-nowrap">{formatWhen(ev.startsAt)}</td>
                  <td className="py-3 pr-3">
                    <input
                      className="w-full min-w-[120px] rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                      value={ev.lead?.primaryDiscordId ?? ""}
                      onChange={(e) => updateEventLead(ev.id, { primary: e.target.value })}
                      placeholder="ID Discord"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      className="w-full min-w-[120px] rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                      value={ev.lead?.secondaryDiscordId ?? ""}
                      onChange={(e) => updateEventLead(ev.id, { secondary: e.target.value })}
                      placeholder="Optionnel"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      className="w-full min-w-[140px] rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                      value={ev.lead?.notes ?? ""}
                      onChange={(e) => updateEventLead(ev.id, { notes: e.target.value })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Aucun événement à venir trouvé dans la base.</p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={savingBulk}
            onClick={() => void saveEventsAndLanes()}
            className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-amber-300 to-amber-600 px-5 py-2.5 text-sm font-bold text-black shadow disabled:opacity-50 ${focusRing}`}
          >
            {savingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer pôles + événements
          </button>
        </div>
      </section>

      {/* Planning */}
      <section className="rounded-3xl border border-white/10 bg-[#080a12]/90 p-6 shadow-xl">
        <div className="flex items-center gap-2 text-white">
          <ClipboardList className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Planning (réunions d’intégration & actions)</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Crée des lignes de calendrier : qui pilote, quand, avec un co-responsable si besoin.
        </p>

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs text-zinc-500">Type</label>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white"
              value={newItem.category}
              onChange={(e) => setNewItem((s) => ({ ...s, category: e.target.value }))}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-500">Titre</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white"
              value={newItem.title}
              onChange={(e) => setNewItem((s) => ({ ...s, title: e.target.value }))}
              placeholder="ex. Point intégration promo Mars"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Début (local, ISO)</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white"
              value={newItem.scheduledAt}
              onChange={(e) => setNewItem((s) => ({ ...s, scheduledAt: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Fin (optionnel)</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white"
              value={newItem.endsAt}
              onChange={(e) => setNewItem((s) => ({ ...s, endsAt: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Responsable 1 (Discord ID)</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white"
              value={newItem.primaryDiscordId}
              onChange={(e) => setNewItem((s) => ({ ...s, primaryDiscordId: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Responsable 2</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white"
              value={newItem.secondaryDiscordId}
              onChange={(e) => setNewItem((s) => ({ ...s, secondaryDiscordId: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="text-xs text-zinc-500">Notes</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white"
              value={newItem.notes}
              onChange={(e) => setNewItem((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={() => void addScheduled()}
              className={`rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-500/25 ${focusRing}`}
            >
              Ajouter au planning
            </button>
          </div>
        </div>

        <ul className="mt-8 space-y-3">
          {scheduled.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-100">{row.title}</p>
                <p className="text-xs text-zinc-500">
                  {CATEGORY_OPTIONS.find((c) => c.value === row.category)?.label || row.category} ·{" "}
                  {formatWhen(row.scheduledAt)}
                  {row.endsAt ? ` → ${formatWhen(row.endsAt)}` : ""}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  R1: {row.primaryDiscordId || "—"} · R2: {row.secondaryDiscordId || "—"}
                </p>
                {row.notes ? <p className="mt-1 text-xs text-zinc-500">{row.notes}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <select
                  className="rounded-lg border border-white/10 bg-[#0a0c12] px-2 py-1.5 text-xs text-white"
                  value={row.status}
                  onChange={(e) => void patchScheduled(row.id, { status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void removeScheduled(row.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-500/35 px-2 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
        {scheduled.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Aucune entrée de planning pour l’instant.</p>
        ) : null}
      </section>
    </div>
  );
}
