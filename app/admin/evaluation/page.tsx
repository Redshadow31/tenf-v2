"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";

export default function EvaluationHubPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2026-01");

  useEffect(() => {
    async function checkAccess() {
      try {
        // Utiliser l'API pour vérifier l'accès (supporte le cache Blobs et les rôles dans données membres)
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

  const categories = [
    {
      title: "A. Présence Active",
      href: "/admin/evaluation/a",
      description: "Spotlights et Raids",
      icon: "📊",
    },
    {
      title: "B. Engagement Communautaire",
      href: "/admin/evaluation/b",
      description: "Discord et Events serveur",
      icon: "💬",
    },
    {
      title: "C. Follow",
      href: "/admin/evaluation/c",
      description: "Retour de follow",
      icon: "👥",
    },
    {
      title: "Synthèse & Bonus",
      href: "/admin/evaluation/d",
      description: "Synthèse globale et bonus",
      icon: "⭐",
    },
    {
      title: "Résultat Final",
      href: "/admin/evaluation/result",
      description: "Tableaux validés et score final",
      icon: "🏆",
    },
    {
      title: "Progression",
      href: "/admin/evaluation/progression",
      description: "Évolution détaillée par membre",
      icon: "📈",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Évaluation Mensuelle</h1>
        <p className="text-gray-400">Vue d'ensemble des critères d'évaluation</p>
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

      {/* Cartes des catégories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 hover:border-[#9146ff] transition-colors"
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{category.icon}</span>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{category.title}</h3>
                <p className="text-gray-400 text-sm">{category.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

