import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, HeartHandshake, Rocket } from "lucide-react";
import AboutPageEnhancer from "@/components/about/AboutPageEnhancer";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import { getRandomItems } from "@/lib/utils";

type Stats = {
  totalMembers: number;
  activeMembers: number;
  livesInProgress: number;
};

type Live = {
  id: string;
  username: string;
  game: string;
  thumbnail: string;
  twitchUrl: string;
};

type VipMember = {
  discordId: string;
  username: string;
  avatar: string;
  displayName: string;
  twitchLogin?: string;
  twitchUrl?: string;
  twitchAvatar?: string;
};

type HomeData = {
  stats: Stats;
  vipMembers: VipMember[];
  lives: Live[];
};

type Review = {
  id: string;
  pseudo: string;
  message: string;
  hearts: number | null;
  created_at: string;
};

type DashboardGrowthPoint = {
  month: string;
  value: number;
};

type DashboardPublicResponse = {
  data?: {
    discordGrowth?: DashboardGrowthPoint[];
  };
};

type PublicMember = {
  twitchLogin: string;
  twitchUrl: string;
  displayName: string;
  role: string;
  avatar?: string;
  integrationDate?: string;
  createdAt?: string;
};

type PublicMembersResponse = {
  members?: PublicMember[];
};

const timeline = [
  { date: "17 avril 2024", label: "Création de Twitch Entraide Family" },
  { date: "2 septembre 2024", label: "Création de Twitch Entraide New Family" },
  { date: "Septembre 2025", label: "Lancement du site TENF" },
  { date: "Janvier 2026", label: "Arrivée de la version 2 du site" },
  { date: "Mars 2026", label: "Mise à jour majeure de la plateforme" },
];

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, cur) => acc + cur, 0) / values.length;
}

function computeMonthlyGrowth(points: DashboardGrowthPoint[]): number {
  if (points.length < 2) return 24;
  const deltas: number[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const delta = points[index].value - points[index - 1].value;
    if (Number.isFinite(delta) && delta > 0) {
      deltas.push(delta);
    }
  }
  const recent = deltas.slice(-3);
  const computed = Math.round(average(recent));
  return computed > 0 ? computed : 24;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function toTimestamp(value?: string): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

export const metadata: Metadata = {
  title: "Accueil | TENF",
  description:
    "Hub communautaire TENF pour découvrir les lives, les créateurs, les VIP et l'évolution de la communauté Twitch Entraide New Family.",
  alternates: {
    canonical: "https://tenf-community.com",
  },
};

export default async function Page() {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  let homeData: HomeData = {
    stats: { totalMembers: 0, activeMembers: 0, livesInProgress: 0 },
    vipMembers: [],
    lives: [],
  };
  let reviews: Review[] = [];
  let members: PublicMember[] = [];
  let monthlyGrowth = 24;

  try {
    const [homeRes, reviewsRes, membersRes, dashboardRes] = await Promise.all([
      fetch(`${baseUrl}/api/home`, { next: { revalidate: 30 } }),
      fetch(`${baseUrl}/api/reviews?type=tenf`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/members/public`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/dashboard/data`, { next: { revalidate: 300 } }),
    ]);

    if (homeRes.ok) {
      homeData = (await homeRes.json()) as HomeData;
    }
    if (reviewsRes.ok) {
      const reviewsData = await reviewsRes.json();
      reviews = (reviewsData.reviews || []) as Review[];
    }
    if (membersRes.ok) {
      const membersData = (await membersRes.json()) as PublicMembersResponse;
      members = membersData.members || [];
    }
    if (dashboardRes.ok) {
      const dashboardData = (await dashboardRes.json()) as DashboardPublicResponse;
      monthlyGrowth = computeMonthlyGrowth(dashboardData.data?.discordGrowth || []);
    }
  } catch (error) {
    console.error("[Homepage] Erreur chargement données:", error);
  }

  const randomLives = getRandomItems(homeData.lives, 3);
  const vipOfMonth = getRandomItems(homeData.vipMembers, Math.min(6, homeData.vipMembers.length));
  const newCreators = [...members]
    .sort((a, b) => {
      const left = Math.max(toTimestamp(a.integrationDate), toTimestamp(a.createdAt));
      const right = Math.max(toTimestamp(b.integrationDate), toTimestamp(b.createdAt));
      return right - left;
    })
    .slice(0, 6);

  const heroStats = [
    { target: homeData.stats.totalMembers, label: "Membres", prefix: "", suffix: "" },
    { target: homeData.stats.activeMembers, label: "Créateurs actifs", prefix: "", suffix: "" },
    { target: monthlyGrowth, label: "Croissance mensuelle", prefix: "+", suffix: "" },
    { target: homeData.stats.livesInProgress, label: "Lives actifs", prefix: "", suffix: "" },
  ];

  return (
    <main className="min-h-screen py-10 sm:py-12" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 sm:px-6 lg:px-8">
        <section
          className="about-fade-up about-glow relative overflow-hidden rounded-3xl border p-8 sm:p-10 lg:p-14"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 34%, transparent), transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 28%, transparent), transparent 70%)",
            }}
          />
          <div className="relative space-y-7">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Hub communautaire TENF
            </div>
            <h1 className="max-w-5xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Plus qu&apos;un Discord : une communauté qui fait grandir les streamers
            </h1>
            <p className="max-w-4xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--color-text-secondary)" }}>
              TENF est une communauté d&apos;entraide dédiée aux créateurs Twitch. Découverte de chaînes,
              progression collective et événements communautaires permettent aux streamers de grandir ensemble.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="https://discord.gg/WnpazgcZHk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Rejoindre TENF <ArrowRight size={16} />
              </Link>
              <Link
                href="/fonctionnement-tenf"
                className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Découvrir le fonctionnement
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroStats.map((stat, index) => (
                <article
                  key={stat.label}
                  className="about-reveal rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "color-mix(in srgb, var(--color-card) 84%, var(--color-bg) 16%)",
                    animationDelay: `${100 + index * 70}ms`,
                  }}
                >
                  <p className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-primary)" }}>
                    <span
                      className="about-counter"
                      data-counter-target={stat.target}
                      data-counter-prefix={stat.prefix}
                      data-counter-suffix={stat.suffix}
                    >
                      {`${stat.prefix}${formatNumber(stat.target)}${stat.suffix}`}
                    </span>
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {stat.label}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-fade-up space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Live en streaming
              </p>
              <h2 className="text-3xl font-bold sm:text-4xl">Qui est en direct dans la communauté</h2>
            </div>
            <Link href="/lives" className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Voir tous les lives
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {randomLives.length > 0 ? (
              randomLives.map((live) => (
                <article
                  key={live.id}
                  className="about-reveal group overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={live.thumbnail}
                      alt={live.username}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white animate-pulse">
                      EN DIRECT
                    </span>
                  </div>
                  <div className="space-y-3 p-5">
                    <h3 className="text-lg font-semibold">{live.username}</h3>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {live.game || "Just Chatting"}
                    </p>
                    <Link
                      href={live.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      Regarder le live
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article
                className="about-reveal rounded-2xl border p-6 md:col-span-3"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Aucun live détecté pour le moment, reviens dans quelques minutes.
                </p>
              </article>
            )}
          </div>
        </section>

        <section className="about-fade-up space-y-6">
          <div className="max-w-3xl space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Vision TENF
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl">Une communauté pensée pour faire progresser ensemble</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Entraide concrète",
                description:
                  "Chaque streamer reçoit des retours utiles, du soutien et de la visibilité dans un cadre bienveillant.",
                icon: HeartHandshake,
              },
              {
                title: "Progression collective",
                description:
                  "Les objectifs se construisent en groupe : régularité, qualité des lives et évolution durable.",
                icon: Rocket,
              },
              {
                title: "Événements communautaires",
                description:
                  "Challenges, spotlights et rendez-vous réguliers créent un rythme qui maintient l'élan de la communauté.",
                icon: CalendarDays,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="about-reveal rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div
                    className="mb-4 inline-flex rounded-xl p-2.5"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 16%, transparent)" }}
                  >
                    <Icon size={20} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="about-fade-up space-y-6">
          <div className="max-w-3xl space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Comment fonctionne TENF
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl">3 étapes pour intégrer, participer et progresser</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Intégration",
                description:
                  "Tu rejoins la communauté, tu configures ton profil et tu découvres les espaces clés du serveur.",
              },
              {
                title: "Participation",
                description:
                  "Tu prends part aux lives, échanges et événements pour créer du lien avec les autres créateurs.",
              },
              {
                title: "Progression",
                description:
                  "Tu bénéficies des retours, des ressources et de la dynamique collective pour franchir un cap.",
              },
            ].map((step, index) => (
              <article
                key={step.title}
                className="about-reveal rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                  Étape {index + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-fade-up space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Nouveaux créateurs
              </p>
              <h2 className="text-3xl font-bold sm:text-4xl">Les derniers profils intégrés</h2>
            </div>
            <Link href="/membres" className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Explorer l&apos;annuaire
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {newCreators.length > 0 ? (
              newCreators.map((member) => (
                <article
                  key={member.twitchLogin}
                  className="about-reveal rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={member.avatar || `https://unavatar.io/twitch/${member.twitchLogin}`}
                      alt={member.displayName}
                      width={56}
                      height={56}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-base font-semibold">{member.displayName}</h3>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                    >
                      Nouveau
                    </span>
                    <Link
                      href={member.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Voir Twitch
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article
                className="about-reveal rounded-2xl border p-6 sm:col-span-2 lg:col-span-3"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Les nouveaux profils apparaîtront ici automatiquement après intégration.
                </p>
              </article>
            )}
          </div>
        </section>

        <section className="about-fade-up space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                VIP du mois
              </p>
              <h2 className="text-3xl font-bold sm:text-4xl">Les profils mis à l&apos;honneur</h2>
            </div>
            <Link href="/vip" className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Voir la page VIP
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vipOfMonth.length > 0 ? (
              vipOfMonth.map((vip) => (
                <article
                  key={vip.discordId || vip.twitchLogin || vip.displayName}
                  className="about-reveal rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={vip.twitchAvatar || vip.avatar || `https://unavatar.io/twitch/${vip.twitchLogin || "tenf"}`}
                      alt={vip.displayName}
                      width={56}
                      height={56}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-base font-semibold">{vip.displayName}</h3>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        Créateur reconnu ce mois-ci
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span
                      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                    >
                      VIP
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <article
                className="about-reveal rounded-2xl border p-6 sm:col-span-2 lg:col-span-3"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Les VIP du mois seront affichés ici dès la prochaine sélection.
                </p>
              </article>
            )}
          </div>
        </section>

        <section className="about-fade-up space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Témoignages
              </p>
              <h2 className="text-3xl font-bold sm:text-4xl">Ce que la communauté dit de TENF</h2>
            </div>
            <Link href="/avis-tenf" className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Voir tous les avis
            </Link>
          </div>
          <TestimonialsCarousel reviews={reviews} />
        </section>

        <section className="about-fade-up space-y-6">
          <div className="max-w-3xl space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Évolution TENF
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl">Une croissance continue portée par la communauté</h2>
          </div>
          <div className="rounded-2xl border p-6 sm:p-8" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <ol className="space-y-6">
              {timeline.map((event) => (
                <li key={event.date} className="about-reveal grid gap-2 sm:grid-cols-[180px_1fr] sm:gap-6">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                    {event.date}
                  </p>
                  <div className="relative border-l pl-4" style={{ borderColor: "var(--color-border)" }}>
                    <span
                      className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    />
                    <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                      {event.label}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="about-fade-up">
          <div
            className="about-glow rounded-3xl border p-8 text-center sm:p-10"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Rejoindre la communauté
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Prêt à grandir avec TENF ?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--color-text-secondary)" }}>
              Rejoins une communauté active où l&apos;entraide n&apos;est pas un concept, mais une pratique quotidienne.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="https://discord.gg/WnpazgcZHk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Rejoindre TENF <ArrowRight size={16} />
              </Link>
              <Link
                href="/membres"
                className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Découvrir les créateurs
              </Link>
            </div>

            <div
              className="mx-auto mt-8 max-w-3xl rounded-2xl border px-5 py-4 text-left"
              style={{
                borderColor: "color-mix(in srgb, var(--color-primary) 25%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, var(--color-card))",
              }}
            >
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Conseil stratégique
              </p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                La prochaine étape naturelle est de faire évoluer TENF en véritable plateforme de découverte de
                streamers Twitch, en mettant encore plus en avant les profils, les lives et les formats communautaires.
              </p>
            </div>
          </div>
        </section>
      </div>

      <AboutPageEnhancer />
    </main>
  );
}
