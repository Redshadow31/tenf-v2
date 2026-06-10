import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import AboutPageEnhancer from "@/components/about/AboutPageEnhancer";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import HomeAudiencePaths from "@/components/home/HomeAudiencePaths";
import type { HomePillarItem } from "@/components/home/HomeExpandablePillars";
import HomeExpandablePillars from "@/components/home/HomeExpandablePillars";
import HomeLivesScroller from "@/components/home/HomeLivesScroller";
import HomeStickyNav from "@/components/home/HomeStickyNav";
import HomeTimelineInteractive from "@/components/home/HomeTimelineInteractive";
import { getRandomItems } from "@/lib/utils";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

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

const pillarItems: HomePillarItem[] = [
  {
    title: "Des formations qui te font grandir",
    description:
      "Technique, chaîne et développement personnel : des contenus pour monter en compétences, pas seulement en statistiques.",
    iconKey: "graduation",
    detail:
      "Ateliers, replays et parcours pensés pour les créateurs francophones : tu progresses à ton rythme, avec des repères concrets à réutiliser sur tes prochains lives.",
  },
  {
    title: "Du monde qui arrive sur tes directs",
    description: "Visibilité au sein du réseau : des gens qui ouvrent ton live parce qu’ils font partie du même projet.",
    iconKey: "rocket",
    detail:
      "Raids, shoutouts, événements communautaires : la visibilité naît de la régularité et des échanges entre pairs — TENF structure ces moments pour qu’ils soient durables.",
  },
  {
    title: "Une communauté qui répond présent",
    description: "Événements, raids, rendez-vous : tu n’es pas un pseudo parmi d’autres dans un serveur muet.",
    iconKey: "calendar",
    detail:
      "Agenda partagé, présences suivies côté espace membre, formats collectifs : tout est pensé pour que tu saches où donner de la voix et où trouver de l’aide.",
  },
];

const compareItems: {
  axis: string;
  elsewhere: string;
  tenf: string;
}[] = [
  {
    axis: "Visibilité",
    elsewhere: "Tu lances ton live et personne ne le sait — tu cries dans un Discord muet.",
    tenf: "Raids, shoutouts et présences sur tes lives : les autres membres ouvrent ton stream parce qu'ils font partie du même projet.",
  },
  {
    axis: "Retours",
    elsewhere: "Personne ne te dit ce qui cloche. Tu progresses au pifomètre.",
    tenf: "Retours structurés, parrains identifiés, évaluations bienveillantes : tu sais ce qui fonctionne sur ta chaîne.",
  },
  {
    axis: "Engagement",
    elsewhere: "Un salon « présentations » oublié, des bots qui répondent à ta place.",
    tenf: "Agenda partagé, événements communautaires, présences suivies — tu sais où être pour exister.",
  },
  {
    axis: "Cadre",
    elsewhere: "Règles floues, gros décalages entre membres, modération aléatoire.",
    tenf: "Charte claire, rôles définis, intégration encadrée — tout le monde joue avec les mêmes repères.",
  },
];

const faqItems: { question: string; answer: string }[] = [
  {
    question: "Faut-il un nombre minimum de viewers pour rejoindre TENF ?",
    answer:
      "Non. TENF n'est pas réservé à une taille de chaîne : on accueille des streamers débutants, intermédiaires et confirmés. Ce qui compte, c'est ton implication réelle dans la communauté, pas ton compteur Twitch.",
  },
  {
    question: "Combien de temps prend l'intégration ?",
    answer:
      "Tu rejoins Discord en quelques minutes. La réunion d'intégration officielle dure environ 30 minutes et se planifie sur un créneau qui te convient — c'est elle qui valide ton entrée dans le cadre TENF.",
  },
  {
    question: "Est-ce que TENF coûte quelque chose ?",
    answer:
      "Non. L'accès à la communauté est gratuit. Les seules contributions sont du temps et de la présence : participer aux events, raider les autres, donner ton avis quand tu peux.",
  },
  {
    question: "Je n'ai pas envie d'être suivi de près. Est-ce que TENF est trop intrusif ?",
    answer:
      "Tu choisis ton niveau d'implication. Certains membres viennent juste profiter des raids et des events, d'autres s'engagent dans le suivi, le mentorat, l'organisation. Tu peux ajuster ton rythme.",
  },
  {
    question: "Qu'est-ce que TENF attend concrètement de moi ?",
    answer:
      "Du respect, de la présence quand tu peux, et l'envie de faire avancer le projet. Pas de quotas d'heures Twitch, pas de raids forcés — juste un cadre clair posé dans la charte communautaire.",
  },
  {
    question: "Et si TENF ne me correspond pas ?",
    answer:
      "Tu peux partir quand tu veux, sans drame. Aucune obligation de rester si l'ambiance ou le format ne te conviennent pas — on préfère des membres impliqués que des membres forcés.",
  },
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
      label: "Actifs de l'entraide",
      caption: "présents dans l'entraide sur la période récente",
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

  const homePxStyle: CSSProperties = {
    // Variable consommée par HomeStickyNav pour aligner ses marges
    // négatives sur le padding fluide du wrapper.
    ["--home-px" as string]: "clamp(0.75rem, 0.5rem + 1.6vw, 3rem)",
    maxWidth: "min(110rem, 100%)",
    paddingLeft: "var(--home-px)",
    paddingRight: "var(--home-px)",
    rowGap: "clamp(1.75rem, 1rem + 1.8vw, 3.75rem)",
  };

  return (
    <main
      className="home-page min-h-screen w-full"
      style={{
        paddingTop: "clamp(1rem, 0.6rem + 1.4vw, 3rem)",
        paddingBottom: "clamp(2rem, 1rem + 2.4vw, 5rem)",
        fontSize: "clamp(0.9375rem, 0.82rem + 0.4vw, 1.125rem)",
      }}
    >
      <div className="home-page-inner mx-auto flex w-full flex-col" style={homePxStyle}>
        <section
          id="accueil-hero"
          className="about-fade-up home-hero relative overflow-hidden rounded-2xl border scroll-mt-28 sm:rounded-3xl"
          style={{ padding: "clamp(1.25rem, 0.8rem + 2.2vw, 3.75rem)" }}
        >
          <div className="home-hero-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
          <div className="home-hero-orb home-hero-orb--tr pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full blur-3xl" aria-hidden />
          <div className="home-hero-orb home-hero-orb--bl pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full blur-3xl" aria-hidden />
          <div className="home-hero-shine pointer-events-none absolute -left-1/4 top-0 h-[120%] w-1/2 skew-x-[-18deg] opacity-40" aria-hidden />
          <div className="relative flex flex-col" style={{ rowGap: "clamp(1rem, 0.6rem + 1.2vw, 2.25rem)" }}>
            <div
              className="home-chip inline-flex w-fit items-center gap-2 rounded-full font-bold uppercase tracking-[0.14em]"
              style={{
                padding: "clamp(0.35rem, 0.2rem + 0.3vw, 0.6rem) clamp(0.75rem, 0.5rem + 0.4vw, 1.1rem)",
                fontSize: "clamp(0.625rem, 0.55rem + 0.2vw, 0.8rem)",
              }}
            >
              <Sparkles size={14} className="opacity-90" aria-hidden />
              Structure, mentorat, vrais retours — pas &laquo; un serveur de plus &raquo;
            </div>
            <h1
              className="home-hero-title font-extrabold leading-[1.05] tracking-tight"
              style={{
                fontSize: "clamp(1.85rem, 1.25rem + 3.6vw, 4.5rem)",
                maxWidth: "min(72rem, 100%)",
              }}
            >
              Tu ne veux plus streamer seul face à ton écran ?
            </h1>
            <p
              className="home-hero-lead font-semibold leading-relaxed"
              style={{
                fontSize: "clamp(1rem, 0.8rem + 0.9vw, 1.5rem)",
                maxWidth: "min(58rem, 100%)",
              }}
            >
              Rejoins un réseau de streamers avec du suivi, des retours sur tes lives et de la visibilité quand tu lances.
            </p>
            <p
              className="home-hero-body leading-relaxed"
              style={{
                fontSize: "clamp(0.875rem, 0.78rem + 0.4vw, 1.125rem)",
                maxWidth: "min(48rem, 100%)",
              }}
            >
              TENF, c&apos;est du concret : parrains, évaluations, agenda d&apos;événements et des gens qui s&apos;engagent — pas un salon Discord oublié au fond de ta barre d&apos;outils.
            </p>

            <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="home-btn-primary inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white"
                style={{
                  padding: "clamp(0.7rem, 0.5rem + 0.4vw, 1.1rem) clamp(1.25rem, 0.9rem + 1.1vw, 2rem)",
                  fontSize: "clamp(0.85rem, 0.78rem + 0.2vw, 1rem)",
                }}
              >
                Rejoindre la communauté — arrêter d&apos;être seul <ArrowRight size={16} className="shrink-0" />
              </Link>
              <Link
                href="/fonctionnement-tenf/decouvrir"
                className="home-btn-secondary inline-flex items-center justify-center rounded-xl font-semibold"
                style={{
                  padding: "clamp(0.7rem, 0.5rem + 0.4vw, 1.1rem) clamp(1.25rem, 0.9rem + 1.1vw, 2rem)",
                  fontSize: "clamp(0.85rem, 0.78rem + 0.2vw, 1rem)",
                }}
              >
                Voir comment ça marche (2 min)
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border font-semibold transition hover:border-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-border))]"
                style={{
                  padding: "clamp(0.7rem, 0.5rem + 0.4vw, 1.1rem) clamp(1.25rem, 0.9rem + 1.1vw, 2rem)",
                  fontSize: "clamp(0.85rem, 0.78rem + 0.2vw, 1rem)",
                  borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--color-border))",
                  backgroundColor: "color-mix(in srgb, var(--color-card) 55%, transparent)",
                  color: "var(--color-text)",
                }}
              >
                Déjà membre ? Connexion Discord
              </Link>
            </div>

            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{
                gap: "clamp(0.6rem, 0.4rem + 0.6vw, 1.25rem)",
                marginTop: "clamp(0.5rem, 0.3rem + 0.4vw, 1rem)",
              }}
            >
              {heroStats.map((stat, index) => (
                <article
                  key={stat.label}
                  className="about-reveal home-stat-card rounded-2xl border"
                  style={{
                    animationDelay: `${100 + index * 70}ms`,
                    padding: "clamp(0.85rem, 0.6rem + 0.6vw, 1.4rem)",
                  }}
                >
                  <p
                    className="home-stat-value font-bold tabular-nums"
                    style={{ fontSize: "clamp(1.45rem, 1.1rem + 1vw, 2.25rem)" }}
                  >
                    <span
                      className="about-counter"
                      data-counter-target={stat.target}
                      data-counter-prefix={stat.prefix}
                      data-counter-suffix={stat.suffix}
                    >
                      {`${stat.prefix}${formatNumber(stat.target)}${stat.suffix}`}
                    </span>
                  </p>
                  <p
                    className="home-stat-label font-semibold"
                    style={{
                      marginTop: "clamp(0.25rem, 0.15rem + 0.15vw, 0.5rem)",
                      fontSize: "clamp(0.8rem, 0.74rem + 0.15vw, 0.95rem)",
                    }}
                  >
                    {stat.label}
                  </p>
                  {stat.caption ? (
                    <p
                      className="home-stat-caption leading-snug"
                      style={{
                        marginTop: "clamp(0.15rem, 0.1rem + 0.1vw, 0.35rem)",
                        fontSize: "clamp(0.7rem, 0.66rem + 0.1vw, 0.8rem)",
                      }}
                    >
                      {stat.caption}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <HomeStickyNav />

        <HomeAudiencePaths />

        <section id="accueil-lives" className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7">
          <div className="home-section-head flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="home-kicker font-bold uppercase tracking-[0.16em]"
                style={{ fontSize: "clamp(0.7rem, 0.65rem + 0.15vw, 0.875rem)" }}
              >
                Preuve sociale — en direct
              </p>
              <h2
                className="home-section-title mt-1 font-extrabold tracking-tight"
                style={{ fontSize: "clamp(1.25rem, 0.95rem + 1.4vw, 2.5rem)" }}
              >
                Qui est en live dans TENF
              </h2>
            </div>
            <Link href="/lives" className="home-link-muted text-sm font-semibold">
              Tous les lives
            </Link>
          </div>
          <HomeLivesScroller lives={randomLives} />
        </section>

        <section id="accueil-nouveaux" className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7">
          <div className="home-section-head flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="home-kicker font-bold uppercase tracking-[0.16em]"
                style={{ fontSize: "clamp(0.7rem, 0.65rem + 0.15vw, 0.875rem)" }}
              >
                Visages du réseau
              </p>
              <h2
                className="home-section-title mt-1 font-extrabold tracking-tight"
                style={{ fontSize: "clamp(1.25rem, 0.95rem + 1.4vw, 2.5rem)" }}
              >
                Ils viennent d&apos;intégrer TENF
              </h2>
            </div>
            <Link href="/membres" className="home-link-muted text-sm font-semibold">
              Explorer l&apos;annuaire
            </Link>
          </div>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6"
            style={{ gap: "clamp(0.75rem, 0.5rem + 0.7vw, 1.5rem)" }}
          >
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
              <article className="about-reveal home-panel-empty col-span-2 rounded-2xl border p-6 sm:col-span-3 xl:col-span-6">
                <p className="home-muted">Les nouveaux profils apparaîtront ici automatiquement après intégration.</p>
              </article>
            )}
          </div>
        </section>

        <section id="accueil-vip" className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7">
          <div className="home-section-head flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="home-kicker font-bold uppercase tracking-[0.16em]"
                style={{ fontSize: "clamp(0.7rem, 0.65rem + 0.15vw, 0.875rem)" }}
              >
                Membres VIP
              </p>
              <h2
                className="home-section-title mt-1 font-extrabold tracking-tight"
                style={{ fontSize: "clamp(1.25rem, 0.95rem + 1.4vw, 2.5rem)" }}
              >
                Les plus actifs envers les autres ce mois-ci
              </h2>
            </div>
            <Link href="/vip" className="home-link-muted text-sm font-semibold">
              Voir la page VIP
            </Link>
          </div>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6"
            style={{ gap: "clamp(0.75rem, 0.5rem + 0.7vw, 1.5rem)" }}
          >
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
              <article className="about-reveal home-panel-empty col-span-2 rounded-2xl border p-6 sm:col-span-3 xl:col-span-6">
                <p className="home-muted">Les VIP du mois seront affichés ici dès la prochaine sélection.</p>
              </article>
            )}
          </div>
        </section>

        <section id="accueil-valeur" className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7">
          <div className="max-w-3xl space-y-3">
            <p
              className="home-kicker font-bold uppercase tracking-[0.16em]"
              style={{ fontSize: "clamp(0.7rem, 0.65rem + 0.15vw, 0.875rem)" }}
            >
              Ce que tu gagnes
            </p>
            <h2
              className="home-section-title font-extrabold tracking-tight"
              style={{ fontSize: "clamp(1.25rem, 0.95rem + 1.4vw, 2.5rem)" }}
            >
              Du concret pour ta chaîne — pas des promesses vides
            </h2>
            <p
              className="home-muted leading-relaxed"
              style={{ fontSize: "clamp(0.875rem, 0.78rem + 0.25vw, 1.0625rem)" }}
            >
              Mentorat, présence sur tes lives, événements : TENF est pensé comme un système, pas comme une liste de salons. Touche une carte pour approfondir.
            </p>
          </div>
          <HomeExpandablePillars items={pillarItems} />
        </section>

        <section id="accueil-etapes" className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7">
          <div className="max-w-3xl space-y-3">
            <p
              className="home-kicker font-bold uppercase tracking-[0.16em]"
              style={{ fontSize: "clamp(0.7rem, 0.65rem + 0.15vw, 0.875rem)" }}
            >
              Comment tu rentres dans le mouvement
            </p>
            <h2
              className="home-section-title font-extrabold tracking-tight"
              style={{ fontSize: "clamp(1.25rem, 0.95rem + 1.4vw, 2.5rem)" }}
            >
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

        <section
          id="accueil-avis"
          className="about-fade-up home-testimonials-shell scroll-mt-28 relative overflow-hidden rounded-2xl border sm:rounded-3xl"
          style={{ padding: "clamp(1rem, 0.7rem + 1.2vw, 2.25rem)" }}
        >
          <div className="home-testimonials-glow pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl" aria-hidden />
          <div className="relative space-y-5 sm:space-y-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className="home-kicker font-bold uppercase tracking-[0.16em]"
                  style={{ fontSize: "clamp(0.7rem, 0.65rem + 0.15vw, 0.875rem)" }}
                >
                  Ils en parlent mieux que nous
                </p>
                <h2
                  className="home-section-title mt-1 font-extrabold tracking-tight"
                  style={{ fontSize: "clamp(1.25rem, 0.95rem + 1.4vw, 2.5rem)" }}
                >
                  Témoignages — des streamers comme toi
                </h2>
                <p
                  className="home-muted mt-2 max-w-2xl"
                  style={{ fontSize: "clamp(0.85rem, 0.78rem + 0.2vw, 1rem)" }}
                >
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

        <section id="accueil-histoire" className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7">
          <div className="max-w-3xl space-y-2">
            <p
              className="home-kicker font-bold uppercase tracking-[0.16em]"
              style={{ fontSize: "clamp(0.7rem, 0.65rem + 0.15vw, 0.875rem)" }}
            >
              Depuis le début
            </p>
            <h2
              className="home-section-title font-extrabold tracking-tight"
              style={{ fontSize: "clamp(1.25rem, 0.95rem + 1.4vw, 2.5rem)" }}
            >
              Le projet TENF en quelques dates
            </h2>
            <p
              className="home-muted"
              style={{ fontSize: "clamp(0.85rem, 0.78rem + 0.2vw, 1rem)" }}
            >
              Explore la frise : sélectionne une étape ou utilise les boutons pour naviguer dans le temps.
            </p>
          </div>
          <HomeTimelineInteractive events={timeline} />
        </section>

        <section id="accueil-compare" className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7">
          <div className="max-w-3xl space-y-3">
            <p
              className="home-kicker font-bold uppercase tracking-[0.16em]"
              style={{ fontSize: "clamp(0.7rem, 0.65rem + 0.15vw, 0.875rem)" }}
            >
              Pourquoi TENF, plutôt qu&apos;un Discord de plus
            </p>
            <h2
              className="home-section-title font-extrabold tracking-tight"
              style={{ fontSize: "clamp(1.25rem, 0.95rem + 1.4vw, 2.5rem)" }}
            >
              Ce que tu vis ailleurs <span className="opacity-60">vs.</span> ce que tu trouves ici
            </h2>
            <p
              className="home-muted leading-relaxed"
              style={{ fontSize: "clamp(0.875rem, 0.78rem + 0.25vw, 1.0625rem)" }}
            >
              Quatre axes concrets : visibilité, retours, engagement, cadre. Pas du marketing — la différence qu&apos;on entend revenir en bouche dans les avis.
            </p>
          </div>

          <ul
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: "clamp(0.75rem, 0.5rem + 0.6vw, 1.25rem)" }}
          >
            {compareItems.map((item) => (
              <li
                key={item.axis}
                className="about-reveal home-step-card rounded-2xl border"
                style={{ padding: "clamp(1rem, 0.7rem + 0.8vw, 1.75rem)" }}
              >
                <p
                  className="home-step-label font-bold uppercase tracking-[0.14em]"
                  style={{ fontSize: "clamp(0.65rem, 0.6rem + 0.1vw, 0.78rem)" }}
                >
                  {item.axis}
                </p>
                <div
                  className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2"
                  style={{ gap: "clamp(0.6rem, 0.45rem + 0.4vw, 1rem)" }}
                >
                  <div
                    className="flex items-start gap-2 rounded-xl border p-3"
                    style={{
                      borderColor: "color-mix(in srgb, #f43f5e 22%, var(--color-border))",
                      backgroundColor: "color-mix(in srgb, #f43f5e 6%, var(--color-card))",
                    }}
                  >
                    <XCircle size={16} className="mt-0.5 shrink-0 text-rose-400" aria-hidden />
                    <p
                      className="leading-relaxed"
                      style={{ fontSize: "clamp(0.8rem, 0.75rem + 0.2vw, 0.95rem)" }}
                    >
                      {item.elsewhere}
                    </p>
                  </div>
                  <div
                    className="flex items-start gap-2 rounded-xl border p-3"
                    style={{
                      borderColor: "color-mix(in srgb, var(--color-primary) 28%, var(--color-border))",
                      backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, var(--color-card))",
                    }}
                  >
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
                    <p
                      className="leading-relaxed"
                      style={{ fontSize: "clamp(0.8rem, 0.75rem + 0.2vw, 0.95rem)" }}
                    >
                      {item.tenf}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="accueil-faq" className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7">
          <div className="max-w-3xl space-y-3">
            <p
              className="home-kicker font-bold uppercase tracking-[0.16em]"
              style={{ fontSize: "clamp(0.7rem, 0.65rem + 0.15vw, 0.875rem)" }}
            >
              Les questions qu&apos;on entend tout le temps
            </p>
            <h2
              className="home-section-title font-extrabold tracking-tight"
              style={{ fontSize: "clamp(1.25rem, 0.95rem + 1.4vw, 2.5rem)" }}
            >
              FAQ — avant de te jeter dans Discord
            </h2>
            <p
              className="home-muted leading-relaxed"
              style={{ fontSize: "clamp(0.875rem, 0.78rem + 0.25vw, 1.0625rem)" }}
            >
              Tout ce qu&apos;on aimerait avoir lu avant de cliquer. Si une question manque, écris-nous via la page{" "}
              <Link href="/contact" className="home-link-accent font-semibold underline-offset-2 hover:underline">
                Contact
              </Link>
              .
            </p>
          </div>
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: "clamp(0.6rem, 0.4rem + 0.5vw, 1rem)" }}
          >
            {faqItems.map((item, idx) => (
              <details
                key={item.question}
                className="about-reveal home-step-card group rounded-2xl border"
                style={{ padding: "clamp(0.85rem, 0.65rem + 0.5vw, 1.25rem)" }}
                {...(idx === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <span
                    className="font-bold leading-snug"
                    style={{ fontSize: "clamp(0.9rem, 0.82rem + 0.25vw, 1.05rem)" }}
                  >
                    {item.question}
                  </span>
                  <ArrowRight
                    size={16}
                    className="mt-0.5 shrink-0 transition-transform group-open:rotate-90"
                    aria-hidden
                  />
                </summary>
                <p
                  className="home-muted mt-3 leading-relaxed"
                  style={{ fontSize: "clamp(0.85rem, 0.78rem + 0.2vw, 1rem)" }}
                >
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section id="accueil-cta" className="about-fade-up scroll-mt-28">
          <div
            className="home-cta-panel relative overflow-hidden rounded-2xl border text-center sm:rounded-3xl"
            style={{ padding: "clamp(1.5rem, 1rem + 2vw, 3.5rem)" }}
          >
            <div className="home-cta-panel-glow pointer-events-none absolute inset-0 opacity-90" aria-hidden />
            <div className="relative">
              <p
                className="home-kicker font-bold uppercase tracking-[0.16em]"
                style={{ fontSize: "clamp(0.7rem, 0.65rem + 0.15vw, 0.875rem)" }}
              >
                Dernière ligne droite
              </p>
              <h2
                className="home-cta-title mt-3 font-extrabold tracking-tight"
                style={{ fontSize: "clamp(1.6rem, 1.1rem + 2.2vw, 3rem)" }}
              >
                Arrête de streamer dans le vide
              </h2>
              <p
                className="home-muted mx-auto mt-4 leading-relaxed"
                style={{
                  maxWidth: "min(42rem, 100%)",
                  fontSize: "clamp(0.95rem, 0.85rem + 0.4vw, 1.2rem)",
                }}
              >
                Rejoins une communauté qui t&apos;aide à monter : retours, présence sur tes lives, et des gens qui assument d&apos;être là.
              </p>
              <div
                className="mt-8 flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row sm:gap-4"
                style={{ marginTop: "clamp(1.5rem, 1rem + 1.2vw, 2.5rem)" }}
              >
                <Link
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="home-btn-primary inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white"
                  style={{
                    padding: "clamp(0.7rem, 0.5rem + 0.4vw, 1.1rem) clamp(1.5rem, 1rem + 1.4vw, 2.5rem)",
                    fontSize: "clamp(0.85rem, 0.78rem + 0.2vw, 1rem)",
                  }}
                >
                  Entrer dans TENF maintenant <ArrowRight size={16} className="shrink-0" />
                </Link>
                <Link
                  href="/rejoindre"
                  className="home-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl font-semibold"
                  style={{
                    padding: "clamp(0.7rem, 0.5rem + 0.4vw, 1.1rem) clamp(1.5rem, 1rem + 1.4vw, 2.5rem)",
                    fontSize: "clamp(0.85rem, 0.78rem + 0.2vw, 1rem)",
                  }}
                >
                  Comprendre comment rejoindre TENF <ArrowRight size={16} className="shrink-0" aria-hidden />
                </Link>
                <Link
                  href="/membres"
                  className="home-btn-secondary inline-flex items-center justify-center rounded-xl font-semibold"
                  style={{
                    padding: "clamp(0.7rem, 0.5rem + 0.4vw, 1.1rem) clamp(1.5rem, 1rem + 1.4vw, 2.5rem)",
                    fontSize: "clamp(0.85rem, 0.78rem + 0.2vw, 1rem)",
                  }}
                >
                  Voir des chaînes du réseau
                </Link>
              </div>

              <p
                className="home-muted mx-auto mt-8 leading-relaxed"
                style={{
                  maxWidth: "min(36rem, 100%)",
                  fontSize: "clamp(0.8rem, 0.74rem + 0.2vw, 0.95rem)",
                }}
              >
                Tu veux comprendre le parcours d&apos;entrée avant de cliquer ? Lis{" "}
                <Link href="/rejoindre" className="home-link-accent font-semibold underline-offset-2 hover:underline">
                  le hub &laquo; Rejoindre TENF &raquo;
                </Link>
                ,{" "}
                <Link href="/fonctionnement-tenf/decouvrir" className="home-link-accent font-semibold underline-offset-2 hover:underline">
                  le fonctionnement TENF
                </Link>{" "}
                ou{" "}
                <Link href="/charte" className="home-link-accent font-semibold underline-offset-2 hover:underline">
                  la charte communautaire
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
