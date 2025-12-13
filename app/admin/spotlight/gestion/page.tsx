"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/admin";
import ManualSpotlightModal from "@/components/admin/ManualSpotlightModal";

interface ActiveSpotlight {
  id: string;
  streamerTwitchLogin: string;
  streamerDisplayName?: string;
  startedAt: string;
  endsAt: string;
  status: 'active' | 'completed' | 'cancelled';
  moderatorUsername: string;
}

interface SpotlightPresence {
  twitchLogin: string;
  displayName?: string;
  addedAt: string;
  addedBy: string;
}

interface Member {
  twitchLogin: string;
  displayName: string;
  role?: string;
  isActive?: boolean;
}

interface EvaluationCriteria {
  id: string;
  label: string;
  maxValue: number;
  value: number;
}

const DEFAULT_CRITERIA: EvaluationCriteria[] = [
  { id: "accueil", label: "Accueil & Présentation", maxValue: 3, value: 3 },
  { id: "interaction", label: "Interaction & Dynamique", maxValue: 5, value: 4 },
  { id: "respect", label: "Respect des règles & Comportement", maxValue: 3, value: 3 },
  { id: "participation", label: "Participation Spotlight", maxValue: 3, value: 2 },
  { id: "qualite", label: "Qualité technique", maxValue: 2, value: 2 },
  { id: "tenf", label: "TENF Spirit", maxValue: 4, value: 3 },
];

export default function GestionSpotlightPage() {
  const [spotlight, setSpotlight] = useState<ActiveSpotlight | null>(null);
  const [presences, setPresences] = useState<SpotlightPresence[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationCriteria[]>(DEFAULT_CRITERIA);
  const [moderatorComments, setModeratorComments] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFounderUser, setIsFounderUser] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showStreamerModal, setShowStreamerModal] = useState(false);
  const [streamerSearch, setStreamerSearch] = useState("");

  useEffect(() => {
    loadData();
    loadMembers();
    checkFounderStatus();
  }, []);

  useEffect(() => {
    // Timer pour mettre à jour le temps restant
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [spotlight]);

  async function checkFounderStatus() {
    try {
      const user = await getDiscordUser();
      if (user) {
        const founderStatus = isFounder(user.id);
        setIsFounderUser(founderStatus);
      }
    } catch (error) {
      console.error("Erreur vérification fondateur:", error);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      const response = await fetch('/api/spotlight/active', {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.spotlight) {
          setSpotlight(data.spotlight.spotlight);
          setPresences(data.spotlight.presences || []);
          if (data.spotlight.evaluation) {
            setEvaluation(data.spotlight.evaluation.criteria || DEFAULT_CRITERIA);
            setModeratorComments(data.spotlight.evaluation.moderatorComments || "");
          }
        } else {
          setSpotlight(null);
          setPresences([]);
        }
      }
    } catch (error) {
      console.error("Erreur chargement spotlight:", error);
    } finally {
      setLoading(false);
      updateTimeRemaining();
    }
  }

  async function loadMembers() {
    try {
      const response = await fetch('/api/members/public', {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        const members = (data.members || [])
          .filter((m: any) => m.isActive !== false)
          .map((m: any) => ({
            twitchLogin: m.twitchLogin || '',
            displayName: m.displayName || m.twitchLogin || '',
            role: m.role,
            isActive: m.isActive,
          }))
          .filter((m: Member) => m.twitchLogin);
        setAllMembers(members);
      }
    } catch (error) {
      console.error("Erreur chargement membres:", error);
    }
  }

  function updateTimeRemaining() {
    if (!spotlight || spotlight.status !== 'active') {
      setTimeRemaining("");
      return;
    }

    const endsAt = new Date(spotlight.endsAt);
    const now = new Date();
    const diff = endsAt.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining("Terminé");
      // Ne pas recharger automatiquement pour éviter les boucles
      // Le rechargement sera fait manuellement si nécessaire
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
  }

  async function handleLaunchSpotlight() {
    setShowStreamerModal(true);
  }

  async function handleSelectStreamer(twitchLogin: string, displayName: string) {
    setShowStreamerModal(false);
    setStreamerSearch("");

    try {
      setSaving(true);
      const response = await fetch('/api/spotlight/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          streamerTwitchLogin: twitchLogin,
          streamerDisplayName: displayName,
        }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || 'Impossible de lancer le spotlight'}`);
      }
    } catch (error) {
      console.error("Erreur lancement spotlight:", error);
      alert("Erreur lors du lancement du spotlight");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPresence(twitchLogin: string, displayName: string) {
    if (!spotlight) return;

    if (presences.some(p => p.twitchLogin.toLowerCase() === twitchLogin.toLowerCase())) {
      return;
    }

    try {
      const response = await fetch('/api/spotlight/presences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twitchLogin, displayName }),
      });

      if (response.ok) {
        const data = await response.json();
        setPresences(data.presences || []);
      }
    } catch (error) {
      console.error("Erreur ajout présence:", error);
    }
  }

  async function handleSavePresences() {
    if (!spotlight) return;

    try {
      setSaving(true);
      const response = await fetch('/api/spotlight/presences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presences }),
      });

      if (response.ok) {
        alert("Présences enregistrées avec succès");
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || 'Impossible d\'enregistrer les présences'}`);
      }
    } catch (error) {
      console.error("Erreur sauvegarde présences:", error);
      alert("Erreur lors de l'enregistrement des présences");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitEvaluation() {
    if (!spotlight) return;

    try {
      setSaving(true);
      const response = await fetch('/api/spotlight/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          criteria: evaluation,
          moderatorComments,
        }),
      });

      if (response.ok) {
        alert("Évaluation enregistrée avec succès");
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || 'Impossible d\'enregistrer l\'évaluation'}`);
      }
    } catch (error) {
      console.error("Erreur sauvegarde évaluation:", error);
      alert("Erreur lors de l'enregistrement de l'évaluation");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddToMonthlyReport() {
    if (!spotlight) return;

    try {
      setSaving(true);
      const response = await fetch('/api/spotlight/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        alert("Spotlight ajouté au rapport mensuel avec succès");
        await loadData();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || 'Impossible d\'ajouter au rapport mensuel'}`);
      }
    } catch (error) {
      console.error("Erreur finalisation spotlight:", error);
      alert("Erreur lors de l'ajout au rapport mensuel");
    } finally {
      setSaving(false);
    }
  }

  function handleSliderChange(id: string, value: number) {
    setEvaluation((prev) =>
      prev.map((crit) => (crit.id === id ? { ...crit, value } : crit))
    );
  }

  const filteredMembers = allMembers.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.twitchLogin.toLowerCase().includes(query) ||
      member.displayName.toLowerCase().includes(query) ||
      (member.role && member.role.toLowerCase().includes(query))
    );
  });

  const filteredStreamers = allMembers.filter((member) => {
    const query = streamerSearch.toLowerCase();
    return (
      member.twitchLogin.toLowerCase().includes(query) ||
      member.displayName.toLowerCase().includes(query)
    );
  });

  const totalScore = evaluation.reduce((sum, crit) => sum + crit.value, 0);
  const maxScore = evaluation.reduce((sum, crit) => sum + crit.maxValue, 0);
  const scorePercentage = (totalScore / maxScore) * 100;

  function getScoreBadge() {
    if (scorePercentage >= 90) return { text: "Excellent Spotlight", color: "bg-green-500/20 text-green-300 border-green-500/30" };
    if (scorePercentage >= 75) return { text: "Très bon Spotlight", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
    if (scorePercentage >= 60) return { text: "Bon Spotlight", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
    return { text: "Spotlight à améliorer", color: "bg-red-500/20 text-red-300 border-red-500/30" };
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

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/spotlight"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au hub Spotlight
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Gestion Spotlight</h1>
            <p className="text-gray-400">Créer et gérer les spotlights</p>
          </div>
          {isFounderUser && (
            <button
              onClick={() => setShowManualModal(true)}
              className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Ajouter un spotlight manuellement
            </button>
          )}
        </div>
      </div>

      {/* Grille principale - 3 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE */}
        <div className="space-y-6">
          {/* Démarrer un Spotlight */}
          <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Démarrer un Spotlight
            </h2>
            {!spotlight ? (
              <button
                onClick={handleLaunchSpotlight}
                disabled={saving}
                className="w-full bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Lancement..." : "Lancer un Spotlight"}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Streamer</p>
                <p className="text-white font-semibold">
                  {spotlight.streamerDisplayName || spotlight.streamerTwitchLogin}
                </p>
                {timeRemaining && (
                  <>
                    <p className="text-sm text-gray-400 mt-4">Temps restant</p>
                    <p className="text-lg font-bold text-[#9146ff]">
                      {timeRemaining}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Liste des présences (membres ajoutés) */}
          {spotlight && (
            <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Présence Spotlight
              </h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {presences.length > 0 ? (
                  presences.map((presence, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-[#0e0e10] rounded-lg border border-gray-700 hover:border-[#9146ff]/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {(presence.displayName || presence.twitchLogin).charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-white font-medium">
                        {presence.displayName || presence.twitchLogin}
                      </span>
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">
                    Aucun membre ajouté pour le moment
                  </p>
                )}
              </div>
              {presences.length > 0 && (
                <button
                  onClick={handleSavePresences}
                  disabled={saving}
                  className="w-full mt-4 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : "enregistrer la liste"}
                </button>
              )}
            </div>
          )}

          {/* Évaluation Spotlight */}
          {spotlight && (
            <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Évaluation Spotlight
              </h2>

              <div className="space-y-6">
                {evaluation.map((crit) => (
                  <div key={crit.id}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">
                        {crit.label}
                      </label>
                      <span className="text-sm text-purple-400 font-semibold">
                        {crit.value}/{crit.maxValue}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max={crit.maxValue}
                        value={crit.value}
                        onChange={(e) =>
                          handleSliderChange(crit.id, parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#9146ff]"
                        style={{
                          background: `linear-gradient(to right, #9146ff 0%, #9146ff ${
                            (crit.value / crit.maxValue) * 100
                          }%, #374151 ${
                            (crit.value / crit.maxValue) * 100
                          }%, #374151 100%)`,
                        }}
                      />
                      <div
                        className="absolute top-0 left-0 h-2 rounded-lg bg-[#9146ff] pointer-events-none"
                        style={{ width: `${(crit.value / crit.maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commentaires du modérateur
                </label>
                <textarea
                  value={moderatorComments}
                  onChange={(e) => setModeratorComments(e.target.value)}
                  placeholder="Commentaires du modérateur"
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] min-h-[100px]"
                />
              </div>

              <button
                onClick={handleSubmitEvaluation}
                disabled={saving}
                className="w-full mt-6 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Soumettre l'évaluation"}
              </button>
            </div>
          )}
        </div>

        {/* COLONNE CENTRALE */}
        <div>
          {spotlight ? (
            <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Présence Spotlight
              </h2>

              {/* Barre de recherche */}
              <div className="mb-6">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Rechercher un membre"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
                  />
                </div>
              </div>

              {/* Tableau */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                        Avatar
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                        Pseudo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                        Statut
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => {
                        const isPresent = presences.some(
                          p => p.twitchLogin.toLowerCase() === member.twitchLogin.toLowerCase()
                        );
                        return (
                          <tr
                            key={member.twitchLogin}
                            className="border-b border-gray-700 hover:bg-[#0e0e10] transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold">
                                {member.displayName.charAt(0).toUpperCase()}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-white font-medium">
                              {member.displayName}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                isPresent
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : "bg-gray-700/50 text-gray-400"
                              }`}>
                                {isPresent ? "Présent" : "Absent"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleAddPresence(member.twitchLogin, member.displayName)}
                                disabled={isPresent || saving}
                                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                  isPresent
                                    ? "bg-[#9146ff] text-white cursor-not-allowed"
                                    : "bg-gray-700 text-gray-400 hover:bg-[#9146ff] hover:text-white"
                                }`}
                              >
                                {isPresent && (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">
                          Aucun membre trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleSavePresences}
                disabled={saving || presences.length === 0}
                className="w-full bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Enregistrement..." : "ajouter aux presents"}
              </button>
            </div>
          ) : (
            <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⭐</div>
                <p className="text-gray-400">
                  Aucun spotlight actif. Lancez un spotlight pour commencer.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* COLONNE DROITE */}
        {spotlight && (
          <div>
            <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Résultat mensuel automatique
              </h2>

              <div className="text-center space-y-4">
                <div>
                  <div className="text-6xl font-bold text-white mb-2">
                    {totalScore}/{maxScore}
                  </div>
                  <p className="text-sm text-gray-400">Score total /{maxScore}</p>
                </div>

                <div>
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getScoreBadge().color}`}
                  >
                    {getScoreBadge().text}
                  </span>
                </div>

                <button
                  onClick={handleAddToMonthlyReport}
                  disabled={saving}
                  className="w-full mt-6 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : "Ajouter au rapport mensuel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de sélection du streamer */}
      {showStreamerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            setShowStreamerModal(false);
            setStreamerSearch("");
          }}
        >
          <div
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Sélectionner le streamer
              </h2>
              <button
                onClick={() => {
                  setShowStreamerModal(false);
                  setStreamerSearch("");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un membre par nom ou Twitch login..."
                  value={streamerSearch}
                  onChange={(e) => setStreamerSearch(e.target.value)}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStreamers.length > 0 ? (
                filteredStreamers.map((member) => (
                  <button
                    key={member.twitchLogin}
                    onClick={() => handleSelectStreamer(member.twitchLogin, member.displayName)}
                    className="w-full flex items-center gap-3 p-3 bg-[#0e0e10] border border-gray-700 rounded-lg hover:border-[#9146ff] hover:bg-[#9146ff]/10 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{member.displayName}</p>
                      <p className="text-sm text-gray-400">@{member.twitchLogin}</p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">
                  Aucun membre trouvé
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout manuel */}
      {showManualModal && (
        <ManualSpotlightModal
          isOpen={showManualModal}
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false);
            loadData(); // Recharger les données
          }}
        />
      )}
    </div>
  );
}
