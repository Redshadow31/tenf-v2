"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SpotlightEvaluation {
  spotlightId: string;
  streamerTwitchLogin: string;
  criteria: Array<{
    id: string;
    label: string;
    maxValue: number;
    value: number;
  }>;
  totalScore: number;
  maxScore: number;
  moderatorComments: string;
  evaluatedAt: string;
  evaluatedBy: string;
}

interface SpotlightData {
  id: string;
  date: string;
  streamerTwitchLogin: string;
  moderatorUsername: string;
  moderatorDiscordId: string;
  duration?: string;
  evaluation: SpotlightEvaluation | null;
  status: 'evaluated' | 'not_evaluated';
}

interface MonthlyEvaluations {
  month: string;
  totalSpotlights: number;
  evaluatedSpotlights: number;
  averageScore: number;
  spotlights: SpotlightData[];
}

export default function EvaluationSpotlightPage() {
  const [monthKey, setMonthKey] = useState("");
  const [monthlyData, setMonthlyData] = useState<MonthlyEvaluations | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpotlight, setSelectedSpotlight] = useState<SpotlightData | null>(null);
  const [searchStreamer, setSearchStreamer] = useState("");
  const [searchModerator, setSearchModerator] = useState("");
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    initializeMonth();
  }, []);

  useEffect(() => {
    if (monthKey) {
      loadMonthlyData();
    }
  }, [monthKey]);

  function initializeMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setMonthKey(`${year}-${month}`);
  }

  async function loadMonthlyData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/spotlight/evaluations/monthly?month=${monthKey}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data);
      } else {
        console.error("Erreur chargement évaluations mensuelles:", response.statusText);
        setMonthlyData(null);
      }
    } catch (error) {
      console.error("Erreur chargement évaluations mensuelles:", error);
      setMonthlyData(null);
    } finally {
      setLoading(false);
    }
  }

  function formatMonthKey(key: string): string {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  function getMonthOptions(): string[] {
    const options: string[] = [];
    const now = new Date();
    
    // Générer les 12 derniers mois
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    
    return options;
  }

  const filteredAndSortedSpotlights = monthlyData?.spotlights
    .filter(spotlight => {
      const matchesStreamer = searchStreamer === "" || 
        spotlight.streamerTwitchLogin.toLowerCase().includes(searchStreamer.toLowerCase());
      const matchesModerator = searchModerator === "" || 
        spotlight.moderatorUsername.toLowerCase().includes(searchModerator.toLowerCase());
      return matchesStreamer && matchesModerator;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        const scoreA = a.evaluation?.totalScore || 0;
        const scoreB = b.evaluation?.totalScore || 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
    }) || [];

  const uniqueStreamers = Array.from(new Set(monthlyData?.spotlights.map(s => s.streamerTwitchLogin) || [])).sort();
  const uniqueModerators = Array.from(new Set(monthlyData?.spotlights.map(s => s.moderatorUsername) || [])).sort();

  if (loading) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/spotlight"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au hub Spotlight
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Évaluation des Spotlights – Mois en cours
        </h1>
        <p className="text-gray-400">Analyse qualitative des spotlights du mois</p>
      </div>

      {/* Sélecteur de mois et indicateurs */}
      <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-300">
              Mois :
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
          </div>

          {monthlyData && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Spotlights</p>
                <p className="text-2xl font-bold text-white">
                  {monthlyData.totalSpotlights}
                </p>
              </div>
              <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Évalués</p>
                <p className="text-2xl font-bold text-[#9146ff]">
                  {monthlyData.evaluatedSpotlights}
                </p>
              </div>
              <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Note moyenne</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {monthlyData.averageScore > 0 ? monthlyData.averageScore.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtres et tri */}
      <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Filtrer par streamer
            </label>
            <input
              type="text"
              placeholder="Rechercher un streamer..."
              value={searchStreamer}
              onChange={(e) => setSearchStreamer(e.target.value)}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Filtrer par modérateur
            </label>
            <input
              type="text"
              placeholder="Rechercher un modérateur..."
              value={searchModerator}
              onChange={(e) => setSearchModerator(e.target.value)}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
            >
              <option value="date">Date</option>
              <option value="score">Note</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Ordre
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
            >
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau principal */}
      <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Spotlights du mois ({filteredAndSortedSpotlights.length})
        </h2>

        {monthlyData && monthlyData.totalSpotlights > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                    Streamer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                    Durée
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                    Note
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                    Modérateur
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
                {filteredAndSortedSpotlights.length > 0 ? (
                  filteredAndSortedSpotlights.map((spotlight) => (
                    <tr
                      key={spotlight.id}
                      className="border-b border-gray-700 hover:bg-[#0e0e10] transition-colors"
                    >
                      <td className="py-3 px-4 text-white">
                        {new Date(spotlight.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold text-sm">
                            {spotlight.streamerTwitchLogin.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">
                            {spotlight.streamerTwitchLogin}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {spotlight.duration || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {spotlight.evaluation ? (
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-bold text-yellow-400 bg-yellow-500/20 border border-yellow-500/30">
                            {spotlight.evaluation.totalScore}/{spotlight.evaluation.maxScore}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {spotlight.moderatorUsername}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            spotlight.status === 'evaluated'
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {spotlight.status === 'evaluated' ? 'Évalué' : 'Non évalué'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedSpotlight(spotlight)}
                          className="text-[#9146ff] hover:text-[#7c3aed] font-semibold text-sm transition-colors"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Aucun spotlight trouvé avec ces filtres
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">
              Aucun spotlight pour ce mois
            </p>
          </div>
        )}
      </div>

      {/* Modal détails spotlight */}
      {selectedSpotlight && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedSpotlight(null)}
        >
          <div
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Détail du spotlight
              </h2>
              <button
                onClick={() => setSelectedSpotlight(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Informations générales */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Informations générales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Streamer</p>
                  <p className="text-white font-semibold">
                    {selectedSpotlight.streamerTwitchLogin}
                  </p>
                </div>
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Date</p>
                  <p className="text-white font-semibold">
                    {new Date(selectedSpotlight.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Durée</p>
                  <p className="text-white font-semibold">
                    {selectedSpotlight.duration || "N/A"}
                  </p>
                </div>
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Modérateur</p>
                  <p className="text-white font-semibold">
                    {selectedSpotlight.moderatorUsername}
                  </p>
                </div>
              </div>
            </div>

            {/* Évaluation */}
            {selectedSpotlight.evaluation ? (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Évaluation du spotlight
                  </h3>
                  <div className="space-y-4">
                    {selectedSpotlight.evaluation.criteria.map((crit) => (
                      <div key={crit.id} className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-300">
                            {crit.label}
                          </label>
                          <span className="text-sm text-purple-400 font-semibold">
                            {crit.value}/{crit.maxValue}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[#9146ff] h-2 rounded-full transition-all"
                            style={{ width: `${(crit.value / crit.maxValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-white">
                        Note finale
                      </p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {selectedSpotlight.evaluation.totalScore}/{selectedSpotlight.evaluation.maxScore}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commentaire */}
                {selectedSpotlight.evaluation.moderatorComments && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Commentaire du modérateur
                    </h3>
                    <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                      <p className="text-white whitespace-pre-wrap">
                        {selectedSpotlight.evaluation.moderatorComments}
                      </p>
                      <p className="text-sm text-gray-400 mt-4">
                        Évalué le {new Date(selectedSpotlight.evaluation.evaluatedAt).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mb-6">
                <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-8 text-center">
                  <p className="text-gray-400">
                    Ce spotlight n'a pas encore été évalué
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
