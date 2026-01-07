"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { hasAdminDashboardAccess } from "@/lib/admin";

export default function EvaluationResultPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2026-01");

  useEffect(() => {
    async function checkAccess() {
      try {
        const user = await getDiscordUser();
        if (user) {
          const access = hasAdminDashboardAccess(user.id);
          setHasAccess(access);
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
    checkAccess();
  }, []);

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
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="bg-[#1a1a1d] border border-red-500 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Accès refusé</h1>
          <p className="text-gray-400">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="mb-8">
        <Link
          href="/admin/evaluation"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au Hub Évaluation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Résultat Final</h1>
        <p className="text-gray-400">Score final et classement</p>
      </div>

      {/* Bandeau fonctionnalité à venir */}
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚧</span>
          <div>
            <p className="text-yellow-300 font-semibold">Fonctionnalité à venir</p>
            <p className="text-yellow-200 text-sm">Architecture prête. Implémentation à venir.</p>
          </div>
        </div>
      </div>

      {/* Sélecteur de mois */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-300">Mois :</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
        >
          {getMonthOptions().map(option => (
            <option key={option} value={option}>
              {formatMonthKey(option)}
            </option>
          ))}
        </select>
      </div>

      {/* Cartes de stats placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Score final</p>
          <p className="text-3xl font-bold text-[#9146ff]">—</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Classement</p>
          <p className="text-3xl font-bold text-white">—</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Évaluation</p>
          <p className="text-3xl font-bold text-gray-400">—</p>
        </div>
      </div>

      {/* Bouton désactivé */}
      <div className="flex justify-end">
        <button
          disabled
          className="bg-gray-700 text-gray-500 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

