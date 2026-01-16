"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { allMembers } from "@/lib/members";

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
  const [heroExpanded, setHeroExpanded] = useState(false);

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
  const [vipMembers, setVipMembers] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchVipMembers() {
      try {
        const response = await fetch("/api/vip-members", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setVipMembers(data.members || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des VIP:", error);
      }
    }
    fetchVipMembers();
  }, []);
  
  // Sélectionner 3 VIP au hasard parmi tous les VIP du mois
  const randomVip = getRandomItems(vipMembers, 3);
  
  const vipOfMonth = vipMembers[0]?.displayName || "MissLyliee";
  
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
        <h1 className="text-5xl md:text-6xl font-bold" style={{ color: 'var(--color-text)' }}>
          Communauté d&apos;entraide pour streamers
        </h1>
        
        {/* Phrase d'accroche courte */}
        <p className="text-xl md:text-2xl font-semibold max-w-3xl" style={{ color: 'var(--color-primary)' }}>
          Une véritable famille où chaque créateur grandit ensemble 💜
        </p>

        {/* Texte principal (réduit au premier coup d'œil) */}
        <div className="max-w-4xl space-y-4 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          <p className="text-xl">
            TENF est bien plus qu&apos;un simple serveur Discord : c&apos;est une véritable famille de streamers engagés à progresser ensemble.
          </p>
          <p>
            Que tu sois débutant, en développement ou déjà affilié, tu trouveras ici un espace bienveillant où chaque créateur est soutenu, encouragé et valorisé.
          </p>
          
          {/* Contenu supplémentaire (replié par défaut) */}
          {heroExpanded && (
            <div className="space-y-4 animate-fade-in">
              <p>
                Notre communauté repose sur trois piliers : entraide, formation et découverte. Grâce à un suivi personnalisé, des retours constructifs, un système d&apos;évaluations transparentes et une équipe de modération formée, TENF accompagne chaque membre vers la réussite.
              </p>
              <p>
                Lives partagés, events communautaires, mentorat, visibilité, accompagnement technique, ambiance chaleureuse : ici, personne ne grandit seul.
              </p>
              <p>
                Rejoins une communauté active, humaine et passionnée, où chaque streamer compte et où ta progression devient un projet collectif.
              </p>
            </div>
          )}
          
          <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>
            Bienvenue dans la New Family.
          </p>
          
          {/* Bouton pour lire plus/moins */}
          <button
            onClick={() => setHeroExpanded(!heroExpanded)}
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            {heroExpanded ? 'Lire moins ▲' : 'Lire plus ▼'}
          </button>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
          <Link
            href="https://discord.gg/tenf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-8 py-3 text-base font-semibold text-white transition-all home-cta-button"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Rejoindre le serveur
          </Link>
          <Link
            href="/fonctionnement-tenf"
            className="rounded-lg px-8 py-3 text-base font-semibold transition-all home-cta-button-secondary border-2"
            style={{ 
              color: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
              backgroundColor: 'transparent'
            }}
          >
            Découvrir comment ça fonctionne
          </Link>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Rejoins plus de 170 créateurs déjà engagés dans l&apos;aventure TENF.
        </p>

        {/* Cartes de stats */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-4">
          <div className="card border p-6 text-center home-stat-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              {loading ? "..." : stats.totalMembers}
            </p>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>membres</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>créateurs engagés</p>
          </div>
          <div className="card border p-6 text-center home-stat-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              {loading ? "..." : stats.activeMembers}
            </p>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>actifs ce mois</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>entraide active</p>
          </div>
          <div className="card border p-6 text-center home-stat-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              {loading ? "..." : stats.livesInProgress}
            </p>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>lives en cours</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>communauté vivante</p>
          </div>
          <div className="card border p-6 text-center home-stat-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-2xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>{vipOfMonth}</p>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>VIP du mois</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>reconnaissance</p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — LIVES EN STREAMING */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>🎥 En ce moment dans la New Family</p>
            <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Lives en streaming</h2>
          </div>
          <Link
            href="/lives"
            className="text-sm font-medium transition-colors home-link"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Voir plus →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {randomLives.map((live) => (
            <div
              key={live.id}
              className="card overflow-hidden border home-live-card"
              style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="relative aspect-video w-full overflow-hidden" style={{ background: 'linear-gradient(to bottom right, var(--color-accent-light), var(--color-accent-medium))' }}>
                {live.thumbnail && (
                  <img
                    src={live.thumbnail}
                    alt={live.username}
                    className="w-full h-full object-cover home-live-thumbnail"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white animate-pulse">
                  🔴 EN DIRECT
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
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>⭐ VIPs du mois</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Mis en avant pour leur implication et leur bienveillance
            </p>
          </div>
          <Link
            href="/vip"
            className="text-sm font-medium transition-colors home-link"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Voir plus →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {randomVip.map((vip) => (
            <div
              key={(vip as any).discordId || (vip as any).twitchLogin || Math.random()}
              className="card flex flex-col items-center space-y-4 border p-6 text-center home-vip-card"
              style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="relative">
                <img
                  src={(vip as any).twitchAvatar || (vip as any).avatar || `https://placehold.co/80x80?text=${(vip as any).displayName?.charAt(0) || 'V'}`}
                  alt={(vip as any).displayName || 'VIP'}
                  className="h-20 w-20 rounded-full object-cover home-vip-avatar"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://placehold.co/80x80?text=${(vip as any).displayName?.charAt(0) || 'V'}`;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-xs font-bold text-white home-vip-badge" style={{ backgroundColor: 'var(--color-primary)' }}>
                  VIP
                </div>
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{(vip as any).displayName || 'VIP'}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — COMMENT FONCTIONNE TENF */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            ⭐ Comment fonctionne TENF ?
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Découvre les piliers qui font de TENF une communauté unique
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card border p-6 text-center home-feature-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-primary)' }}>Entraide humaine</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Un système d&apos;entraide sincère où chaque membre soutient les autres. Pas de compétition, juste du partage et de la bienveillance.
            </p>
          </div>
          <div className="card border p-6 text-center home-feature-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-primary)' }}>Système de points & reconnaissance</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Gagne des points en participant à la communauté et débloque des récompenses. L&apos;engagement est valorisé, pas la performance.
            </p>
          </div>
          <div className="card border p-6 text-center home-feature-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-5xl mb-4">🌟</div>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-primary)' }}>Spotlight & événements</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Des événements communautaires, des Spotlights pour mettre en avant les membres, et une vie de communauté riche et active.
            </p>
          </div>
        </div>
        <div className="text-center">
          <Link
            href="/fonctionnement-tenf"
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-all home-cta-button"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Découvrir le fonctionnement TENF
          </Link>
        </div>
      </section>

      {/* SECTION 5 — BOUTIQUE */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>💜 Boutique TENF</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Soutiens la communauté avec notre merch officiel
          </p>
        </div>
        <div className="rounded-lg border p-8 text-center home-boutique-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <p className="text-xl mb-4 font-semibold" style={{ color: 'var(--color-text)' }}>
            💜 Soutiens la communauté avec notre merch officiel
          </p>
          <p className="text-base mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Chaque achat contribue au projet <strong style={{ color: 'var(--color-text)' }}>New Family Aventura 2026</strong> et au développement de notre communauté.
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            💰 Tes achats permettent d&apos;organiser des événements, de développer de nouveaux outils, et de faire grandir la New Family ensemble.
          </p>
          <Link
            href="/boutique"
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-all home-cta-button"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Découvrir toute la boutique
          </Link>
        </div>
      </section>
    </div>
  );
}
