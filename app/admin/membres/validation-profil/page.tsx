"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, FileText, Loader2, Trash2, RefreshCw } from "lucide-react";
import AdminToastStack, { type AdminToastItem } from "@/components/admin/ui/AdminToastStack";
import AdminTableShell from "@/components/admin/ui/AdminTableShell";

interface PendingItem {
  id: string;
  twitch_login: string;
  discord_id: string | null;
  description: string | null;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  birthday: string | null;
  twitch_affiliate_date: string | null;
  status: string;
  submitted_at: string;
}

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

export default function ValidationProfilPage() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);
  const [savedViews, setSavedViews] = useState<Array<{ id: string; name: string; search: string }>>([]);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState("");
  const [newSavedViewName, setNewSavedViewName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const SAVED_VIEWS_KEY = "tenf-admin-validation-profil-saved-views";

  function pushToast(type: "success" | "warning" | "info", title: string, description?: string) {
    const toast: AdminToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      description,
    };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    }, 3500);
  }

  useEffect(() => {
    loadPending();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_VIEWS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSavedViews(parsed);
    } catch {
      // Ignore malformed localStorage value.
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  async function loadPending() {
    try {
      setLoading(true);
      setRefreshing(true);
      const res = await fetch("/api/admin/members/profile-validation", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject" | "force_delete") {
    if (action === "force_delete") {
      const confirmed = window.confirm(
        "Confirmer la suppression forcée de cette demande ?\n\nCette action supprime définitivement l'entrée de validation."
      );
      if (!confirmed) return;
    }

    setActioning(id);
    try {
      const res = await fetch("/api/admin/members/profile-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== id));
        pushToast(
          "success",
          action === "approve"
            ? "Demande validée"
            : action === "reject"
              ? "Demande rejetée"
              : "Demande supprimée"
        );
      } else {
        pushToast("warning", "Action impossible", data.error || "Erreur");
      }
    } catch (e) {
      pushToast("warning", "Erreur de connexion");
    } finally {
      setActioning(null);
    }
  }

  function saveViewsToStorage(nextViews: typeof savedViews) {
    setSavedViews(nextViews);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(nextViews));
  }

  function saveCurrentView() {
    if (!newSavedViewName.trim()) {
      pushToast("warning", "Nom requis", "Ajoute un nom avant d'enregistrer.");
      return;
    }
    const next = [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: newSavedViewName.trim(), search },
      ...savedViews,
    ].slice(0, 20);
    saveViewsToStorage(next);
    setSelectedSavedViewId(next[0].id);
    setNewSavedViewName("");
    pushToast("success", "Vue sauvegardée");
  }

  function applySavedView(viewId: string) {
    setSelectedSavedViewId(viewId);
    const view = savedViews.find((v) => v.id === viewId);
    if (!view) return;
    setSearch(view.search);
    pushToast("info", "Vue appliquée", view.name);
  }

  function deleteSavedView(viewId: string) {
    const next = savedViews.filter((v) => v.id !== viewId);
    saveViewsToStorage(next);
    if (selectedSavedViewId === viewId) setSelectedSavedViewId("");
    pushToast("info", "Vue supprimée");
  }

  const filteredPending = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pending;
    return pending.filter((item) => item.twitch_login.toLowerCase().includes(q));
  }, [pending, search]);

  const paginatedPending = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPending.slice(start, start + pageSize);
  }, [filteredPending, currentPage, pageSize]);

  const totalPending = pending.length;
  const filteredCount = filteredPending.length;
  const withDescription = pending.filter((item) => Boolean(item.description?.trim())).length;
  const withSocialLinks = pending.filter((item) => item.instagram || item.tiktok || item.twitter).length;

  return (
    <div className="space-y-6 text-white">
      <AdminToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
      />
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Link href="/admin/membres/gestion" className="inline-block text-sm text-slate-300 hover:text-white transition mb-4">
              ← Retour à la gestion des membres
            </Link>
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Membres · Validation profil</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Centre de validation des profils
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Les membres proposent des modifications de profil. Valide, rejette ou supprime les demandes selon les règles de conformité.
            </p>
          </div>
          <button type="button" onClick={() => void loadPending()} disabled={refreshing} className={`${subtleButtonClass} disabled:opacity-60`}>
            <RefreshCw className="h-4 w-4" />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Demandes totales</p>
          <p className="mt-2 text-3xl font-semibold">{totalPending}</p>
          <p className="mt-1 text-xs text-slate-400">En attente de décision</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Filtre actif</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{filteredCount}</p>
          <p className="mt-1 text-xs text-slate-400">Résultats affichés</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Avec descriptif</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-300">{withDescription}</p>
          <p className="mt-1 text-xs text-slate-400">Contexte éditorial disponible</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Réseaux fournis</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-300">{withSocialLinks}</p>
          <p className="mt-1 text-xs text-slate-400">Instagram / TikTok / Twitter</p>
        </article>
      </section>

      <section className={`${sectionCardClass} flex flex-wrap items-center gap-2 p-3`}>
          <select
            value={selectedSavedViewId}
            onChange={(e) => applySavedView(e.target.value)}
            className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-white"
          >
            <option value="">Vues sauvegardées</option>
            {savedViews.map((view) => (
              <option key={view.id} value={view.id}>{view.name}</option>
            ))}
          </select>
          <input
            value={newSavedViewName}
            onChange={(e) => setNewSavedViewName(e.target.value)}
            placeholder="Nom de vue"
            className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-white"
          />
          <button onClick={saveCurrentView} className="rounded-lg border border-indigo-300/30 bg-indigo-500/25 px-3 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/35">
            Sauver vue
          </button>
          {selectedSavedViewId && (
            <button onClick={() => deleteSavedView(selectedSavedViewId)} className="rounded-lg border border-rose-300/30 bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/30">
              Suppr vue
            </button>
          )}
      </section>

      {loading ? (
        <section className={`${sectionCardClass} flex justify-center py-12`}>
          <Loader2 className="h-10 w-10 animate-spin text-indigo-300" />
        </section>
      ) : filteredPending.length === 0 ? (
        <section className={`${sectionCardClass} p-12 text-center`}>
          <FileText className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <p className="text-slate-300">Aucune demande en attente</p>
        </section>
      ) : (
        <section className={`${sectionCardClass} p-4`}>
          <AdminTableShell
            title="Demandes en attente"
            subtitle="Traitement standardisé avec filtres, pagination et actions rapides"
            searchValue={search}
            onSearchChange={setSearch}
            page={currentPage}
            pageSize={pageSize}
            total={filteredPending.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            searchPlaceholder="Filtrer par Twitch login..."
          >
          <div className="space-y-6">
            {paginatedPending.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      <Link
                        href={`/admin/membres/gestion?search=${encodeURIComponent(item.twitch_login)}`}
                        className="text-indigo-200 hover:text-indigo-100 hover:underline"
                      >
                        {item.twitch_login}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Soumis le {new Date(item.submitted_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(item.id, "approve")}
                      disabled={actioning === item.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.28),rgba(6,95,70,0.4))] px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:-translate-y-[1px] hover:border-emerald-200/55 hover:bg-[linear-gradient(135deg,rgba(16,185,129,0.4),rgba(6,95,70,0.58))] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actioning === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Valider
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "reject")}
                      disabled={actioning === item.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-300/35 bg-[linear-gradient(135deg,rgba(244,63,94,0.24),rgba(127,29,29,0.42))] px-4 py-2 text-sm font-semibold text-rose-100 transition hover:-translate-y-[1px] hover:border-rose-200/55 hover:bg-[linear-gradient(135deg,rgba(244,63,94,0.36),rgba(127,29,29,0.58))] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "force_delete")}
                      disabled={actioning === item.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-300/35 bg-[linear-gradient(135deg,rgba(245,158,11,0.24),rgba(120,53,15,0.44))] px-4 py-2 text-sm font-semibold text-amber-100 transition hover:-translate-y-[1px] hover:border-amber-200/55 hover:bg-[linear-gradient(135deg,rgba(245,158,11,0.38),rgba(120,53,15,0.62))] disabled:cursor-not-allowed disabled:opacity-50"
                      title="Supprime définitivement cette demande, sans modifier le profil membre"
                    >
                      <Trash2 className="w-4 h-4" />
                      Forcer suppression
                    </button>
                  </div>
                </div>

                {item.description && (
                  <div className="mb-4">
                    <p className="mb-1 text-xs font-medium text-slate-400">Descriptif</p>
                    <p className="whitespace-pre-wrap rounded-lg border border-[#31384d] bg-[#0f1321]/85 p-3 text-sm text-slate-100">
                      {item.description}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {item.instagram && (
                    <div>
                      <span className="text-xs text-slate-400">Instagram:</span>
                      <span className="ml-2 text-sm">{item.instagram}</span>
                    </div>
                  )}
                  {item.tiktok && (
                    <div>
                      <span className="text-xs text-slate-400">TikTok:</span>
                      <span className="ml-2 text-sm">{item.tiktok}</span>
                    </div>
                  )}
                  {item.twitter && (
                    <div>
                      <span className="text-xs text-slate-400">Twitter:</span>
                      <span className="ml-2 text-sm">{item.twitter}</span>
                    </div>
                  )}
                  {item.birthday && (
                    <div>
                      <span className="text-xs text-slate-400">Anniversaire:</span>
                      <span className="ml-2 text-sm">{new Date(item.birthday).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}</span>
                    </div>
                  )}
                  {item.twitch_affiliate_date && (
                    <div>
                      <span className="text-xs text-slate-400">Affiliation Twitch:</span>
                      <span className="ml-2 text-sm">
                        {new Date(item.twitch_affiliate_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          </AdminTableShell>
        </section>
      )}
    </div>
  );
}
