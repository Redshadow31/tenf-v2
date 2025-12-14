"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/admin";
import ManualSpotlightModal from "@/components/admin/ManualSpotlightModal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

interface SpotlightData {
  id: string;
  date: string;
  streamerTwitchLogin: string;
  moderatorUsername: string;
  membersCount: number;
}

interface MemberStats {
  twitchLogin: string;
  displayName: string;
  role: string;
  totalSpotlights: number;
  presences: number;
  presenceRate: number;
  lastSpotlightDate: string | null;
  spotlightDetails: Array<{
    date: string;
    streamer: string;
    present: boolean;
  }>;
}

interface MonthlyData {
  month: string;
  totalSpotlights: number;
  spotlights: SpotlightData[];
  members: MemberStats[];
  charts: {
    presenceBySpotlight: Array<{
      id: string;
      label: string;
      date: string;
      streamer: string;
      presenceCount: number;
    }>;
    streamerScores: Array<{
      id: string;
      date: string;
      streamer: string;
      score: number;
      maxScore: number;
    }>;
  };
}

export default function PresenceSpotlightPage() {
  const [monthKey, setMonthKey] = useState("");
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFounderUser, setIsFounderUser] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    checkFounderStatus();
    initializeMonth();
  }, []);

  useEffect(() => {
    if (monthKey) {
      loadMonthlyData();
    }
  }, [monthKey]);

  async function checkFounderStatus() {
    try {
      const user = await getDiscordUser();
      if (user) {
        setIsFounderUser(isFounder(user.id));
      }
    } catch (error) {
      console.error("Erreur vérification fondateur:", error);
    }
  }

  function initializeMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setMonthKey(`${year}-${month}`);
  }

  async function loadMonthlyData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/spotlight/presence/monthly?month=${monthKey}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data);
      } else {
        console.error("Erreur chargement données mensuelles:", response.statusText);
        setMonthlyData(null);
      }
    } catch (error) {
      console.error("Erreur chargement données mensuelles:", error);
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

  // Filtrer seulement les membres qui ont au moins une présence
  const membersWithPresences = monthlyData?.members.filter(member => member.presences > 0) || [];
  
  const filteredMembers = membersWithPresences
    .filter(member => {
      const matchesSearch = 
        member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.twitchLogin.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      // Trier par ordre alphabétique
      const nameA = a.displayName.toLowerCase();
      const nameB = b.displayName.toLowerCase();
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

  const uniqueRoles = Array.from(new Set(monthlyData?.members.map(m => m.role) || [])).sort();

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
            <h1 className="text-4xl font-bold text-white mb-2">
              Présence aux Spotlights – Analyse mensuelle
            </h1>
            <p className="text-gray-400">Analyse de l'implication et de la présence active</p>
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

      {/* Sélecteur de mois */}
      <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6 mb-6">
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
          {monthlyData && (
            <span className="text-gray-400 text-sm">
              {monthlyData.totalSpotlights} spotlight{monthlyData.totalSpotlights > 1 ? 's' : ''} sur le mois
            </span>
          )}
        </div>
      </div>

      {/* Graphiques */}
      {monthlyData && monthlyData.totalSpotlights > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Graphique 1 - Présence par spotlight */}
          <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Présence par spotlight
            </h2>
            {monthlyData.charts.presenceBySpotlight.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData.charts.presenceBySpotlight}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="label" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1d',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="presenceCount" fill="#9146ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Aucune donnée de présence disponible
              </p>
            )}
          </div>

          {/* Graphique 2 - Note du streamer */}
          <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Note du streamer par spotlight
            </h2>
            {monthlyData.charts.streamerScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData.charts.streamerScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="streamer" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    domain={[0, 20]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1d',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`${value}/20`, 'Note']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#9146ff" 
                    strokeWidth={2}
                    dot={{ fill: '#9146ff', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Aucune évaluation streamer disponible
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-8 mb-6">
          <p className="text-gray-400 text-center">
            Aucun spotlight validé pour ce mois
          </p>
        </div>
      )}

      {/* Tableau principal */}
      <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Analyse par membre ({filteredMembers.length})
          </h2>
          
          <div className="flex gap-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 md:flex-none md:w-64 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
            >
              <option value="all">Tous les rôles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Membre
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Rôle
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                  Spotlights
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                  Présences
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                  Taux
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                  Dernier spotlight
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr
                    key={member.twitchLogin}
                    className="border-b border-gray-700 hover:bg-[#0e0e10] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{member.displayName}</p>
                          <p className="text-sm text-gray-400">@{member.twitchLogin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-700/50 text-gray-300">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-white">
                      {monthlyData.totalSpotlights}
                    </td>
                    <td className="py-3 px-4 text-center text-white">
                      {member.presences}/{monthlyData?.totalSpotlights || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          member.presenceRate >= 80
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : member.presenceRate >= 50
                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {member.presenceRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {member.lastSpotlightDate
                        ? new Date(member.lastSpotlightDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedMember(member)}
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
                    Aucun membre trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détails membre */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold text-2xl">
                  {selectedMember.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedMember.displayName}
                  </h2>
                  <p className="text-gray-400">@{selectedMember.twitchLogin}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Résumé mensuel */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Spotlights</p>
                <p className="text-2xl font-bold text-white">
                  {selectedMember.totalSpotlights}
                </p>
              </div>
              <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Présences</p>
                <p className="text-2xl font-bold text-green-400">
                  {selectedMember.presences}
                </p>
              </div>
              <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Taux</p>
                <p className="text-2xl font-bold text-[#9146ff]">
                  {selectedMember.presenceRate}%
                </p>
              </div>
            </div>

            {/* Historique */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Historique des spotlights du mois
              </h3>
              <div className="space-y-2">
                {selectedMember.spotlightDetails.length > 0 ? (
                  selectedMember.spotlightDetails
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-[#0e0e10] border border-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="text-white font-medium">
                            {new Date(detail.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-400">
                            Streamer: {detail.streamer}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            detail.present
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {detail.present ? "Présent" : "Absent"}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    Aucun spotlight pour ce membre ce mois-ci
                  </p>
                )}
              </div>
            </div>

            {/* Impact sur l'évaluation */}
            <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Impact sur l'évaluation mensuelle
              </h3>
              <p className="text-sm text-gray-400">
                Le taux de présence de {selectedMember.presenceRate}% sur {selectedMember.totalSpotlights} spotlight{selectedMember.totalSpotlights > 1 ? 's' : ''} 
                {selectedMember.presenceRate >= 80 
                  ? " indique une excellente implication."
                  : selectedMember.presenceRate >= 50
                  ? " indique une implication modérée."
                  : " nécessite une amélioration de la présence."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout manuel */}
      {showManualModal && (
        <ManualSpotlightModal
          isOpen={showManualModal}
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false);
            loadMonthlyData();
          }}
        />
      )}
    </div>
  );
}
