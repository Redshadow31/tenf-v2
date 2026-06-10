"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  HeartHandshake,
  LayoutGrid,
  MessageCircle,
  Quote,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

export type FounderProfilePublic = {
  name: string;
  twitchLogin: string;
  role: string;
  personality: string;
  quote: string;
  avatarUrl: string;
};

type StoryStep = { title: string; text: string };
type EvolutionStep = { date: string; phase: string; text: string };

// Chronologie réelle : l'idée naît dans un groupe Facebook, une première
// communauté voit le jour sous le nom TEF (Twitch Entraide Family). En août
// 2024 un admin de départ veut monétiser l'aide → désaccord avec Red, Clara
// et Nexou. En septembre 2024, le projet est refondé sous le nom TENF
// (Twitch Entraide New Family).
const storyTimeline: StoryStep[] = [
  {
    title: "Une idée née sur Facebook",
    text: "Tout commence dans un groupe Facebook : l'envie de créer une vraie communauté d'entraide entre streamers Twitch. Pas une page promo de plus — juste un endroit pour ne plus avancer seul·e.",
  },
  {
    title: "Première version : TEF",
    text: "L'idée prend forme sur Discord sous le nom TEF (Twitch Entraide Family). Les premiers membres se rassemblent, les premiers liens se créent, l'entraide démarre pour de vrai.",
  },
  {
    title: "Août 2024 — le tournant",
    text: "L'un des admins de départ propose de monétiser l'entraide. Pour Red, Clara et Nexou, c'est un non net : l'aide n'est pas un produit. Les chemins se séparent.",
  },
  {
    title: "Septembre 2024 — naissance de TENF",
    text: "Le trio refonde le projet. TEF devient TENF (Twitch Entraide New Family) — le « New » est une promesse : repartir sur des bases saines, sans compromis sur les valeurs.",
  },
  {
    title: "On pose un cadre",
    text: "Petit à petit : des rôles, des repères, une charte, des règles claires. Pas pour fliquer, pour protéger ce qui fonctionne déjà.",
  },
  {
    title: "Aujourd'hui",
    text: "TENF est une vraie famille structurée mais humaine. Du soutien sincère, des projets ensemble, et l'envie commune de durer sans perdre ce qui nous a réuni·es.",
  },
];

const evolution: EvolutionStep[] = [
  {
    date: "Été 2024",
    phase: "Une idée sur Facebook",
    text: "Dans un groupe Facebook, l'idée d'une vraie communauté d'entraide entre streamers prend forme.",
  },
  {
    date: "Avant août 2024",
    phase: "TEF — première version",
    text: "Twitch Entraide Family (TEF) voit le jour sur Discord et rassemble ses premiers membres.",
  },
  {
    date: "Août 2024",
    phase: "Désaccord net",
    text: "Un admin de départ veut monétiser l'entraide. Red, Clara et Nexou refusent. Les chemins se séparent.",
  },
  {
    date: "Septembre 2024",
    phase: "Naissance de TENF",
    text: "Refondation du projet sous le nom TENF (Twitch Entraide New Family), avec des valeurs claires et un cadre assumé.",
  },
  {
    date: "2025",
    phase: "On structure",
    text: "Charte, rôles, événements, intégration des nouveaux : TENF s'organise pour durer.",
  },
  {
    date: "2026",
    phase: "On assume",
    text: "Une famille engagée, stable, utile — loin des dynamiques creuses et des promesses vides.",
  },
];

const NAV_SECTIONS = [
  { id: "apropos-intro", label: "Intro" },
  { id: "apropos-decouvrir", label: "Découvrir" },
  { id: "apropos-tournant", label: "Tournant" },
  { id: "apropos-parcours", label: "Histoire" },
  { id: "apropos-identite", label: "Valeurs" },
  { id: "apropos-fondateurs", label: "Trio" },
  { id: "apropos-difference", label: "Pourquoi" },
  { id: "apropos-evolution", label: "Dates" },
] as const;

const DISCOVER_CARDS: {
  id: string;
  href: string;
  icon: typeof BookOpen;
  iconColor: string;
  iconBg: string;
  label: string;
  title: string;
  description: string;
}[] = [
  {
    id: "apropos-parcours",
    href: "#apropos-parcours",
    icon: BookOpen,
    iconColor: "text-violet-300",
    iconBg: "bg-violet-500/15 ring-violet-400/30",
    label: "L'histoire",
    title: "D'où on vient",
    description: "Le récit complet, sans filtre : ce qui nous a réuni·es et ce qui nous a fait grandir.",
  },
  {
    id: "apropos-identite",
    href: "#apropos-identite",
    icon: HeartHandshake,
    iconColor: "text-rose-300",
    iconBg: "bg-rose-500/15 ring-rose-400/30",
    label: "Les valeurs",
    title: "Ce qui nous tient",
    description: "Ce que TENF défend au quotidien — et ce qu'on refuse, fermement.",
  },
  {
    id: "apropos-fondateurs",
    href: "#apropos-fondateurs",
    icon: Users,
    iconColor: "text-fuchsia-300",
    iconBg: "bg-fuchsia-500/15 ring-fuchsia-400/30",
    label: "Le trio",
    title: "Red, Clara, Nexou",
    description: "Les trois personnes qui portent le projet, chacun·e avec son rôle et son univers.",
  },
  {
    id: "apropos-evolution",
    href: "#apropos-evolution",
    icon: Sparkles,
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/15 ring-amber-400/30",
    label: "Aujourd'hui",
    title: "Où on en est",
    description: "Les grandes étapes franchies depuis avril 2024 jusqu'à maintenant.",
  },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function animateCounter(element: HTMLElement) {
  if (element.dataset.animated === "true") return;
  const target = Number(element.dataset.counterTarget || "0");
  const prefix = element.dataset.counterPrefix || "";
  const suffix = element.dataset.counterSuffix || "";
  const duration = 1200;
  const start = performance.now();
  element.dataset.animated = "true";
  const format = (value: number) => new Intl.NumberFormat("fr-FR").format(value);
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    element.textContent = `${prefix}${format(value)}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

type AboutPublicPageProps = {
  totalMembers: number;
  activeMembers: number;
  foundersWithAvatar: FounderProfilePublic[];
};

// Variables CSS qui rendent la page fluide :
// - --about-px : padding latéral qui s'adapte au viewport (scalable au zoom).
// - --about-max : largeur max du contenu (occupe la place dispo sans
//   devenir illisible sur écran 4K).
const ABOUT_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--about-px": "clamp(1rem, 3.5vw, 3rem)",
  "--about-max": "min(112rem, 100%)",
  paddingTop: "clamp(1.25rem, 2.5vw, 2.25rem)",
  paddingBottom: "clamp(2.5rem, 5vw, 4rem)",
  paddingLeft: "var(--about-px)",
  paddingRight: "var(--about-px)",
  fontSize: "clamp(0.95rem, 0.9rem + 0.18vw, 1.05rem)",
  backgroundColor: "var(--color-bg)",
};

export default function AboutPublicPage({
  totalMembers,
  activeMembers,
  foundersWithAvatar,
}: AboutPublicPageProps) {
  const [storyIdx, setStoryIdx] = useState(0);
  const [identityFocus, setIdentityFocus] = useState<"pas" | "est">("est");
  const [founderOpen, setFounderOpen] = useState<string | null>(null);
  const [evoOpen, setEvoOpen] = useState<number | null>(null);
  const [activeNav, setActiveNav] = useState<string>(NAV_SECTIONS[0].id);
  const navSentinelRef = useRef<HTMLDivElement | null>(null);

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("about-js-enabled");

    const revealElements = Array.from(document.querySelectorAll<HTMLElement>(".about-reveal"));
    revealElements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index * 45, 240)}ms`;
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealElements.forEach((el) => revealObserver.observe(el));

    const counterObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          animateCounter(entry.target as HTMLElement);
          counterObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -30px 0px" }
    );
    document.querySelectorAll<HTMLElement>(".about-counter").forEach((c) => counterObserver.observe(c));

    // Tracking de la section visible pour mettre en avant l'onglet
    // correspondant dans la nav rapide.
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveNav(visible.target.id);
        }
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: "-120px 0px -45% 0px" }
    );
    NAV_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) navObserver.observe(el);
    });

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
      navObserver.disconnect();
      document.documentElement.classList.remove("about-js-enabled");
    };
  }, []);

  const story = storyTimeline[storyIdx] ?? storyTimeline[0];

  return (
    <main className="min-h-screen" style={ABOUT_STYLE}>
      <div ref={navSentinelRef} className="h-0" aria-hidden />

      {/* Navigation rapide */}
      <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-40 flex justify-center px-3 md:sticky md:top-[4.5rem] md:bottom-auto md:mb-6 md:px-0">
        <nav
          className="pointer-events-auto flex max-w-[95vw] gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/65 px-2 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] md:max-w-none md:flex-wrap md:justify-center [&::-webkit-scrollbar]:hidden"
          aria-label="Sections de la page"
        >
          {NAV_SECTIONS.map((s) => {
            const isActive = activeNav === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToId(s.id)}
                aria-current={isActive ? "true" : undefined}
                className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 md:text-xs ${
                  isActive
                    ? "bg-violet-500/25 text-white ring-1 ring-violet-400/40"
                    : "text-zinc-300 hover:bg-violet-500/15 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        className="mx-auto flex w-full flex-col gap-12 sm:gap-16 md:gap-20"
        style={{ maxWidth: "var(--about-max)" }}
      >
        {/* === Hero === */}
        <section
          id="apropos-intro"
          className="about-glow about-fade-up relative overflow-hidden rounded-3xl border border-violet-500/25"
          style={{ padding: "clamp(1.5rem, 3vw, 3rem)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.96]"
            style={{
              background:
                "linear-gradient(125deg, rgba(10,8,16,0.99) 0%, rgba(42,20,62,0.93) 48%, rgba(18,12,28,0.98) 100%)",
            }}
          />
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-violet-600/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-[-12%] h-80 w-80 rounded-full bg-fuchsia-600/22 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-100">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                  Bienvenue chez TENF
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Streamers · membres · curieux·ses
                </span>
              </div>
              <h1
                className="font-black leading-[1.08] tracking-tight text-white"
                style={{ fontSize: "clamp(1.85rem, 1.4rem + 2vw, 3rem)" }}
              >
                TENF, ce n'est pas un produit.
                <span className="mt-2 block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-200 bg-clip-text text-transparent">
                  C'est une famille de streamers qui s'entraident pour de vrai.
                </span>
              </h1>
              <p
                className="max-w-2xl leading-relaxed text-zinc-300"
                style={{ fontSize: "clamp(0.95rem, 0.9rem + 0.2vw, 1.05rem)" }}
              >
                Tout part d'une idée née dans un groupe Facebook : créer une vraie communauté d'entraide entre streamers Twitch. Une première version a existé sous le nom <strong className="text-white">TEF</strong> (<em>Twitch Entraide Family</em>), puis en septembre 2024, après un désaccord net sur la monétisation de l'aide,{" "}
                <strong className="font-semibold text-white">Red, Clara et Nexou</strong> ont refondé le projet sous le nom <strong className="text-white">TENF</strong> — avec une règle qui ne bouge pas :{" "}
                <strong className="text-violet-200">l'entraide n'est pas une marchandise</strong>.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Histoire", "Valeurs", "Trio fondateur", "Évolution"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-zinc-400"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/rejoindre"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_36px_rgba(124,58,237,0.4)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                >
                  Voir comment nous rejoindre
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/membres"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:border-violet-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                >
                  <Users className="h-4 w-4 text-violet-300" aria-hidden />
                  Voir les membres
                </Link>
                <Link
                  href="/lives"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-red-400/35 hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                >
                  Lives en direct
                  <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <article className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-violet-400/40">
                <Users className="h-5 w-5 text-violet-400" aria-hidden />
                <p
                  className="mt-3 font-black tabular-nums text-white"
                  style={{ fontSize: "clamp(1.75rem, 1.2rem + 1.8vw, 2.5rem)" }}
                >
                  <span className="about-counter" data-counter-target={totalMembers}>
                    {formatNumber(totalMembers)}
                  </span>
                </p>
                <p className="mt-1 text-xs font-medium leading-snug text-zinc-400">
                  personnes ont rejoint l'aventure
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-emerald-400/40">
                <LayoutGrid className="h-5 w-5 text-emerald-400" aria-hidden />
                <p
                  className="mt-3 font-black tabular-nums text-white"
                  style={{ fontSize: "clamp(1.75rem, 1.2rem + 1.8vw, 2.5rem)" }}
                >
                  <span className="about-counter" data-counter-target={activeMembers}>
                    {formatNumber(activeMembers)}
                  </span>
                </p>
                <p className="mt-1 text-xs font-medium leading-snug text-zinc-400">
                  actifs de l'entraide sur la période récente
                </p>
              </article>
              <article className="col-span-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-400/40">
                    <BookOpen className="h-4 w-4 text-amber-300" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-amber-100">À lire tranquillement</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                      Les chiffres donnent une échelle, mais le cœur de TENF, ce sont les vraies interactions, chaque jour, sur Discord et Twitch.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* === Ce que tu vas trouver ici === */}
        <section id="apropos-decouvrir" className="about-reveal space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
                Ce que tu vas trouver ici
              </p>
              <h2
                className="mt-2 font-black text-white"
                style={{ fontSize: "clamp(1.5rem, 1.1rem + 1.6vw, 2.25rem)" }}
              >
                Tu peux lire tout — ou aller direct à ce qui t'intéresse
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Quatre raccourcis pour découvrir TENF à ton rythme. Tout est lisible en moins de 5 minutes.
              </p>
            </div>
            <Link
              href="/rejoindre"
              className="hidden items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-violet-100 transition hover:bg-violet-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 md:inline-flex"
            >
              Rejoindre TENF
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {DISCOVER_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <a
                  key={card.id}
                  href={card.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId(card.id);
                  }}
                  className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                  aria-label={`Aller à la section ${card.title}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${card.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${card.iconColor}`} aria-hidden />
                    </span>
                    <ArrowRight className="h-4 w-4 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-violet-300" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300/80">
                      {card.label}
                    </p>
                    <p className="mt-1 text-base font-bold text-white">{card.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{card.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* === Tournant === */}
        <section
          id="apropos-tournant"
          className="about-reveal rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-950/40 via-black/40 to-violet-950/20"
          style={{ padding: "clamp(1.5rem, 2.5vw, 2.5rem)" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40">
              <Star className="h-6 w-6" aria-hidden />
            </span>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200/90">Le tournant · août 2024</p>
              <h2
                className="font-black text-white"
                style={{ fontSize: "clamp(1.25rem, 1rem + 1vw, 1.75rem)" }}
              >
                Le jour où on a refusé de monétiser l'entraide
              </h2>
              <p className="max-w-3xl leading-relaxed text-zinc-300">
                En août 2024, alors qu'on s'appelle encore <strong className="text-white">TEF</strong>, l'un des admins de départ propose de transformer l'aide entre membres en service payant. La discussion est tendue — mais la réponse fait l'unanimité côté Red, Clara et Nexou :{" "}
                <strong className="text-white">l'entraide n'est pas un produit, c'est une relation.</strong> Les chemins se séparent, et en septembre 2024 le projet renaît sous le nom <strong className="text-white">TENF</strong> (<em>Twitch Entraide New Family</em>). Ce choix a un coût, en temps et en énergie, mais c'est ce qui rend la communauté crédible pour celles et ceux qui cherchent du soutien sincère plutôt que du volume.
              </p>
            </div>
          </div>
        </section>

        {/* Citation */}
        <section className="about-fade-up">
          <blockquote
            className="relative rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-950/50 to-black/40 text-center shadow-[0_20px_60px_rgba(88,28,135,0.2)]"
            style={{ padding: "clamp(2rem, 3vw, 3.5rem)" }}
          >
            <Quote
              className="mx-auto h-8 w-8 text-violet-400/60"
              aria-hidden
            />
            <p
              className="mx-auto mt-4 max-w-3xl font-medium italic leading-relaxed text-white"
              style={{ fontSize: "clamp(1rem, 0.9rem + 0.6vw, 1.35rem)" }}
            >
              « On n'a pas commencé avec une roadmap. On a commencé avec des gens qu'on ne voulait pas laisser tomber. »
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300/80">
              — Le trio fondateur
            </p>
          </blockquote>
        </section>

        {/* === Parcours interactif === */}
        <section id="apropos-parcours" className="about-reveal space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Parcours</p>
            <h2
              className="mt-2 font-black text-white"
              style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.8vw, 2.5rem)" }}
            >
              Comment l'histoire s'est écrite
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Cinq étapes — utilise les flèches, les points ou les onglets latéraux pour naviguer.
            </p>
          </div>

          <div
            className="rounded-3xl border border-white/10 bg-black/25"
            style={{ padding: "clamp(1.25rem, 2vw, 2rem)" }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0 lg:w-56 [&::-webkit-scrollbar]:hidden">
                {storyTimeline.map((step, index) => (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setStoryIdx(index)}
                    aria-pressed={storyIdx === index}
                    className={`shrink-0 rounded-xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 lg:w-full ${
                      storyIdx === index
                        ? "border-violet-400/55 bg-violet-500/20 text-white ring-1 ring-violet-400/35"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-300/80">
                      Étape {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-1 text-sm font-bold">{step.title}</p>
                  </button>
                ))}
              </div>

              <div
                className="min-h-[220px] flex-1 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-transparent"
                style={{ padding: "clamp(1.25rem, 2vw, 2rem)" }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-300/90">
                    {story.title}
                  </p>
                  <span className="text-[10px] font-semibold text-zinc-500">
                    {storyIdx + 1} / {storyTimeline.length}
                  </span>
                </div>
                <p
                  className="mt-4 leading-relaxed text-zinc-200"
                  style={{ fontSize: "clamp(0.95rem, 0.9rem + 0.3vw, 1.1rem)" }}
                >
                  {story.text}
                </p>
                <div className="mt-8 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={storyIdx <= 0}
                    onClick={() => setStoryIdx((i) => Math.max(0, i - 1))}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Précédent
                  </button>
                  <div className="flex gap-1.5" role="tablist" aria-label="Étapes du parcours">
                    {storyTimeline.map((s, i) => (
                      <button
                        key={`dot-${i}`}
                        type="button"
                        role="tab"
                        aria-selected={i === storyIdx}
                        aria-label={`Étape ${i + 1} : ${s.title}`}
                        onClick={() => setStoryIdx(i)}
                        className={`h-2.5 w-2.5 rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
                          i === storyIdx ? "scale-125 bg-violet-400" : "bg-zinc-600 hover:bg-zinc-500"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={storyIdx >= storyTimeline.length - 1}
                    onClick={() =>
                      setStoryIdx((i) => Math.min(storyTimeline.length - 1, i + 1))
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === Réalité === */}
        <section className="about-reveal space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Sans filtre</p>
            <h2
              className="mt-2 font-black text-white"
              style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.8vw, 2.5rem)" }}
            >
              Ce qu'on voit moins, mais qui fait la différence
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              On préfère être honnêtes : voici ce qui se passe vraiment dans les coulisses.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: "On a hésité",
                body: "Comme dans toute famille, on s'est posé des vraies questions. Continuer ? Changer de cap ? Notre réponse à chaque fois : tenir, ensemble.",
                hue: "border-rose-500/25 bg-rose-950/20 hover:border-rose-400/40",
                accent: "text-rose-200",
              },
              {
                title: "On se parle vraiment",
                body: "On ne fuit pas les désaccords. Quand ça grince, on en parle — parfois avec émotion, mais toujours en face. C'est ce qui permet de décider clairement.",
                hue: "border-amber-500/25 bg-amber-950/15 hover:border-amber-400/40",
                accent: "text-amber-200",
              },
              {
                title: "On reste alignés",
                body: "Une règle qui ne bouge pas : l'entraide n'est jamais un business. C'est ça qui guide chaque choix, même quand c'est plus dur.",
                hue: "border-emerald-500/25 bg-emerald-950/20 hover:border-emerald-400/40",
                accent: "text-emerald-200",
              },
            ].map((card) => (
              <article
                key={card.title}
                className={`about-reveal rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] ${card.hue}`}
              >
                <p className={`text-lg font-bold text-white ${card.accent}`}>{card.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* === Identité === */}
        <section id="apropos-identite" className="about-reveal space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Nos valeurs</p>
            <h2
              className="mt-2 font-black text-white"
              style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.8vw, 2.5rem)" }}
            >
              Une ligne claire — et assumée
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Avant de te dire ce qu'on est, on préfère te dire ce qu'on n'est pas. Bascule pour comparer.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Valeurs TENF"
            className="flex justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={identityFocus === "pas"}
              onClick={() => setIdentityFocus("pas")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 sm:flex-none sm:px-8 ${
                identityFocus === "pas"
                  ? "bg-rose-600/25 text-rose-100 ring-1 ring-rose-400/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Ce qu'on refuse
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={identityFocus === "est"}
              onClick={() => setIdentityFocus("est")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:flex-none sm:px-8 ${
                identityFocus === "est"
                  ? "bg-emerald-600/25 text-emerald-100 ring-1 ring-emerald-400/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Ce qu'on construit
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article
              className={`rounded-3xl border p-8 transition-all duration-300 ${
                identityFocus === "pas"
                  ? "border-rose-400/45 bg-gradient-to-br from-rose-950/50 to-black/40 shadow-[0_20px_50px_rgba(225,29,72,0.12)]"
                  : "border-white/8 bg-white/[0.02] opacity-60 md:opacity-100"
              }`}
            >
              <p className="text-sm font-black uppercase tracking-wide text-rose-300">Pas chez nous</p>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-300">
                <li className="flex gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">✕</span>
                  Le follow-for-follow sans lien réel.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">✕</span>
                  Le serveur silencieux où personne ne répond.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">✕</span>
                  La vitrine promo déguisée en entraide.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">✕</span>
                  L'aide monnayée ou conditionnée à une contrepartie.
                </li>
              </ul>
            </article>
            <article
              className={`rounded-3xl border p-8 transition-all duration-300 ${
                identityFocus === "est"
                  ? "border-emerald-400/45 bg-gradient-to-br from-emerald-950/45 to-black/40 shadow-[0_20px_50px_rgba(16,185,129,0.12)]"
                  : "border-white/8 bg-white/[0.02] opacity-60 md:opacity-100"
              }`}
            >
              <p className="text-sm font-black uppercase tracking-wide text-emerald-300">Chez nous, oui</p>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-300">
                <li className="flex gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">✓</span>
                  De l'implication réelle, au quotidien, par les membres.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">✓</span>
                  Du soutien entre personnes — pas entre comptes.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">✓</span>
                  Une progression qui prend le temps, sans pression de chiffres.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">✓</span>
                  Une bienveillance qui sait aussi poser des limites.
                </li>
              </ul>
            </article>
          </div>
        </section>

        {/* === Fondateurs === */}
        <section id="apropos-fondateurs" className="about-reveal space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Le trio</p>
            <h2
              className="mt-2 font-black text-white"
              style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.8vw, 2.5rem)" }}
            >
              Trois personnalités, une même envie
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Red, Clara et Nexou portent TENF. Trois sensibilités différentes, et c'est ce qui nous équilibre. Touche une carte pour lire leur phrase préférée — puis va découvrir leur chaîne Twitch.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {foundersWithAvatar.map((founder) => {
              const open = founderOpen === founder.name;
              return (
                <article
                  key={founder.name}
                  className={`about-reveal group cursor-pointer rounded-3xl border bg-black/30 p-6 transition hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_18px_50px_rgba(124,58,237,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
                    open ? "border-violet-400/55 ring-1 ring-violet-400/30" : "border-white/10"
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  aria-label={`${founder.name} — ${founder.role}`}
                  onClick={() => setFounderOpen(open ? null : founder.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setFounderOpen(open ? null : founder.name);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-violet-500/35 ring-2 ring-transparent transition group-hover:ring-violet-400/40">
                        <Image src={founder.avatarUrl} alt="" fill className="object-cover" sizes="64px" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{founder.name}</p>
                        <p className="text-xs text-violet-300/90">{founder.role}</p>
                      </div>
                    </div>
                    {open ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400">
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                    {founder.personality}
                  </p>
                  <p
                    className={`mt-2 text-sm italic leading-relaxed text-zinc-300 transition ${
                      open ? "" : "line-clamp-3"
                    }`}
                  >
                    « {founder.quote} »
                  </p>
                  <a
                    href={`https://www.twitch.tv/${founder.twitchLogin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-xs font-bold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                    aria-label={`Ouvrir la chaîne Twitch de ${founder.name}`}
                  >
                    Twitch · {founder.twitchLogin}
                    <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        {/* === Différence === */}
        <section id="apropos-difference" className="about-reveal space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Pourquoi ça tient</p>
            <h2
              className="mt-2 font-black text-white"
              style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.8vw, 2.5rem)" }}
            >
              Trois piliers qui font la différence
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              On préfère les bases solides aux effets de pic.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: HeartHandshake,
                title: "L'engagement est réel",
                body: "Pas une performance pour les métriques : des messages, des raids, des coups de main quand ça compte.",
              },
              {
                icon: Users,
                title: "Un cadre qui rassure",
                body: "Des règles claires, une charte, des rôles — pour que chacun·e trouve sa place sans écraser les personnalités.",
              },
              {
                icon: Compass,
                title: "On joue le long terme",
                body: "Pas de course à l'attention. On construit dans la durée, pour que TENF tienne dans 1 an, 5 ans, et plus.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.05]"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-400/30 transition group-hover:bg-violet-500/25">
                    <Icon className="h-6 w-6 text-violet-300" aria-hidden />
                  </span>
                  <p className="mt-4 text-base font-bold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* === Évolution === */}
        <section id="apropos-evolution" className="about-reveal space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Notre évolution</p>
            <h2
              className="mt-2 font-black text-white"
              style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.8vw, 2.5rem)" }}
            >
              Les grandes étapes, dans l'ordre
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Touche une phase pour afficher le détail. Tout est public, tout est assumé.
            </p>
          </div>
          <div
            className="rounded-3xl border border-white/10 bg-black/25"
            style={{ padding: "clamp(1.25rem, 2vw, 2rem)" }}
          >
            <ol className="relative space-y-2">
              {evolution.map((step, index) => {
                const active = evoOpen === index;
                return (
                  <li key={step.date}>
                    <button
                      type="button"
                      onClick={() => setEvoOpen(active ? null : index)}
                      aria-expanded={active}
                      className={`flex w-full flex-col gap-1 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 sm:flex-row sm:items-center sm:gap-6 ${
                        active
                          ? "border-violet-400/45 bg-violet-500/10 shadow-[0_12px_32px_rgba(88,28,135,0.15)]"
                          : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="shrink-0 text-sm font-black text-violet-300">{step.date}</span>
                      <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:gap-4">
                        <span className="font-bold text-white">{step.phase}</span>
                        <span
                          className={`text-sm text-zinc-400 ${active ? "" : "line-clamp-1 sm:line-clamp-none"}`}
                        >
                          {step.text}
                        </span>
                      </div>
                      <ChevronRight
                        className={`hidden h-5 w-5 shrink-0 text-zinc-500 transition sm:block ${
                          active ? "rotate-90 text-violet-300" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* === CTA final === */}
        <section className="about-reveal">
          <div
            className="rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-950/60 via-black/50 to-fuchsia-950/30 text-center shadow-[0_28px_70px_rgba(0,0,0,0.45)]"
            style={{ padding: "clamp(2rem, 3.5vw, 3.5rem)" }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Et maintenant ?</p>
            <h2
              className="mx-auto mt-4 max-w-3xl font-black leading-tight text-white"
              style={{ fontSize: "clamp(1.5rem, 1.1rem + 2vw, 2.5rem)" }}
            >
              TENF, c'est pas juste une commu de plus.
              <span
                className="mt-3 block font-semibold text-zinc-300"
                style={{ fontSize: "clamp(1rem, 0.85rem + 0.8vw, 1.4rem)" }}
              >
                C'est un endroit où on prend le temps, où on s'écoute, où on grandit ensemble — un live à la fois.
              </span>
            </h2>
            <p
              className="mx-auto mt-5 max-w-2xl leading-relaxed text-zinc-400"
              style={{ fontSize: "clamp(0.9rem, 0.85rem + 0.2vw, 1rem)" }}
            >
              Que tu passes en curieux·se ou que tu sois déjà membre : si tu cherches du vrai lien, du soutien honnête et des gens qui s'impliquent, tu as ta place dans la discussion.
            </p>
            <div className="mt-10 flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
              <Link
                href="/rejoindre"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              >
                Comment nous rejoindre
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-8 py-3 text-sm font-bold text-white transition hover:border-violet-400/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              >
                <MessageCircle className="h-4 w-4 text-violet-300" aria-hidden />
                Discord TENF
                <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
              </Link>
              <Link
                href="/charte"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/12 px-8 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
              >
                Lire la charte
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
