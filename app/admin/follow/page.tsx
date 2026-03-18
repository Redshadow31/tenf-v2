"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import AdminToastStack, { type AdminToastItem } from "@/components/admin/ui/AdminToastStack";
import AdminTableShell from "@/components/admin/ui/AdminTableShell";

interface SummaryItem {
  staffSlug: string;
  staffName: string;
  lastValidationDate: string | null;
  followRate: number | null;
  followedCount: number | null;
  totalMembers: number | null;
  status: 'up_to_date' | 'obsolete' | 'not_validated';
}

interface GlobalStats {
  averageFollowRate: number;
  totalFollowed: number;
  totalMembers: number;
  validPagesCount: number;
  obsoletePagesCount: number;
}

export default function FollowHubPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthKey, setMonthKey] = useState("");
  const [dataSourceMonth, setDataSourceMonth] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SummaryItem["status"]>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);
  const [savedViews, setSavedViews] = useState<Array<{
    id: string;
    name: string;
    monthKey: string;
    search: string;
    statusFilter: "all" | SummaryItem["status"];
  }>>([]);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState("");
  const [newSavedViewName, setNewSavedViewName] = useState("");
  const SAVED_VIEWS_KEY = "tenf-admin-follow-saved-views";

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
    initializeMonth();
    checkAccess();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_VIEWS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSavedViews(parsed);
    } catch {
      // Ignore malformed storage payload.
    }
  }, []);

  useEffect(() => {
    if (monthKey && hasAccess) {
      loadSummary();
    }
  }, [monthKey, hasAccess]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize, monthKey]);

  function initializeMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setMonthKey(`${year}-${month}`);
  }

  async function checkAccess() {
    try {
      // Utiliser l'API pour vérifier l'accès (supporte le cache Blobs)
      const response = await fetch('/api/user/role');
      if (response.ok) {
        const data = await response.json();
        setHasAccess(data.hasAdminAccess === true);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Erreur vérification accès:", error);
      setHasAccess(false);
      pushToast("warning", "Vérification d'accès échouée");
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary() {
    try {
      setLoading(true);
      const response = await fetch(`/api/follow/summary/${monthKey}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setGlobalStats(data.globalStats);
        setSummary(data.summary);
        setDataSourceMonth(data.dataSourceMonth || null);
      } else {
        console.error("Erreur chargement résumé:", response.statusText);
        pushToast("warning", "Chargement impossible", response.statusText);
      }
    } catch (error) {
      console.error("Erreur chargement résumé:", error);
      pushToast("warning", "Erreur chargement résumé");
    } finally {
      setLoading(false);
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
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: newSavedViewName.trim(),
        monthKey,
        search,
        statusFilter,
      },
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
    setMonthKey(view.monthKey);
    setSearch(view.search);
    setStatusFilter(view.statusFilter);
    pushToast("info", "Vue appliquée", view.name);
  }

  function deleteSavedView(viewId: string) {
    const next = savedViews.filter((v) => v.id !== viewId);
    saveViewsToStorage(next);
    if (selectedSavedViewId === viewId) setSelectedSavedViewId("");
    pushToast("info", "Vue supprimée");
  }

  const filteredSummary = useMemo(() => {
    const q = search.trim().toLowerCase();
    return summary.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.staffName.toLowerCase().includes(q) ||
        item.staffSlug.toLowerCase().includes(q)
      );
    });
  }, [summary, search, statusFilter]);

  const paginatedSummary = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSummary.slice(start, start + pageSize);
  }, [filteredSummary, currentPage, pageSize]);

  function getMonthOptions(): string[] {
    const options: string[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    
    return options;
  }

  function formatMonthKey(key: string): string {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  if (loading) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-white">
        <div className="bg-[#1a1a1d] border border-red-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <AdminToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
      />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Suivi des Follow</h1>
        <p className="text-gray-400 mb-4">
          Vue globale consultative du suivi follow du staff
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-semibold text-gray-300">
            Mois analysé :
          </label>
          <select
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
          >
            {getMonthOptions().map(option => (
              <option key={option} value={option}>
                {formatMonthKey(option)}
              </option>
            ))}
          </select>
          {dataSourceMonth && dataSourceMonth !== monthKey && (
            <span className="text-amber-400 text-sm">
              Données affichées : {formatMonthKey(dataSourceMonth)} (aucune donnée pour {formatMonthKey(monthKey)})
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={selectedSavedViewId}
            onChange={(e) => applySavedView(e.target.value)}
            className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
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
            className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          />
          <button onClick={saveCurrentView} className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-sm font-semibold">
            Sauver vue
          </button>
          {selectedSavedViewId && (
            <button onClick={() => deleteSavedView(selectedSavedViewId)} className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 py-2 rounded-lg text-sm font-semibold">
              Suppr vue
            </button>
          )}
        </div>
      </div>

      {/* Statistiques globales */}
      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Moyenne du taux de follow retour</p>
            <p className="text-3xl font-bold text-[#9146ff]">
              {globalStats.averageFollowRate > 0 ? `${globalStats.averageFollowRate}%` : 'N/A'}
            </p>
          </div>
          <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Nombre total de follows retour</p>
            <p className="text-3xl font-bold text-green-400">
              {globalStats.totalFollowed}
            </p>
          </div>
          <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Pages staff à jour</p>
            <p className="text-3xl font-bold text-white">
              {globalStats.validPagesCount}
            </p>
          </div>
          <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Pages obsolètes</p>
            <p className="text-3xl font-bold text-yellow-400">
              {globalStats.obsoletePagesCount}
            </p>
          </div>
        </div>
      )}

      {/* Règle des 30 jours */}
      <div className="bg-[#1a1a1d] border border-yellow-500/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-400">
          <strong>Règle des 30 jours :</strong> Les pages non validées depuis plus de 30 jours sont exclues automatiquement des calculs globaux et marquées comme "Données obsolètes".
        </p>
      </div>

      {/* Tableau récapitulatif */}
      <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
        <AdminTableShell
          title="Récapitulatif par membre du staff"
          subtitle="Table standardisée avec filtres/pagination"
          searchValue={search}
          onSearchChange={setSearch}
          page={currentPage}
          pageSize={pageSize}
          total={filteredSummary.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          searchPlaceholder="Filtrer staff..."
        >
        <div className="mb-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | SummaryItem["status"])}
            className="bg-[#0e0e10] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="all">Tous statuts</option>
            <option value="up_to_date">À jour</option>
            <option value="obsolete">Obsolète</option>
            <option value="not_validated">Non validé</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Membre du staff
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Dernière date de validation
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                  Taux de follow retour
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                  Follows retour
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                  Statut
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedSummary.length > 0 ? (
                paginatedSummary.map((item) => (
                  <tr
                    key={item.staffSlug}
                    className="border-b border-gray-700 hover:bg-[#0e0e10] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold text-sm">
                          {item.staffName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">
                          {item.staffName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {item.lastValidationDate
                        ? new Date(item.lastValidationDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.followRate !== null ? (
                        <span className="text-[#9146ff] font-semibold">
                          {item.followRate}%
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.followedCount !== null ? (
                        <span className="text-green-400 font-semibold">
                          {item.followedCount}/{item.totalMembers}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'up_to_date'
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : item.status === 'obsolete'
                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {item.status === 'up_to_date'
                          ? 'À jour'
                          : item.status === 'obsolete'
                          ? 'Obsolète'
                          : 'Non validé'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/admin/follow/${item.staffSlug}`}
                        className="text-[#9146ff] hover:text-[#7c3aed] font-semibold text-sm transition-colors"
                      >
                        Voir détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Aucune donnée disponible pour ce filtre
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </AdminTableShell>
      </div>
    </div>
  );
}
