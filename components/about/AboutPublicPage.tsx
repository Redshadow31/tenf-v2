"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  HeartHandshake,
  LayoutGrid,
  Sparkles,
  Users,
  X,
} from "lucide-react";

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

const NAV_SECTIONS = [
  { id: "apropos-intro", label: "Intro" },
  { id: "apropos-tournant", label: "Tournant" },
  { id: "apropos-parcours", label: "Parcours" },
  { id: "apropos-identite", label: "Identité" },
  { id: "apropos-fondateurs", label: "Trio" },
  { id: "apropos-difference", label: "Lignes" },
  { id: "apropos-evolution", label: "Dates" },
] as const;

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

export default function AboutPublicPage({
  totalMembers,
  activeMembers,
  foundersWithAvatar,
}: AboutPublicPageProps) {
  const [storyIdx, setStoryIdx] = useState(0);
  const [identityFocus, setIdentityFocus] = useState<"pas" | "est">("est");
  const [founderOpen, setFounderOpen] = useState<string | null>(null);
  const [evoOpen, setEvoOpen] = useState<number | null>(null);
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

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
      document.documentElement.classList.remove("about-js-enabled");
    };
  }, []);

  const story = storyTimeline[storyIdx] ?? storyTimeline[0];

  return (
    <main className="min-h-screen pb-16 pt-8 md:pb-12 md:pt-10" style={{ backgroundColor: "var(--color-bg)" }}>
      <div ref={navSentinelRef} className="h-0" aria-hidden />

      {/* Navigation rapide */}
      <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-40 flex justify-center px-3 md:sticky md:top-[4.5rem] md:bottom-auto md:mb-6 md:px-0">
        <nav
          className="pointer-events-auto flex max-w-[95vw] gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/65 px-2 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] md:max-w-none md:flex-wrap md:justify-center [&::-webkit-scrollbar]:hidden"
          aria-label="Sections de la page"
        >
          {NAV_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToId(s.id)}
              className="shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-zinc-300 transition hover:bg-violet-500/20 hover:text-white md:text-xs"
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:gap-16 sm:px-6 lg:px-8 prose-readable-mobile md:gap-20">
        {/* Hero */}
        <section
          id="apropos-intro"
          className="about-glow about-fade-up relative overflow-hidden rounded-3xl border border-violet-500/25 p-6 sm:p-8 lg:p-12"
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
                  Transparence TENF
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Curieux·ses & membres</span>
              </div>
              <h1 className="max-w-4xl text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                TENF n’est pas né d’une stratégie marketing.
                <span className="mt-2 block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-200 bg-clip-text text-transparent">
                  Il est né d’un chaos qu’on a refusé d’abandonner.
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                Au départ : un groupe Facebook et des streamers qui voulaient s’entraider pour de vrai. Quand les repères ont sauté,{" "}
                <strong className="font-semibold text-white">Red, Clara et Nexou</strong> ont repris le flambeau — avec une ligne rouge claire :{" "}
                <strong className="text-violet-200">l’aide n’est pas une marchandise</strong>. Si tu découvres TENF ou que tu es déjà dans la&nbsp;New Family, cette page raconte{" "}
                <em className="text-zinc-200">pourquoi</em> la communauté tient debout.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Origine", "Tournant", "Réalité", "Identité", "Fondateurs", "Évolution"].map((label) => (
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
                  href="/membres"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:border-violet-400/40"
                >
                  <Users className="h-4 w-4 text-violet-300" aria-hidden />
                  Annuaire membres
                </Link>
                <Link
                  href="/lives"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-red-400/35 hover:bg-red-500/10"
                >
                  Lives TENF
                  <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
                </Link>
                <Link
                  href="/rejoindre"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_36px_rgba(124,58,237,0.4)] transition hover:brightness-110"
                >
                  Rejoindre
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <article className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-sm transition hover:border-violet-400/30">
                <Users className="h-5 w-5 text-violet-400" aria-hidden />
                <p className="mt-3 text-3xl font-black tabular-nums text-white sm:text-4xl">
                  <span className="about-counter" data-counter-target={totalMembers}>
                    {formatNumber(totalMembers)}
                  </span>
                </p>
                <p className="mt-1 text-xs font-medium leading-snug text-zinc-400">personnes ont rejoint cette histoire</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-sm transition hover:border-emerald-400/25">
                <LayoutGrid className="h-5 w-5 text-emerald-400" aria-hidden />
                <p className="mt-3 text-3xl font-black tabular-nums text-white sm:text-4xl">
                  <span className="about-counter" data-counter-target={activeMembers}>
                    {formatNumber(activeMembers)}
                  </span>
                </p>
                <p className="mt-1 text-xs font-medium leading-snug text-zinc-400">activité suivie côté communauté</p>
              </article>
              <article className="col-span-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-4">
                <BookOpen className="h-5 w-5 text-amber-300" aria-hidden />
                <p className="mt-2 text-sm font-bold text-amber-100">À lire tranquillement</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  Les chiffres sont là pour donner une échelle — le cœur de TENF, ce sont les interactions quotidiennes sur Discord et Twitch.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Tournant */}
        <section
          id="apropos-tournant"
          className="about-reveal rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-950/40 via-black/40 to-violet-950/20 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40">
              <AlertTriangle className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200/90">Le tournant</p>
              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">Quand « monétiser l’aide » a été refusé</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                La proposition a créé des tensions — et un positionnement clair :{" "}
                <strong className="text-white">ici, l’entraide n’est pas un produit</strong>. Ce choix a coûté en énergie, mais il définit encore aujourd’hui ce qui rend TENF crédible pour celles et ceux qui cherchent du soutien sincère, pas du volume artificiel.
              </p>
            </div>
          </div>
        </section>

        <section className="about-fade-up">
          <blockquote className="rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-950/50 to-black/40 px-6 py-8 text-center shadow-[0_20px_60px_rgba(88,28,135,0.2)] sm:px-10">
            <p className="text-lg font-medium italic leading-relaxed text-white sm:text-xl">
              « On n’a pas commencé avec une roadmap. On a commencé avec des gens qu’on ne voulait pas laisser tomber. »
            </p>
          </blockquote>
        </section>

        {/* Parcours interactif */}
        <section id="apropos-parcours" className="space-y-6 about-reveal">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Parcours</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Comment l’histoire s’est écrite</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Navigue étape par étape — ou touche une carte pour sauter directement à un moment clé.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-5 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
                {storyTimeline.map((step, index) => (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setStoryIdx(index)}
                    className={`shrink-0 rounded-xl border px-4 py-3 text-left transition lg:w-full ${
                      storyIdx === index
                        ? "border-violet-400/55 bg-violet-500/20 text-white ring-1 ring-violet-400/35"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-300/80">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-1 text-sm font-bold">{step.title}</p>
                  </button>
                ))}
              </div>

              <div className="min-h-[220px] flex-1 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-transparent p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-300/90">{story.title}</p>
                <p className="mt-4 text-base leading-relaxed text-zinc-200 sm:text-lg">{story.text}</p>
                <div className="mt-8 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={storyIdx <= 0}
                    onClick={() => setStoryIdx((i) => Math.max(0, i - 1))}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Précédent
                  </button>
                  <div className="flex gap-1.5">
                    {storyTimeline.map((_, i) => (
                      <button
                        key={`dot-${i}`}
                        type="button"
                        aria-label={`Étape ${i + 1}`}
                        onClick={() => setStoryIdx(i)}
                        className={`h-2.5 w-2.5 rounded-full transition ${i === storyIdx ? "scale-125 bg-violet-400" : "bg-zinc-600 hover:bg-zinc-500"}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={storyIdx >= storyTimeline.length - 1}
                    onClick={() => setStoryIdx((i) => Math.min(storyTimeline.length - 1, i + 1))}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Réalité */}
        <section className="space-y-5 about-reveal">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Réalité</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Ce qu’on voit moins, mais qui compte</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: "Des doutes",
                body: "Des moments où arrêter aurait été plus confortable.",
                hue: "border-rose-500/25 bg-rose-950/20",
              },
              {
                title: "Des conflits",
                body: "Des désaccords sérieux sur la direction — émotionnels parfois, mais nécessaires.",
                hue: "border-amber-500/25 bg-amber-950/15",
              },
              {
                title: "Des décisions",
                body: "Le fil rouge : ne jamais transformer l’entraide en business.",
                hue: "border-emerald-500/25 bg-emerald-950/20",
              },
            ].map((card) => (
              <article
                key={card.title}
                className={`about-reveal rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] ${card.hue}`}
              >
                <p className="text-lg font-bold text-white">{card.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Identité interactive */}
        <section id="apropos-identite" className="space-y-6 about-reveal">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Identité</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Une ligne claire</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">Bascule pour comparer ce que TENF refuse et ce qu’elle défend.</p>
          </div>

          <div className="flex justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2">
            <button
              type="button"
              onClick={() => setIdentityFocus("pas")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition sm:flex-none sm:px-8 ${
                identityFocus === "pas"
                  ? "bg-rose-600/25 text-rose-100 ring-1 ring-rose-400/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              TENF n’est pas…
            </button>
            <button
              type="button"
              onClick={() => setIdentityFocus("est")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition sm:flex-none sm:px-8 ${
                identityFocus === "est"
                  ? "bg-emerald-600/25 text-emerald-100 ring-1 ring-emerald-400/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              TENF est…
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article
              className={`rounded-3xl border p-8 transition-all duration-300 ${
                identityFocus === "pas"
                  ? "border-rose-400/45 bg-gradient-to-br from-rose-950/50 to-black/40 shadow-[0_20px_50px_rgba(225,29,72,0.12)]"
                  : "border-white/8 opacity-50 md:opacity-100"
              }`}
            >
              <p className="text-sm font-black uppercase tracking-wide text-rose-300">Limites assumées</p>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-300">
                <li className="flex gap-2">
                  <span className="text-rose-400">✕</span> Un follow-for-follow sans lien réel.
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-400">✕</span> Un serveur passif où personne ne répond.
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-400">✕</span> Une vitrine promo déguisée en entraide.
                </li>
              </ul>
            </article>
            <article
              className={`rounded-3xl border p-8 transition-all duration-300 ${
                identityFocus === "est"
                  ? "border-emerald-400/45 bg-gradient-to-br from-emerald-950/45 to-black/40 shadow-[0_20px_50px_rgba(16,185,129,0.12)]"
                  : "border-white/8 opacity-50 md:opacity-100"
              }`}
            >
              <p className="text-sm font-black uppercase tracking-wide text-emerald-300">Ce qu’on construit</p>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-300">
                <li className="flex gap-2">
                  <span className="text-emerald-400">✓</span> De l’implication concrète au jour le jour.
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">✓</span> Du soutien entre personnes, pas entre « stats ».
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">✓</span> Une progression qui prend le temps — sans coup d’éclat creux.
                </li>
              </ul>
            </article>
          </div>
        </section>

        {/* Fondateurs */}
        <section id="apropos-fondateurs" className="space-y-6 about-reveal">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Fondateurs</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Trois profils qui se complètent</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Touche une carte pour agrandir la citation — puis passe sur Twitch si tu veux voir leur univers.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {foundersWithAvatar.map((founder) => {
              const open = founderOpen === founder.name;
              return (
                <article
                  key={founder.name}
                  className={`about-reveal cursor-pointer rounded-3xl border bg-black/30 p-6 transition hover:border-violet-400/40 ${
                    open ? "border-violet-400/55 ring-1 ring-violet-400/30" : "border-white/10"
                  }`}
                  role="button"
                  tabIndex={0}
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
                    {open ? <X className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden /> : null}
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{founder.personality}</p>
                  <p className={`mt-2 text-sm italic leading-relaxed text-zinc-300 transition ${open ? "" : "line-clamp-3"}`}>
                    « {founder.quote} »
                  </p>
                  <a
                    href={`https://www.twitch.tv/${founder.twitchLogin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-xs font-bold text-white transition hover:brightness-110"
                  >
                    Twitch · {founder.twitchLogin}
                    <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        {/* Différence */}
        <section id="apropos-difference" className="space-y-5 about-reveal">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Différence</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Pourquoi TENF tient dans la durée</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-violet-400/35">
              <HeartHandshake className="h-8 w-8 text-violet-400" aria-hidden />
              <p className="mt-4 text-sm font-semibold leading-relaxed text-zinc-300">
                L’engagement est réel — pas une performance pour les métriques.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-violet-400/35">
              <Users className="h-8 w-8 text-violet-400" aria-hidden />
              <p className="mt-4 text-sm font-semibold leading-relaxed text-zinc-300">
                Un cadre qui sécurise, sans écraser les personnalités.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-violet-400/35">
              <Compass className="h-8 w-8 text-violet-400" aria-hidden />
              <p className="mt-4 text-sm font-semibold leading-relaxed text-zinc-300">
                Une vision long terme plutôt que des pics d’attention éphémères.
              </p>
            </article>
          </div>
        </section>

        {/* Évolution */}
        <section id="apropos-evolution" className="space-y-6 about-reveal">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Évolution</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Les phases de croissance</h2>
            <p className="mt-2 text-sm text-zinc-400">Clique une phase pour afficher le détail.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/25 p-6 sm:p-8">
            <ol className="relative space-y-2">
              {evolution.map((step, index) => {
                const active = evoOpen === index;
                return (
                  <li key={step.date}>
                    <button
                      type="button"
                      onClick={() => setEvoOpen(active ? null : index)}
                      className={`flex w-full flex-col gap-1 rounded-2xl border px-4 py-4 text-left transition sm:flex-row sm:items-center sm:gap-6 ${
                        active
                          ? "border-violet-400/45 bg-violet-500/10 shadow-[0_12px_32px_rgba(88,28,135,0.15)]"
                          : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="shrink-0 text-sm font-black text-violet-300">{step.date}</span>
                      <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:gap-4">
                        <span className="font-bold text-white">{step.phase}</span>
                        <span className={`text-sm text-zinc-400 ${active ? "" : "line-clamp-1 sm:line-clamp-none"}`}>{step.text}</span>
                      </div>
                      <ChevronRight
                        className={`hidden h-5 w-5 shrink-0 text-zinc-500 transition sm:block ${active ? "rotate-90 text-violet-300" : ""}`}
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="about-reveal">
          <div className="rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-950/60 via-black/50 to-fuchsia-950/30 p-8 text-center shadow-[0_28px_70px_rgba(0,0,0,0.45)] sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Et maintenant ?</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-black leading-tight text-white sm:text-4xl">
              La TENF, ce n’est pas « une commu de plus ».
              <span className="mt-2 block text-lg font-semibold text-zinc-300 sm:text-2xl">
                C’est une histoire qu’on écrit ensemble, avec des règles et du cœur.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Que tu passes en curieux·se ou que tu sois déjà membre : si tu cherches du vrai lien, du soutien honnête et des gens qui s’impliquent, tu as ta place dans la discussion.
            </p>
            <div className="mt-10 flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
              <Link
                href="https://discord.gg/WnpazgcZHk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
              >
                Discord TENF
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/decouvrir-createurs"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-8 py-3 text-sm font-bold text-white transition hover:border-violet-400/35"
              >
                Clips à découvrir
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/12 px-8 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
              >
                Accueil
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
