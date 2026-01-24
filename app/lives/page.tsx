"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import NextEventBanner from "@/components/NextEventBanner";
import LivesFamilyNote from "@/components/LivesFamilyNote";

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
  isVip: boolean;
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
        // Récupérer les VIP du mois en cours depuis l'API
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const currentMonthKey = `${year}-${month}`;
        
        let currentMonthVipLogins: string[] = [];
        try {
          const vipMonthResponse = await fetch(`/api/vip-month/save?month=${currentMonthKey}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          });
          if (vipMonthResponse.ok) {
            const vipMonthData = await vipMonthResponse.json();
            currentMonthVipLogins = (vipMonthData.vipLogins || []).map((login: string) => login.toLowerCase());
          }
        } catch (error) {
          console.warn('Erreur récupération VIP du mois:', error);
        }
        
        // Récupérer tous les membres actifs depuis l'API publique (même source que la page /membres)
        const membersResponse = await fetch("/api/members/public", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!membersResponse.ok) {
          // Essayer de récupérer le message d'erreur de l'API
          let errorMessage = "Failed to fetch members";
          try {
            const errorData = await membersResponse.json();
            errorMessage = errorData.error || errorMessage;
            console.error('[Lives Page] Erreur API membres:', errorMessage, errorData);
          } catch (e) {
            console.error('[Lives Page] Erreur API membres (status):', membersResponse.status, membersResponse.statusText);
          }
          throw new Error(errorMessage);
        }
        
        const membersData = await membersResponse.json();
        const activeMembers = membersData.members || [];
        
        if (!Array.isArray(activeMembers)) {
          console.error('[Lives Page] Format de données invalide:', membersData);
          throw new Error("Format de données invalide depuis l'API");
        }
        
        // Si l'API retourne une erreur mais avec une liste vide, afficher un message d'avertissement
        if (activeMembers.length === 0 && membersData.error) {
          console.warn('[Lives Page] Aucun membre récupéré:', membersData.error);
          setError(`Impossible de charger les membres: ${membersData.error}`);
        }
        
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
        
        // Déterminer si un membre est staff (uniquement Admin, Admin Adjoint, Mentor, Modérateur Junior)
        const isStaff = (live: LiveMember): boolean => {
          const staffRoles = ['Admin', 'Admin Adjoint', 'Mentor', 'Modérateur Junior'];
          return staffRoles.includes(live.role) && !live.isVip;
        };
        
        // Vérifier si un membre est VIP du mois en cours
        const isCurrentMonthVip = (live: LiveMember): boolean => {
          return currentMonthVipLogins.includes(live.twitchLogin.toLowerCase());
        };
        
        // Séparer en groupes : Staff, VIP, Autres (avec priorité VIP du mois)
        const staffLives = validLives.filter(live => isStaff(live));
        const vipLives = validLives.filter(live => live.isVip === true && !isStaff(live));
        
        // Dans "Autres", séparer les VIP du mois en cours des autres
        const otherLives = validLives.filter(live => !live.isVip && !isStaff(live));
        const otherLivesCurrentMonthVip = otherLives.filter(live => isCurrentMonthVip(live));
        const otherLivesRegular = otherLives.filter(live => !isCurrentMonthVip(live));
        
        // Mélanger chaque groupe aléatoirement
        const shuffledStaff = shuffleArray(staffLives);
        const shuffledVip = shuffleArray(vipLives);
        const shuffledOtherCurrentMonthVip = shuffleArray(otherLivesCurrentMonthVip);
        const shuffledOtherRegular = shuffleArray(otherLivesRegular);
        
        // Combiner dans l'ordre : Staff -> VIP -> Autres (VIP du mois en premier) -> Autres (reste)
        const sortedLives = [
          ...shuffledStaff, 
          ...shuffledVip, 
          ...shuffledOtherCurrentMonthVip,
          ...shuffledOtherRegular
        ];

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

  const getRoleBadgeColor = (role: string): { bg: string; text: string; border?: string } => {
    switch (role) {
      case "Affilié":
        return { bg: 'var(--color-accent-light)', text: 'var(--color-primary)', border: 'var(--color-primary)' };
      case "Développement":
        return { bg: 'var(--color-primary-dark)', text: 'white' };
      case "Mentor":
        return { bg: 'var(--color-text-secondary)', text: 'white' };
      case "Admin":
        return { bg: 'var(--color-text-secondary)', text: 'white' };
      case "Admin Adjoint":
        return { bg: 'var(--color-text-secondary)', text: 'white' };
      case "Créateur Junior":
        return { bg: 'var(--color-accent-light)', text: 'var(--color-primary)', border: 'var(--color-primary)' };
      default:
        return { bg: 'var(--color-text-secondary)', text: 'white' };
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
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Lives en direct</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl" style={{ color: 'var(--color-text)' }}>Chargement des lives...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Lives en direct</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl" style={{ color: '#ef4444' }}>Erreur: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bandeau prochain événement */}
      <NextEventBanner />
      
      {/* Encart rappel ADN TENF */}
      <LivesFamilyNote />
      
      {/* Titre et bouton filtre jeu */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Lives en direct</h1>
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {liveMembers.length} {liveMembers.length > 1 ? "streamers" : "streamer"} en live
        </div>
      </div>

      {/* Filtre déroulant */}
      <div className="flex items-center gap-3">
        <label htmlFor="game-filter" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Filtrer par jeu:
        </label>
        <select
          id="game-filter"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-all focus:outline-none"
          style={{ 
            backgroundColor: 'var(--color-card)', 
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
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
                className="card overflow-hidden transition-all duration-300 group"
                style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                onMouseEnter={(e) => {
                  setHoveredStream(live.twitchLogin);
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  setHoveredStream(null);
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                {/* Thumbnail avec vidéo dynamique et zoom */}
                <div className="relative aspect-video w-full overflow-hidden" style={{ background: 'linear-gradient(to bottom right, var(--color-accent-light), var(--color-accent-medium))' }}>
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
                        <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{live.displayName}</h3>
                        <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>{live.game}</p>
                      </div>
                    </div>
                    <Link
                      href={live.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg text-white px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                      }}
                    >
                      Regarder
                    </Link>
                  </div>
                  
                  {/* Badge rôle */}
                  <div className="mt-3">
                    <span
                      className="inline-block rounded-lg px-3 py-1 text-xs font-bold"
                      style={{
                        backgroundColor: getRoleBadgeColor(live.role).bg,
                        color: getRoleBadgeColor(live.role).text,
                        border: getRoleBadgeColor(live.role).border ? `1px solid ${getRoleBadgeColor(live.role).border}` : 'none',
                      }}
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
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Aucun streamer en live pour le moment.
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Les lives seront affichés automatiquement lorsqu'ils commenceront à streamer.
          </p>
        </div>
      )}
    </div>
  );
}
