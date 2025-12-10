"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMemberByDiscordUsername } from "@/lib/members";
import { getTwitchUser } from "@/lib/twitch";

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
  const [vipMembers, setVipMembers] = useState<VipMember[]>([]);

  useEffect(() => {
    async function fetchVipMembers() {
      try {
        const response = await fetch("/api/vip-members", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch VIP members");
        }
        const data = await response.json();
        
        // Enrichir les données avec les informations Twitch
        const enrichedMembers = await Promise.all(
          data.members.map(async (member: VipMember) => {
            const localMember = getMemberByDiscordUsername(member.username);
            
            if (localMember) {
              try {
                const twitchUser = await getTwitchUser(localMember.twitchLogin);
                return {
                  ...member,
                  twitchLogin: localMember.twitchLogin,
                  twitchUrl: localMember.twitchUrl,
                  twitchAvatar: twitchUser.profile_image_url,
                  displayName: localMember.displayName,
                  twitchBio: "", // TODO: Récupérer la bio depuis l'API Twitch
                };
              } catch (err) {
                console.error(`Error fetching Twitch data for ${member.username}:`, err);
                return {
                  ...member,
                  twitchLogin: localMember.twitchLogin,
                  twitchUrl: localMember.twitchUrl,
                  displayName: localMember.displayName,
                };
              }
            }
            
            return member;
          })
        );
        
        setVipMembers(enrichedMembers);
        
        // Générer des clips aléatoires pour chaque VIP
        // TODO: Remplacer par une vraie récupération de clips depuis l'API Twitch
        // Pour l'instant, on génère des clips mock avec des IDs Twitch valides
        const mockClips: Clip[] = enrichedMembers
          .filter((member) => member.twitchLogin)
          .map((member, index) => {
            // Générer un ID de clip mock (format Twitch: nom aléatoire)
            const clipId = `${member.twitchLogin}-${Date.now()}-${index}`;
            return {
              id: clipId,
              url: `https://clips.twitch.tv/${clipId}`,
              title: `Clip épique de ${member.displayName}`,
              thumbnailUrl: `https://placehold.co/640x360?text=Clip+${member.displayName}`,
              creatorId: member.discordId,
              creatorName: member.displayName,
              creatorLogin: member.twitchLogin || "",
              creatorAvatar: member.twitchAvatar || member.avatar,
              creatorBio: member.twitchBio || `Streamer sur Twitch - ${member.displayName}`,
              viewCount: Math.floor(Math.random() * 10000),
              createdAt: new Date().toISOString(),
            };
          });
        
        // Mélanger les clips aléatoirement
        const shuffledClips = mockClips.sort(() => Math.random() - 0.5);
        setClips(shuffledClips);
      } catch (err) {
        console.error("Error fetching VIP members:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVipMembers();
  }, []);

  const currentClip = clips[currentClipIndex];

  const nextClip = () => {
    setCurrentClipIndex((prev) => (prev + 1) % clips.length);
  };

  const previousClip = () => {
    setCurrentClipIndex((prev) => (prev - 1 + clips.length) % clips.length);
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
                  src={`https://clips.twitch.tv/embed?clip=${currentClip.id.split('/').pop()}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&autoplay=false`}
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
                {currentClipIndex + 1} / {clips.length}
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
                Tous les clips ({clips.length})
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {clips.map((clip, index) => (
                  <button
                    key={clip.id}
                    onClick={() => setCurrentClipIndex(index)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentClipIndex
                        ? "border-purple-600"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-semibold">
                        {clip.creatorName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
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

