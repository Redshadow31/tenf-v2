"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { allMembers } from "@/lib/members";
import { getVipMembers } from "@/lib/memberRoles";

interface Stats {
  totalMembers: number;
  activeMembers: number;
  livesInProgress: number;
}

// Fonction pour sélectionner aléatoirement N éléments d'un tableau
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function Page() {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    activeMembers: 0,
    livesInProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  // Charger les statistiques depuis l'API
  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/stats", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalMembers: data.totalMembers || 0,
            activeMembers: data.activeMembers || 0,
            livesInProgress: data.livesInProgress || 0,
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Récupérer les VIP
  const allVip = getVipMembers();
  
  // Sélectionner 3 VIP au hasard parmi tous les VIP du mois
  const randomVip = getRandomItems(allVip, 3);
  
  const vipOfMonth = allVip[0]?.displayName || "MissLyliee";
  
  // Récupérer les vraies données de lives
  const [lives, setLives] = useState<any[]>([]);
  
  useEffect(() => {
    async function loadLives() {
      try {
        // Récupérer les membres actifs
        const membersResponse = await fetch("/api/members/public", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          const activeMembers = membersData.members || [];
          const twitchLogins = activeMembers
            .map((member: any) => member.twitchLogin)
            .filter(Boolean);

          if (twitchLogins.length > 0) {
            // Récupérer les streams en cours
            const userLoginsParam = twitchLogins.join(',');
            const streamsResponse = await fetch(
              `/api/twitch/streams?user_logins=${encodeURIComponent(userLoginsParam)}`,
              {
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache',
                },
              }
            );

            if (streamsResponse.ok) {
              const streamsData = await streamsResponse.json();
              const liveStreams = (streamsData.streams || [])
                .filter((stream: any) => stream.type === 'live')
                .map((stream: any) => {
                  const member = activeMembers.find(
                    (m: any) => m.twitchLogin.toLowerCase() === stream.userLogin.toLowerCase()
                  );
                  return {
                    id: stream.userLogin,
                    username: member?.displayName || stream.userName,
                    game: stream.gameName || "Just Chatting",
                    thumbnail: stream.thumbnailUrl || "/api/placeholder/400/225",
                    twitchUrl: member?.twitchUrl || `https://www.twitch.tv/${stream.userLogin}`,
                  };
                });
              
              // Sélectionner 3 lives au hasard
              setLives(getRandomItems(liveStreams, 3));
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des lives:", error);
      }
    }
    loadLives();
  }, []);
  
  const randomLives = lives;

  return (
    <div className="space-y-16 pb-16">
      {/* SECTION 1 — HERO */}
      <section className="flex flex-col items-center justify-center space-y-8 py-16 text-center">
        <h1 className="text-5xl font-bold text-white">
          Communauté d'entraide pour streamers
        </h1>
        <div className="max-w-4xl space-y-4 text-lg text-gray-300">
          <p>
            TENF est bien plus qu'un simple serveur Discord : c'est une véritable famille de streamers engagés à progresser ensemble.
          </p>
          <p>
            Que tu sois débutant, en développement ou déjà affilié, tu trouveras ici un espace bienveillant où chaque créateur est soutenu, encouragé et valorisé.
          </p>
          <p>
            Notre communauté repose sur trois piliers : entraide, formation et découverte. Grâce à un suivi personnalisé, des retours constructifs, un système d'évaluations transparentes et une équipe de modération formée, TENF accompagne chaque membre vers la réussite.
          </p>
          <p>
            Lives partagés, events communautaires, mentorat, visibilité, accompagnement technique, ambiance chaleureuse : ici, personne ne grandit seul.
          </p>
          <p>
            Rejoins une communauté active, humaine et passionnée, où chaque streamer compte et où ta progression devient un projet collectif.
          </p>
          <p className="text-[#9146ff] font-semibold">
            Bienvenue dans la New Family.
          </p>
        </div>

        {/* Bouton Rejoindre le serveur */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href="https://discord.gg/tenf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#9146ff] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#5a32b4]"
          >
            Rejoindre le serveur
          </Link>
          <p className="text-sm text-gray-400">
            Rejoins plus de 170 créateurs déjà engagés dans l'aventure TENF.
          </p>
        </div>

        {/* Cartes de stats */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-4">
          <div className="card bg-[#1a1a1d] border border-gray-700 p-6 text-center">
            <p className="text-4xl font-bold text-white">
              {loading ? "..." : stats.totalMembers}
            </p>
            <p className="mt-2 text-sm text-gray-400">membres</p>
          </div>
          <div className="card bg-[#1a1a1d] border border-gray-700 p-6 text-center">
            <p className="text-4xl font-bold text-white">
              {loading ? "..." : stats.activeMembers}
            </p>
            <p className="mt-2 text-sm text-gray-400">actifs ce mois</p>
          </div>
          <div className="card bg-[#1a1a1d] border border-gray-700 p-6 text-center">
            <p className="text-4xl font-bold text-white">
              {loading ? "..." : stats.livesInProgress}
            </p>
            <p className="mt-2 text-sm text-gray-400">lives en cours</p>
          </div>
          <div className="card bg-[#1a1a1d] border border-gray-700 p-6 text-center">
            <p className="text-2xl font-bold text-white">{vipOfMonth}</p>
            <p className="mt-2 text-sm text-gray-400">VIP du mois</p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — LIVES EN STREAMING */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Lives en streaming</h2>
          <Link
            href="/lives"
            className="text-sm font-medium text-white hover:text-[#9146ff] transition-colors"
          >
            Voir plus →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {randomLives.map((live) => (
            <div
              key={live.id}
              className="card overflow-hidden bg-[#1a1a1d] border border-gray-700 transition-transform hover:scale-[1.02]"
            >
              <div className="relative aspect-video w-full bg-gradient-to-br from-[#9146ff]/20 to-[#5a32b4]/20">
                {live.thumbnail && (
                  <img
                    src={live.thumbnail}
                    alt={live.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                  EN DIRECT
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white">{live.username}</h3>
                <p className="mt-1 text-sm text-gray-400">{live.game}</p>
                <Link
                  href={live.twitchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full rounded-lg bg-[#9146ff] px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#5a32b4]"
                >
                  Regarder
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — VIPs DU MOIS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">VIPs du mois</h2>
          <Link
            href="/vip"
            className="text-sm font-medium text-white hover:text-[#9146ff] transition-colors"
          >
            Voir plus →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {randomVip.map((vip) => (
            <div
              key={vip.twitchLogin}
              className="card flex flex-col items-center space-y-4 bg-[#1a1a1d] border border-gray-700 p-6 text-center transition-transform hover:scale-[1.02]"
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4]"></div>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-[#9146ff] px-2 py-0.5 text-xs font-bold text-white">
                  VIP
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white">{vip.displayName}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
