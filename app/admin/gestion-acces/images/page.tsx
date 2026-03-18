"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ImageIcon, Loader2, RefreshCcw, Search, XCircle } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

type AvatarQuality = "good" | "fallback" | "missing";

interface MemberImageRow {
  twitchLogin: string;
  displayName: string;
  role: string;
  isActive: boolean;
  savedAvatar?: string;
  savedAvatarQuality: AvatarQuality;
  fetchedAvatar?: string;
  fetchedAvatarQuality: AvatarQuality;
  hasIssue: boolean;
  previewAvatar: string;
}

export default function AdminImagesManagementPage() {
  const [rows, setRows] = useState<MemberImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "issues">("issues");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterMode === "issues" && !r.hasIssue) return false;
      if (!q) return true;
      return (
        r.twitchLogin.toLowerCase().includes(q) ||
        r.displayName.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      );
    });
  }, [rows, filterMode, search]);

  const issueCount = useMemo(() => rows.filter((r) => r.hasIssue).length, [rows]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/members/images", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors du chargement des images");
      }
      setRows(data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  function toggleRow(login: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(login)) next.delete(login);
      else next.add(login);
      return next;
    });
  }

  function selectOnlyIssues() {
    const issueLogins = rows.filter((r) => r.hasIssue).map((r) => r.twitchLogin);
    setSelected(new Set(issueLogins));
  }

  function selectVisible() {
    setSelected(new Set(filteredRows.map((r) => r.twitchLogin)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function syncSelected() {
    if (selected.size === 0) {
      setError("Sélectionne au moins un membre.");
      return;
    }

    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/members/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twitchLogins: Array.from(selected) }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de la mise à jour des images");
      }

      setSuccess(
        `Terminé: ${data.updated ?? 0} mis à jour, ${data.failed ?? 0} en échec, ${data.missing ?? 0} introuvable(s).`
      );
      await loadData();
      clearSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1116] text-white">
      <AdminHeader
        title="Gestion des images profils Twitch"
        navLinks={[
          { href: "/admin/gestion-acces/accueil", label: "Dashboard administration" },
          { href: "/admin/gestion-acces", label: "Comptes administrateurs" },
          { href: "/admin/gestion-acces/dashboard", label: "Paramètres dashboard" },
          { href: "/admin/gestion-acces/permissions", label: "Permissions par section" },
          { href: "/admin/gestion-acces/images", label: "Images profils Twitch", active: true },
          { href: "/admin/gestion-acces/admin-avance", label: "Admin avancé (fondateurs)" },
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="rounded-xl border border-gray-700 bg-[#151924] p-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                Gestion des images profils Twitch
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Source commune pour l&apos;admin et les pages publiques.
              </p>
            </div>
            <div className="text-sm text-gray-300">
              Total: <span className="font-semibold">{rows.length}</span> - A corriger:{" "}
              <span className="font-semibold text-orange-300">{issueCount}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un membre..."
                className="pl-9 pr-3 py-2 rounded-lg bg-[#0f1116] border border-gray-700 text-sm w-64"
              />
            </div>

            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as "all" | "issues")}
              className="px-3 py-2 rounded-lg bg-[#0f1116] border border-gray-700 text-sm"
            >
              <option value="issues">Uniquement les échecs / non bonnes</option>
              <option value="all">Tous les membres</option>
            </select>

            <button
              onClick={loadData}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Rafraîchir
            </button>
            <button
              onClick={selectOnlyIssues}
              className="px-3 py-2 rounded-lg bg-orange-700 hover:bg-orange-600 text-sm"
            >
              Sélectionner les problèmes
            </button>
            <button
              onClick={selectVisible}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
            >
              Sélectionner visibles
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
            >
              Tout décocher
            </button>
            <button
              onClick={syncSelected}
              disabled={syncing || selected.size === 0}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-400 text-sm font-semibold"
            >
              {syncing ? "Synchronisation..." : `Demander à Twitch + valider (${selected.size})`}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-2 rounded bg-red-900/30 border border-red-700 text-red-200 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-3 p-2 rounded bg-emerald-900/30 border border-emerald-700 text-emerald-200 text-sm">
              {success}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-700 bg-[#151924] overflow-hidden">
          {loading ? (
            <div className="p-10 flex items-center justify-center text-gray-300">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Chargement...
            </div>
          ) : (
            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#10131c] border-b border-gray-700">
                  <tr className="text-left text-gray-300">
                    <th className="px-3 py-2 w-10"></th>
                    <th className="px-3 py-2">Membre</th>
                    <th className="px-3 py-2">Avatar actuel</th>
                    <th className="px-3 py-2">Photo Twitch demandée</th>
                    <th className="px-3 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.twitchLogin} className="border-b border-gray-800 hover:bg-[#1a2030]">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(row.twitchLogin)}
                          onChange={() => toggleRow(row.twitchLogin)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{row.displayName}</div>
                        <div className="text-xs text-gray-400">{row.twitchLogin}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <img src={row.previewAvatar} alt={row.displayName} className="w-10 h-10 rounded-full object-cover border border-gray-600" />
                          <span className="text-xs text-gray-400">{row.savedAvatarQuality}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {row.fetchedAvatar ? (
                          <div className="flex items-center gap-2">
                            <img src={row.fetchedAvatar} alt={row.displayName} className="w-10 h-10 rounded-full object-cover border border-gray-600" />
                            <span className="text-xs text-gray-400">{row.fetchedAvatarQuality}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Aucune réponse Twitch</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row.hasIssue ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-orange-900/40 border border-orange-700 text-orange-200">
                            <XCircle className="w-3 h-3" />
                            Echec / non bonne
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-900/40 border border-emerald-700 text-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

