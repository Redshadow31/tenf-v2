"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Clip {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  creatorId: string;
  creatorName: string;
  creatorLogin: string;
  creatorAvatar: string;
  creatorBio: string;
  viewCount: number;
  createdAt: string;
  embedUrl?: string;
  broadcasterId?: string;
  broadcasterName?: string;
}

interface VipMember {
  discordId: string;
  username: string;
  avatar: string;
  displayName: string;
  twitchLogin?: string;
  twitchUrl?: string;
  twitchAvatar?: string;
  twitchBio?: string;
}

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [validClips, setValidClips] = useState<Clip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [shouldLoadEmbed, setShouldLoadEmbed] = useState(false); // Lazy loading de l'iframe

  useEffect(() => {
    async function fetchClips() {
      try {
        setLoading(true);
        
        // Récupérer les membres VIP
        const vipResponse = await fetch("/api/vip-members", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!vipResponse.ok) {
          throw new Error("Failed to fetch VIP members");
        }
        
        const vipData = await vipResponse.json();
        const vipMembers = vipData.members || [];
        
        // Récupérer les IDs Twitch des VIP
        const twitchLogins = vipMembers
          .map((m: any) => m.twitchLogin)
          .filter(Boolean);
        
        if (twitchLogins.length === 0) {
          setClips([]);
          setValidClips([]);
          setLoading(false);
          return;
        }
        
        // Récupérer les IDs Twitch (broadcaster IDs) depuis l'API Twitch
        const usersResponse = await fetch(
          `/api/twitch/users?logins=${twitchLogins.join(',')}`
        );
        
        if (!usersResponse.ok) {
          throw new Error("Failed to fetch Twitch user IDs");
        }
        
        const usersData = await usersResponse.json();
        const broadcasterIds = usersData.users
          .map((u: any) => u.id)
          .filter(Boolean);
        
        if (broadcasterIds.length === 0) {
          setClips([]);
          setValidClips([]);
          setLoading(false);
          return;
        }
        
        // Récupérer les clips depuis l'API Twitch (limite réduite pour accélérer le chargement)
        const clipsResponse = await fetch(
          `/api/twitch/clips?broadcaster_ids=${broadcasterIds.join(',')}&limit=12`
        );
        
        if (!clipsResponse.ok) {
          throw new Error("Failed to fetch clips");
        }
        
        const clipsData = await clipsResponse.json();
        const fetchedClips = clipsData.clips || [];
        
        // Créer un map des membres VIP par broadcaster ID
        const membersByBroadcasterId = new Map();
        usersData.users.forEach((user: any) => {
          const member = vipMembers.find(
            (m: any) => m.twitchLogin?.toLowerCase() === user.login?.toLowerCase()
          );
          if (member) {
            membersByBroadcasterId.set(user.id, member);
          }
        });
        
        // Enrichir les clips avec les informations des membres VIP
        const enrichedClips: Clip[] = fetchedClips.map((clip: any) => {
          const member = membersByBroadcasterId.get(clip.broadcasterId);
          
          return {
            id: clip.id,
            url: clip.url,
            title: clip.title,
            thumbnailUrl: clip.thumbnailUrl,
            creatorId: clip.creatorId,
            creatorName: clip.creatorName || clip.broadcasterName || member?.displayName || 'Unknown',
            creatorLogin: clip.broadcasterName || member?.twitchLogin || '',
            creatorAvatar: member?.avatar || member?.twitchAvatar || `https://placehold.co/64x64?text=${(clip.broadcasterName || 'C').charAt(0)}`,
            creatorBio: member?.displayName ? `Streamer sur Twitch - ${member.displayName}` : '',
            viewCount: clip.viewCount,
            createdAt: clip.createdAt,
            embedUrl: clip.embedUrl,
            broadcasterId: clip.broadcasterId,
            broadcasterName: clip.broadcasterName,
          };
        });
        
        // Trier par nombre de vues (décroissant)
        enrichedClips.sort((a, b) => b.viewCount - a.viewCount);
        
        setClips(enrichedClips);
        setValidClips(enrichedClips); // Initialement, tous les clips sont considérés valides
      } catch (err) {
        console.error("Error fetching clips:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setClips([]);
        setValidClips([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClips();
  }, []);
  
  // Initialiser validClips avec tous les clips (l'API Twitch ne retourne que les clips disponibles)
  useEffect(() => {
    if (clips.length > 0 && validClips.length === 0) {
      setValidClips(clips);
    }
  }, [clips]);

  // Utiliser validClips au lieu de clips pour éviter les clips indisponibles
  const currentClip = validClips.length > 0 
    ? validClips[Math.min(currentClipIndex, validClips.length - 1)]
    : null;

  // Détecter les erreurs d'embedding avec un timeout seulement si l'embed est en cours de chargement
  useEffect(() => {
    if (!currentClip || !shouldLoadEmbed) return;
    
    // Timeout pour détecter si l'iframe reste bloquée (ERR_BLOCKED_BY_RESPONSE)
    let mounted = true;
    const timeoutId = setTimeout(() => {
      if (mounted && !embedLoaded) {
        // Si après 6 secondes l'embed n'est toujours pas chargé, considérer comme erreur
        console.warn('Clip embed timeout, switching to fallback');
        setEmbedError(true);
        setEmbedLoaded(true);
      }
    }, 6000);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentClipIndex, currentClip?.id, shouldLoadEmbed, embedLoaded]);

  // Réinitialiser l'état au changement de clip
  useEffect(() => {
    if (!currentClip) return;
    setEmbedLoaded(false);
    setEmbedError(false);
    setShouldLoadEmbed(false); // Ne pas charger automatiquement, attendre le clic
  }, [currentClipIndex, currentClip?.id]);

  const nextClip = () => {
    if (validClips.length === 0) return;
    setCurrentClipIndex((prev) => (prev + 1) % validClips.length);
    setEmbedLoaded(false);
    setEmbedError(false);
    setShouldLoadEmbed(false); // Réinitialiser le lazy loading pour le nouveau clip
  };

  const previousClip = () => {
    if (validClips.length === 0) return;
    setCurrentClipIndex((prev) => (prev - 1 + validClips.length) % validClips.length);
    setEmbedLoaded(false);
    setEmbedError(false);
    setShouldLoadEmbed(false); // Réinitialiser le lazy loading pour le nouveau clip
  };


  if (loading) {
    return (
      <main className="p-6 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xl">Chargement des clips...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-white">Clips VIP</h1>
            <Link
              href="/vip"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              ← Retour aux VIP
            </Link>
          </div>
          <div className="text-center py-12">
            <p className="text-red-400 text-xl">Erreur: {error}</p>
            <p className="text-gray-400 text-sm mt-2">
              Impossible de charger les clips pour le moment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-white">Clips VIP</h1>
          <Link
            href="/vip"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Retour aux VIP
          </Link>
        </div>
        
        {/* Message d'information */}
        {validClips.length > 0 && (
          <div className="bg-purple-900/30 border border-purple-600/50 rounded-lg p-4 mb-6">
            <p className="text-purple-200 text-sm">
              💡 <strong>Astuce:</strong> Cliquez sur la miniature d'un clip pour le charger. Les clips se chargent à la demande pour une meilleure performance. Si un clip ne se charge pas, utilisez le bouton "Regarder sur Twitch".
            </p>
          </div>
        )}

        {currentClip ? (
          <div className="space-y-6">
            {/* Visionneur de clip */}
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
              {/* Clip avec lazy loading et fallback amélioré */}
              <div className="aspect-video w-full bg-black relative">
                {/* Thumbnail de base toujours visible */}
                <img
                  src={currentClip.thumbnailUrl}
                  alt={currentClip.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                
                {/* Overlay avec bouton play si l'embed n'est pas chargé */}
                {!shouldLoadEmbed && !embedLoaded && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer hover:bg-black/70 transition-colors z-20"
                    onClick={() => setShouldLoadEmbed(true)}
                  >
                    <div className="text-center">
                      <div className="mb-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-purple-600/90 hover:bg-purple-700 flex items-center justify-center transition-colors">
                          <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      <p className="text-white font-semibold mb-1">Cliquez pour charger le clip</p>
                      <p className="text-gray-300 text-xs">Chargement optimisé à la demande</p>
                    </div>
                  </div>
                )}

                {/* Indicateur de chargement */}
                {shouldLoadEmbed && !embedLoaded && !embedError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-300">Chargement du clip...</p>
                    </div>
                  </div>
                )}

                {/* Fallback si erreur d'embedding */}
                {embedError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30">
                    <div className="text-center p-6">
                      <div className="text-red-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{currentClip.title}</h3>
                      <p className="text-gray-400 mb-6 max-w-md text-sm">
                        Ce clip ne peut pas être affiché directement. Cliquez sur le bouton ci-dessous pour le regarder sur Twitch.
                      </p>
                      <a
                        href={currentClip.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                        </svg>
                        Regarder sur Twitch
                      </a>
                      <button
                        onClick={() => {
                          setEmbedError(false);
                          setEmbedLoaded(false);
                          setShouldLoadEmbed(false);
                        }}
                        className="mt-3 text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        Réessayer
                      </button>
                    </div>
                  </div>
                )}

                {/* Iframe Twitch (chargée seulement si shouldLoadEmbed est true) */}
                {shouldLoadEmbed && !embedError && (
                  <iframe
                    key={`${currentClip.id}-${currentClipIndex}-${shouldLoadEmbed}`}
                    src={(() => {
                      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                      const clipId = currentClip.id;
                      
                      // Construire l'URL d'embed Twitch avec le paramètre parent correct
                      // Important: le domaine doit être exactement celui utilisé (pas de www, etc.)
                      const baseUrl = `https://clips.twitch.tv/embed`;
                      const params = new URLSearchParams({
                        clip: clipId,
                        parent: hostname,
                        autoplay: 'false',
                        muted: 'true', // Muted par défaut pour une meilleure UX
                      });
                      
                      return `${baseUrl}?${params.toString()}`;
                    })()}
                    width="100%"
                    height="100%"
                    allowFullScreen
                    className={`w-full h-full absolute inset-0 ${!embedLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
                    title={currentClip.title}
                    scrolling="no"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    onLoad={() => {
                      // Délai court pour s'assurer que le contenu est réellement chargé
                      setTimeout(() => {
                        setEmbedLoaded(true);
                        setEmbedError(false);
                      }, 500);
                    }}
                    onError={(e) => {
                      console.error('Iframe load error:', e);
                      setEmbedError(true);
                      setEmbedLoaded(true);
                    }}
                  />
                )}
              </div>

              {/* Informations du clip */}
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-white">
                  {currentClip.title}
                </h2>

                {/* Informations du créateur */}
                <div className="flex items-center space-x-4">
                  <img
                    src={currentClip.creatorAvatar}
                    alt={currentClip.creatorName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {currentClip.creatorName}
                    </h3>
                    <p className="text-sm text-gray-400">
                      @{currentClip.creatorLogin}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      {currentClip.creatorBio}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {currentClip.viewCount.toLocaleString()} vues
                    </div>
                    <a
                      href={currentClip.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Voir sur Twitch →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contrôles de navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={previousClip}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                ← Clip précédent
              </button>
              <div className="text-gray-400">
                {currentClipIndex + 1} / {validClips.length}
              </div>
              <button
                onClick={nextClip}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Clip suivant →
              </button>
            </div>

            {/* Liste des clips disponibles */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Tous les clips ({validClips.length})
              </h3>
              {validClips.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {validClips.map((clip, index) => {
                    const actualIndex = validClips.findIndex(c => c.id === clip.id);
                    return (
                      <button
                        key={clip.id}
                        onClick={() => {
                          setCurrentClipIndex(actualIndex);
                          setShouldLoadEmbed(false); // Réinitialiser pour le nouveau clip
                          setEmbedLoaded(false);
                          setEmbedError(false);
                        }}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          actualIndex === currentClipIndex
                            ? "border-purple-600 ring-2 ring-purple-500"
                            : "border-gray-700 hover:border-gray-600 hover:scale-[1.02]"
                        }`}
                      >
                        <img
                          src={clip.thumbnailUrl}
                          alt={clip.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://placehold.co/640x360?text=${clip.creatorName}`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 flex items-end justify-center p-2 opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-semibold text-center line-clamp-2">
                            {clip.title}
                          </span>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1 text-xs font-semibold text-white">
                          {clip.viewCount.toLocaleString()} vues
                        </div>
                        {actualIndex === currentClipIndex && (
                          <div className="absolute top-2 right-2 bg-purple-600 rounded-full w-6 h-6 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">Aucun clip valide disponible.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Aucun clip disponible pour le moment.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

