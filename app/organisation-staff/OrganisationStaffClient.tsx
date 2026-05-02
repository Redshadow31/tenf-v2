"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Bot,
  CalendarHeart,
  ChevronDown,
  CircleDot,
  Compass,
  HeartHandshake,
  LayoutDashboard,
  Palette,
  Shield,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Audience = "public" | "member";

const NAV = [
  { id: "staff-journey", label: "Parcours" },
  { id: "staff-governance", label: "Gouvernance" },
  { id: "staff-moderation", label: "Modération" },
  { id: "staff-support", label: "Soutien" },
  { id: "staff-poles", label: "Pôles" },
  { id: "staff-collaborate", label: "Ensemble" },
  { id: "staff-faq", label: "FAQ" },
] as const;

const JOURNEY_STEPS = [
  {
    id: "staff-governance",
    title: "Vision & cadre",
    subtitle: "Direction",
    icon: Compass,
    accent: "rgba(59,130,246,0.9)",
    blurb: "Fondateurs et admins posent le cap et coordonnent les projets.",
  },
  {
    id: "staff-moderation",
    title: "Sécurité & accueil",
    subtitle: "Modération",
    icon: ShieldCheck,
    accent: "rgba(168,85,247,0.95)",
    blurb: "Une équipe répartie entre actifs, formation et pause.",
  },
  {
    id: "staff-poles",
    title: "Projets & outils",
    subtitle: "Pôles",
    icon: Workflow,
    accent: "rgba(234,179,8,0.95)",
    blurb: "Six pôles portent animation, com, formations, tech…",
  },
  {
    id: "staff-support",
    title: "Élan communautaire",
    subtitle: "Soutien TENF",
    icon: HeartHandshake,
    accent: "rgba(34,197,94,0.95)",
    blurb: "Membres très engagés sans rôle de modération active.",
  },
] as const;

const governanceCards = [
  {
    title: "Fondateurs",
    text: "Les fondateurs définissent la vision globale de TENF, les orientations de la communauté et les projets à long terme. Ils assurent aussi la cohérence entre les pôles et veillent au développement de la communauté.",
  },
  {
    title: "Administration & coordination",
    text: "L'équipe d'administration coordonne les activités du serveur, assure le lien entre les pôles et suit le bon déroulement des projets communautaires.",
  },
];

const moderationCards = [
  {
    title: "Modérateurs actifs",
    text: "Les modérateurs actifs assurent le respect des règles, l'accompagnement des membres et le bon fonctionnement quotidien de la communauté.",
  },
  {
    title: "Modérateurs en formation",
    text: "Les modérateurs en formation sont accompagnés progressivement pour apprendre les bases de la modération et monter en compétence.",
  },
  {
    title: "Modérateurs en pause",
    text: "Les modérateurs en pause restent liés à la communauté, mais ne participent pas à la modération active pendant cette période. Ce statut reconnaît leur engagement tout en respectant leur disponibilité.",
  },
];

const supportBullets = [
  "à l'entraide entre streamers",
  "au soutien des différents pôles",
  "à l'organisation de projets et d'événements",
  "à l'accompagnement des membres et des nouveaux arrivants",
];

const poles = [
  {
    title: "Pôle Animation & Événements",
    Icon: CalendarHeart,
    accent: "#ec4899",
    text: "Ce pôle tient les plannings, coordonne les animations et organise les temps forts communautaires pour renforcer les liens entre les membres.",
    memberTip: "Événements, présences, animations : ce pôle pilote le calendrier communautaire.",
  },
  {
    title: "Pôle Communication & Visuels",
    Icon: Palette,
    accent: "#3b82f6",
    text: "Ce pôle gère l'image de TENF sur Discord, le site, les réseaux sociaux et les contenus vidéo. Le design du site reste géré à part.",
    memberTip: "Annonces visuelles et cohérence de la communication externe.",
  },
  {
    title: "Pôle Formation & Coordination Membres",
    Icon: BookOpen,
    accent: "#eab308",
    text: "Ce pôle organise les formations membres, coordonne les sessions d'apprentissage et suit les tickets liés à l'accompagnement communautaire.",
    memberTip: "Parcours membres, montée en compétence et questions d'intégration.",
  },
  {
    title: "Pôle Formation & Coordination Staff",
    Icon: Shield,
    accent: "#f59e0b",
    text: "Ce pôle accompagne l'équipe de modération via les formations staff, le suivi des pratiques et le maintien du cadre de modération.",
    memberTip: "Référent pour les pratiques de modération et la montée en charge du staff.",
  },
  {
    title: "Pôle Technique & Bots",
    Icon: Bot,
    accent: "#a855f7",
    text: "Ce pôle gère les permissions Discord, les bots, les automatisations et la maintenance du site web afin d'assurer la stabilité des outils.",
    memberTip: "Bugs outils, bots, accès techniques : le bon interlocuteur côté tooling.",
  },
  {
    title: "Pôle Accueil & Intégration",
    Icon: UserPlus,
    accent: "#f97316",
    text: "Ce pôle organise l'accueil, les réunions d'intégration et l'accompagnement des nouveaux membres pour faciliter leur inclusion dans TENF.",
    memberTip: "Premiers pas sur le serveur, parcours d'arrivée et inclusion.",
  },
] as const;

const faqItems = [
  {
    q: "Je suis nouveau : à qui m'adresser en premier ?",
    a: "L'accueil et l'intégration sont portés par le pôle dédié ; la modération veille au respect du cadre. Pour une question précise, le salon adapté sur Discord reste le canal le plus rapide.",
  },
  {
    q: "Quelle différence entre modération active et Soutien TENF ?",
    a: "La modération active encadre le serveur au quotidien. Le rôle Soutien TENF permet à des membres très investis d'aider les projets sans exercer cette fonction opérationnelle.",
  },
  {
    q: "Comment savoir qui fait quoi ?",
    a: "L'organigramme interactif liste les membres du staff, leurs rôles et leurs rattachements aux pôles — idéal pour repérer un contact.",
  },
  {
    q: "Les pôles recrutent-ils en continu ?",
    a: "Les besoins varient selon les saisons et les projets. Les opportunités sont généralement annoncées sur le serveur ; rester actif et bienveillant est le meilleur premier pas.",
  },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function OrganisationStaffClient() {
  const [audience, setAudience] = useState<Audience>("public");
  const [activeNav, setActiveNav] = useState<string>(NAV[0].id);
  const [openPole, setOpenPole] = useState<number | null>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const skipSpyUntil = useRef(0);

  const navIds = useMemo(() => NAV.map((n) => n.id), []);

  const updateSpy = useCallback(() => {
    if (typeof window === "undefined") return;
    if (Date.now() < skipSpyUntil.current) return;
    const marker = window.scrollY + 160;
    let current = navIds[0];
    for (const id of navIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) current = id;
    }
    setActiveNav(current);
  }, [navIds]);

  useEffect(() => {
    updateSpy();
    window.addEventListener("scroll", updateSpy, { passive: true });
    window.addEventListener("resize", updateSpy, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateSpy);
      window.removeEventListener("resize", updateSpy);
    };
  }, [updateSpy]);

  const goTo = (id: string) => {
    skipSpyUntil.current = Date.now() + 700;
    setActiveNav(id);
    scrollToId(id);
  };

  const togglePole = (i: number) => {
    setOpenPole((prev) => (prev === i ? null : i));
  };

  const toggleFaq = (i: number) => {
    setOpenFaq((prev) => (prev === i ? null : i));
  };

  return (
    <main className="relative min-h-screen overflow-hidden py-10 sm:py-12" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="org-staff-mesh" aria-hidden="true" />
      <div className="org-staff-glow org-staff-glow-left" aria-hidden="true" />
      <div className="org-staff-glow org-staff-glow-right" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-3xl border p-8 sm:p-10 lg:p-14 org-staff-fade-up"
          style={{
            borderColor: "var(--color-border)",
            background:
              "radial-gradient(120% 130% at 10% 0%, rgba(59,130,246,0.22), rgba(15,23,42,0.15) 38%, rgba(2,6,23,0.82) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl opacity-90"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 40%, transparent), transparent 72%)",
            }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-primary)" }}>
                Organisation · Staff TENF
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-5xl md:leading-tight" style={{ color: "var(--color-text)" }}>
                Une communauté portée par des bénévoles structurés
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
                Visiteur ou membre : comprends en un coup d&apos;œil comment TENF fonctionne — gouvernance, modération,
                pôles projet et rôle de soutien — avant d&apos;approfondir avec l&apos;organigramme interactif.
              </p>

              <div
                className="mt-8 inline-flex rounded-2xl border p-1"
                style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.35)" }}
                role="tablist"
                aria-label="Profil de lecture"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={audience === "public"}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: audience === "public" ? "var(--color-primary)" : "transparent",
                    color: audience === "public" ? "white" : "var(--color-text-secondary)",
                  }}
                  onClick={() => setAudience("public")}
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={16} aria-hidden />
                    Je découvre TENF
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={audience === "member"}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: audience === "member" ? "var(--color-primary)" : "transparent",
                    color: audience === "member" ? "white" : "var(--color-text-secondary)",
                  }}
                  onClick={() => setAudience("member")}
                >
                  <span className="inline-flex items-center gap-2">
                    <Users size={16} aria-hidden />
                    Je suis membre
                  </span>
                </button>
              </div>

              <div
                className="mt-4 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5"
                style={{ borderColor: "rgba(59,130,246,0.25)", backgroundColor: "rgba(15,23,42,0.45)" }}
              >
                {audience === "public" ? (
                  <p className="text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    <strong style={{ color: "var(--color-text)" }}>Pour le grand public :</strong> cette page résume les
                    responsabilités sans entrer dans les détails internes. Pour voir les visages et rôles réels, ouvre
                    l&apos;organigramme — il est filtrable par équipe et par pôle.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    <strong style={{ color: "var(--color-text)" }}>Pour les membres :</strong> utilise les ancres ci-dessous
                    pour retrouver rapidement qui porte quoi. Les cartes pôles incluent une ligne « repère » pour
                    t&apos;orienter au quotidien sur Discord.
                  </p>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/organisation-staff/organigramme"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--color-primary)", color: "white", boxShadow: "0 12px 30px rgba(59,130,246,0.25)" }}
                >
                  Organigramme interactif
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => goTo("staff-journey")}
                  className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Parcourir la structure
                  <ArrowDown size={16} aria-hidden />
                </button>
                {audience === "member" ? (
                  <Link
                    href="/member/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  >
                    <LayoutDashboard size={16} aria-hidden />
                    Espace membre
                  </Link>
                ) : (
                  <Link
                    href="/fonctionnement-tenf/decouvrir"
                    className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  >
                    Fonctionnement TENF
                    <ArrowRight size={14} aria-hidden />
                  </Link>
                )}
              </div>
            </div>

            {/* Mini stats visuelles */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { label: "Pôles actifs", value: "6", hint: "Animation à l'intégration" },
                { label: "Familles de rôles", value: "4+", hint: "Direction, modération, soutien…" },
                { label: "Carte live", value: "Organigramme", hint: "Filtres rôle & pôle", link: "/organisation-staff/organigramme" },
                { label: "Esprit", value: "Bénévolat", hint: "Structure horizontale" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="org-staff-stat rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(2,6,23,0.5)" }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
                    {card.label}
                  </p>
                  {card.link ? (
                    <Link
                      href={card.link}
                      className="mt-1 block text-xl font-bold hover:underline"
                      style={{ color: "var(--color-text)" }}
                    >
                      {card.value}
                    </Link>
                  ) : (
                    <p className="mt-1 text-xl font-bold" style={{ color: "var(--color-text)" }}>
                      {card.value}
                    </p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {card.hint}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sticky nav */}
        <nav
          className="org-staff-nav sticky top-3 z-30 -mx-1 rounded-2xl border px-2 py-2 shadow-lg sm:top-4"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "color-mix(in srgb, var(--color-bg) 82%, transparent)",
            backdropFilter: "blur(12px)",
          }}
          aria-label="Sections de la page"
        >
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin sm:flex-wrap sm:overflow-visible sm:pb-0">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(item.id)}
                className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm"
                style={{
                  backgroundColor: activeNav === item.id ? "var(--color-primary)" : "transparent",
                  color: activeNav === item.id ? "white" : "var(--color-text-secondary)",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Parcours visuel */}
        <section id="staff-journey" className="scroll-mt-28 space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Lecture guidée
              </p>
              <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
                Du cadre aux projets : un flux simple
              </h2>
              <p className="mt-2 max-w-2xl text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Clique une étape pour sauter à la section correspondante. Sur mobile, fais défiler horizontalement les cartes.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:pb-0 md:snap-none">
              {JOURNEY_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="relative min-w-[78%] snap-center sm:min-w-[260px] md:min-w-0">
                    {i < JOURNEY_STEPS.length - 1 ? (
                      <div
                        className="pointer-events-none absolute right-[-10px] top-[52px] z-0 hidden h-[2px] w-[calc(100%+10px)] md:block"
                        style={{
                          background: `linear-gradient(90deg, ${step.accent}, transparent)`,
                          opacity: 0.45,
                        }}
                        aria-hidden
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => goTo(step.id)}
                      className="org-staff-step relative z-[1] flex h-full w-full flex-col rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                      style={{
                        borderColor: `${step.accent}55`,
                        background: `linear-gradient(145deg, ${step.accent}22, rgba(15,23,42,0.92) 42%, rgba(2,6,23,0.96) 100%)`,
                        boxShadow: "0 16px 36px rgba(2,6,23,0.28)",
                      }}
                    >
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${step.accent}33`, color: step.accent }}
                      >
                        <Icon size={22} strokeWidth={2} aria-hidden />
                      </span>
                      <span className="mt-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: step.accent }}>
                        {step.subtitle}
                      </span>
                      <span className="mt-1 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                        {step.title}
                      </span>
                      <span className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                        {step.blurb}
                      </span>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: step.accent }}>
                        Voir la section
                        <ArrowRight size={14} aria-hidden />
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Gouvernance */}
        <section id="staff-governance" className="scroll-mt-28 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Gouvernance
          </p>
          <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
            Direction de la communauté
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {governanceCards.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <h3 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                  <CircleDot size={18} style={{ color: "var(--color-primary)" }} aria-hidden />
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Modération */}
        <section id="staff-moderation" className="scroll-mt-28 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Encadrement
          </p>
          <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
            Équipe de modération
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {moderationCards.map((item, idx) => (
              <article
                key={item.title}
                className="org-staff-card rounded-2xl border p-6"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-card)",
                  animationDelay: `${idx * 70}ms`,
                }}
              >
                <h3 className="flex items-center gap-2 text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  <ShieldCheck size={18} style={{ color: "var(--color-primary)" }} aria-hidden />
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Soutien */}
        <section
          id="staff-support"
          className="scroll-mt-28 rounded-3xl border p-6 md:p-10"
          style={{
            borderColor: "rgba(34,197,94,0.35)",
            background:
              "linear-gradient(135deg, rgba(22,163,74,0.16), rgba(15,23,42,0.88) 38%, rgba(2,6,23,0.96) 100%)",
          }}
        >
          <p
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ borderColor: "rgba(34,197,94,0.45)", color: "#86efac", backgroundColor: "rgba(34,197,94,0.12)" }}
          >
            <HeartHandshake size={14} aria-hidden />
            Soutien communautaire
          </p>
          <h2 className="mt-3 text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
            Rôle « Soutien TENF »
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Le rôle regroupe des membres particulièrement impliqués : anciens modérateurs ou membres actifs qui souhaitent
            continuer à soutenir TENF sans exercer une modération active au quotidien.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {supportBullets.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border px-4 py-3"
                style={{ borderColor: "rgba(34,197,94,0.25)", backgroundColor: "rgba(2,6,23,0.35)" }}
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#86efac" }} aria-hidden />
                <span style={{ color: "var(--color-text-secondary)" }}>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Ce rôle est distinct de la modération active et représente un pilier important de la dynamique communautaire.
          </p>
        </section>

        {/* Pôles accordéon */}
        <section id="staff-poles" className="scroll-mt-28 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Organisation interne
          </p>
          <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
            Les six pôles TENF
          </h2>
          <p className="max-w-3xl leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Chaque pôle est une équipe de bénévoles : ouvre une carte pour le détail.{" "}
            {audience === "member" ? "La ligne « Repère membre » résume l'usage au quotidien." : null}
          </p>

          <div className="space-y-3">
            {poles.map((pole, i) => {
              const Icon = pole.Icon;
              const expanded = openPole === i;
              return (
                <div
                  key={pole.title}
                  className="overflow-hidden rounded-2xl border transition-shadow duration-200"
                  style={{
                    borderColor: expanded ? `${pole.accent}88` : `${pole.accent}44`,
                    background: expanded
                      ? `linear-gradient(135deg, ${pole.accent}28, rgba(15,23,42,0.95) 45%, rgba(2,6,23,0.98) 100%)`
                      : `linear-gradient(135deg, ${pole.accent}14, rgba(15,23,42,0.92) 50%, rgba(2,6,23,0.96) 100%)`,
                    boxShadow: expanded ? `0 18px 40px ${pole.accent}22` : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => togglePole(i)}
                    className="flex w-full items-start gap-4 p-5 text-left"
                    aria-expanded={expanded}
                  >
                    <span
                      className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${pole.accent}35`, color: pole.accent }}
                    >
                      <Icon size={24} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                        {pole.title}
                      </span>
                      <span className="mt-1 line-clamp-2 text-sm md:line-clamp-none" style={{ color: "var(--color-text-secondary)" }}>
                        {pole.text}
                      </span>
                    </span>
                    <ChevronDown
                      size={22}
                      className="mt-1 shrink-0 transition-transform duration-200"
                      style={{
                        color: pole.accent,
                        transform: expanded ? "rotate(180deg)" : undefined,
                      }}
                      aria-hidden
                    />
                  </button>
                  {expanded ? (
                    <div className="border-t px-5 pb-5 pt-0" style={{ borderColor: `${pole.accent}33` }}>
                      <p className="pt-4 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                        {pole.text}
                      </p>
                      {audience === "member" ? (
                        <div
                          className="mt-4 rounded-xl border px-4 py-3 text-sm"
                          style={{ borderColor: `${pole.accent}44`, backgroundColor: "rgba(2,6,23,0.45)" }}
                        >
                          <span className="font-semibold" style={{ color: pole.accent }}>
                            Repère membre ·{" "}
                          </span>
                          <span style={{ color: "var(--color-text-secondary)" }}>{pole.memberTip}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Collaboratif + CTA */}
        <section
          id="staff-collaborate"
          className="scroll-mt-28 rounded-3xl border p-6 md:p-10"
          style={{
            borderColor: "var(--color-border)",
            background: "linear-gradient(120deg, rgba(59,130,246,0.18), rgba(2,6,23,0.92) 48%, rgba(124,58,237,0.2) 100%)",
          }}
        >
          <h2 className="flex flex-wrap items-center gap-2 text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
            <Workflow size={26} className="shrink-0" style={{ color: "var(--color-primary)" }} aria-hidden />
            Fonctionnement collaboratif
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Chaque pôle travaille en lien avec les autres pour garder une communauté dynamique, structurée et bienveillante.
            Cette organisation permet à TENF de porter des projets collectifs tout en offrant un cadre stable aux créateurs et aux membres.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/organisation-staff/organigramme"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
            >
              Voir l&apos;organigramme staff
              <ArrowRight size={15} aria-hidden />
            </Link>
            <Link
              href="/a-propos"
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Découvrir la communauté
            </Link>
            <Link
              href="/fonctionnement-tenf/decouvrir"
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Fonctionnement TENF
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="staff-faq" className="scroll-mt-28 space-y-4 pb-8">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Questions fréquentes
          </p>
          <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--color-text)" }}>
            Membres & curieux : les bases
          </h2>
          <div className="space-y-2">
            {faqItems.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(i)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                      {item.q}
                    </span>
                    <ChevronDown
                      size={20}
                      className="shrink-0 transition-transform duration-200"
                      style={{
                        color: "var(--color-primary)",
                        transform: open ? "rotate(180deg)" : undefined,
                      }}
                      aria-hidden
                    />
                  </button>
                  {open ? (
                    <div className="border-t px-5 pb-5 pt-0" style={{ borderColor: "var(--color-border)" }}>
                      <p className="pt-4 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                        {item.a}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <style jsx>{`
        .org-staff-mesh {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.35;
          background-image:
            radial-gradient(circle at 18% 18%, rgba(59, 130, 246, 0.14), transparent 38%),
            radial-gradient(circle at 82% 12%, rgba(99, 102, 241, 0.12), transparent 32%),
            radial-gradient(circle at 72% 78%, rgba(168, 85, 247, 0.1), transparent 38%);
        }

        .org-staff-glow {
          position: absolute;
          width: 320px;
          height: 320px;
          filter: blur(88px);
          pointer-events: none;
          opacity: 0.22;
          animation: orgStaffFloat 9s ease-in-out infinite;
        }

        .org-staff-glow-left {
          left: -140px;
          top: 120px;
          background: rgba(59, 130, 246, 0.4);
        }

        .org-staff-glow-right {
          right: -140px;
          bottom: 80px;
          background: rgba(124, 58, 237, 0.42);
          animation-delay: 1.4s;
        }

        .org-staff-fade-up {
          opacity: 0;
          transform: translateY(12px);
          animation: orgStaffFadeUp 0.6s ease forwards;
        }

        .org-staff-stat:focus-within,
        .org-staff-step:focus-visible {
          outline: none;
        }

        .org-staff-card {
          opacity: 0;
          transform: translateY(10px);
          animation: orgStaffCardIn 0.5s ease forwards;
        }

        @keyframes orgStaffFadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orgStaffCardIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes orgStaffFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-16px);
          }
        }
      `}</style>
    </main>
  );
}
