"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles,
  Shield,
  Search,
  CalendarClock,
} from "lucide-react";
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
      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_55%)]" />
        <div className="relative text-center">
          <div className="relative mx-auto mb-5 h-14 w-14">
            <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" />
            <div className="relative h-14 w-14 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
          </div>
          <p className="text-[length:clamp(0.8125rem,0.75rem+0.35vw,0.9375rem)] font-medium text-zinc-400">
            Vérification des accès…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[calc(100dvh-4rem)] w-full min-w-0 overflow-x-hidden pb-[clamp(1.5rem,4vw,2.5rem)]"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_45%_at_50%_-8%,rgba(124,58,237,0.12),transparent)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(9,9,11,0.55))]" />

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

      <div className="relative z-[1] mx-auto w-full max-w-[min(100%,1680px)] px-[clamp(0.75rem,2.5vw,1.75rem)] py-[clamp(0.75rem,2vw,1.5rem)]">
        {error && (
          <div
            className="animate-fade-in mb-[clamp(0.75rem,2vw,1.25rem)] flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-950/35 p-[clamp(0.75rem,2vw,1rem)] shadow-lg shadow-red-950/25 backdrop-blur-md"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="min-w-0 flex-1 text-[length:clamp(0.8125rem,0.75rem+0.25vw,0.875rem)] leading-relaxed text-zinc-100">
              {error}
            </p>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1.5 text-red-400 transition hover:bg-red-950/60 hover:text-red-200"
              onClick={() => setError(null)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {success && (
          <div
            className="animate-fade-in mb-[clamp(0.75rem,2vw,1.25rem)] flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-[clamp(0.75rem,2vw,1rem)] shadow-lg shadow-emerald-950/25 backdrop-blur-md"
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <p className="min-w-0 flex-1 text-[length:clamp(0.8125rem,0.75rem+0.25vw,0.875rem)] text-zinc-100">{success}</p>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-950/50 hover:text-emerald-200"
              onClick={() => setSuccess(null)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {renewTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-[clamp(0.75rem,3vw,1.5rem)] backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="renew-modal-title"
            onClick={(e) => e.target === e.currentTarget && !renewSubmitting && closeRenew()}
          >
            <div
              className="max-h-[min(90dvh,880px)] w-full max-w-lg scale-100 overflow-y-auto rounded-2xl border border-zinc-700/80 bg-zinc-950/95 p-[clamp(1rem,3vw,1.5rem)] shadow-2xl shadow-violet-950/30 ring-1 ring-violet-500/15"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="renew-modal-title"
                    className="text-[length:clamp(1.0625rem,0.95rem+0.4vw,1.25rem)] font-bold tracking-tight text-zinc-50"
                  >
                    Renouveler l’accès admin avancé
                  </h3>
                  <p className="mt-1 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] text-zinc-400">
                    {renewTarget.username || "Membre"} ·{" "}
                    <span className="font-mono text-violet-300/90">{renewTarget.discordId}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !renewSubmitting && closeRenew()}
                  className="shrink-0 rounded-xl border border-zinc-700/80 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-[clamp(1rem,2.5vw,1.25rem)]">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200">
                    <CalendarClock className="h-4 w-4 text-violet-400" aria-hidden />
                    Nouvelle date d’expiration
                  </label>
                  <input
                    type="datetime-local"
                    value={renewExpiresAt}
                    onChange={(e) => setRenewExpiresAt(e.target.value)}
                    className="w-full min-h-[2.75rem] rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2.5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25"
                  />
                  <p className="mt-1.5 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] text-zinc-500">
                    Maximum 90 jours à partir d’aujourd’hui (même règle qu’un nouvel ajout).
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200">
                    Justification du renouvellement
                  </label>
                  <textarea
                    value={renewJustification}
                    onChange={(e) => setRenewJustification(e.target.value)}
                    placeholder="Pourquoi prolonger cet accès ?"
                    className="w-full min-h-[5.5rem] rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2.5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25"
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
                  className="rounded-xl border border-zinc-600/80 bg-zinc-900/60 px-[clamp(0.85rem,2vw,1.25rem)] py-2.5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-45"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleRenewSubmit}
                  disabled={renewSubmitting}
                  className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-[clamp(0.85rem,2vw,1.25rem)] py-2.5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] font-bold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45"
                >
                  {renewSubmitting ? (
                    <span
                      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                      aria-hidden
                    />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden />
                  )}
                  Confirmer le renouvellement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero + intro */}
        <header className="mb-[clamp(1rem,2.5vw,1.75rem)]">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-950/35 px-3 py-1 text-[length:clamp(0.625rem,0.55rem+0.2vw,0.6875rem)] font-bold uppercase tracking-widest text-violet-200/90">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" aria-hidden />
            Fondateurs
          </div>
          <h1 className="bg-gradient-to-r from-zinc-50 via-zinc-200 to-violet-200 bg-clip-text text-[length:clamp(1.375rem,1.1rem+1.2vw,2rem)] font-bold tracking-tight text-transparent">
            Accès admin avancé
          </h1>
          <p className="mt-2 max-w-3xl text-[length:clamp(0.8125rem,0.75rem+0.25vw,1rem)] leading-relaxed text-zinc-400">
            Les fondateurs ont toujours accès et ne figurent pas ici. Liste des personnes autorisées pour le menu{" "}
            <code className="rounded-md border border-zinc-700/80 bg-zinc-900/80 px-1.5 py-0.5 font-mono text-violet-200/90">
              /admin/avance
            </code>
            .
          </p>
        </header>

        {/* Carte ajout */}
        <section className="mb-[clamp(1rem,2.5vw,1.75rem)] overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/50 shadow-xl shadow-black/30 backdrop-blur-sm">
          <div className="flex flex-col gap-3 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900/90 via-violet-950/25 to-zinc-900/90 p-[clamp(1rem,2.5vw,1.35rem)] sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-[length:clamp(1rem,0.9rem+0.35vw,1.125rem)] font-bold text-zinc-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-950/40 text-violet-300">
                <Plus className="h-5 w-5" aria-hidden />
              </span>
              Ajouter une personne
            </h2>
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] font-bold text-white shadow-md shadow-violet-950/35 transition hover:brightness-110 active:scale-[0.98]"
            >
              {isAdding ? "Fermer le formulaire" : "Nouveau"}
            </button>
          </div>

          {isAdding && (
            <div className="space-y-[clamp(1rem,2.5vw,1.25rem)] p-[clamp(1rem,2.5vw,1.35rem)]">
              <div>
                <label className="mb-2 flex items-center gap-2 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200">
                  <Search className="h-4 w-4 text-violet-400" aria-hidden />
                  Rechercher un membre Discord
                </label>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={searchDiscord}
                    onChange={(e) => setSearchDiscord(e.target.value)}
                    placeholder="Pseudo, surnom ou ID…"
                    className="min-h-[2.75rem] min-w-0 flex-1 rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2.5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25"
                    onKeyDown={(e) => e.key === "Enter" && handleSearchDiscord()}
                  />
                  <button
                    type="button"
                    onClick={handleSearchDiscord}
                    disabled={searchingDiscord || !searchDiscord.trim()}
                    className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-violet-600/50 bg-violet-950/50 px-5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] font-bold text-violet-100 transition hover:bg-violet-900/60 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {searchingDiscord ? "…" : "Rechercher"}
                  </button>
                </div>
                {discordMembers.length > 0 && (
                  <div className="mt-3 max-h-[min(40vh,16rem)] space-y-2 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2">
                    {discordMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setNewDiscordId(m.id);
                          setDiscordMembers([]);
                          setSearchDiscord("");
                        }}
                        className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition hover:border-violet-500/30 hover:bg-violet-950/25 active:scale-[0.99]"
                      >
                        {m.avatar ? (
                          <img src={m.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full ring-2 ring-zinc-700/80" />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-700 to-fuchsia-800 text-sm font-bold text-white">
                            {m.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-zinc-100">{m.username}</div>
                          <div className="truncate font-mono text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] text-zinc-500">
                            {m.id}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200">
                  ID Discord
                </label>
                <input
                  type="text"
                  value={newDiscordId}
                  onChange={(e) => setNewDiscordId(e.target.value)}
                  placeholder="123456789012345678"
                  className="w-full min-h-[2.75rem] rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2.5 font-mono text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25"
                />
              </div>
              <div>
                <label className="mb-2 block text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200">
                  Justification (obligatoire)
                </label>
                <textarea
                  value={newJustification}
                  onChange={(e) => setNewJustification(e.target.value)}
                  placeholder="Pourquoi cet accès avancé est nécessaire ?"
                  className="w-full min-h-[5.5rem] rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2.5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200">
                  <CalendarClock className="h-4 w-4 text-violet-400" aria-hidden />
                  Expire le (obligatoire)
                </label>
                <input
                  type="datetime-local"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className="w-full min-h-[2.75rem] rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2.5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25"
                />
              </div>
              <button
                type="button"
                onClick={handleAdd}
                className="flex w-full min-h-[3rem] items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-[length:clamp(0.875rem,0.8rem+0.25vw,0.9375rem)] font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:brightness-110 active:scale-[0.99]"
              >
                Ajouter l’accès
              </button>
            </div>
          )}
        </section>

        {/* Liste */}
        <section className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/45 shadow-2xl shadow-black/35 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-900/40 p-[clamp(0.85rem,2.2vw,1.15rem)]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-950/80 text-violet-400">
                <Users className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-[length:clamp(1rem,0.9rem+0.35vw,1.125rem)] font-bold text-zinc-50">
                  Accès accordés
                </h2>
                <p className="text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-medium uppercase tracking-wide text-zinc-500">
                  {accessList.length} personne{accessList.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-zinc-700/80 bg-zinc-900/70 px-3 py-1 font-mono text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold tabular-nums text-zinc-300">
              {loading ? "…" : accessList.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 p-[clamp(1rem,2.5vw,1.5rem)]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-zinc-900/60"
                  style={{ animationDelay: `${i * 70}ms` }}
                />
              ))}
            </div>
          ) : accessList.length === 0 ? (
            <div className="border-t border-dashed border-zinc-800/80 p-[clamp(2rem,5vw,3rem)] text-center">
              <Shield className="mx-auto mb-3 h-10 w-10 text-zinc-600" aria-hidden />
              <p className="text-[length:clamp(0.875rem,0.8rem+0.25vw,0.9375rem)] font-medium text-zinc-300">
                Aucune personne ajoutée
              </p>
              <p className="mt-1 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] text-zinc-500">
                Les fondateurs ont toujours accès à l’admin avancé.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-800/90 bg-zinc-900/50">
                    <th className="sticky top-0 z-[1] px-[clamp(0.65rem,1.8vw,1rem)] py-3 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500">
                      Utilisateur
                    </th>
                    <th className="sticky top-0 z-[1] px-[clamp(0.65rem,1.8vw,1rem)] py-3 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500">
                      Justification
                    </th>
                    <th className="sticky top-0 z-[1] px-[clamp(0.65rem,1.8vw,1rem)] py-3 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500">
                      Ajouté le
                    </th>
                    <th className="sticky top-0 z-[1] px-[clamp(0.65rem,1.8vw,1rem)] py-3 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500">
                      Expiration
                    </th>
                    <th className="sticky top-0 z-[1] px-[clamp(0.65rem,1.8vw,1rem)] py-3 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500">
                      Ajouté par
                    </th>
                    <th className="sticky top-0 z-[1] px-[clamp(0.65rem,1.8vw,1rem)] py-3 text-right text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accessList.map((entry) => (
                    <tr
                      key={entry.discordId}
                      className="border-b border-zinc-800/60 transition-colors hover:bg-violet-950/10"
                    >
                      <td className="px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] align-top">
                        <div className="flex items-center gap-3">
                          {entry.avatar ? (
                            <img
                              src={entry.avatar}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-full ring-2 ring-zinc-700/80"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-700 text-sm font-bold text-white">
                              {(entry.username || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-zinc-100">
                              {entry.username || "Inconnu"}
                            </div>
                            <div className="truncate font-mono text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] text-zinc-500">
                              {entry.discordId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className="max-w-[14rem] px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] align-top text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] leading-relaxed text-zinc-400"
                        title={entry.justification || undefined}
                      >
                        {entry.justification || "—"}
                      </td>
                      <td className="whitespace-nowrap px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] align-top text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] text-zinc-400">
                        {entry.addedAt ? new Date(entry.addedAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="whitespace-nowrap px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] align-top text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)]">
                        <span className={entry.isExpired ? "font-semibold text-red-400" : "text-zinc-400"}>
                          {entry.expiresAt ? new Date(entry.expiresAt).toLocaleString("fr-FR") : "—"}
                          {entry.isExpired ? " · expiré" : ""}
                        </span>
                      </td>
                      <td className="max-w-[10rem] truncate px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] align-top text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] text-zinc-400">
                        {entry.addedByUsername || entry.addedBy || "—"}
                      </td>
                      <td className="px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] align-top text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openRenew(entry)}
                            className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-xl border border-violet-600/40 bg-violet-950/30 px-3 py-2 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-violet-200 transition hover:bg-violet-900/40 active:scale-[0.98]"
                          >
                            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                            Renouveler
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(entry.discordId)}
                            className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-xl border border-red-500/35 bg-red-950/25 px-3 py-2 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-red-300 transition hover:bg-red-950/40 active:scale-[0.98]"
                          >
                            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
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
        </section>
      </div>
    </div>
  );
}
