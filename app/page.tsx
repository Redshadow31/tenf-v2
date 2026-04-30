import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, GraduationCap, Rocket } from "lucide-react";
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
  title: "TENF — Communauté structurée pour streamers Twitch (mentorat, visibilité, entraide)",
  description:
    "TENF n'est pas un simple Discord : mentorat, suivi, événements et vrais retours sur tes lives. Rejoins un réseau de streamers qui t'aide à progresser.",
  keywords: [
    "communaute entraide streamer",
    "communaute entraide twitch",
    "communaute streamers twitch",
    "entraide createurs twitch",
    "discord entraide twitch",
    "communaute twitch francophone",
  ],
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
    {
      target: homeData.stats.totalMembers,
      label: "Membres dans TENF",
      caption: "personnes qui font partie du projet",
      prefix: "",
      suffix: "",
    },
    {
      target: homeData.stats.activeMembers,
      label: "Streamers actifs",
      caption: "présents et visibles sur la période récente",
      prefix: "",
      suffix: "",
    },
    {
      target: monthlyGrowth,
      label: "Arrivées par mois",
      caption: "nouvelles intégrations en moyenne (Discord)",
      prefix: "+",
      suffix: "",
    },
    {
      target: homeData.stats.livesInProgress,
      label: "En live tout de suite",
      caption: "streams détectés dans la communauté",
      prefix: "",
      suffix: "",
    },
  ];

  return (
    <main className="home-page min-h-screen py-6 sm:py-14">
      <div className="home-page-inner mx-auto flex w-full max-w-7xl flex-col px-3 sm:px-6 lg:px-8">
        <section className="about-fade-up home-hero relative overflow-hidden rounded-2xl border p-5 sm:rounded-3xl sm:p-10 lg:p-14">
          <div className="home-hero-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
          <div className="home-hero-orb home-hero-orb--tr pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full blur-3xl" />
          <div className="home-hero-orb home-hero-orb--bl pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full blur-3xl" />
          <div className="home-hero-shine pointer-events-none absolute -left-1/4 top-0 h-[120%] w-1/2 skew-x-[-18deg] opacity-40" aria-hidden />
          <div className="relative space-y-5 sm:space-y-8">
            <div className="home-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs">
              Structure, mentorat, vrais retours — pas &laquo; un serveur de plus &raquo;
            </div>
            <h1 className="home-hero-title max-w-5xl text-2xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Tu ne veux plus streamer seul face à ton écran ?
            </h1>
            <p className="home-hero-lead max-w-4xl text-base font-semibold leading-relaxed sm:text-xl">
              Rejoins un réseau de streamers avec du suivi, des retours sur tes lives et de la visibilité quand tu lances.
            </p>
            <p className="home-hero-body max-w-3xl text-sm leading-relaxed sm:text-base">
              TENF, c&apos;est du concret : parrains, évaluations, agenda d&apos;événements et des gens qui s&apos;engagent — pas un salon Discord oublié au fond de ta barre d&apos;outils.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="https://discord.gg/WnpazgcZHk"
                target="_blank"
                rel="noopener noreferrer"
                className="home-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
              >
                Rejoindre la communauté — arrêter d&apos;être seul <ArrowRight size={16} className="shrink-0" />
              </Link>
              <Link href="/fonctionnement-tenf/decouvrir" className="home-btn-secondary inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold">
                Voir comment ça marche (2 min)
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {heroStats.map((stat, index) => (
                <article
                  key={stat.label}
                  className="about-reveal home-stat-card rounded-2xl border p-4 sm:p-5"
                  style={{ animationDelay: `${100 + index * 70}ms` }}
                >
                  <p className="home-stat-value text-2xl font-bold tabular-nums sm:text-3xl">
                    <span
                      className="about-counter"
                      data-counter-target={stat.target}
                      data-counter-prefix={stat.prefix}
                      data-counter-suffix={stat.suffix}
                    >
                      {`${stat.prefix}${formatNumber(stat.target)}${stat.suffix}`}
                    </span>
                  </p>
                  <p className="home-stat-label mt-1.5 text-sm font-semibold">{stat.label}</p>
                  {stat.caption ? <p className="home-stat-caption mt-1 text-xs leading-snug">{stat.caption}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-fade-up home-section space-y-5 sm:space-y-7">
          <div className="home-section-head flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">Preuve sociale — en direct</p>
              <h2 className="home-section-title mt-1 text-xl font-extrabold tracking-tight sm:text-4xl">
                Qui est en live dans TENF
              </h2>
            </div>
            <Link href="/lives" className="home-link-muted text-sm font-semibold">
              Tous les lives
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {randomLives.length > 0 ? (
              randomLives.map((live) => (
                <article
                  key={live.id}
                  className="about-reveal home-live-card group overflow-hidden rounded-2xl border"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={live.thumbnail}
                      alt={live.username}
                      fill
                      className="home-live-thumbnail object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <span className="home-live-pill absolute left-3 top-3">EN DIRECT</span>
                  </div>
                  <div className="space-y-2 p-4 sm:space-y-3 sm:p-5">
                    <h3 className="text-lg font-bold">{live.username}</h3>
                    <p className="home-muted text-sm">{live.game || "Just Chatting"}</p>
                    <Link
                      href={live.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="home-btn-primary home-btn-primary--block inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Regarder le live
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article className="about-reveal home-panel-empty col-span-2 rounded-2xl border p-6 md:col-span-3">
                <p className="home-muted">Aucun live détecté pour le moment, reviens dans quelques minutes.</p>
              </article>
            )}
          </div>
        </section>

        <section className="about-fade-up home-section space-y-5 sm:space-y-7">
          <div className="home-section-head flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">Visages du réseau</p>
              <h2 className="home-section-title mt-1 text-xl font-extrabold tracking-tight sm:text-4xl">
                Ils viennent d&apos;intégrer TENF
              </h2>
            </div>
            <Link href="/membres" className="home-link-muted text-sm font-semibold">
              Explorer l&apos;annuaire
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {newCreators.length > 0 ? (
              newCreators.map((member) => (
                <article key={member.twitchLogin} className="about-reveal home-member-card rounded-2xl border p-4 sm:p-5">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="home-avatar-ring relative shrink-0">
                      <Image
                        src={member.avatar || `https://unavatar.io/twitch/${member.twitchLogin}`}
                        alt={member.displayName}
                        width={56}
                        height={56}
                        className="h-11 w-11 rounded-full object-cover sm:h-14 sm:w-14"
                      />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold sm:text-base">{member.displayName}</h3>
                      <p className="home-muted text-xs">{member.role}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="home-badge-soft rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                      Nouveau
                    </span>
                    <Link href={member.twitchUrl} target="_blank" rel="noopener noreferrer" className="home-link-muted text-sm font-semibold">
                      Voir Twitch
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article className="about-reveal home-panel-empty col-span-2 rounded-2xl border p-6 lg:col-span-3">
                <p className="home-muted">Les nouveaux profils apparaîtront ici automatiquement après intégration.</p>
              </article>
            )}
          </div>
        </section>

        <section className="about-fade-up home-section space-y-5 sm:space-y-7">
          <div className="home-section-head flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">Membres VIP</p>
              <h2 className="home-section-title mt-1 text-xl font-extrabold tracking-tight sm:text-4xl">
                Les plus actifs envers les autres ce mois-ci
              </h2>
            </div>
            <Link href="/vip" className="home-link-muted text-sm font-semibold">
              Voir la page VIP
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {vipOfMonth.length > 0 ? (
              vipOfMonth.map((vip) => (
                <article key={vip.discordId || vip.twitchLogin || vip.displayName} className="about-reveal home-vip-card rounded-2xl border p-5">
                  <div className="flex items-center gap-4">
                    <Image
                      src={vip.twitchAvatar || vip.avatar || `https://unavatar.io/twitch/${vip.twitchLogin || "tenf"}`}
                      alt={vip.displayName}
                      width={56}
                      height={56}
                      className="home-vip-avatar h-14 w-14 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-base font-bold">{vip.displayName}</h3>
                      <p className="home-muted text-xs">S&apos;implique pour la communauté</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="home-vip-badge inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                      VIP
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <article className="about-reveal home-panel-empty col-span-2 rounded-2xl border p-6 lg:col-span-3">
                <p className="home-muted">Les VIP du mois seront affichés ici dès la prochaine sélection.</p>
              </article>
            )}
          </div>
        </section>

        <section className="about-fade-up home-section space-y-5 sm:space-y-7">
          <div className="max-w-3xl space-y-3">
            <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">Ce que tu gagnes</p>
            <h2 className="home-section-title text-xl font-extrabold tracking-tight sm:text-4xl">
              Du concret pour ta chaîne — pas des promesses vides
            </h2>
            <p className="home-muted text-sm leading-relaxed sm:text-base">
              Mentorat, présence sur tes lives, événements : TENF est pensé comme un système, pas comme une liste de salons.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {[
              {
                title: "Des formations qui te font grandir",
                description:
                  "Technique, développement de chaîne et développement personnel : des contenus pour monter en compétences, pas seulement en statistiques.",
                icon: GraduationCap,
              },
              {
                title: "Du monde qui arrive sur tes directs",
                description:
                  "Visibilité au sein du réseau : des gens qui ouvrent ton live parce qu'ils font partie du même projet.",
                icon: Rocket,
              },
              {
                title: "Une communauté qui répond présent",
                description:
                  "Événements, raids, rendez-vous réguliers : tu n'es pas un pseudo parmi d'autres dans un serveur muet.",
                icon: CalendarDays,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="about-reveal home-feature-card rounded-2xl border p-4 sm:p-6">
                  <div className="home-icon-bubble mb-3 inline-flex rounded-xl p-2.5 sm:mb-4 sm:p-3">
                    <Icon size={22} style={{ color: "var(--color-primary)" }} aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold sm:text-xl">{item.title}</h3>
                  <p className="home-muted mt-2 text-sm leading-relaxed">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="about-fade-up home-section space-y-5 sm:space-y-7">
          <div className="max-w-3xl space-y-3">
            <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">
              Comment tu rentres dans le mouvement
            </p>
            <h2 className="home-section-title text-xl font-extrabold tracking-tight sm:text-4xl">
              3 étapes — simples, sans blabla
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {[
              {
                title: "Tu poses tes bases",
                description:
                  "Tu rejoins Discord, tu relies Twitch, tu complètes ton profil. On t'indique où lire les règles et où demander de l'aide.",
              },
              {
                title: "Tu participes à la réunion d'intégration",
                description:
                  "Tu rencontres l'équipe, tu poses tes questions et tu valides ton entrée dans le cadre TENF avant de te lancer pleinement.",
              },
              {
                title: "Tu participes pour de vrai",
                description:
                  "Tu passes sur les lives des autres, tu discutes, tu testes les formats — la visibilité se construit en étant là.",
              },
            ].map((step, index) => (
              <article key={step.title} className="about-reveal home-step-card rounded-2xl border p-4 sm:p-6">
                <p className="home-step-label text-[11px] font-bold uppercase tracking-[0.14em]">Étape {index + 1}</p>
                <h3 className="mt-2 text-lg font-bold sm:text-xl">{step.title}</h3>
                <p className="home-muted mt-2 text-sm leading-relaxed">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-fade-up home-testimonials-shell relative overflow-hidden rounded-2xl border p-5 sm:rounded-3xl sm:p-8">
          <div className="home-testimonials-glow pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl" aria-hidden />
          <div className="relative space-y-5 sm:space-y-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">Ils en parlent mieux que nous</p>
                <h2 className="home-section-title mt-1 text-xl font-extrabold tracking-tight sm:text-4xl">
                  Témoignages — des streamers comme toi
                </h2>
                <p className="home-muted mt-2 max-w-2xl text-sm sm:text-base">
                  Pas de slogans : des retours d&apos;expérience réels sur ce que TENF change au quotidien.
                </p>
              </div>
              <Link href="/avis-tenf" className="home-link-accent shrink-0 text-sm font-bold">
                Tous les avis →
              </Link>
            </div>
            <TestimonialsCarousel reviews={reviews} emphasis />
          </div>
        </section>

        <section className="about-fade-up home-section space-y-5 sm:space-y-7">
          <div className="max-w-3xl space-y-2">
            <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">Depuis le début</p>
            <h2 className="home-section-title text-xl font-extrabold tracking-tight sm:text-4xl">
              Le projet TENF en quelques dates
            </h2>
          </div>
          <div className="home-timeline-card rounded-2xl border p-5 sm:p-8">
            <ol className="space-y-4 sm:space-y-6">
              {timeline.map((event) => (
                <li key={event.date} className="about-reveal grid gap-2 sm:grid-cols-[180px_1fr] sm:gap-6">
                  <p className="home-timeline-date text-sm font-bold">{event.date}</p>
                  <div className="home-timeline-line relative border-l pl-4">
                    <span className="home-timeline-dot absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full" />
                    <p className="home-muted text-sm leading-relaxed sm:text-base">{event.label}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="about-fade-up">
          <div className="home-cta-panel relative overflow-hidden rounded-2xl border p-6 text-center sm:rounded-3xl sm:p-12">
            <div className="home-cta-panel-glow pointer-events-none absolute inset-0 opacity-90" aria-hidden />
            <div className="relative">
              <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">Dernière ligne droite</p>
              <h2 className="home-cta-title mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Arrête de streamer dans le vide
              </h2>
              <p className="home-muted mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
                Rejoins une communauté qui t&apos;aide à monter : retours, présence sur tes lives, et des gens qui assument d&apos;être là.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="https://discord.gg/WnpazgcZHk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="home-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
                >
                  Entrer dans TENF maintenant <ArrowRight size={16} className="shrink-0" />
                </Link>
                <Link href="/membres" className="home-btn-secondary inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold">
                  Voir des chaînes du réseau
                </Link>
              </div>

              <p className="home-muted mx-auto mt-8 max-w-xl text-sm leading-relaxed">
                Tu veux comprendre les règles avant de cliquer ? Lis{" "}
                <Link href="/fonctionnement-tenf/decouvrir" className="home-link-accent font-semibold underline-offset-2 hover:underline">
                  le fonctionnement TENF
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>

      <AboutPageEnhancer />
    </main>
  );
}
