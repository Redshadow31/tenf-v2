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

interface SpotlightHighlight {
  id: string;
  streamerTwitchLogin: string;
  streamerDisplayName: string;
  startedAt: string;
  endsAt?: string;
  text: string;
}

const BIRTHDAY_HIGHLIGHT_LOGIN = "tabs_up";
// Mise en avant ponctuelle (uniquement ce jour).
const BIRTHDAY_HIGHLIGHT_DATE_PARIS = "2026-03-06";

export default function LivesPage() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [liveMembers, setLiveMembers] = useState<LiveMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutedStreams, setMutedStreams] = useState<Set<string>>(new Set());
  const [hoveredStream, setHoveredStream] = useState<string | null>(null);
  const [availableGames, setAvailableGames] = useState<string[]>([]);
  const [spotlightHighlight, setSpotlightHighlight] = useState<SpotlightHighlight | null>(null);

  const todayParis = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const isBirthdayHighlightEnabled = todayParis === BIRTHDAY_HIGHLIGHT_DATE_PARIS;

  const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs = 12000
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    async function fetchSpotlightHighlight() {
      try {
        const response = await fetchWithTimeout(
          "/api/spotlight/live",
          { cache: "no-store", headers: { "Cache-Control": "no-cache" } },
          8000
        );
        if (!response.ok) {
          setSpotlightHighlight(null);
          return;
        }
        const data = await response.json();
        setSpotlightHighlight(data.spotlight || null);
      } catch (error) {
        console.warn("[Lives Page] Erreur récupération spotlight live:", error);
        setSpotlightHighlight(null);
      }
    }

    fetchSpotlightHighlight();
    const interval = setInterval(fetchSpotlightHighlight, 60000);
    return () => clearInterval(interval);
  }, []);

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
          const vipMonthResponse = await fetchWithTimeout(`/api/vip-month/save?month=${currentMonthKey}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          }, 8000);
          if (vipMonthResponse.ok) {
            const vipMonthData = await vipMonthResponse.json();
            currentMonthVipLogins = (vipMonthData.vipLogins || []).map((login: string) => login.toLowerCase());
          }
        } catch (error) {
          console.warn('Erreur récupération VIP du mois:', error);
        }
        
        // Récupérer tous les membres actifs depuis l'API publique (même source que la page /membres)
        const membersResponse = await fetchWithTimeout("/api/members/public", {}, 12000);
        
        // L'API retourne toujours 200 maintenant, même en cas d'erreur
        const membersData = await membersResponse.json();
        const activeMembers = membersData.members || [];
        
        if (!Array.isArray(activeMembers)) {
          console.error('[Lives Page] Format de données invalide:', membersData);
          setError("Format de données invalide depuis l'API");
          setLiveMembers([]);
          setLoading(false);
          return;
        }
        
        // Si l'API retourne une erreur mais qu'on a quand même des membres (cache), continuer silencieusement
        if (membersData.error && activeMembers.length === 0) {
          console.warn('[Lives Page] Erreur API membres:', membersData.error);
          // Ne pas afficher l'erreur immédiatement, continuer pour essayer de récupérer les streams
          // L'erreur sera affichée seulement si on n'a vraiment aucune donnée à afficher après le chargement complet
        }
        
        // Si aucun membre n'a été récupéré, essayer de continuer quand même avec les streams
        // La page peut fonctionner sans la liste complète des membres (pour afficher les streams)
        if (activeMembers.length === 0) {
          console.warn('[Lives Page] Aucun membre récupéré, continuation avec streams uniquement');
          // Ne pas retourner immédiatement, continuer pour récupérer les streams
          // Les streams peuvent être affichés même sans la liste complète des membres
        }
        
        const twitchLogins = activeMembers
          .map((member: any) => member.twitchLogin)
          .filter(Boolean);

        // Si on n'a pas de membres mais qu'on peut quand même récupérer les streams, continuer
        // Cela permet à la page de fonctionner même si la DB est temporairement indisponible
        if (twitchLogins.length === 0) {
          console.warn('[Lives Page] Aucun membre disponible, tentative de récupération des streams sans filtrage');
          // Essayer de récupérer les streams sans filtrage par membres (si l'API le permet)
          // Sinon, afficher une liste vide mais ne pas bloquer la page
          setLiveMembers([]);
          setLoading(false);
          // Ne pas afficher l'erreur immédiatement, seulement si vraiment aucune donnée n'est disponible
          // L'erreur sera affichée seulement après le chargement complet si vraiment nécessaire
          // (géré dans le catch/finally)
          return;
        }

        // Récupérer les streams via POST pour éviter les URL trop longues
        const response = await fetchWithTimeout(
          "/api/twitch/streams",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
            body: JSON.stringify({ logins: twitchLogins }),
            cache: "no-store",
          },
          15000
        );

        if (!response.ok) {
          // Si l'API Twitch échoue, continuer avec une liste vide plutôt que de planter
          console.error('[Lives Page] Erreur récupération streams Twitch:', response.status, response.statusText);
          setError(`⚠️ Impossible de récupérer les streams en direct. Réessayez dans quelques instants.`);
          setLiveMembers([]);
          setLoading(false);
          return;
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
          if (member.shadowbanLives === true) {
            return null;
          }

          // Afficher le pseudo de la chaîne Twitch (userName depuis l'API streams, sinon login)
          const twitchDisplayName = stream.userName || member.twitchLogin;
          // Utiliser l'avatar depuis l'API (déjà récupéré en batch)
          // Si pas d'avatar, utiliser un placeholder
          const avatar = member.avatar || `https://placehold.co/40x40?text=${twitchDisplayName.charAt(0)}`;

          return {
            twitchLogin: member.twitchLogin,
            twitchUrl: `https://www.twitch.tv/${stream.userLogin}`,
            displayName: twitchDisplayName,
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
        // Si on a réussi à charger des streams, effacer toute erreur précédente
        if (sortedLives.length > 0) {
          setError(null);
        } else if (membersData.error) {
          // Afficher l'erreur seulement si on n'a vraiment aucune donnée après le chargement complet
          // Mais avec un petit délai pour éviter les faux positifs
          setTimeout(() => {
            setError(`⚠️ Données membres temporairement indisponibles. Réessayez dans quelques instants.`);
          }, 1000);
        }
      } catch (err) {
        console.error("Error fetching live streams:", err);
        // En cas d'erreur, afficher une liste vide plutôt que des données mock
        setLiveMembers([]);
        // Afficher l'erreur seulement après un délai pour éviter les faux positifs
        setTimeout(() => {
          setError(err instanceof Error ? err.message : "Unknown error");
        }, 1000);
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
    const filtered = activeFilter === "Tous"
      ? liveMembers
      : liveMembers.filter((live) => {
      return live.game === activeFilter;
      });

    if (!isBirthdayHighlightEnabled && !spotlightHighlight) {
      return filtered;
    }

    const spotlightLogin = spotlightHighlight?.streamerTwitchLogin.toLowerCase();

    return [...filtered].sort((a, b) => {
      const aSpotlight = !!spotlightLogin && a.twitchLogin.toLowerCase() === spotlightLogin;
      const bSpotlight = !!spotlightLogin && b.twitchLogin.toLowerCase() === spotlightLogin;
      if (aSpotlight !== bSpotlight) return aSpotlight ? -1 : 1;

      const aBirthday = a.twitchLogin.toLowerCase() === BIRTHDAY_HIGHLIGHT_LOGIN;
      const bBirthday = b.twitchLogin.toLowerCase() === BIRTHDAY_HIGHLIGHT_LOGIN;
      if (aBirthday === bBirthday) return 0;
      return aBirthday ? -1 : 1;
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

  const spotlightIsLive = spotlightHighlight
    ? liveMembers.some(
        (live) =>
          live.twitchLogin.toLowerCase() ===
          spotlightHighlight.streamerTwitchLogin.toLowerCase()
      )
    : false;

  return (
    <div className="space-y-8">
      {/* Bandeau prochain événement */}
      <NextEventBanner />
      
      {/* Encart rappel ADN TENF */}
      <LivesFamilyNote />

      {spotlightHighlight && (
        <div
          className="rounded-lg border p-4 space-y-2"
          style={{
            borderColor: "rgba(168, 85, 247, 0.6)",
            background:
              "linear-gradient(135deg, rgba(168, 85, 247, 0.20) 0%, rgba(88, 28, 135, 0.25) 100%)",
          }}
        >
          <h2 className="text-sm font-semibold flex items-center gap-2 text-purple-100">
            <span className="text-base">🌟</span>
            Spotlight TENF: {spotlightHighlight.streamerDisplayName}
          </h2>
          <p className="text-xs leading-relaxed text-purple-100/90">
            {spotlightHighlight.text}
          </p>
          <p className="text-xs text-purple-200/90">
            {spotlightIsLive
              ? "Le streamer est actuellement en live: profitez-en pour passer, discuter et soutenir."
              : "Le créneau de mise en avant est actif. Dès que le live démarre, allez l'encourager."}
          </p>
        </div>
      )}
      
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
            const isBirthdayHighlight =
              isBirthdayHighlightEnabled && live.twitchLogin.toLowerCase() === BIRTHDAY_HIGHLIGHT_LOGIN;
            const isSpotlightHighlight =
              !!spotlightHighlight &&
              live.twitchLogin.toLowerCase() ===
                spotlightHighlight.streamerTwitchLogin.toLowerCase();
            
            return (
              <div
                key={live.twitchLogin}
                className="card overflow-hidden transition-all duration-300 group"
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderColor: isSpotlightHighlight
                    ? '#a855f7'
                    : isBirthdayHighlight
                      ? '#f59e0b'
                      : 'var(--color-border)',
                  boxShadow: isSpotlightHighlight
                    ? '0 0 0 1px rgba(168, 85, 247, 0.35), 0 0 24px rgba(168, 85, 247, 0.22)'
                    : isBirthdayHighlight
                      ? '0 0 0 1px rgba(245, 158, 11, 0.35), 0 0 20px rgba(245, 158, 11, 0.2)'
                      : undefined,
                }}
                onMouseEnter={(e) => {
                  setHoveredStream(live.twitchLogin);
                  e.currentTarget.style.borderColor = isSpotlightHighlight
                    ? '#a855f7'
                    : isBirthdayHighlight
                      ? '#f59e0b'
                      : 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  setHoveredStream(null);
                  e.currentTarget.style.borderColor = isSpotlightHighlight
                    ? '#a855f7'
                    : isBirthdayHighlight
                      ? '#f59e0b'
                      : 'var(--color-border)';
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
                  {isSpotlightHighlight && (
                    <div
                      className="mb-3 rounded-lg border px-3 py-2"
                      style={{
                        borderColor: "rgba(168, 85, 247, 0.55)",
                        backgroundColor: "rgba(168, 85, 247, 0.14)",
                      }}
                    >
                      <p className="text-sm font-semibold text-purple-200">🌟 Mise en avant TENF</p>
                      <p className="text-xs text-purple-100/90">
                        Cette chaîne est mise en lumière par TENF: passe la soutenir avec ta présence.
                      </p>
                    </div>
                  )}
                  {isBirthdayHighlight && (
                    <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
                      <span className="font-semibold">🎂 Anniversaire du jour</span>
                      <span className="text-xs" style={{ color: '#fde68a' }}>Souhaitez-lui un bon anniversaire 💜</span>
                    </div>
                  )}
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
