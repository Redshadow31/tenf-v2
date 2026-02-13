import Link from "next/link";
import Image from "next/image";
import { getRandomItems } from "@/lib/utils";
import HomeClient from "@/components/HomeClient";

interface Stats {
  totalMembers: number;
  activeMembers: number;
  livesInProgress: number;
}

interface Live {
  id: string;
  username: string;
  game: string;
  thumbnail: string;
  twitchUrl: string;
}

interface VipMember {
  discordId: string;
  username: string;
  avatar: string;
  displayName: string;
  twitchLogin?: string;
  twitchUrl?: string;
  twitchAvatar?: string;
  vipBadge?: string;
  consecutiveMonths?: number;
}

interface HomeData {
  stats: Stats;
  vipMembers: VipMember[];
  lives: Live[];
}

interface Review {
  id: string;
  pseudo: string;
  message: string;
  hearts: number | null;
  created_at: string;
}

/**
 * Page d'accueil - Server Component
 * Récupère toutes les données côté serveur avec cache ISR de 30 secondes
 */
export default async function Page() {
  // Récupérer toutes les données en une seule requête depuis /api/home
  let homeData: HomeData = {
    stats: { totalMembers: 0, activeMembers: 0, livesInProgress: 0 },
    vipMembers: [],
    lives: [],
  };

  let reviews: Review[] = [];
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/home`, {
      next: { revalidate: 30 }, // Cache ISR de 30 secondes
    });

    if (response.ok) {
      homeData = await response.json();
    }

    // Charger les 3 derniers avis TENF pour la section témoignages
    const reviewsRes = await fetch(`${baseUrl}/api/reviews?type=tenf`, {
      next: { revalidate: 60 }, // Cache 1 min
    });
    if (reviewsRes.ok) {
      const data = await reviewsRes.json();
      reviews = (data.reviews || []).slice(0, 3);
    }
  } catch (error) {
    console.error('[Homepage] Error fetching home data:', error);
  }

  const { stats, vipMembers, lives } = homeData;

  // Sélectionner 3 VIP au hasard parmi tous les VIP du mois
  const randomVip = getRandomItems(vipMembers, 3);
  const vipOfMonth = vipMembers[0]?.displayName || "MissLyliee";

  // Sélectionner 3 lives au hasard
  const randomLives = getRandomItems(lives, 3);

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

        {/* Texte principal (avec composant client pour "Lire plus") */}
        <HomeClient />

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
          <Link
            href="https://discord.gg/WnpazgcZHk"
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
              {stats.totalMembers}
            </p>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>membres</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>créateurs engagés</p>
          </div>
          <div className="card border p-6 text-center home-stat-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              {stats.activeMembers}
            </p>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>actifs ce mois</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>entraide active</p>
          </div>
          <div className="card border p-6 text-center home-stat-card" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              {stats.livesInProgress}
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
                  <Image
                    src={live.thumbnail}
                    alt={live.username}
                    fill
                    className="object-cover home-live-thumbnail"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                )}
                <div className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white animate-pulse z-10">
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
                  className="mt-4 block w-full rounded-lg px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-primary)' }}
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
              key={vip.discordId || vip.twitchLogin || Math.random()}
              className="card flex flex-col items-center space-y-4 border p-6 text-center home-vip-card"
              style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="relative">
                <Image
                  src={vip.twitchAvatar || vip.avatar || `https://placehold.co/80x80?text=${vip.displayName?.charAt(0) || 'V'}`}
                  alt={vip.displayName || 'VIP'}
                  width={80}
                  height={80}
                  className="rounded-full object-cover home-vip-avatar"
                />
                <div className="absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-xs font-bold text-white home-vip-badge" style={{ backgroundColor: 'var(--color-primary)' }}>
                  VIP
                </div>
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{vip.displayName || 'VIP'}</h3>
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

      {/* SECTION 4b — TÉMOIGNAGES / AVIS TENF */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>💜 Ce que disent les membres</p>
            <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Ils parlent de TENF</h2>
          </div>
          <Link
            href="/avis-tenf"
            className="text-sm font-medium transition-colors home-link"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Voir tous les avis →
          </Link>
        </div>
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="card border p-6 home-feature-card"
                style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{r.pseudo}</span>
                  {r.hearts != null && (() => {
                    const h = r.hearts as number;
                    return (
                      <span className="text-rose-500" aria-label={`${h} sur 5`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} style={{ color: i < h ? '#e11d48' : 'var(--color-border)' }}>♥</span>
                        ))}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-sm line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>
                  &quot;{r.message.length > 120 ? `${r.message.slice(0, 120)}…` : r.message}&quot;
                </p>
                <Link
                  href="/avis-tenf"
                  className="mt-4 inline-block text-sm font-medium transition-colors home-link"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Lire la suite →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Soyez le premier à partager votre expérience TENF
            </p>
            <Link
              href="/avis-tenf"
              className="inline-block px-6 py-2 rounded-lg font-semibold text-white transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Poster un avis
            </Link>
          </div>
        )}
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
