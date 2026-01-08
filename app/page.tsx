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
        <h1 className="text-5xl font-bold" style={{ color: 'var(--color-text)' }}>
          Communauté d'entraide pour streamers
        </h1>
        <div className="max-w-4xl space-y-4 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
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
          <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>
            Bienvenue dans la New Family.
          </p>
        </div>

        {/* Bouton Rejoindre le serveur */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href="https://discord.gg/tenf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-6 py-3 text-base font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }}
          >
            Rejoindre le serveur
          </Link>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Rejoins plus de 170 créateurs déjà engagés dans l'aventure TENF.
          </p>
        </div>

        {/* Cartes de stats */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-4">
          <div className="card border p-6 text-center" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>
              {loading ? "..." : stats.totalMembers}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>membres</p>
          </div>
          <div className="card border p-6 text-center" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>
              {loading ? "..." : stats.activeMembers}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>actifs ce mois</p>
          </div>
          <div className="card border p-6 text-center" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>
              {loading ? "..." : stats.livesInProgress}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>lives en cours</p>
          </div>
          <div className="card border p-6 text-center" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{vipOfMonth}</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>VIP du mois</p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — LIVES EN STREAMING */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Lives en streaming</h2>
          <Link
            href="/lives"
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            Voir plus →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {randomLives.map((live) => (
            <div
              key={live.id}
              className="card overflow-hidden border transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="relative aspect-video w-full" style={{ background: 'linear-gradient(to bottom right, var(--color-accent-light), var(--color-accent-medium))' }}>
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
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{live.username}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{live.game}</p>
                <Link
                  href={live.twitchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full rounded-lg px-4 py-2 text-center text-sm font-medium text-white transition-colors"
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
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — VIPs DU MOIS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>VIPs du mois</h2>
          <Link
            href="/vip"
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            Voir plus →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {randomVip.map((vip) => (
            <div
              key={vip.twitchLogin}
              className="card flex flex-col items-center space-y-4 border p-6 text-center transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-full" style={{ background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-primary-dark))' }}></div>
                <div className="absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                  VIP
                </div>
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{vip.displayName}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
