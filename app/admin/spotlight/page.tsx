"use client";

import { useState } from "react";
import Link from "next/link";

// Mock data
const connectedMembers = [
  { id: 1, name: "Alice", avatar: "https://placehold.co/40x40?text=A" },
  { id: 2, name: "Clara", avatar: "https://placehold.co/40x40?text=C" },
  { id: 3, name: "Nexou31", avatar: "https://placehold.co/40x40?text=N" },
  { id: 4, name: "Red", avatar: "https://placehold.co/40x40?text=R" },
];

const spotlightPresence = [
  { id: 1, pseudo: "Clara", avatar: "https://placehold.co/40x40?text=C", present: true },
  { id: 2, pseudo: "Nexou31", avatar: "https://placehold.co/40x40?text=N", present: true },
  { id: 3, pseudo: "Jenny", avatar: "https://placehold.co/40x40?text=J", present: true },
  { id: 4, pseudo: "Alice", avatar: "https://placehold.co/40x40?text=A", present: true },
  { id: 5, pseudo: "Red", avatar: "https://placehold.co/40x40?text=R", present: true },
];

interface EvaluationCriteria {
  id: string;
  label: string;
  maxValue: number;
  value: number;
}

export default function GestionSpotlightPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [presence, setPresence] = useState(spotlightPresence);
  const [evaluation, setEvaluation] = useState<EvaluationCriteria[]>([
    { id: "accueil", label: "Accueil & Présentation", maxValue: 3, value: 3 },
    { id: "interaction", label: "Interaction & Dynamique", maxValue: 5, value: 4 },
    { id: "respect", label: "Respect des règles & Comportement", maxValue: 3, value: 3 },
    { id: "participation", label: "Participation Spotlight", maxValue: 3, value: 2 },
    { id: "qualite", label: "Qualité technique", maxValue: 2, value: 2 },
    { id: "tenf", label: "TENF Spirit", maxValue: 4, value: 3 },
  ]);
  const [comments, setComments] = useState("");

  const filteredPresence = presence.filter((member) =>
    member.pseudo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalScore = evaluation.reduce((sum, crit) => sum + crit.value, 0);
  const maxScore = evaluation.reduce((sum, crit) => sum + crit.maxValue, 0);
  const scorePercentage = (totalScore / maxScore) * 100;

  const getScoreBadge = () => {
    if (scorePercentage >= 90) return { text: "Excellent Spotlight", color: "bg-green-500/20 text-green-300 border-green-500/30" };
    if (scorePercentage >= 75) return { text: "Très bon Spotlight", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
    if (scorePercentage >= 60) return { text: "Bon Spotlight", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
    return { text: "Spotlight à améliorer", color: "bg-red-500/20 text-red-300 border-red-500/30" };
  };

  const handleSliderChange = (id: string, value: number) => {
    setEvaluation((prev) =>
      prev.map((crit) => (crit.id === id ? { ...crit, value } : crit))
    );
  };

  const handleTogglePresence = (id: number) => {
    setPresence((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, present: !member.present } : member
      )
    );
  };

  const handleSubmitEvaluation = () => {
    alert(`Évaluation soumise avec un score de ${totalScore}/${maxScore}`);
  };

  const handleAddToReport = () => {
    alert("Ajouté au rapport mensuel");
  };

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard Général" },
    { href: "/admin/membres", label: "Gestion des Membres" },
    { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
    { href: "/admin/spotlight", label: "Gestion Spotlight", active: true },
    { href: "/admin/events", label: "Planification Évènements" },
    { href: "/admin/logs", label: "Logs" },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        {/* Header avec navigation */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Gestion Spotlight</h1>
          <div className="flex flex-wrap gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  link.active
                    ? "bg-[#9146ff] text-white"
                    : "bg-[#1a1a1d] text-gray-300 hover:bg-[#252529] hover:text-white border border-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
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
              <button className="w-full bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Lancer un Spotlight
              </button>

              {/* Membres connectés */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Membres connectés
                </h3>
                <div className="space-y-3">
                  {connectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 bg-[#0e0e10] rounded-lg hover:bg-[#252529] transition-colors cursor-pointer"
                    >
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="flex-1 text-white font-medium">
                        {member.name}
                      </span>
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
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Évaluation Spotlight */}
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
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commentaires du modérateur
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Commentaires du modérateur"
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] min-h-[100px]"
                />
              </div>

              <button
                onClick={handleSubmitEvaluation}
                className="w-full mt-6 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Soumettre l'évaluation
              </button>
            </div>
          </div>

          {/* COLONNE CENTRALE */}
          <div>
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
              <div className="overflow-x-auto">
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
                    {filteredPresence.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-gray-700 hover:bg-[#0e0e10] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <img
                            src={member.avatar}
                            alt={member.pseudo}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {member.pseudo}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Présent
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleTogglePresence(member.id)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                              member.present
                                ? "bg-[#9146ff] text-white"
                                : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {member.present && (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE */}
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
                  onClick={handleAddToReport}
                  className="w-full mt-6 bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Ajouter au rapport mensuel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
