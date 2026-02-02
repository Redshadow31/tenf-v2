"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";

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

  useEffect(() => {
    initializeMonth();
    checkAccess();
  }, []);

  useEffect(() => {
    if (monthKey && hasAccess) {
      loadSummary();
    }
  }, [monthKey, hasAccess]);

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
      }
    } catch (error) {
      console.error("Erreur chargement résumé:", error);
    } finally {
      setLoading(false);
    }
  }

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
        <h2 className="text-xl font-semibold text-white mb-4">
          Récapitulatif par membre du staff
        </h2>
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
              {summary.length > 0 ? (
                summary.map((item) => (
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
                    Aucune donnée disponible pour ce mois
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
