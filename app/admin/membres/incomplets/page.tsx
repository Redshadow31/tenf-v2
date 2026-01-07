"use client";

import { useState, useEffect } from "react";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/admin";
import Link from "next/link";

interface Member {
  twitchLogin: string;
  displayName: string;
  discordUsername?: string;
  discordId?: string;
  twitchId?: string;
  twitchUrl?: string;
  role: string;
  isActive: boolean;
  siteUsername?: string;
  description?: string;
}

interface IncompleteMember {
  member: Member;
  missingFields: string[];
  completionPercentage: number;
}

export default function IncompletsMembresPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [incompleteMembers, setIncompleteMembers] = useState<IncompleteMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"completion" | "name">("completion");

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        try {
          const roleResponse = await fetch("/api/user/role");
          const roleData = await roleResponse.json();
          
          if (!roleData.hasAdminAccess) {
            window.location.href = "/unauthorized";
            return;
          }
          
          const isAdminRole = roleData.role === "Admin";
          const isAdminAdjoint = roleData.role === "Admin Adjoint";
          const founderStatus = isFounder(user.id);
          
          setCurrentAdmin({ 
            id: user.id, 
            username: user.username, 
            isFounder: founderStatus || isAdminRole || isAdminAdjoint 
          });
        } catch (err) {
          const founderStatus = isFounder(user.id);
          if (!founderStatus) {
            window.location.href = "/unauthorized";
            return;
          }
          setCurrentAdmin({ id: user.id, username: user.username, isFounder: founderStatus });
        }
      } else {
        window.location.href = "/auth/login?redirect=/admin/membres/incomplets";
      }
    }
    loadAdmin();
  }, []);

  useEffect(() => {
    if (currentAdmin !== null) {
      loadMembersAndDetectIncomplete();
    }
  }, [currentAdmin]);

  async function loadMembersAndDetectIncomplete() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/members", {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!response.ok) {
        console.error("Erreur lors du chargement des membres");
        return;
      }

      const data = await response.json();
      const membersData: Member[] = data.members || [];
      setMembers(membersData);

      // Détecter les comptes incomplets
      const incomplete: IncompleteMember[] = [];

      for (const member of membersData) {
        const missingFields: string[] = [];
        
        // Champs essentiels
        if (!member.twitchLogin || member.twitchLogin.trim() === "") {
          missingFields.push("Twitch");
        }
        if (!member.discordId) {
          missingFields.push("Discord");
        }
        if (!member.twitchId) {
          missingFields.push("ID Twitch");
        }
        if (!member.displayName || member.displayName.trim() === "") {
          missingFields.push("Nom d'affichage");
        }

        // Champs optionnels mais importants
        if (!member.description) {
          missingFields.push("Description");
        }
        if (!member.siteUsername) {
          missingFields.push("Pseudo site");
        }

        // Calculer le pourcentage de complétion
        const totalFields = 6; // twitchLogin, discordId, twitchId, displayName, description, siteUsername
        const completedFields = totalFields - missingFields.length;
        const completionPercentage = Math.round((completedFields / totalFields) * 100);

        // Considérer comme incomplet si moins de 100% ou si des champs essentiels manquent
        if (completionPercentage < 100 || missingFields.some(f => ["Twitch", "Discord", "Nom d'affichage"].includes(f))) {
          incomplete.push({
            member,
            missingFields,
            completionPercentage,
          });
        }
      }

      // Trier par pourcentage de complétion
      incomplete.sort((a, b) => a.completionPercentage - b.completionPercentage);
      setIncompleteMembers(incomplete);
    } catch (error) {
      console.error("Erreur lors de la détection des comptes incomplets:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredIncomplete = filterType === "all"
    ? incompleteMembers
    : incompleteMembers.filter(im => im.missingFields.includes(filterType));

  const sortedIncomplete = [...filteredIncomplete].sort((a, b) => {
    if (sortBy === "completion") {
      return a.completionPercentage - b.completionPercentage;
    } else {
      return (a.member.displayName || a.member.twitchLogin).localeCompare(
        b.member.displayName || b.member.twitchLogin
      );
    }
  });

  const allMissingFields = Array.from(new Set(incompleteMembers.flatMap(im => im.missingFields)));

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getCompletionBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500/20";
    if (percentage >= 50) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Analyse des comptes incomplets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        <div className="mb-6">
          <Link 
            href="/admin/membres" 
            className="text-[#9146ff] hover:text-[#5a32b4] mb-4 inline-block"
          >
            ← Retour au hub Membres
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2">Comptes Incomplets</h1>
        <p className="text-gray-400 mb-8">Membres avec configuration partielle nécessitant une attention</p>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{incompleteMembers.length}</div>
            <div className="text-sm text-gray-400">Comptes incomplets</div>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">
              {incompleteMembers.filter(im => im.completionPercentage < 50).length}
            </div>
            <div className="text-sm text-gray-400">Moins de 50%</div>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {incompleteMembers.filter(im => im.completionPercentage >= 50 && im.completionPercentage < 80).length}
            </div>
            <div className="text-sm text-gray-400">50-80%</div>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {incompleteMembers.filter(im => im.completionPercentage >= 80).length}
            </div>
            <div className="text-sm text-gray-400">80%+</div>
          </div>
        </div>

        {/* Filtres et tri */}
        <div className="mb-6 flex gap-2 flex-wrap items-center">
          <span className="text-gray-400">Filtrer par champ manquant:</span>
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === "all"
                ? "bg-[#9146ff] text-white"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
            }`}
          >
            Tous ({incompleteMembers.length})
          </button>
          {allMissingFields.map((field) => (
            <button
              key={field}
              onClick={() => setFilterType(field)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === field
                  ? "bg-[#9146ff] text-white"
                  : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
              }`}
            >
              {field} ({incompleteMembers.filter(im => im.missingFields.includes(field)).length})
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <span className="text-gray-400">Trier par:</span>
            <button
              onClick={() => setSortBy("completion")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === "completion"
                  ? "bg-[#9146ff] text-white"
                  : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
              }`}
            >
              Complétion
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === "name"
                  ? "bg-[#9146ff] text-white"
                  : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
              }`}
            >
              Nom
            </button>
          </div>
        </div>

        {/* Liste des comptes incomplets */}
        {sortedIncomplete.length === 0 ? (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <div className="text-xl font-semibold text-white mb-2">Tous les comptes sont complets</div>
            <div className="text-gray-400">Aucun membre avec une configuration partielle.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedIncomplete.map((incomplete, index) => (
              <div
                key={index}
                className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-white">
                        {incomplete.member.displayName || incomplete.member.twitchLogin}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getCompletionBgColor(incomplete.completionPercentage)} ${getCompletionColor(incomplete.completionPercentage)}`}>
                        {incomplete.completionPercentage}% complet
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {incomplete.member.twitchLogin && (
                        <div className="text-sm">
                          <span className="text-gray-400">Twitch:</span>{" "}
                          <span className="text-white">{incomplete.member.twitchLogin}</span>
                        </div>
                      )}
                      {incomplete.member.discordUsername && (
                        <div className="text-sm">
                          <span className="text-gray-400">Discord:</span>{" "}
                          <span className="text-white">{incomplete.member.discordUsername}</span>
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <div className="text-sm text-gray-400 mb-2">Champs manquants:</div>
                      <div className="flex flex-wrap gap-2">
                        {incomplete.missingFields.map((field, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs font-semibold"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/admin/membres/gestion?search=${encodeURIComponent(incomplete.member.twitchLogin || incomplete.member.displayName)}`}
                        className="text-[#9146ff] hover:text-[#5a32b4] text-sm font-medium"
                      >
                        → Compléter dans la gestion
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

