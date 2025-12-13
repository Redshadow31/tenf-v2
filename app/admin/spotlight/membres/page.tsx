"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Member {
  twitchLogin: string;
  displayName: string;
  role?: string;
}

interface SpotlightData {
  id: string;
  date: string;
  streamerTwitchLogin: string;
  moderatorUsername: string;
  role: 'streamer' | 'present';
  status?: string;
  evaluation?: {
    totalScore: number;
    maxScore: number;
    criteria: Array<{ id: string; label: string; value: number; maxValue: number }>;
    moderatorComments: string;
  } | null;
}

interface MemberSpotlightStats {
  twitchLogin: string;
  spotlights: SpotlightData[];
  stats: {
    totalSpotlights: number;
    asStreamer: number;
    asPresent: number;
    averageScore: number;
    totalScore: number;
    evaluationsCount: number;
  };
}

export default function MembresSpotlightPage() {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberData, setMemberData] = useState<MemberSpotlightStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      loadMemberSpotlightData(selectedMember.twitchLogin);
    } else {
      setMemberData(null);
    }
  }, [selectedMember]);

  async function loadMembers() {
    try {
      setLoadingMembers(true);
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
          }))
          .filter((m: Member) => m.twitchLogin);
        setAllMembers(members);
      }
    } catch (error) {
      console.error("Erreur chargement membres:", error);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadMemberSpotlightData(twitchLogin: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/spotlight/member/${encodeURIComponent(twitchLogin)}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setMemberData(data);
      } else {
        console.error("Erreur chargement données spotlight:", response.statusText);
        setMemberData(null);
      }
    } catch (error) {
      console.error("Erreur chargement données spotlight:", error);
      setMemberData(null);
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = allMembers.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.twitchLogin.toLowerCase().includes(query) ||
      member.displayName.toLowerCase().includes(query) ||
      (member.role && member.role.toLowerCase().includes(query))
    );
  });

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/spotlight"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour au hub Spotlight
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">Données individuelles</h1>
        <p className="text-gray-400">Consulter les données spotlight par membre</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Recherche membre */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Rechercher un membre
            </h2>

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
                  placeholder="Rechercher un membre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
                />
              </div>
            </div>

            {loadingMembers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff] mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const isSelected = selectedMember?.twitchLogin === member.twitchLogin;
                    return (
                      <button
                        key={member.twitchLogin}
                        onClick={() => setSelectedMember(member)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                          isSelected
                            ? "bg-[#9146ff] text-white"
                            : "bg-[#0e0e10] border border-gray-700 hover:border-[#9146ff]"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4] flex items-center justify-center text-white font-bold flex-shrink-0">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{member.displayName}</p>
                          <p className="text-sm opacity-75">@{member.twitchLogin}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-center py-8">Aucun membre trouvé</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite - Données spotlight */}
        <div className="lg:col-span-2">
          {selectedMember ? (
            <div className="space-y-6">
              {/* En-tête avec statistiques */}
              <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-6">
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

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff] mx-auto"></div>
                  </div>
                ) : memberData ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Total Spotlights</p>
                      <p className="text-2xl font-bold text-white">
                        {memberData.stats.totalSpotlights}
                      </p>
                    </div>
                    <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">En tant que Streamer</p>
                      <p className="text-2xl font-bold text-[#9146ff]">
                        {memberData.stats.asStreamer}
                      </p>
                    </div>
                    <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Présent</p>
                      <p className="text-2xl font-bold text-green-400">
                        {memberData.stats.asPresent}
                      </p>
                    </div>
                    <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Score moyen</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {memberData.stats.evaluationsCount > 0
                          ? memberData.stats.averageScore.toFixed(1)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Aucune donnée spotlight trouvée pour ce membre
                  </p>
                )}
              </div>

              {/* Liste des spotlights */}
              {memberData && memberData.spotlights.length > 0 && (
                <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Historique des Spotlights ({memberData.spotlights.length})
                  </h3>

                  <div className="space-y-4">
                    {memberData.spotlights.map((spotlight) => (
                      <div
                        key={spotlight.id}
                        className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  spotlight.role === 'streamer'
                                    ? "bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30"
                                    : "bg-green-500/20 text-green-300 border border-green-500/30"
                                }`}
                              >
                                {spotlight.role === 'streamer' ? 'Streamer' : 'Présent'}
                              </span>
                              <span className="text-sm text-gray-400">
                                {new Date(spotlight.date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-white font-medium">
                              Streamer: {spotlight.streamerTwitchLogin}
                            </p>
                            <p className="text-sm text-gray-400">
                              Modérateur: {spotlight.moderatorUsername}
                            </p>
                          </div>
                        </div>

                        {spotlight.evaluation && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-gray-300">
                                Évaluation
                              </p>
                              <p className="text-sm font-bold text-yellow-400">
                                {spotlight.evaluation.totalScore}/{spotlight.evaluation.maxScore}
                              </p>
                            </div>
                            {spotlight.evaluation.moderatorComments && (
                              <p className="text-sm text-gray-400 mt-2">
                                {spotlight.evaluation.moderatorComments}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#1a1a1d] border border-neutral-800 rounded-lg p-8">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Données individuelles
                </h2>
                <p className="text-gray-400 mb-6">
                  Sélectionnez un membre pour consulter ses données spotlight.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
