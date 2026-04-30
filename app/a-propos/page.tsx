import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AboutPageEnhancer from "@/components/about/AboutPageEnhancer";
import { getTwitchUsers } from "@/lib/twitch";
import { AlertTriangle, ArrowRight, Compass, HeartHandshake, Users } from "lucide-react";

type HomeApiResponse = {
  stats?: {
    totalMembers?: number;
    activeMembers?: number;
  };
};

type FounderProfile = {
  name: string;
  twitchLogin: string;
  role: string;
  personality: string;
  quote: string;
};

type StoryStep = {
  title: string;
  text: string;
};

type EvolutionStep = {
  date: string;
  phase: string;
  text: string;
};

const founders: FounderProfile[] = [
  {
    name: "Red",
    twitchLogin: "red_shadow_31",
    role: "Structure et vision",
    personality: "Calme, cadrant, tourné long terme",
    quote: "On peut être exigeants sans perdre l'humain.",
  },
  {
    name: "Clara",
    twitchLogin: "clarastonewall",
    role: "Émotion et valeurs",
    personality: "Empathique, directe, protectrice",
    quote: "Si l'entraide devient un décor, on a déjà perdu.",
  },
  {
    name: "Nexou",
    twitchLogin: "nexou31",
    role: "Équilibre et lien",
    personality: "Spontané, pragmatique, fédérateur",
    quote: "On avance mieux quand on reste vrais entre nous.",
  },
];

const storyTimeline: StoryStep[] = [
  {
    title: "Départ simple",
    text: "Au début, TENF n'est qu'un groupe Facebook. Pas de plan. Juste des streamers qui veulent s'entraider.",
  },
  {
    title: "Période de chaos",
    text: "Les fondateurs initiaux partent, la structure se fragilise, la direction devient floue.",
  },
  {
    title: "Moment décisif",
    text: "Le trio reprend la responsabilité. Pas par ego. Parce qu'il y avait des personnes derrière, pas juste un serveur.",
  },
  {
    title: "Construction",
    text: "Le cadre se construit progressivement : rôles, repères, décisions plus claires.",
  },
  {
    title: "Aujourd'hui",
    text: "TENF est une communauté structurée, mais toujours centrée sur l'humain et l'entraide réelle.",
  },
];

const evolution: EvolutionStep[] = [
  {
    date: "Avril 2024",
    phase: "Naissance",
    text: "Le groupe démarre avec l'envie d'entraide entre streamers.",
  },
  {
    date: "Mi 2024",
    phase: "Instabilité",
    text: "Départs, doutes, tensions : la communauté vacille.",
  },
  {
    date: "Fin 2024",
    phase: "Reprise",
    text: "Le trio reprend le projet et pose une direction claire.",
  },
  {
    date: "2025",
    phase: "Structuration",
    text: "TENF s'organise pour durer sans perdre son ADN humain.",
  },
  {
    date: "2026",
    phase: "Identité assumée",
    text: "Une communauté engagée, stable, utile, loin des dynamiques superficielles.",
  },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export const metadata: Metadata = {
  title: "À propos | TENF",
  description:
    "L'histoire de TENF, de ses débuts chaotiques à une communauté structurée et humaine, portée par l'entraide réelle.",
  alternates: {
    canonical: "https://tenf-community.com/a-propos",
  },
};

export default async function Page() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  let totalMembers = 564;
  let activeMembers = 220;
  let foundersWithAvatar = founders.map((founder) => ({
    ...founder,
    avatarUrl: `https://unavatar.io/twitch/${founder.twitchLogin}`,
  }));

  try {
    const [homeRes, twitchUsers] = await Promise.all([
      fetch(`${baseUrl}/api/home`, { next: { revalidate: 60 } }),
      getTwitchUsers(founders.map((founder) => founder.twitchLogin)),
    ]);

    if (homeRes.ok) {
      const homeData = (await homeRes.json()) as HomeApiResponse;
      totalMembers = homeData.stats?.totalMembers ?? totalMembers;
      activeMembers = homeData.stats?.activeMembers ?? activeMembers;
    }

    const avatarByLogin = new Map((twitchUsers || []).map((user) => [user.login.toLowerCase(), user.profile_image_url]));
    foundersWithAvatar = founders.map((founder) => ({
      ...founder,
      avatarUrl: avatarByLogin.get(founder.twitchLogin.toLowerCase()) || `https://unavatar.io/twitch/${founder.twitchLogin}`,
    }));
  } catch (error) {
    console.error("[A propos] Erreur chargement données:", error);
  }

  return (
    <main className="min-h-screen py-12" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 sm:px-6 lg:px-8 prose-readable-mobile">
        <section className="relative overflow-hidden rounded-3xl border p-8 sm:p-10 lg:p-14 about-glow about-fade-up" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 35%, transparent), transparent 70%)" }} />
          <div className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, color-mix(in srgb, #5865f2 20%, transparent), transparent 70%)" }} />
          <div className="relative flex flex-col gap-5">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              La vraie histoire TENF
            </p>
            <h1 className="max-w-5xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl" style={{ color: "var(--color-text)" }}>
              TENF n'est pas né d'une stratégie.
              <br />
              TENF est né d'un chaos qu'on a refusé d'abandonner.
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Au départ, c'était un simple groupe Facebook. Puis les repères ont sauté.
              Les personnes à l'origine sont parties.
              Red, Clara et Nexou ont repris ce qu'il restait, avec une idée simple: aider pour de vrai.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Origine", "Tournant", "Réalité", "Différence", "Fondateurs", "Évolution"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5" style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-card) 80%, var(--color-bg) 20%)", boxShadow: "0 14px 34px rgba(0,0,0,0.25)" }}>
                <p className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-primary)" }}>
                  <span className="about-counter" data-counter-target={totalMembers}>{formatNumber(totalMembers)}</span>
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>membres ont rejoint cette histoire</p>
              </article>
              <article className="rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5" style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-card) 80%, var(--color-bg) 20%)", boxShadow: "0 14px 34px rgba(0,0,0,0.25)" }}>
                <p className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-primary)" }}>
                  <span className="about-counter" data-counter-target={activeMembers}>{formatNumber(activeMembers)}</span>
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>personnes font vivre TENF activement</p>
              </article>
            </div>
          </div>
        </section>

        <section
          className="rounded-2xl border p-6 about-fade-up"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-card) 84%, #150b26)",
            borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--color-border))",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} style={{ color: "var(--color-primary)", marginTop: "2px" }} />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Le tournant qui a tout changé
              </p>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Quand l'idée de monétiser l'aide a été mise sur la table, le trio a refusé. Ce choix a coûté, a créé des tensions, mais a défini TENF:
                ici, l'entraide n'est pas un produit.
              </p>
            </div>
          </div>
        </section>

        <section className="about-fade-up">
          <blockquote
            className="rounded-2xl border px-6 py-5 text-center sm:px-8"
            style={{
              borderColor: "color-mix(in srgb, var(--color-primary) 28%, var(--color-border))",
              backgroundColor: "color-mix(in srgb, var(--color-card) 88%, #120a22)",
              boxShadow: "0 18px 44px rgba(0,0,0,0.3)",
            }}
          >
            <p className="text-base italic sm:text-lg" style={{ color: "var(--color-text)" }}>
              “On n&apos;a pas commencé avec une roadmap. On a commencé avec des gens qu&apos;on ne voulait pas laisser tomber.”
            </p>
          </blockquote>
        </section>

        <section className="space-y-5 about-fade-up">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>Parcours</p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>Comment l'histoire s'est écrite</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {storyTimeline.map((step) => (
              <article
                key={step.title}
                className="rounded-2xl border p-5 about-reveal transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5 about-fade-up">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>Réalité</p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>Ce qu'on voit moins, mais qui compte</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <article className="rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "0 10px 26px rgba(0,0,0,0.2)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Des doutes</p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Il y a eu des moments où arrêter semblait plus simple.</p>
            </article>
            <article className="rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "0 10px 26px rgba(0,0,0,0.2)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Des conflits</p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Des désaccords forts, parfois émotionnels, sur la direction à prendre.</p>
            </article>
            <article className="rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "0 10px 26px rgba(0,0,0,0.2)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Des décisions</p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Le choix fondateur: ne jamais transformer l'aide en business.</p>
            </article>
          </div>
        </section>

        <section className="space-y-5 about-fade-up">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>Identité</p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>Une identité claire</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
            <article className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "0 12px 30px rgba(0,0,0,0.24)" }}>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#f87171" }}>TENF n'est pas</p>
              <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>Un follow-for-follow.</p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Un serveur passif où personne ne se répond.</p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Un espace promo déguisé en entraide.</p>
            </article>
            <article className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "0 12px 30px rgba(0,0,0,0.24)" }}>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#4ade80" }}>TENF est</p>
              <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>De l'implication réelle.</p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Du soutien concret entre personnes.</p>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Une progression qui se construit dans le temps.</p>
            </article>
          </div>
        </section>

        <section className="space-y-5 about-fade-up">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>Fondateurs</p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>Trois profils qui se complètent</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {foundersWithAvatar.map((founder) => (
              <article
                key={founder.name}
                className="rounded-2xl border p-6 about-reveal transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "linear-gradient(165deg, color-mix(in srgb, var(--color-card) 95%, transparent), color-mix(in srgb, #130a25 30%, var(--color-card)))",
                  borderColor: "color-mix(in srgb, var(--color-primary) 20%, var(--color-border))",
                  boxShadow: "0 14px 36px rgba(0,0,0,0.3)",
                }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border-2" style={{ borderColor: "color-mix(in srgb, var(--color-primary) 45%, var(--color-border))" }}>
                    <Image src={founder.avatarUrl} alt={`Avatar Twitch de ${founder.name}`} fill className="object-cover" sizes="56px" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{founder.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{founder.role}</p>
                  </div>
                </div>
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>{founder.personality}</p>
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  “{founder.quote}”
                </p>
                <a
                  href={`https://www.twitch.tv/${founder.twitchLogin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs font-semibold underline decoration-dotted underline-offset-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  twitch.tv/{founder.twitchLogin}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5 about-fade-up">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>Différence</p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>Pourquoi TENF tient dans la durée</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <HeartHandshake size={18} style={{ color: "var(--color-primary)" }} />
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>L'engagement est réel, pas performatif.</p>
            </article>
            <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <Users size={18} style={{ color: "var(--color-primary)" }} />
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Le cadre existe, sans écraser l'humain.</p>
            </article>
            <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <Compass size={18} style={{ color: "var(--color-primary)" }} />
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>La progression est pensée long terme, pas coup d'éclat.</p>
            </article>
          </div>
        </section>

        <section className="space-y-5 about-fade-up">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>Évolution</p>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>Les phases de croissance</h2>
          </div>
          <div className="rounded-2xl border p-6 sm:p-8" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <ol className="relative space-y-6">
              {evolution.map((step) => (
                <li key={step.date} className="grid gap-2 sm:grid-cols-[140px_1fr] sm:gap-6 about-reveal">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>{step.date}</p>
                  <div className="relative border-l pl-4" style={{ borderColor: "var(--color-border)" }}>
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                    <p className="font-semibold" style={{ color: "var(--color-text)" }}>{step.phase}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="about-fade-up">
          <div
            className="rounded-3xl border p-8 text-center sm:p-10"
            style={{
              background: "linear-gradient(165deg, color-mix(in srgb, var(--color-card) 92%, #0f081d), color-mix(in srgb, #120a23 55%, var(--color-card)))",
              borderColor: "color-mix(in srgb, var(--color-primary) 30%, var(--color-border))",
              boxShadow: "0 22px 56px rgba(0,0,0,0.36)",
            }}
          >
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>Message final</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              La TENF, ce n'est pas juste une communauté.
              <br />
              C'est une histoire qu'on écrit tous ensemble.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Si tu veux un endroit vrai, avec du soutien réel et des gens qui s'impliquent, tu peux en faire partie.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="https://discord.gg/WnpazgcZHk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5" style={{ backgroundColor: "var(--color-primary)" }}>
                Rejoindre le Discord <ArrowRight size={16} />
              </Link>
              <Link href="/" className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition-colors" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </section>
      </div>

      <AboutPageEnhancer />
    </main>
  );
}
