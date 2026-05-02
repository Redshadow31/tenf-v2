"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronDown,
  Compass,
  ExternalLink,
  HeartHandshake,
  LayoutDashboard,
  LineChart,
  MessageCircle,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import styles from "@/app/fonctionnement-tenf/fonctionnement.module.css";

const SECTION_IDS = [
  { id: "decouvrir-audience", label: "Pour qui ?" },
  { id: "decouvrir-piliers", label: "4 piliers" },
  { id: "decouvrir-parcours", label: "3 mouvements" },
  { id: "decouvrir-hub", label: "Liens utiles" },
  { id: "decouvrir-suite", label: "Aller plus loin" },
] as const;

const benefits = [
  {
    title: "Entraide réelle",
    text: "Retours sur tes lives, raids et présence quand tu en as besoin — pas une promo vide.",
    detail:
      "On privilégie les échanges concrets : feedback sur des extraits, questionnement sur ton setup ou ton rythme, présence quand tu annonces un live important. L’objectif n’est pas le vanity metric, mais que tu sentes un filet de sécurité autour de ta chaîne.",
    Icon: HeartHandshake,
  },
  {
    title: "Progression suivie",
    text: "Évaluations régulières, points selon ton implication et usage en boutique pour booster ta chaîne.",
    detail:
      "Des points reflètent ta participation (Discord, raids, événements…). Ils servent de répères — pas de jugement public — et peuvent débloquer des avantages en boutique. Les évaluations permettent au staff d’ajuster le cadre et de t’accompagner dans la durée.",
    Icon: LineChart,
  },
  {
    title: "Cadre bienveillant",
    text: "Règles claires, staff disponible et événements pensés pour créer du lien sans toxicité.",
    detail:
      "Des règles lisibles, des canaux dédiés et une équipe présente pour arbitrer. Les temps communautaires (soirées, ateliers, spotlights) sont pensés pour inclure sans mettre la pression : tu progresses à ton rythme.",
    Icon: ShieldCheck,
  },
  {
    title: "Visibilité collective",
    text: "Spotlights, films communautaires et agenda : des moments pour te faire connaître au bon moment.",
    detail:
      "L’agenda public et les événements TENF créent des créneaux où la communauté regarde ensemble. Les spotlights et projets collectifs sont des opportunités de te montrer dans un contexte encadré — utile quand tu cartographies ta découverte.",
    Icon: Radio,
  },
] as const;

const miniSteps = [
  {
    title: "Rejoindre & te présenter",
    short: "Profil, Discord, premiers repères — tu n’es pas seul face au serveur.",
    Icon: Users,
    href: "/fonctionnement-tenf/comment-ca-marche",
  },
  {
    title: "Participer au quotidien",
    short: "Discussions, raids, événements : l’entraide devient un réflexe, pas une exception.",
    Icon: MessageCircle,
    href: "/fonctionnement-tenf/comment-ca-marche",
  },
  {
    title: "Progresser avec le collectif",
    short: "Points, suivis, ressources — pour cadrer ta progression sans streamer dans le vide.",
    Icon: Rocket,
    href: "/fonctionnement-tenf/progression",
  },
] as const;

type HubLink = {
  href: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
  memberHint?: boolean;
};

const hubLinks: HubLink[] = [
  {
    href: "/fonctionnement-tenf/comment-ca-marche",
    label: "Comment ça marche",
    hint: "Les 3 étapes détaillées",
    Icon: Compass,
  },
  {
    href: "/fonctionnement-tenf/progression",
    label: "Ta progression",
    hint: "Points, capes, objectifs",
    Icon: LineChart,
  },
  {
    href: "/events2",
    label: "Calendrier événements",
    hint: "Public — inscriptions membres",
    Icon: Calendar,
  },
  {
    href: "/lives",
    label: "Lives & planning",
    hint: "Découvrir qui stream",
    Icon: Radio,
  },
  {
    href: "/membres",
    label: "Annuaire membres",
    hint: "Profils & chaînes Twitch",
    Icon: Users,
  },
  {
    href: "/a-propos",
    label: "À propos de TENF",
    hint: "Histoire & valeurs",
    Icon: BookOpen,
  },
  {
    href: "/rejoindre/guide-public",
    label: "Rejoindre TENF",
    hint: "Guides & FAQ entrée",
    Icon: Sparkles,
  },
  {
    href: "/member/dashboard",
    label: "Espace membre",
    hint: "Dashboard (connecté)",
    Icon: LayoutDashboard,
    memberHint: true,
  },
];

type Audience = "public" | "membre";

export default function DecouvrirTenfInteractive() {
  const [audience, setAudience] = useState<Audience>("public");
  const [activeSection, setActiveSection] = useState<string>(SECTION_IDS[0].id);

  useEffect(() => {
    const nodes = SECTION_IDS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { root: null, rootMargin: "-42% 0px -48% 0px", threshold: [0, 0.12, 0.25, 0.5] },
    );

    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <nav className={`${styles.fnDiscoverJumpNav} mb-8`} aria-label="Sections de la page Découvrir">
        <div className="flex min-w-min gap-1.5 px-0.5 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          {SECTION_IDS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToId(id)}
              className={`${styles.fnDiscoverJumpLink} ${activeSection === id ? styles.fnDiscoverJumpLinkActive : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <section id="decouvrir-audience" className="scroll-mt-[5.5rem] space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className={styles.fnSectionTitle}>Tu es plutôt…</h2>
            <p className={styles.fnSectionLead}>
              La même TENF, deux angles : curieux du projet ou déjà dans la boucle. Choisis pour afficher des repères adaptés.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setAudience("public")}
            className={`rounded-2xl border px-4 py-4 text-left transition-all ${
              audience === "public"
                ? "border-[color-mix(in_srgb,var(--fn-purple)_55%,var(--color-border))] bg-[color-mix(in_srgb,var(--fn-purple)_14%,transparent)] shadow-[0_0_32px_color-mix(in_srgb,var(--fn-purple)_18%,transparent)]"
                : "border-[color-mix(in_srgb,var(--color-border)_90%,var(--fn-purple))] bg-[color-mix(in_srgb,var(--color-card)_85%,transparent)] hover:border-[color-mix(in_srgb,var(--fn-purple)_35%,var(--color-border))]"
            }`}
          >
            <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--fn-purple)_88%,#fff)]">
              <Compass className="h-4 w-4" aria-hidden />
              Grand public & curieux
            </span>
            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">Je découvre TENF sans encore être membre</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Parcours lisibles, pages publiques et Discord pour observer l’ambiance avant de t’engager.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setAudience("membre")}
            className={`rounded-2xl border px-4 py-4 text-left transition-all ${
              audience === "membre"
                ? "border-[color-mix(in_srgb,var(--fn-purple)_55%,var(--color-border))] bg-[color-mix(in_srgb,var(--fn-purple)_14%,transparent)] shadow-[0_0_32px_color-mix(in_srgb,var(--fn-purple)_18%,transparent)]"
                : "border-[color-mix(in_srgb,var(--color-border)_90%,var(--fn-purple))] bg-[color-mix(in_srgb,var(--color-card)_85%,transparent)] hover:border-[color-mix(in_srgb,var(--fn-purple)_35%,var(--color-border))]"
            }`}
          >
            <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--fn-purple)_88%,#fff)]">
              <Sparkles className="h-4 w-4" aria-hidden />
              Membre TENF
            </span>
            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">Je suis dans Discord / l’espace membre</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Raccourcis vers agenda, progression et outils pour gagner du temps au quotidien.
            </p>
          </button>
        </div>

        {audience === "public" ? (
          <div className={styles.fnGuidanceSection}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[color-mix(in_srgb,var(--fn-purple)_35%,transparent)] bg-[color-mix(in_srgb,var(--fn-purple)_12%,transparent)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[color-mix(in_srgb,var(--fn-purple)_92%,#fff)]">
                Parcours recommandé
              </span>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fn-purple)]" aria-hidden />
                Lis cette page pour la promesse TENF, puis enchaîne sur <strong className="text-[var(--color-text)]">Comment ça marche</strong> pour
                le pas-à-pas.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fn-purple)]" aria-hidden />
                Jette un œil au <strong className="text-[var(--color-text)]">calendrier public</strong> et aux lives : tu verras la communauté en
                action.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fn-purple)]" aria-hidden />
                Quand tu es prêt·e, le <strong className="text-[var(--color-text)]">guide pour rejoindre</strong> centralise les étapes officielles.
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/fonctionnement-tenf/comment-ca-marche" className={styles.fnBtnPrimary}>
                Les 3 étapes
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/events2" className={styles.fnBtnGhost}>
                Voir les événements
              </Link>
              <Link href="/rejoindre/guide-public" className={styles.fnBtnGhost}>
                Guide rejoindre
              </Link>
            </div>
          </div>
        ) : (
          <div className={`${styles.fnLiveStrip} flex-col items-stretch sm:flex-row sm:items-center`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={styles.fnLiveDot} aria-hidden />
              <span className={styles.fnLiveText}>Espace membre actif — garde tes repères sous la main</span>
            </div>
            <span className={`${styles.fnLiveBadge} sm:ml-0`}>TENF</span>
            <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
              <Link
                href="/member/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,#4ade80_40%,transparent)] bg-[color-mix(in_srgb,#14532d_35%,transparent)] px-3 py-1.5 text-xs font-semibold text-[#bbf7d0] hover:bg-[color-mix(in_srgb,#14532d_55%,transparent)]"
              >
                <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                Dashboard
              </Link>
              <Link
                href="/member/evenements"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,#4ade80_40%,transparent)] bg-[color-mix(in_srgb,#14532d_35%,transparent)] px-3 py-1.5 text-xs font-semibold text-[#bbf7d0] hover:bg-[color-mix(in_srgb,#14532d_55%,transparent)]"
              >
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                Agenda TENF
              </Link>
              <Link
                href="/fonctionnement-tenf/progression"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,#4ade80_40%,transparent)] bg-[color-mix(in_srgb,#14532d_35%,transparent)] px-3 py-1.5 text-xs font-semibold text-[#bbf7d0] hover:bg-[color-mix(in_srgb,#14532d_55%,transparent)]"
              >
                <LineChart className="h-3.5 w-3.5" aria-hidden />
                Progression
              </Link>
            </div>
          </div>
        )}
      </section>

      <section id="decouvrir-piliers" className="scroll-mt-[5.5rem] space-y-8">
        <div>
          <h2 className={styles.fnSectionTitle}>Ce que tu y gagnes concrètement</h2>
          <p className={styles.fnSectionLead}>
            Quatre piliers pensés pour les créateurs qui veulent progresser sans streamer dans le vide. Ouvre « Approfondir » pour le détail — même
            pattern que sur <strong className="font-semibold text-[var(--color-text)]">Comment ça marche</strong>.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {benefits.map((b) => (
            <article key={b.title} className={`${styles.fnCard} ${styles.fnCardPad} ${styles.fnCardInteractive} flex flex-col`}>
              <div className="flex gap-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-[0_0_22px_color-mix(in_srgb,var(--fn-purple)_22%,transparent)]"
                  style={{
                    borderColor: "color-mix(in srgb, var(--fn-purple) 35%, transparent)",
                    background: "linear-gradient(145deg, color-mix(in srgb, var(--fn-purple) 28%, transparent), color-mix(in srgb, #5da9ff 12%, transparent))",
                    color: "#f5f3ff",
                  }}
                  aria-hidden
                >
                  <b.Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold tracking-tight text-[var(--color-text)]">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-text-secondary)_96%,#c4b5fd)]">{b.text}</p>
                </div>
              </div>
              <details className={`group/details ${styles.fnDetailsLite} mt-5`}>
                <summary className="flex items-center justify-between gap-2">
                  <span>Approfondir</span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 opacity-70 transition-transform group-open/details:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className={styles.fnDetailsInner}>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{b.detail}</p>
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section id="decouvrir-parcours" className="scroll-mt-[5.5rem] space-y-6" aria-labelledby="parcours-mini-heading">
        <div>
          <h2 id="parcours-mini-heading" className={styles.fnSectionTitle}>
            Les trois mouvements (version express)
          </h2>
          <p className={styles.fnSectionLead}>
            Résumé aligné sur le parcours officiel. Clique « Suite » pour la page détaillée correspondante.
          </p>
        </div>
        <div className={styles.fnStepList}>
          {miniSteps.map((step, index) => (
            <div key={step.title} className={styles.fnStepRow}>
              <div className={styles.fnStepRail}>
                <div className={styles.fnStepBadge} aria-hidden>
                  <step.Icon className="h-[17px] w-[17px]" strokeWidth={2.25} />
                </div>
                {index < miniSteps.length - 1 ? <div className={styles.fnStepLine} aria-hidden /> : null}
              </div>
              <article className={`${styles.fnCard} ${styles.fnCardPad} flex min-h-0 flex-col`}>
                <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--fn-purple)_88%,#fff)]">
                  Mouvement {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-bold tracking-tight text-[var(--color-text)]">{step.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{step.short}</p>
                <Link
                  href={step.href}
                  className={`${styles.fnBtnGhost} mt-4 inline-flex w-fit items-center gap-2 border-[color-mix(in_srgb,var(--fn-purple)_32%,var(--color-border))]`}
                >
                  Voir la suite
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section id="decouvrir-hub" className="scroll-mt-[5.5rem] space-y-6">
        <div>
          <h2 className={styles.fnSectionTitle}>Carte des pages utiles</h2>
          <p className={styles.fnSectionLead}>
            Les mêmes liens que tu retrouves sur le site public — regroupés pour éviter les allers-retours. Tu peux les ouvrir dans un nouvel onglet si
            tu compares les infos.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hubLinks.map((item) => {
            const isExternal = item.href.startsWith("http");
            return (
              <Link
                key={item.href}
                href={item.href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`${styles.fnCard} ${styles.fnCardPad} ${styles.fnCardInteractive} group flex flex-col`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_30%,transparent)] bg-[color-mix(in_srgb,var(--fn-purple)_16%,transparent)] text-[#e9d5ff]"
                    aria-hidden
                  >
                    <item.Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  {item.memberHint ? (
                    <span className="rounded-full border border-[color-mix(in_srgb,var(--fn-purple)_28%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--fn-purple)_90%,#fff)]">
                      Membre
                    </span>
                  ) : null}
                </div>
                <span className="mt-3 text-sm font-bold text-[var(--color-text)] group-hover:text-[color-mix(in_srgb,var(--fn-purple)_95%,#fff)]">
                  {item.label}
                </span>
                <span className="mt-1 text-xs leading-snug text-[var(--color-text-secondary)]">{item.hint}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]">
                  {isExternal ? "Ouvrir" : "Voir"}
                  {isExternal ? (
                    <ExternalLink className="h-3 w-3 opacity-80" aria-hidden />
                  ) : (
                    <ArrowRight className="h-3 w-3 opacity-80" aria-hidden />
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="decouvrir-suite" className="scroll-mt-[5.5rem] space-y-6">
        <div
          className={`${styles.fnCard} ${styles.fnCardPad} relative overflow-hidden`}
          style={{
            background:
              "linear-gradient(155deg, color-mix(in srgb, var(--fn-purple) 14%, transparent), transparent 45%), linear-gradient(165deg, var(--fn-card-bg), color-mix(in srgb, var(--color-card) 94%, #07040f))",
          }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
            style={{ background: "color-mix(in srgb, var(--fn-purple) 45%, transparent)" }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className={styles.fnSectionTitle}>Parcours complet (onglets)</h2>
              <p className={`${styles.fnSectionLead} max-w-xl`}>
                Tu préfères tout lire d’une traite, comme l’ancienne expérience ? Le parcours à onglets regroupe évaluation, rôles, FAQ et ressources
                dans l’ordre d’origine.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Link href="/fonctionnement-tenf/parcours-complet" className={styles.fnBtnPrimary}>
                Ouvrir le parcours complet
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/fonctionnement-tenf/faq" className={styles.fnBtnGhost}>
                FAQ fonctionnement
              </Link>
            </div>
          </div>
        </div>

        <div className={`${styles.fnMutedCard} text-center md:text-left`}>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            Besoin d’un contact humain ? Le Discord TENF reste le lieu des annonces et des réponses rapides du staff.
          </p>
          <Link
            href="https://discord.gg/WnpazgcZHk"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.fnBtnGhost} mt-4 inline-flex border-[color-mix(in_srgb,var(--fn-purple)_35%,var(--color-border))]`}
          >
            Rejoindre le Discord
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <div className={styles.fnFlowFooter}>
        <p className="text-sm text-[var(--color-text-secondary)]">Étape suivante : les trois mouvements détaillés du début de parcours.</p>
        <Link href="/fonctionnement-tenf/comment-ca-marche" className={`${styles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
          Comment ça marche →
        </Link>
      </div>
    </>
  );
}
