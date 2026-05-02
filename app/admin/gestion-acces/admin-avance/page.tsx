"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

interface AdvancedAccessEntry {
  discordId: string;
  addedAt: string;
  addedBy: string;
  justification?: string;
  expiresAt?: string;
  isExpired?: boolean;
  username?: string;
  avatar?: string | null;
  addedByUsername?: string;
}

function getDefaultExpiryDateTimeLocal(daysAhead = 30): string {
  const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AdminAvancePage() {
  const [accessList, setAccessList] = useState<AdvancedAccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newJustification, setNewJustification] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState<string>(() => getDefaultExpiryDateTimeLocal(30));
  const [searchDiscord, setSearchDiscord] = useState("");
  const [discordMembers, setDiscordMembers] = useState<Array<{ id: string; username: string; avatar: string | null }>>([]);
  const [searchingDiscord, setSearchingDiscord] = useState(false);
  const [renewTarget, setRenewTarget] = useState<AdvancedAccessEntry | null>(null);
  const [renewExpiresAt, setRenewExpiresAt] = useState("");
  const [renewJustification, setRenewJustification] = useState("");
  const [renewSubmitting, setRenewSubmitting] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch("/api/admin/access");
        if (res.status === 403) {
          window.location.href = "/unauthorized";
          return;
        }
        if (!res.ok) throw new Error("Erreur vérification");
        setIsFounder(true);
      } catch (err) {
        console.error(err);
        setError("Erreur lors de la vérification");
        window.location.href = "/unauthorized";
      }
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (!isFounder) return;
    loadList();
  }, [isFounder]);

  async function loadList() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/advanced-access", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 403) {
          setError("Réservé aux fondateurs");
          return;
        }
        throw new Error("Erreur chargement");
      }
      const data = await res.json();
      setAccessList(data.accessList || []);
    } catch (err: any) {
      setError(err.message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchDiscord() {
    if (!searchDiscord.trim()) return;
    try {
      setSearchingDiscord(true);
      setError(null);
      const res = await fetch("/api/discord/members", { cache: "no-store" });
      if (!res.ok) throw new Error("Erreur recherche");
      const data = await res.json();
      const term = searchDiscord.toLowerCase().trim();
      const matches = (data.members || [])
        .filter((m: any) => {
          const u = (m.discordUsername || "").toLowerCase();
          const n = (m.discordNickname || "").toLowerCase();
          const id = m.discordId || "";
          return u.includes(term) || n.includes(term) || id.includes(term);
        })
        .slice(0, 10)
        .map((m: any) => ({
          id: m.discordId,
          username: m.discordNickname || m.discordUsername || "Inconnu",
          avatar: m.avatar || null,
        }));
      setDiscordMembers(matches);
      if (matches.length === 0) setError("Aucun membre Discord trouvé");
    } catch (err: any) {
      setError(err.message || "Erreur recherche");
    } finally {
      setSearchingDiscord(false);
    }
  }

  async function handleAdd() {
    if (!newDiscordId.trim()) {
      setError("L'ID Discord est requis");
      return;
    }
    if (!newJustification.trim()) {
      setError("La justification est obligatoire");
      return;
    }
    if (!newExpiresAt) {
      setError("La date d'expiration est obligatoire");
      return;
    }
    try {
      setError(null);
      const res = await fetch("/api/admin/advanced-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: newDiscordId.trim(),
          justification: newJustification.trim(),
          expiresAt: new Date(newExpiresAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur ajout");
      await loadList();
      setNewDiscordId("");
      setNewJustification("");
      setNewExpiresAt(getDefaultExpiryDateTimeLocal(30));
      setIsAdding(false);
      setSuccess("Accès ajouté");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur ajout");
      setSuccess(null);
    }
  }

  function openRenew(entry: AdvancedAccessEntry) {
    setRenewTarget(entry);
    setRenewExpiresAt(getDefaultExpiryDateTimeLocal(30));
    setRenewJustification("");
    setError(null);
  }

  function closeRenew() {
    setRenewTarget(null);
    setRenewSubmitting(false);
  }

  async function handleRenewSubmit() {
    if (!renewTarget) return;
    const j = renewJustification.trim();
    if (!j) {
      setError("La justification du renouvellement est obligatoire");
      return;
    }
    if (!renewExpiresAt) {
      setError("La date d'expiration est obligatoire");
      return;
    }
    try {
      setRenewSubmitting(true);
      setError(null);
      const res = await fetch("/api/admin/advanced-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: renewTarget.discordId,
          justification: j,
          expiresAt: new Date(renewExpiresAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur renouvellement");
      await loadList();
      closeRenew();
      setSuccess("Accès renouvelé");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur renouvellement");
      setSuccess(null);
    } finally {
      setRenewSubmitting(false);
    }
  }

  async function handleRemove(discordId: string) {
    const reason = prompt("Motif du retrait (obligatoire) :");
    if (!reason || !reason.trim()) {
      setError("Le motif de retrait est obligatoire");
      return;
    }
    if (!confirm("Retirer l'accès admin avancé de cette personne ?")) return;
    try {
      setError(null);
      const res = await fetch(
        `/api/admin/advanced-access?discordId=${encodeURIComponent(discordId)}&reason=${encodeURIComponent(reason.trim())}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur suppression");
      await loadList();
      setSuccess("Accès retiré");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur suppression");
      setSuccess(null);
    }
  }

  if (!isFounder && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: "var(--color-primary)" }} />
          <p style={{ color: "var(--color-text-secondary)" }}>Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <AdminHeader
        title="Accès admin avancé"
        navLinks={[
          { href: "/admin/gestion-acces/accueil", label: "Dashboard administration" },
          { href: "/admin/gestion-acces", label: "Comptes administrateurs" },
          { href: "/admin/gestion-acces/dashboard", label: "Paramètres dashboard" },
          { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
          { href: "/admin/gestion-acces/admin-avance", label: "Admin avancé (fondateurs)", active: true },
        ]}
      />

      <div className="mx-auto max-w-7xl px-8 py-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/50 p-4" style={{ backgroundColor: "var(--color-card)" }}>
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-sm" style={{ color: "var(--color-text)" }}>{error}</p>
            <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => setError(null)}>×</button>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/50 p-4" style={{ backgroundColor: "var(--color-card)" }}>
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
            <p className="text-sm" style={{ color: "var(--color-text)" }}>{success}</p>
            <button className="ml-auto text-green-600 hover:text-green-700" onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        {renewTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="renew-modal-title"
            onClick={(e) => e.target === e.currentTarget && !renewSubmitting && closeRenew()}
          >
            <div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-xl"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="renew-modal-title" className="mb-1 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Renouveler l’accès admin avancé
              </h3>
              <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {renewTarget.username || "Membre"} · <span className="font-mono text-xs">{renewTarget.discordId}</span>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: "var(--color-text)" }}>
                    Nouvelle date d’expiration
                  </label>
                  <input
                    type="datetime-local"
                    value={renewExpiresAt}
                    onChange={(e) => setRenewExpiresAt(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  />
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Maximum 90 jours à partir d’aujourd’hui (même règle qu’un nouvel ajout).
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: "var(--color-text)" }}>
                    Justification du renouvellement
                  </label>
                  <textarea
                    value={renewJustification}
                    onChange={(e) => setRenewJustification(e.target.value)}
                    placeholder="Pourquoi prolonger cet accès ?"
                    className="w-full rounded-lg border px-4 py-2"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRenew}
                  disabled={renewSubmitting}
                  className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleRenewSubmit}
                  disabled={renewSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {renewSubmitting ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden />
                  )}
                  Confirmer le renouvellement
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Les fondateurs ont toujours accès à l'admin avancé et ne figurent pas dans cette liste.
            Ajoutez ici les personnes autorisées à accéder au menu complet (<code className="rounded bg-black/20 px-1">/admin/avance</code>).
          </p>
        </div>

        <div className="mb-8 rounded-lg border p-6" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold" style={{ color: "var(--color-text)" }}>
              <Plus className="h-5 w-5" />
              Ajouter une personne
            </h2>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {isAdding ? "Annuler" : "Nouveau"}
            </button>
          </div>

          {isAdding && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  Rechercher un membre Discord
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchDiscord}
                    onChange={(e) => setSearchDiscord(e.target.value)}
                    placeholder="Nom ou ID Discord..."
                    className="flex-1 rounded-lg border px-4 py-2"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchDiscord()}
                  />
                  <button
                    onClick={handleSearchDiscord}
                    disabled={searchingDiscord || !searchDiscord.trim()}
                    className="rounded-lg px-4 py-2 font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {searchingDiscord ? "..." : "Rechercher"}
                  </button>
                </div>
                {discordMembers.length > 0 && (
                  <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                    {discordMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setNewDiscordId(m.id);
                          setDiscordMembers([]);
                          setSearchDiscord("");
                        }}
                        className="flex w-full items-center gap-3 rounded-lg border p-2 transition-opacity hover:opacity-80"
                        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                      >
                        {m.avatar ? (
                          <img src={m.avatar} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-sm text-white">
                            {m.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium" style={{ color: "var(--color-text)" }}>{m.username}</div>
                          <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{m.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  ID Discord
                </label>
                <input
                  type="text"
                  value={newDiscordId}
                  onChange={(e) => setNewDiscordId(e.target.value)}
                  placeholder="123456789012345678"
                  className="w-full rounded-lg border px-4 py-2"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  Justification (obligatoire)
                </label>
                <textarea
                  value={newJustification}
                  onChange={(e) => setNewJustification(e.target.value)}
                  placeholder="Pourquoi cet accès avancé est nécessaire ?"
                  className="w-full rounded-lg border px-4 py-2"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  Expire le (obligatoire)
                </label>
                <input
                  type="datetime-local"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full rounded-lg px-4 py-2 font-medium text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Ajouter l'accès
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                Personnes avec accès admin avancé ({accessList.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2" style={{ borderColor: "var(--color-primary)" }} />
            </div>
          ) : accessList.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
              Aucune personne ajoutée. Les fondateurs ont toujours accès.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>Utilisateur</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>Justification</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>Ajouté le</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>Expiration</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>Ajouté par</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accessList.map((entry) => (
                    <tr
                      key={entry.discordId}
                      className="border-b transition-colors"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {entry.avatar ? (
                            <img src={entry.avatar} alt="" className="h-10 w-10 rounded-full" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white" style={{ background: "linear-gradient(to bottom right, var(--color-primary), var(--color-primary-dark))" }}>
                              {(entry.username || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium" style={{ color: "var(--color-text)" }}>{entry.username || "Inconnu"}</div>
                            <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{entry.discordId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {entry.justification || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {entry.addedAt ? new Date(entry.addedAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: entry.isExpired ? "#ef4444" : "var(--color-text-secondary)" }}>
                        {entry.expiresAt ? new Date(entry.expiresAt).toLocaleString("fr-FR") : "—"}
                        {entry.isExpired ? " (expiré)" : ""}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {entry.addedByUsername || entry.addedBy || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openRenew(entry)}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/10"
                            style={{ color: "var(--color-primary)" }}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Renouveler
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(entry.discordId)}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Retirer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
