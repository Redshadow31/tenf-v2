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
        
        // Récupérer les clips depuis l'API Twitch
        const clipsResponse = await fetch(
          `/api/twitch/clips?broadcaster_ids=${broadcasterIds.join(',')}&limit=50`
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

  const nextClip = () => {
    if (validClips.length === 0) return;
    setCurrentClipIndex((prev) => (prev + 1) % validClips.length);
  };

  const previousClip = () => {
    if (validClips.length === 0) return;
    setCurrentClipIndex((prev) => (prev - 1 + validClips.length) % validClips.length);
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
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Clips VIP</h1>
          <Link
            href="/vip"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Retour aux VIP
          </Link>
        </div>

        {currentClip ? (
          <div className="space-y-6">
            {/* Visionneur de clip */}
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
              {/* Clip */}
              <div className="aspect-video w-full bg-black relative">
                <iframe
                  src={currentClip.embedUrl || `https://clips.twitch.tv/embed?clip=${currentClip.id}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&autoplay=false`}
                  width="100%"
                  height="100%"
                  allowFullScreen
                  className="w-full h-full"
                  title={currentClip.title}
                  scrolling="no"
                  frameBorder="0"
                />
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
                        onClick={() => setCurrentClipIndex(actualIndex)}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          actualIndex === currentClipIndex
                            ? "border-purple-600"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <img
                          src={clip.thumbnailUrl}
                          alt={clip.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://placehold.co/640x360?text=${clip.creatorName}`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-semibold">
                            {clip.creatorName}
                          </span>
                        </div>
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

