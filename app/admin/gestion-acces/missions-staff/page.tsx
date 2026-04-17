"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  assigneeDiscordId: string;
};

export default function StaffMissionsAdminPage() {
  const [assigneeId, setAssigneeId] = useState("");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const id = assigneeId.trim();
    if (!id) {
      setError("Indique l’ID Discord du staff concerné.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/staff-missions?assigneeDiscordId=${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j?.error === "string" ? j.error : "Chargement impossible");
      }
      setMissions(Array.isArray(j.missions) ? j.missions : []);
      setMessage(j.missions?.length ? null : "Aucune mission pour ce compte.");
    } catch (e) {
      setMissions([]);
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [assigneeId]);

  useEffect(() => {
    setMessage(null);
  }, [assigneeId]);

  async function addMission() {
    const id = assigneeId.trim();
    const title = newTitle.trim();
    if (!id || !title) {
      setError("ID Discord et titre requis pour ajouter une mission.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/staff-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneeDiscordId: id,
          title,
          description: newDescription.trim() || null,
          sortOrder: Number.isFinite(newSortOrder) ? newSortOrder : 0,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j?.error === "string" ? j.error : "Création refusée");
      }
      setNewTitle("");
      setNewDescription("");
      setNewSortOrder(0);
      setMessage("Mission ajoutée.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function removeMission(missionId: string) {
    if (!window.confirm("Supprimer cette mission ?")) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/staff-missions/${encodeURIComponent(missionId)}`, {
        method: "DELETE",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j?.error === "string" ? j.error : "Suppression refusée");
      }
      setMessage("Mission supprimée.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <AdminHeader
        title="Missions nominatives staff"
        navLinks={[
          { href: "/admin/gestion-acces/accueil", label: "Dashboard administration" },
          { href: "/admin/gestion-acces/organigramme-staff", label: "Organigramme staff" },
          { href: "/admin/mon-compte", label: "Mon compte" },
          { href: "/admin/gestion-acces/missions-staff", label: "Missions staff", active: true },
        ]}
      />

      <div className="mx-auto max-w-3xl space-y-8 px-8 pb-16">
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          Attribue des missions concrètes (OBS, budget, organisation…) : elles apparaissent sur la page{" "}
          <strong style={{ color: "var(--color-text)" }}>Mon compte</strong> du staff concerné. Réservé aux fondateurs
          et admins coordinateurs.
        </p>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
        <h2 className="text-sm font-semibold text-white">Charger les missions d’un compte</h2>
        <p className="mt-1 text-xs text-zinc-500">Utilise l’ID Discord (chiffres) du membre staff, tel qu’en base.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-zinc-400" htmlFor="assignee">
              Discord ID du destinataire
            </label>
            <input
              id="assignee"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder="ex. 1021398088474169414"
            />
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Charger
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/35 bg-red-950/30 px-4 py-3 text-sm text-red-100">{error}</div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
        <h2 className="text-sm font-semibold text-white">Ajouter une mission</h2>
        <div className="mt-4 grid gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Titre</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="ex. Référent formation OBS"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Description (optionnel)</label>
            <textarea
              className="min-h-[88px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Précisions, lien interne, périodicité…"
            />
          </div>
          <div className="max-w-[120px]">
            <label className="mb-1 block text-xs text-zinc-400">Ordre</label>
            <input
              type="number"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void addMission()}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? "Ajout…" : "Ajouter pour ce Discord ID"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
        <h2 className="text-sm font-semibold text-white">Liste ({missions.length})</h2>
        <ul className="mt-4 space-y-3">
          {missions.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-100">{m.title}</p>
                {m.description ? <p className="mt-1 text-xs text-zinc-400">{m.description}</p> : null}
                <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-600">
                  ordre {m.sortOrder} · id {m.id.slice(0, 8)}…
                </p>
              </div>
              <button
                type="button"
                onClick={() => void removeMission(m.id)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-500/35 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </li>
          ))}
        </ul>
        {!loading && missions.length === 0 && assigneeId.trim() && !error ? (
          <p className="mt-4 text-sm text-zinc-500">Aucune entrée — ajoute une mission ci-dessus.</p>
        ) : null}
      </section>
      </div>
    </div>
  );
}
