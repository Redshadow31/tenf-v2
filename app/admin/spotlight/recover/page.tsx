"use client";

import { useState } from "react";
import Link from "next/link";

interface FoundSpotlight {
  spotlightId: string;
  month: string;
  date: string;
  streamerTwitchLogin: string;
}

export default function SpotlightRecoverPage() {
  const [streamerLogin, setStreamerLogin] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FoundSpotlight[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!streamerLogin.trim()) {
      setError("Veuillez entrer un login Twitch");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/spotlight/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamerTwitchLogin: streamerLogin.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.spotlights || []);
        if (data.found === 0) {
          setError(`Aucun spotlight trouvé pour ${streamerLogin}`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erreur lors de la recherche");
      }
    } catch (err) {
      console.error("Erreur recherche spotlight:", err);
      setError("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthKey: string): string => {
    const [year, month] = monthKey.split("-");
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/spotlight/evaluation"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour à l'évaluation des Spotlights
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Récupération de Spotlight Perdu
        </h1>
        <p className="text-gray-400">
          Recherchez un spotlight par login Twitch du streamer dans tous les mois disponibles
        </p>
      </div>

      <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Login Twitch du streamer
            </label>
            <input
              type="text"
              value={streamerLogin}
              onChange={(e) => setStreamerLogin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ex: nexou31"
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {results !== null && (
        <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Résultats ({results.length})
          </h2>

          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Streamer
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      Mois
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      ID Spotlight
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((spotlight) => (
                    <tr
                      key={spotlight.spotlightId}
                      className="border-b border-gray-700 hover:bg-[#0e0e10] transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-medium">
                        {spotlight.streamerTwitchLogin}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(spotlight.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {formatMonth(spotlight.month)}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm font-mono">
                        {spotlight.spotlightId}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/admin/spotlight/evaluation?month=${spotlight.month}`}
                          className="text-[#9146ff] hover:text-[#7c3aed] font-semibold text-sm transition-colors"
                        >
                          Voir dans {formatMonth(spotlight.month)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">
                Aucun spotlight trouvé pour ce streamer
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

