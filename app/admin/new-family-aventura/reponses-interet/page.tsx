"use client";

import { useEffect, useMemo, useState } from "react";
import type { AventuraInterestResponse } from "@/lib/newFamilyAventuraStorage";

export default function AdminAventuraResponsesPage() {
  const [responses, setResponses] = useState<AventuraInterestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filterQuick, setFilterQuick] = useState<string>("all");
  const [filterProfile, setFilterProfile] = useState<string>("all");
  const [filterReviewed, setFilterReviewed] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/new-family-aventura/interest", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Chargement impossible");
        setResponses(data.responses || []);
      } catch (e) {
        setError("Impossible de charger les réponses.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return responses.filter((item) => {
      if (filterQuick !== "all" && item.quick_response !== filterQuick) return false;
      if (filterProfile !== "all" && item.profile_type !== filterProfile) return false;
      if (filterReviewed === "reviewed" && !item.is_reviewed) return false;
      if (filterReviewed === "unreviewed" && item.is_reviewed) return false;
      return true;
    });
  }, [responses, filterQuick, filterProfile, filterReviewed]);

  async function saveReview(id: string, updates: { is_reviewed?: boolean; admin_note?: string }) {
    setSavingId(id);
    try {
      const response = await fetch(`/api/new-family-aventura/interest/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("save error");
      setResponses((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                is_reviewed:
                  typeof updates.is_reviewed === "boolean"
                    ? updates.is_reviewed
                    : item.is_reviewed,
                admin_note:
                  typeof updates.admin_note === "string"
                    ? updates.admin_note
                    : item.admin_note,
              }
            : item
        )
      );
    } catch {
      setError("Impossible de mettre à jour cette réponse.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Réponses & intérêt - New Family Aventura
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Consultation des réponses, filtres et actions de suivi admin.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={filterQuick} onChange={(e) => setFilterQuick(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}>
          <option value="all">Toutes réponses</option>
          <option value="interested">Intéressé</option>
          <option value="more_info">Plus d'infos</option>
          <option value="maybe">Hésitant</option>
          <option value="not_for_me">Pas pour moi</option>
        </select>
        <select value={filterProfile} onChange={(e) => setFilterProfile(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}>
          <option value="all">Tous profils</option>
          <option value="createur">Créateur</option>
          <option value="membre">Membre</option>
          <option value="autre">Autre</option>
        </select>
        <select value={filterReviewed} onChange={(e) => setFilterReviewed(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)" }}>
          <option value="all">Lu + non lu</option>
          <option value="reviewed">Relu</option>
          <option value="unreviewed">Non relu</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
          {error}
        </div>
      ) : null}

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        {loading ? (
          <div className="p-5" style={{ color: "var(--color-text-secondary)" }}>
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5" style={{ color: "var(--color-text-secondary)" }}>
            Aucune réponse pour ces filtres.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {filtered.map((item) => (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                    {item.pseudo}
                  </span>
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    ({item.profile_type}) - {item.quick_response}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(item.created_at).toLocaleString("fr-FR")}
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: item.is_reviewed
                        ? "rgba(16,185,129,0.18)"
                        : "rgba(245,158,11,0.16)",
                      color: item.is_reviewed ? "#34d399" : "#f59e0b",
                    }}
                  >
                    {item.is_reviewed ? "Relu" : "Non relu"}
                  </span>
                </div>
                <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Contact: {item.contact || "non renseigné"} - Source: {item.source}
                </div>
                {item.interest_reason ? (
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {item.interest_reason}
                  </p>
                ) : null}
                {item.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.conditions.map((condition) => (
                      <span key={condition} className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : null}
                <textarea
                  defaultValue={item.admin_note || ""}
                  placeholder="Note admin..."
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  onBlur={(e) => {
                    void saveReview(item.id, { admin_note: e.target.value });
                  }}
                />
                <button
                  onClick={() => void saveReview(item.id, { is_reviewed: !item.is_reviewed })}
                  disabled={savingId === item.id}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {item.is_reviewed ? "Marquer non relu" : "Marquer comme relu"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TODO: ajouter export CSV et filtres avancés (intervalle dates, recherche texte, tri) */}
    </div>
  );
}

