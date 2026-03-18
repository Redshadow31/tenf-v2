"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";
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
      const res = await fetch("/api/admin/members/profile-validation", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
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
        pushToast("success", action === "approve" ? "Demande validée" : "Demande rejetée");
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <AdminToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
      />
      <div className="max-w-4xl mx-auto px-8 py-8">
        <Link href="/admin/membres/gestion" className="inline-block text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          ← Retour à la gestion des membres
        </Link>

        <h1 className="text-3xl font-bold mb-2">Validation des profils</h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
          Les membres proposent des modifications (descriptif, réseaux). Valide ou rejette les demandes.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={selectedSavedViewId}
            onChange={(e) => applySavedView(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
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
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
          />
          <button onClick={saveCurrentView} className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700">
            Sauver vue
          </button>
          {selectedSavedViewId && (
            <button onClick={() => deleteSavedView(selectedSavedViewId)} className="px-3 py-2 rounded-lg text-sm font-semibold text-red-200 bg-red-600/20 hover:bg-red-600/30">
              Suppr vue
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--color-primary)" }} />
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--color-text-secondary)" }} />
            <p style={{ color: "var(--color-text-secondary)" }}>Aucune demande en attente</p>
          </div>
        ) : (
          <AdminTableShell
            title="Demandes en attente"
            subtitle="Table standardisée filtres/pagination"
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
                className="rounded-xl border p-6"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      <Link
                        href={`/admin/membres/gestion?search=${encodeURIComponent(item.twitch_login)}`}
                        className="hover:underline"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {item.twitch_login}
                      </Link>
                    </h3>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      Soumis le {new Date(item.submitted_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(item.id, "approve")}
                      disabled={actioning === item.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {actioning === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Valider
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "reject")}
                      disabled={actioning === item.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                  </div>
                </div>

                {item.description && (
                  <div className="mb-4">
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Descriptif</p>
                    <p className="text-sm whitespace-pre-wrap rounded-lg p-3" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
                      {item.description}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {item.instagram && (
                    <div>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Instagram:</span>
                      <span className="ml-2 text-sm">{item.instagram}</span>
                    </div>
                  )}
                  {item.tiktok && (
                    <div>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>TikTok:</span>
                      <span className="ml-2 text-sm">{item.tiktok}</span>
                    </div>
                  )}
                  {item.twitter && (
                    <div>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Twitter:</span>
                      <span className="ml-2 text-sm">{item.twitter}</span>
                    </div>
                  )}
                  {item.birthday && (
                    <div>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Anniversaire:</span>
                      <span className="ml-2 text-sm">{new Date(item.birthday).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}</span>
                    </div>
                  )}
                  {item.twitch_affiliate_date && (
                    <div>
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Affiliation Twitch:</span>
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
        )}
      </div>
    </div>
  );
}
