"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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
  isVip?: boolean;
}

export default function LivesPage() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [liveMembers, setLiveMembers] = useState<LiveMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutedStreams, setMutedStreams] = useState<Set<string>>(new Set());
  const [hoveredStream, setHoveredStream] = useState<string | null>(null);
  const [availableGames, setAvailableGames] = useState<string[]>([]);

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
        // Les avatars sont déjà récupérés dans l'API, pas besoin de faire des appels supplémentaires
        const enrichedLives = liveStreamsOnly.map((stream) => {
          // Chercher dans les membres actifs uniquement (même logique que /membres)
          const member = activeMembers.find(
            (m: any) => m.twitchLogin.toLowerCase() === stream.userLogin.toLowerCase()
          );

          if (!member) {
            return null;
          }

          // Utiliser l'avatar depuis l'API (déjà récupéré en batch)
          // Si pas d'avatar, utiliser un placeholder
          const avatar = member.avatar || `https://placehold.co/40x40?text=${member.displayName.charAt(0)}`;

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
            isVip: member.isVip || false,
          };
        });

        // Filtrer les nulls
        const validLives = enrichedLives.filter((live): live is LiveMember => live !== null);
        
        // Fonction pour mélanger un tableau (Fisher-Yates shuffle)
        const shuffleArray = <T,>(array: T[]): T[] => {
          const shuffled = [...array];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };
        
        // Déterminer si un membre est staff (non VIP)
        const isStaff = (live: LiveMember): boolean => {
          const staffRoles = ['Admin', 'Admin Adjoint', 'Mentor', 'Staff', 'Créateur Junior', 'Développement'];
          return staffRoles.includes(live.role) && !live.isVip;
        };
        
        // Séparer en groupes : VIP, Staff, Autres
        const vipLives = validLives.filter(live => live.isVip === true);
        const staffLives = validLives.filter(live => isStaff(live));
        const otherLives = validLives.filter(live => !live.isVip && !isStaff(live));
        
        // Mélanger chaque groupe aléatoirement
        const shuffledVip = shuffleArray(vipLives);
        const shuffledStaff = shuffleArray(staffLives);
        const shuffledOther = shuffleArray(otherLives);
        
        // Combiner dans l'ordre : VIP -> Staff -> Autres
        const sortedLives = [...shuffledVip, ...shuffledStaff, ...shuffledOther];

        // Extraire les jeux uniques pour le filtre
        const uniqueGames = Array.from(new Set(sortedLives.map(live => live.game).filter(Boolean))).sort();
        setAvailableGames(uniqueGames);

        setLiveMembers(sortedLives);
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
    return liveMembers.filter((live) => {
      return live.game === activeFilter;
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


  const toggleMute = (twitchLogin: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMutedStreams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(twitchLogin)) {
        newSet.delete(twitchLogin);
      } else {
        newSet.add(twitchLogin);
      }
      return newSet;
    });
  };

  const isMuted = (twitchLogin: string) => {
    return mutedStreams.has(twitchLogin);
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

      {/* Filtre déroulant */}
      <div className="flex items-center gap-3">
        <label htmlFor="game-filter" className="text-sm text-gray-400">
          Filtrer par jeu:
        </label>
        <select
          id="game-filter"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="rounded-lg bg-[#1a1a1d] border border-gray-700 text-white px-4 py-2 text-sm font-medium transition-all hover:border-[#9146ff]/50 focus:border-[#9146ff] focus:outline-none"
        >
          <option value="Tous">Tous</option>
          {availableGames.map((game) => (
            <option key={game} value={game}>
              {game}
            </option>
          ))}
        </select>
      </div>

      {/* Grille de lives */}
      {getFilteredLives().length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {getFilteredLives().map((live) => {
            const isHovered = hoveredStream === live.twitchLogin;
            const muted = isMuted(live.twitchLogin);
            const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
            
            return (
              <div
                key={live.twitchLogin}
                className="card overflow-hidden bg-[#1a1a1d] border border-gray-700 transition-all duration-300 hover:border-[#9146ff]/50 group"
                onMouseEnter={() => setHoveredStream(live.twitchLogin)}
                onMouseLeave={() => setHoveredStream(null)}
              >
                {/* Thumbnail avec vidéo dynamique et zoom */}
                <div className="relative aspect-video w-full bg-gradient-to-br from-[#9146ff]/20 to-[#5a32b4]/20 overflow-hidden">
                  {/* Thumbnail de base */}
                  <img
                    src={live.thumbnailUrl}
                    alt={live.displayName}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                      isHovered ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
                    }`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  
                  {/* Vidéo Twitch en preview (affichée au survol) */}
                  {isHovered && (
                    <div className="absolute inset-0 z-10 overflow-hidden">
                      <iframe
                        src={`https://player.twitch.tv/?channel=${live.twitchLogin}&parent=${hostname}&muted=${muted ? 'true' : 'false'}&autoplay=true&controls=false`}
                        width="100%"
                        height="100%"
                        allowFullScreen={false}
                        className="w-full h-full"
                        style={{ transform: 'scale(1.1)', transition: 'transform 0.5s ease' }}
                        allow="autoplay; encrypted-media"
                        frameBorder="0"
                        scrolling="no"
                      />
                    </div>
                  )}
                  
                  {/* Overlay avec badges */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute left-2 top-2">
                      <div className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </div>
                    </div>
                    
                    {/* Bouton son */}
                    <div className="absolute right-2 top-2 z-30 pointer-events-auto">
                      <button
                        onClick={(e) => toggleMute(live.twitchLogin, e)}
                        className="rounded-full bg-black/70 hover:bg-black/90 p-2 transition-colors"
                        aria-label={muted ? "Activer le son" : "Désactiver le son"}
                      >
                        {muted ? (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Infos du streamer */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={live.avatar}
                        alt={live.displayName}
                        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
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
                    <Link
                      href={live.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[#9146ff] hover:bg-[#5a32b4] text-white px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      Regarder
                    </Link>
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
              </div>
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
