"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getActiveMembers, getMemberRole } from "@/lib/memberRoles";
import { getTwitchUser } from "@/lib/twitch";

// Mock data pour les jeux en cours (à remplacer par l'API Twitch)
const mockGames: Record<string, string> = {
  nexou31: "Fortnite",
  clarastonewall: "The Sims 4",
  yaya_romali: "VALORANT",
  misslyliee: "Elden Ring",
  jenny31200: "Animal Crossing",
  red_shadow_31: "Dead by Daylight",
  // Ajouter d'autres mappings selon les besoins
};

// Simuler les membres actuellement en live (à remplacer par l'API Twitch)
// Pour l'instant, on prend les 6 premiers membres actifs comme exemple
function getLiveMembers() {
  const activeMembers = getActiveMembers();
  // TODO: Filtrer avec l'API Twitch pour ne garder que ceux qui sont vraiment en live
  return activeMembers.slice(0, 6).map((member) => ({
    ...member,
    game: mockGames[member.twitchLogin.toLowerCase()] || "Just Chatting",
  }));
}

const filters = ["Tous", "Affiliés", "Développement"];

export default function Page() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const allLiveMembers = getLiveMembers();

  const getFilteredLives = () => {
    if (activeFilter === "Tous") {
      return allLiveMembers;
    }
    const filterMap: Record<string, string> = {
      Affiliés: "Affilié",
      Développement: "Développement",
    };
    return allLiveMembers.filter((live) => {
      const role = getMemberRole(live.twitchLogin);
      return role.role === filterMap[activeFilter];
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Affilié":
        return "bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30";
      case "Développement":
        return "bg-[#5a32b4] text-white";
      case "Mentor":
        return "bg-gray-700 text-white";
      default:
        return "bg-gray-700 text-white";
    }
  };

  return (
    <div className="space-y-8">
      {/* Titre et bouton filtre jeu */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Lives en direct</h1>
        <button className="rounded-lg bg-[#1a1a1d] px-4 py-2 text-sm font-medium text-white border border-gray-700 hover:border-[#9146ff]/50 transition-colors">
          Jeu
        </button>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeFilter === filter
                ? "bg-[#9146ff] text-white"
                : "bg-[#1a1a1d] text-white border border-gray-700 hover:border-[#9146ff]/50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Grille de lives */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {getFilteredLives().map((live) => {
          const role = getMemberRole(live.twitchLogin);
          return (
            <Link
              key={live.twitchLogin}
              href={live.twitchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card overflow-hidden bg-[#1a1a1d] border border-gray-700 transition-transform hover:scale-[1.02]"
            >
              {/* Thumbnail avec badge LIVE */}
              <div className="relative aspect-video w-full bg-gradient-to-br from-[#9146ff]/20 to-[#5a32b4]/20">
                <div className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                  LIVE
                </div>
              </div>

              {/* Infos du streamer */}
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4]"></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{live.displayName}</h3>
                    <p className="text-sm text-gray-400 truncate">{live.game}</p>
                  </div>
                </div>
                
                {/* Badge rôle */}
                <div className="mt-3">
                  <span
                    className={`inline-block rounded-lg px-3 py-1 text-xs font-bold ${getRoleBadgeColor(
                      role.role
                    )}`}
                  >
                    {role.role}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
