"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMemberByDiscordUsername } from "@/lib/members";
import { getTwitchUser } from "@/lib/twitch";

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

export default function VipPage() {
  const [vipMembers, setVipMembers] = useState<VipMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVipMembers() {
      try {
        const response = await fetch("/api/vip-members");
        if (!response.ok) {
          throw new Error("Failed to fetch VIP members");
        }
        const data = await response.json();
        
        // Enrichir les données avec les informations Twitch
        const enrichedMembers = await Promise.all(
          data.members.map(async (member: VipMember) => {
            // Chercher le membre dans la liste locale par son pseudo Discord
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
      } catch (err) {
        console.error("Error fetching VIP members:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchVipMembers();
  }, []);

  if (loading) {
    return (
      <main className="p-6 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xl">Chargement des VIP...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-400 text-xl">Erreur: {error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Titre */}
        <h1 className="text-4xl font-bold text-white">VIP du mois</h1>

        {/* Grille des VIP */}
        {vipMembers.length > 0 ? (
          <div className="grid grid-cols-5 gap-6">
            {vipMembers.map((member) => (
              <div
                key={member.discordId}
                className="flex flex-col items-center space-y-2 bg-[#1a1a1d] border border-gray-700 p-4 rounded-lg hover:border-[#9146ff]/50 transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={member.twitchAvatar || member.avatar}
                    alt={member.displayName}
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = member.avatar;
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-purple-600 px-2 py-0.5 text-xs font-bold text-white">
                    WP
                  </div>
                </div>

                {/* Nom */}
                <h3 className="text-sm font-semibold text-white text-center">
                  {member.displayName}
                </h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Aucun VIP Elite trouvé pour le moment.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Vérifiez que le bot Discord est configuré et que le rôle VIP Elite existe sur le serveur.
            </p>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <Link
            href="/vip/interviews"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
          >
            Interviews vidéo
          </Link>
          <Link
            href="/vip/historique"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
          >
            Historique
          </Link>
          <Link
            href="/vip/clips"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
          >
            Clips
          </Link>
        </div>
      </div>
    </main>
  );
}
