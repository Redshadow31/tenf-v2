"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getTwitchUser } from "@/lib/twitch";

interface LiveStream {
  id: string;
  userId: string;
  userLogin: string;
  userName: string;
  gameName: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string;
  type: string;
}

interface LiveMember {
  twitchLogin: string;
  twitchUrl: string;
  displayName: string;
  game: string;
  viewerCount: number;
  thumbnailUrl: string;
  avatar: string;
  role: string;
}

const filters = ["Tous", "Affiliés", "Développement"];

export default function LivesPage() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [liveMembers, setLiveMembers] = useState<LiveMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLiveStreams() {
      try {
        // Récupérer tous les membres actifs depuis l'API publique (même source que la page /membres)
        const membersResponse = await fetch("/api/members/public", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!membersResponse.ok) {
          throw new Error("Failed to fetch members");
        }
        const membersData = await membersResponse.json();
        const activeMembers = membersData.members || [];
        
        const twitchLogins = activeMembers
          .map((member: any) => member.twitchLogin)
          .filter(Boolean);

        if (twitchLogins.length === 0) {
          setLiveMembers([]);
          setLoading(false);
          return;
        }

        // Récupérer les streams en cours depuis l'API Twitch
        const userLoginsParam = twitchLogins.join(',');
        const response = await fetch(
          `/api/twitch/streams?user_logins=${encodeURIComponent(userLoginsParam)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch live streams");
        }

        const data = await response.json();
        const streams: LiveStream[] = data.streams || [];

        // Filtrer uniquement les streams vraiment en live
        const liveStreamsOnly = streams.filter((stream) => stream.type === "live");

        // Enrichir les données avec les informations des membres actifs uniquement
        // On utilise activeMembers depuis l'API publique pour garantir la synchronisation
        const enrichedLives = await Promise.all(
          liveStreamsOnly.map(async (stream) => {
            // Chercher dans les membres actifs uniquement (même logique que /membres)
            const member = activeMembers.find(
              (m: any) => m.twitchLogin.toLowerCase() === stream.userLogin.toLowerCase()
            );

            if (!member) {
              return null;
            }

            // Utiliser l'avatar depuis l'API ou récupérer depuis Twitch
            let avatar = member.avatar || '';
            if (!avatar) {
              try {
                const twitchUser = await getTwitchUser(member.twitchLogin);
                avatar = twitchUser.profile_image_url;
              } catch (err) {
                console.error(`Error fetching avatar for ${member.twitchLogin}:`, err);
                avatar = `https://placehold.co/40x40?text=${member.displayName.charAt(0)}`;
              }
            }

            return {
              twitchLogin: member.twitchLogin,
              twitchUrl: member.twitchUrl,
              displayName: member.displayName,
              game: stream.gameName,
              viewerCount: stream.viewerCount,
              thumbnailUrl: stream.thumbnailUrl
                ?.replace("{width}", "640")
                ?.replace("{height}", "360") || stream.thumbnailUrl,
              avatar: avatar,
              role: member.role,
            };
          })
        );

        // Filtrer les nulls et trier par nombre de viewers (décroissant)
        const validLives = enrichedLives
          .filter((live): live is LiveMember => live !== null)
          .sort((a, b) => b.viewerCount - a.viewerCount);

        setLiveMembers(validLives);
      } catch (err) {
        console.error("Error fetching live streams:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        // En cas d'erreur, afficher une liste vide plutôt que des données mock
        setLiveMembers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveStreams();

    // Rafraîchir toutes les 60 secondes
    const interval = setInterval(fetchLiveStreams, 60000);

    return () => clearInterval(interval);
  }, []);

  const getFilteredLives = () => {
    if (activeFilter === "Tous") {
      return liveMembers;
    }
    const filterMap: Record<string, string> = {
      Affiliés: "Affilié",
      Développement: "Développement",
    };
    return liveMembers.filter((live) => {
      return live.role === filterMap[activeFilter];
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
      case "Admin":
        return "bg-gray-700 text-white";
      case "Admin Adjoint":
        return "bg-gray-700 text-white";
      case "Créateur Junior":
        return "bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30";
      default:
        return "bg-gray-700 text-white";
    }
  };

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">Lives en direct</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xl">Chargement des lives...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">Lives en direct</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-400 text-xl">Erreur: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Titre et bouton filtre jeu */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Lives en direct</h1>
        <div className="text-sm text-gray-400">
          {liveMembers.length} {liveMembers.length > 1 ? "streamers" : "streamer"} en live
        </div>
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
      {getFilteredLives().length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {getFilteredLives().map((live) => {
            return (
              <Link
                key={live.twitchLogin}
                href={live.twitchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card overflow-hidden bg-[#1a1a1d] border border-gray-700 transition-transform hover:scale-[1.02] hover:border-[#9146ff]/50"
              >
                {/* Thumbnail avec badge LIVE */}
                <div className="relative aspect-video w-full bg-gradient-to-br from-[#9146ff]/20 to-[#5a32b4]/20">
                  <img
                    src={live.thumbnailUrl}
                    alt={live.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute left-2 top-2 flex items-center gap-2">
                    <div className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </div>
                    <div className="rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                      {formatViewerCount(live.viewerCount)} viewers
                    </div>
                  </div>
                </div>

                {/* Infos du streamer */}
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={live.avatar}
                      alt={live.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://placehold.co/40x40?text=${live.displayName.charAt(0)}`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{live.displayName}</h3>
                      <p className="text-sm text-gray-400 truncate">{live.game}</p>
                    </div>
                  </div>
                  
                  {/* Badge rôle */}
                  <div className="mt-3">
                    <span
                      className={`inline-block rounded-lg px-3 py-1 text-xs font-bold ${getRoleBadgeColor(
                        live.role
                      )}`}
                    >
                      {live.role}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            Aucun streamer en live pour le moment.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Les lives seront affichés automatiquement lorsqu'ils commenceront à streamer.
          </p>
        </div>
      )}
    </div>
  );
}
