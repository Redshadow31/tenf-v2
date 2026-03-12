"use client";

import { FormEvent, useEffect, useState } from "react";
import StreamPlanningCalendar, { type StreamPlanningCalendarItem } from "@/components/member/StreamPlanningCalendar";

type StreamPlanning = StreamPlanningCalendarItem;

export default function MemberPlanningPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plannings, setPlannings] = useState<StreamPlanning[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "",
    liveType: "",
    title: "",
  });

  async function loadPlannings() {
    try {
      setError(null);
      const response = await fetch("/api/members/me/stream-plannings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Impossible de charger le planning.");
        return;
      }
      setPlannings(data.plannings || []);
    } catch (e) {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlannings();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/members/me/stream-plannings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Erreur lors de l'ajout.");
        return;
      }

      setForm({ date: "", time: "", liveType: "", title: "" });
      setShowModal(false);
      await loadPlannings();
    } catch (e) {
      setError("Erreur de connexion.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(planningId: string) {
    if (!confirm("Supprimer ce stream du planning ?")) return;

    try {
      const response = await fetch(`/api/members/me/stream-plannings?planningId=${planningId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erreur lors de la suppression.");
        return;
      }
      await loadPlannings();
    } catch (e) {
      setError("Erreur de connexion.");
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "rgba(145, 70, 255, 0.35)", background: "linear-gradient(135deg, rgba(145, 70, 255, 0.12), rgba(145, 70, 255, 0.04))" }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
            <span>🗓️</span>
            <span>Planning de mes streams</span>
          </h1>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg font-semibold text-white transition-colors"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            + Ajouter un stream
          </button>
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Ajoute manuellement tes prochains lives. Si ton planning est rempli, il sera visible dans ton modal sur la page Membres.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {loading ? (
          <div className="py-10 text-center" style={{ color: "var(--color-text-secondary)" }}>
            Chargement du planning...
          </div>
        ) : (
          <StreamPlanningCalendar plannings={plannings} />
        )}
      </div>

      {plannings.length > 0 ? (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Liste rapide
          </h2>
          {plannings.map((planning) => (
            <div
              key={planning.id}
              className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                  {new Date(planning.date).toLocaleDateString("fr-FR")} - {planning.time}
                </span>
                {" · "}
                {planning.liveType}
                {planning.title ? ` · ${planning.title}` : ""}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(planning.id)}
                className="px-3 py-1 rounded-md text-xs font-semibold text-white"
                style={{ backgroundColor: "#dc2626" }}
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}>
          <div
            className="w-full max-w-xl rounded-xl border p-6"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                Ajouter un stream
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ color: "var(--color-text-secondary)" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                    Horaire *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Jeu / type de live *
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={form.liveType}
                  onChange={(e) => setForm((prev) => ({ ...prev, liveType: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Ex: Just Chatting, Valorant, Ranking..."
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Titre du live (optionnel)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Ex: Road to Master avec la commu"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {saving ? "Ajout..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

