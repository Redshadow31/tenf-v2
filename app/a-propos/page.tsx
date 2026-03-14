import type { Metadata } from "next";
import Link from "next/link";
import AboutPageEnhancer from "@/components/about/AboutPageEnhancer";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleDot,
  Compass,
  Gift,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Rocket,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

type Step = {
  title: string;
  description: string;
};

type EcosystemItem = {
  title: string;
  description: string;
  icon: typeof Compass;
};

type Differentiator = {
  title: string;
  description: string;
  icon: typeof Sparkles;
};

type TimelineEvent = {
  date: string;
  label: string;
};

type HomeApiResponse = {
  stats?: {
    totalMembers?: number;
    activeMembers?: number;
  };
};

type DashboardGrowthPoint = {
  month: string;
  value: number;
};

type DashboardPublicResponse = {
  success?: boolean;
  data?: {
    discordGrowth?: DashboardGrowthPoint[];
  };
};

type PublicEvent = {
  id: string;
  title: string;
  date: string;
  category?: string;
  location?: string;
};

type EventsApiResponse = {
  events?: PublicEvent[];
};

const differentiators: Differentiator[] = [
  {
    title: "Entraide concrète",
    description:
      "Ici, on se répond, on se suit, on se conseille. L'entraide est une pratique quotidienne, pas un slogan.",
    icon: HeartHandshake,
  },
  {
    title: "Progression collective",
    description:
      "Chaque streamer avance avec les autres: retours, partage d'experience, motivation et objectifs communs.",
    icon: Rocket,
  },
  {
    title: "Cadre bienveillant",
    description:
      "Participation, respect et ecoute structurent les echanges. L'ambiance reste humaine, accessible et saine.",
    icon: Users,
  },
  {
    title: "Apprentissage continu",
    description:
      "Formations, outils et pratiques de terrain permettent de monter en competence sans pression inutile.",
    icon: GraduationCap,
  },
];

const steps: Step[] = [
  {
    title: "1. Integration",
    description:
      "Tu arrives, tu decouvres les espaces, les roles et les personnes qui font vivre TENF.",
  },
  {
    title: "2. Participation",
    description:
      "Tu prends part aux echanges, aux evenements et aux actions d'entraide entre streamers.",
  },
  {
    title: "3. Progression",
    description:
      "Tu evolues avec la communaute grace aux formations, aux retours et a une dynamique collective.",
  },
];

const ecosystemItems: EcosystemItem[] = [
  {
    title: "Serveur Discord structure",
    description: "Des espaces clairs, des roles definis et une organisation qui facilite l'entraide.",
    icon: LayoutDashboard,
  },
  {
    title: "Site web TENF",
    description: "Un hub communautaire pour centraliser infos, parcours et ressources utiles.",
    icon: Compass,
  },
  {
    title: "Annuaire des membres",
    description: "Une meilleure visibilite des createurs pour favoriser les rencontres et collaborations.",
    icon: Users,
  },
  {
    title: "Evenements communautaires",
    description: "Des rendez-vous reguliers pour creer du lien, partager et dynamiser la communaute.",
    icon: CalendarDays,
  },
  {
    title: "Formations",
    description: "Des contenus et moments d'apprentissage pour aider chaque streamer a progresser.",
    icon: BookOpen,
  },
  {
    title: "Points et recompenses",
    description: "L'implication est reconnue avec un systeme qui valorise la participation utile.",
    icon: Gift,
  },
  {
    title: "Partenariats",
    description: "Des connexions qui soutiennent l'ecosysteme et ouvrent de nouvelles opportunites.",
    icon: Trophy,
  },
];

const roles = [
  "Fondateur",
  "Admin coordinateur",
  "Moderateur",
  "Moderateur en formation",
  "Soutien TENF",
  "Createur affilie",
  "Createur en developpement",
  "Createur junior",
  "Createur en pause",
  "Communaute",
];

const timeline: TimelineEvent[] = [
  { date: "17 avril 2024", label: "Creation de Twitch Entraide Family" },
  { date: "2 septembre 2024", label: "Creation de Twitch Entraide New Family" },
  { date: "Septembre 2025", label: "Lancement du site TENF" },
  { date: "Janvier 2026", label: "Arrivee de la version 2 du site" },
  { date: "Mars 2026", label: "Mise a jour majeure de la plateforme" },
];

const founders = ["Red", "Nexou", "Clara"];

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, cur) => acc + cur, 0) / values.length;
}

function computeGrowthFromHistory(points: DashboardGrowthPoint[]): {
  monthlyGrowth: number;
  dailyGrowth: number;
} {
  if (points.length < 2) {
    return { monthlyGrowth: 89, dailyGrowth: 1 };
  }

  const deltas: number[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const delta = points[i].value - points[i - 1].value;
    if (Number.isFinite(delta) && delta > 0) {
      deltas.push(delta);
    }
  }

  const recentDeltas = deltas.slice(-3);
  const rawMonthlyGrowth = Math.round(average(recentDeltas));
  const monthlyGrowth = rawMonthlyGrowth > 0 ? rawMonthlyGrowth : 89;
  const dailyGrowth = Math.max(1, Math.round(monthlyGrowth / 30));

  return { monthlyGrowth, dailyGrowth };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date a confirmer";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export const metadata: Metadata = {
  title: "A propos | TENF",
  description:
    "Decouvrez TENF, communaute d'entraide entre streamers Twitch: progression collective, formations, evenements et ecosysteme communautaire.",
  alternates: {
    canonical: "https://tenf-community.com/a-propos",
  },
};

export default async function Page() {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  let totalMembers = 564;
  let activeMembers = 220;
  let monthlyGrowth = 89;
  let dailyGrowth = 1;
  let activityFeed: PublicEvent[] = [];

  try {
    const [homeRes, dashboardRes, eventsRes] = await Promise.all([
      fetch(`${baseUrl}/api/home`, {
        next: { revalidate: 60 },
      }),
      fetch(`${baseUrl}/api/dashboard/data`, {
        next: { revalidate: 300 },
      }),
      fetch(`${baseUrl}/api/events`, {
        next: { revalidate: 60 },
      }),
    ]);

    if (homeRes.ok) {
      const homeData = (await homeRes.json()) as HomeApiResponse;
      totalMembers = homeData.stats?.totalMembers ?? totalMembers;
      activeMembers = homeData.stats?.activeMembers ?? activeMembers;
    }

    if (dashboardRes.ok) {
      const dashboardData = (await dashboardRes.json()) as DashboardPublicResponse;
      const growthPoints = dashboardData.data?.discordGrowth ?? [];
      const computed = computeGrowthFromHistory(growthPoints);
      monthlyGrowth = computed.monthlyGrowth;
      dailyGrowth = computed.dailyGrowth;
    }

    if (eventsRes.ok) {
      const eventsData = (await eventsRes.json()) as EventsApiResponse;
      const events = eventsData.events ?? [];
      activityFeed = events
        .filter((event) => Boolean(event?.title) && Boolean(event?.date))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6);
    }
  } catch (error) {
    console.error("[A propos] Erreur chargement stats dynamiques:", error);
  }

  const heroStats = [
    { target: totalMembers, label: "membres dans la communaute", prefix: "", suffix: "" },
    { target: activeMembers, label: "membres actifs et engages", prefix: "", suffix: "" },
    { target: monthlyGrowth, label: "croissance moyenne", prefix: "+", suffix: "/mois" },
    { target: dailyGrowth, label: "nouveau membre minimum", prefix: "", suffix: "+ / jour" },
  ];

  return (
    <main className="min-h-screen py-12" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border p-8 sm:p-10 lg:p-14 about-glow about-fade-up" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 35%, transparent), transparent 70%)" }} />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 25%, transparent), transparent 70%)" }} />
          <div className="relative flex flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              <Sparkles size={14} /> Twitch Entraide New Family
            </div>

            <div className="max-w-4xl space-y-5">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl" style={{ color: "var(--color-text)" }}>
                Plus qu&apos;un Discord:
                <br />
                une communaute qui fait grandir les streamers ensemble.
              </h1>
              <p className="max-w-3xl text-lg leading-relaxed sm:text-xl" style={{ color: "var(--color-text-secondary)" }}>
                TENF, c&apos;est un espace d&apos;entraide reelle, de progression collective, de formations et d&apos;evenements. Ici, on avance avec les autres et on construit un ecosysteme vivant, humain et evolutif.
              </p>
            </div>

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
                className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition-colors"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Decouvrir le fonctionnement
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroStats.map((stat, index) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border p-4 about-fade-up about-reveal"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "color-mix(in srgb, var(--color-card) 80%, var(--color-bg) 20%)",
                    animationDelay: `${120 + index * 90}ms`,
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

        <section className="space-y-8 about-fade-up">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Mur d&apos;activite live
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Les derniers evenements qui font vivre TENF
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activityFeed.length > 0 ? (
              activityFeed.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border p-5 about-reveal"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                    <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-primary)" }} />
                    Activite communaute
                  </div>
                  <h3 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {formatEventDate(event.date)}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {event.category || "Evenement TENF"}{event.location ? ` · ${event.location}` : ""}
                  </p>
                </article>
              ))
            ) : (
              <article
                className="rounded-2xl border p-5 about-reveal md:col-span-2 xl:col-span-3"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Le mur d&apos;activite se met a jour automatiquement depuis les evenements internes TENF.
                </p>
              </article>
            )}
          </div>
        </section>

        <section className="space-y-8 about-fade-up">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Ce qui rend TENF different
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Une dynamique communautaire, pas un simple espace de promotion
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {differentiators.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="group rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 about-reveal"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div className="mb-4 inline-flex rounded-xl p-2.5" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}>
                    <Icon size={20} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-8 about-fade-up">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Comment fonctionne la communaute
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Un parcours simple, clair et evolutif
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="relative rounded-2xl border p-6 about-reveal"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                  <CircleDot size={14} /> Etape {index + 1}
                </div>
                <h3 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8 about-fade-up">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              L&apos;ecosysteme TENF
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Discord, site et outils: tout est pense pour progresser ensemble
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ecosystemItems.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 about-reveal"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div className="mb-4 inline-flex rounded-xl p-2.5" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}>
                    <Icon size={20} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
          <div className="rounded-2xl border p-6 about-reveal" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Structure de roles communautaire
            </p>
            <div className="flex flex-wrap gap-2.5">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8 about-fade-up">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Les fondateurs
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Trois visages, une meme vision communautaire
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {founders.map((founder) => (
              <article
                key={founder}
                className="rounded-2xl border p-6 about-reveal"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)", color: "var(--color-primary)" }}>
                  {founder.charAt(0)}
                </div>
                <h3 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                  {founder}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Cofondateur de TENF et acteur cle de l&apos;identite humaine, evolutive et solidaire de la communaute.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8 about-fade-up">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              TENF en chiffres
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Une communaute active, en mouvement permanent
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border p-6 about-reveal" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <p className="text-4xl font-bold" style={{ color: "var(--color-primary)" }}>
                <span className="about-counter" data-counter-target={totalMembers} data-counter-prefix="" data-counter-suffix="">
                  {formatNumber(totalMembers)}
                </span>
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>membres dans TENF aujourd&apos;hui</p>
            </article>
            <article className="rounded-2xl border p-6 about-reveal" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <p className="text-4xl font-bold" style={{ color: "var(--color-primary)" }}>
                <span className="about-counter" data-counter-target={activeMembers} data-counter-prefix="" data-counter-suffix="">
                  {formatNumber(activeMembers)}
                </span>
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>membres actifs et engages dans l&apos;entraide</p>
            </article>
            <article className="rounded-2xl border p-6 about-reveal" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <p className="text-4xl font-bold" style={{ color: "var(--color-primary)" }}>
                <span className="about-counter" data-counter-target={monthlyGrowth} data-counter-prefix="+" data-counter-suffix="">
                  {`+${formatNumber(monthlyGrowth)}`}
                </span>
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>nouveaux membres en moyenne par mois</p>
            </article>
            <article className="rounded-2xl border p-6 about-reveal" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <p className="text-4xl font-bold" style={{ color: "var(--color-primary)" }}>
                <span className="about-counter" data-counter-target={dailyGrowth} data-counter-prefix="" data-counter-suffix="+">
                  {`${dailyGrowth}+`}
                </span>
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>nouveau membre chaque jour minimum</p>
            </article>
          </div>
        </section>

        <section className="space-y-8 about-fade-up">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              L&apos;histoire de TENF
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Une evolution rapide, construite avec la communaute
            </h2>
          </div>
          <div className="rounded-2xl border p-6 sm:p-8" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <ol className="relative space-y-6">
              {timeline.map((event) => (
                <li key={event.date} className="grid gap-2 sm:grid-cols-[170px_1fr] sm:gap-6 about-reveal">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                    {event.date}
                  </p>
                  <div className="relative border-l pl-4" style={{ borderColor: "var(--color-border)" }}>
                    <span
                      className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    />
                    <p className="text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                      {event.label}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="about-fade-up">
          <div className="rounded-3xl border p-8 text-center sm:p-10" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
              Rejoins l&apos;aventure
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Tu veux streamer sans avancer seul ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--color-text-secondary)" }}>
              TENF est un espace d&apos;apprentissage, d&apos;echange et de soutien. Viens rencontrer une communaute active qui aide les createurs a progresser durablement.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="https://discord.gg/WnpazgcZHk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Rejoindre le Discord <ArrowRight size={16} />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition-colors"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Explorer le site
              </Link>
            </div>
          </div>
        </section>
      </div>

      <AboutPageEnhancer />
    </main>
  );
}
