"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { getDiscordUser } from "@/lib/discord";
import { isFounder, getAdminRole, getRoleDisplayName } from "@/lib/adminRoles";
import Link from "next/link";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres" },
  { href: "/admin/raids", label: "Suivi des Raids" },
  { href: "/admin/founders/audit", label: "Audit Logs", active: true },
];

interface AuditLog {
  id: string;
  actorDiscordId: string;
  actorUsername?: string;
  role: string;
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  reverted: boolean;
  revertedBy?: string;
  revertedAt?: string;
  revertLogId?: string;
  metadata?: Record<string, any>;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    actorDiscordId: "",
    action: "",
    resourceType: "",
    reverted: "",
  });
  const [applyingFilters, setApplyingFilters] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const user = await getDiscordUser();
      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      const role = getAdminRole(user.id);
      if (!role || !isFounder(user.id)) {
        window.location.href = "/admin/dashboard";
        return;
      }

      setCurrentUser(user);
      setUserRole(role);
      loadLogs();
    }
    checkAccess();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.actorDiscordId) queryParams.set("actorDiscordId", filters.actorDiscordId);
      if (filters.action) queryParams.set("action", filters.action);
      if (filters.resourceType) queryParams.set("resourceType", filters.resourceType);
      if (filters.reverted) queryParams.set("reverted", filters.reverted);
      queryParams.set("limit", "500");

      const response = await fetch(`/api/admin/audit?${queryParams.toString()}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          window.location.href = "/admin/dashboard";
          return;
        }
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Erreur chargement logs:", error);
      alert("Erreur lors du chargement des logs d'audit");
    } finally {
      setLoading(false);
      setApplyingFilters(false);
    }
  }

  async function handleRevert(logId: string) {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette action ?\n\nCela créera un nouveau log d'audit et restaurera la valeur précédente.")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'annulation");
      }

      const data = await response.json();
      alert(`✅ ${data.message}`);
      
      // Recharger les logs
      loadLogs();
    } catch (error) {
      console.error("Erreur revert:", error);
      alert(`❌ Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  }

  function formatValue(value: any): string {
    if (value === null || value === undefined) return "null";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des logs d'audit...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isFounder(currentUser.id)) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        <AdminHeader title="Audit Logs (Founders Only)" navLinks={navLinks} />

        {/* Filtres */}
        <div className="mb-6 bg-[#1a1a1d] rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Filtres</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID Discord Acteur</label>
              <input
                type="text"
                value={filters.actorDiscordId}
                onChange={(e) => setFilters({ ...filters, actorDiscordId: e.target.value })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="1021398088474169414"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Action</label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="member.update"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type de ressource</label>
              <input
                type="text"
                value={filters.resourceType}
                onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="member"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Annulé</label>
              <select
                value={filters.reverted}
                onChange={(e) => setFilters({ ...filters, reverted: e.target.value })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="">Tous</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => {
              setApplyingFilters(true);
              loadLogs();
            }}
            disabled={applyingFilters}
            className="mt-4 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {applyingFilters ? "Application..." : "Appliquer les filtres"}
          </button>
        </div>

        {/* Tableau des logs */}
        <div className="bg-[#1a1a1d] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0e0e10] border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Acteur</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Rôle</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Ressource</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Avant</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Après</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                      Aucun log trouvé
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-800 hover:bg-[#0e0e10] transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="text-white">{log.actorUsername || "Unknown"}</div>
                          <div className="text-gray-500 text-xs">{log.actorDiscordId}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {getRoleDisplayName(log.role as any)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <div>
                          <div>{log.resourceType}</div>
                          {log.resourceId && (
                            <div className="text-gray-500 text-xs">{log.resourceId}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 max-w-xs">
                        <pre className="whitespace-pre-wrap break-words text-xs">
                          {formatValue(log.previousValue)}
                        </pre>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 max-w-xs">
                        <pre className="whitespace-pre-wrap break-words text-xs">
                          {formatValue(log.newValue)}
                        </pre>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.reverted ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-red-900/30 text-red-400 text-xs">
                            Annulé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-green-900/30 text-green-400 text-xs">
                            Actif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {!log.reverted && (
                          <button
                            onClick={() => handleRevert(log.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Annuler
                          </button>
                        )}
                        {log.revertLogId && (
                          <div className="text-gray-500 text-xs mt-1">
                            Revert: {log.revertLogId.substring(0, 8)}...
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          Total: {logs.length} log(s)
        </div>
      </div>
    </div>
  );
}

