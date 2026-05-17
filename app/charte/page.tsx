import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, MicOff, XCircle } from "lucide-react";
import type { CSSProperties } from "react";
import AboutPageEnhancer from "@/components/about/AboutPageEnhancer";
import Hero from "./_components/Hero";
import SectionHeader from "./_components/SectionHeader";
import FinalCta from "./_components/FinalCta";
import ChartePageClient from "./_components/ChartePageClient";
import {
  confidentialityRules,
  conflictRules,
  encouraged,
  entraideCards,
  integrationBlocks,
  pauseBlocks,
  promotionRules,
  refused,
  rights,
  sanctions,
  values,
  vocalImportantRules,
  vocalRules,
} from "./_data";

// ============================================================
// Metadata
// ============================================================
export const metadata: Metadata = {
  title: "Charte communautaire — TENF",
  description:
    "La charte de Twitch Entraide New Family : valeurs, comportements encouragés et interdits, confidentialité, règles vocales, intégration, sanctions et droits des membres. Un cadre clair, ferme et humain.",
  alternates: {
    canonical: "https://tenf-community.com/charte",
  },
  openGraph: {
    title: "Charte communautaire — TENF",
    description:
      "Cadre clair pour que l'entraide TENF reste humaine, respectueuse et utile à tous : valeurs, règles vocales, confidentialité, sanctions et droits des membres.",
    url: "https://tenf-community.com/charte",
    type: "website",
    siteName: "TENF New Family",
  },
  twitter: {
    card: "summary_large_image",
    title: "Charte communautaire — TENF",
    description:
      "Le cadre officiel de la communauté Twitch Entraide New Family : entraide, respect, confidentialité, sanctions et droits.",
  },
  keywords: [
    "charte TENF",
    "règles communauté streamer",
    "discord twitch francophone",
    "confidentialité streamer",
    "communauté entraide twitch",
  ],
};

/**
 * Wrapper fluide : la page gère ses propres marges intérieures pour
 * utiliser tout l'espace libre à droite de la sidebar et rester
 * scalable au zoom navigateur.
 */
const PAGE_OUTER_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--charte-px": "clamp(0.75rem, 2vw, 2.5rem)",
  paddingLeft: "var(--charte-px)",
  paddingRight: "var(--charte-px)",
  paddingTop: "clamp(1rem, 2vw, 2rem)",
  paddingBottom: "clamp(2rem, 3vw, 3.5rem)",
};

const PAGE_INNER_STYLE: CSSProperties = {
  maxWidth: "min(120rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

// ============================================================
// Page Charte — Hub des règles publiques
// ============================================================
export default function ChartePage() {
  return (
    <main className="home-page min-h-screen" style={PAGE_OUTER_STYLE}>
      <div style={PAGE_INNER_STYLE} className="home-page-inner flex w-full flex-col">
        {/* 1. Hero */}
        <Hero />

        {/* Layout 2 colonnes sur xl : sommaire sticky à gauche + contenu à droite */}
        <div className="mt-8 grid grid-cols-1 gap-8 xl:mt-10 xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-12 2xl:grid-cols-[20rem_minmax(0,1fr)]">
          {/* Sommaire — sticky sur xl */}
          <aside id="charte-sommaire" className="scroll-mt-28">
            <ChartePageClient />
          </aside>

          {/* Contenu principal */}
          <div className="space-y-10 sm:space-y-14">
            {/* 2. Introduction — pourquoi cette charte */}
            <section
              id="introduction"
              className="about-fade-up scroll-mt-28 space-y-4"
            >
              <SectionHeader
                kicker="1. Pourquoi cette charte existe"
                title="Un cadre humain, pas un règlement administratif"
              />
              <div
                className="space-y-3 text-sm leading-relaxed sm:text-base"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <p>
                  TENF n&apos;est pas un Discord ouvert au hasard. C&apos;est un projet construit autour d&apos;une promesse : t&apos;aider à avancer entouré·e de vrais créateurs et créatrices, dans un espace où l&apos;on s&apos;écoute et où l&apos;on se respecte.
                </p>
                <p>
                  Cette charte protège ce projet. Elle existe pour{" "}
                  <strong style={{ color: "var(--color-text)" }}>éviter les abus</strong>,{" "}
                  <strong style={{ color: "var(--color-text)" }}>rassurer les nouveaux arrivants</strong> et{" "}
                  <strong style={{ color: "var(--color-text)" }}>préserver l&apos;esprit New Family</strong>. Sans elle, ce sont les plus bruyants ou les plus opportunistes qui dictent le ton — et ce n&apos;est pas ce qu&apos;on veut.
                </p>
                <p>
                  Elle est volontairement courte, claire et honnête. Aucune formule ronflante : juste ce qui fait tenir une vraie communauté d&apos;entraide.
                </p>
              </div>
            </section>

            {/* 3. Valeurs (6 piliers) */}
            <section id="valeurs" className="about-fade-up scroll-mt-28 space-y-5 sm:space-y-7">
              <SectionHeader
                kicker="2. Les valeurs de la New Family"
                title="Six piliers qui guident toutes nos décisions"
                lead="Quand une situation est ambiguë, c'est sur ces valeurs qu'on s'appuie — pas sur des règles à la lettre."
              />
              <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3">
                {values.map((item) => (
                  <li key={item.title}>
                    <article className="about-reveal home-stat-card group h-full rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                        }}
                        aria-hidden
                      >
                        <item.icon
                          className="h-5 w-5"
                          strokeWidth={2.25}
                          style={{ color: "var(--color-primary)" }}
                        />
                      </span>
                      <h3 className="mt-3 text-base font-bold sm:text-lg">{item.title}</h3>
                      <p className="home-muted mt-2 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            {/* 4. Ce que TENF encourage */}
            <section id="encourage" className="about-fade-up scroll-mt-28 space-y-4">
              <SectionHeader
                kicker="3. Ce que TENF encourage"
                title="Les comportements qui font vivre la communauté"
                lead="Pas une checklist scolaire, juste les réflexes naturels d'une bonne entraide."
              />
              <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {encouraged.map((item) => (
                  <li
                    key={item}
                    className="about-reveal flex items-start gap-3 rounded-xl border p-3 transition hover:-translate-y-0.5 sm:p-4"
                    style={{
                      borderColor: "color-mix(in srgb, #22c55e 35%, var(--color-border))",
                      backgroundColor: "color-mix(in srgb, #22c55e 6%, var(--color-card))",
                    }}
                  >
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0"
                      style={{ color: "#22c55e" }}
                      aria-hidden
                    />
                    <span
                      className="text-sm leading-relaxed sm:text-base"
                      style={{ color: "var(--color-text)" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 5. Ce que TENF refuse */}
            <section id="refuse" className="about-fade-up scroll-mt-28 space-y-4">
              <SectionHeader
                kicker="4. Ce que TENF refuse"
                title="Les comportements qu'on ne tolère pas"
                lead="Les désaccords sont autorisés ; ils doivent rester calmes, respectueux et constructifs. Mais ces comportements-là, jamais."
              />
              <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {refused.map((item) => (
                  <li
                    key={item}
                    className="about-reveal flex items-start gap-3 rounded-xl border p-3 transition hover:-translate-y-0.5 sm:p-4"
                    style={{
                      borderColor: "color-mix(in srgb, #ef4444 35%, var(--color-border))",
                      backgroundColor: "color-mix(in srgb, #ef4444 6%, var(--color-card))",
                    }}
                  >
                    <XCircle
                      className="mt-0.5 h-5 w-5 shrink-0"
                      style={{ color: "#ef4444" }}
                      aria-hidden
                    />
                    <span
                      className="text-sm leading-relaxed sm:text-base"
                      style={{ color: "var(--color-text)" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 6. Entraide, promotion et engagement */}
            <section id="entraide" className="about-fade-up scroll-mt-28 space-y-5">
              <SectionHeader
                kicker="5. Entraide, promotion et engagement"
                title="On lève le malentendu"
                lead={
                  <>
                    Beaucoup de monde mélange ces trois notions. Chez TENF, on les distingue avec
                    clarté —{" "}
                    <strong style={{ color: "var(--color-text)" }}>
                      TENF n&apos;est pas un serveur de publicité, mais une communauté d&apos;entraide
                    </strong>
                    .
                  </>
                }
              />

              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
                {entraideCards.map((card) => {
                  const tone =
                    card.tone === "positive"
                      ? { color: "#22c55e", Icon: CheckCircle2, label: "À cultiver" }
                      : card.tone === "negative"
                      ? { color: "#ef4444", Icon: AlertTriangle, label: "À éviter" }
                      : { color: "var(--color-primary)", Icon: CheckCircle2, label: "Saine" };
                  const Icon = tone.Icon;
                  return (
                    <article
                      key={card.label}
                      className="about-reveal rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
                      style={{
                        borderColor: `color-mix(in srgb, ${tone.color} 30%, var(--color-border))`,
                        backgroundColor:
                          "color-mix(in srgb, var(--color-card) 70%, transparent)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${tone.color} 18%, transparent)`,
                            }}
                            aria-hidden
                          >
                            <Icon
                              className="h-4 w-4"
                              style={{ color: tone.color }}
                              strokeWidth={2.25}
                            />
                          </span>
                          <h3 className="text-base font-bold">{card.label}</h3>
                        </div>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${tone.color} 14%, transparent)`,
                            color: tone.color,
                          }}
                        >
                          {tone.label}
                        </span>
                      </div>
                      <p className="home-muted mt-3 text-sm leading-relaxed">
                        {card.description}
                      </p>
                    </article>
                  );
                })}
              </div>

              <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
                {promotionRules.map((item) => (
                  <li key={item.title}>
                    <article className="about-reveal home-member-card h-full rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                          }}
                          aria-hidden
                        >
                          <item.icon
                            className="h-4 w-4"
                            strokeWidth={2.25}
                            style={{ color: "var(--color-primary)" }}
                          />
                        </span>
                        <div>
                          <h3 className="text-sm font-bold sm:text-base">{item.title}</h3>
                          <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            {/* 7. Confidentialité et vocaux */}
            <section
              id="confidentialite"
              className="about-fade-up scroll-mt-28 space-y-6"
            >
              <SectionHeader
                kicker="6. Confidentialité et vocaux"
                title="Ce qui se dit sur TENF reste sur TENF"
                lead="C'est une règle centrale, et toute atteinte à la confidentialité est considérée comme une faute sérieuse."
              />

              <div
                className="rounded-2xl border p-4 sm:p-5"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--color-primary) 35%, var(--color-border))",
                  backgroundColor:
                    "color-mix(in srgb, var(--color-primary) 6%, var(--color-card))",
                }}
              >
                <h3 className="text-sm font-bold sm:text-base">
                  Confidentialité — les règles strictes
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {confidentialityRules.map((rule) => (
                    <li
                      key={rule}
                      className="flex items-start gap-3 text-sm leading-relaxed sm:text-base"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <XCircle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: "#ef4444" }}
                        aria-hidden
                      />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3
                  className="text-base font-bold sm:text-lg"
                  style={{ color: "var(--color-text)" }}
                >
                  Bonne tenue dans les vocaux
                </h3>
                <p className="home-muted text-sm leading-relaxed sm:text-base">
                  Les salons vocaux sont des espaces de convivialité et de respect. Quelques réflexes simples suffisent à protéger l&apos;ambiance.
                </p>
                <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                  {vocalRules.map((rule) => (
                    <li key={rule.title}>
                      <article className="about-reveal home-member-card h-full rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5">
                        <div className="flex items-start gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor:
                                "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                            }}
                            aria-hidden
                          >
                            <rule.icon
                              className="h-4 w-4"
                              strokeWidth={2.25}
                              style={{ color: "var(--color-primary)" }}
                            />
                          </span>
                          <div>
                            <h4 className="text-sm font-bold sm:text-base">{rule.title}</h4>
                            <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">
                              {rule.description}
                            </p>
                          </div>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3
                  className="text-base font-bold sm:text-lg"
                  style={{ color: "var(--color-text)" }}
                >
                  Vocaux pendant un live ou une session de jeu
                </h3>
                <ul className="space-y-3">
                  {vocalImportantRules.map((rule, index) => (
                    <li
                      key={rule.title}
                      className="about-reveal rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
                      style={{
                        borderColor: "color-mix(in srgb, #f59e0b 35%, var(--color-border))",
                        backgroundColor: "color-mix(in srgb, #f59e0b 6%, var(--color-card))",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: "color-mix(in srgb, #f59e0b 22%, transparent)",
                          }}
                          aria-hidden
                        >
                          {index === vocalImportantRules.length - 1 ? (
                            <MicOff
                              className="h-4 w-4"
                              style={{ color: "#f59e0b" }}
                              strokeWidth={2.25}
                            />
                          ) : (
                            <AlertTriangle
                              className="h-4 w-4"
                              style={{ color: "#f59e0b" }}
                              strokeWidth={2.25}
                            />
                          )}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold sm:text-base">{rule.title}</h4>
                          <p
                            className="mt-1.5 text-sm leading-relaxed"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {rule.description}
                          </p>
                          <p className="home-muted mt-2 text-xs leading-snug sm:text-sm">
                            <span
                              className="font-semibold"
                              style={{ color: "var(--color-text)" }}
                            >
                              Pourquoi :
                            </span>{" "}
                            {rule.explanation}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 8. Intégration et rôles */}
            <section
              id="integration"
              className="about-fade-up scroll-mt-28 space-y-5"
            >
              <SectionHeader
                kicker="7. Intégration et rôles"
                title="Un cadre, pas un mur"
                lead="L'accès complet à l'entraide et à la promotion passe par la lecture du règlement et la réunion d'intégration. Ce n'est pas une punition : c'est une protection — pour toi comme pour la communauté."
              />
              <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
                {integrationBlocks.map((block) => (
                  <li key={block.title}>
                    <article className="about-reveal home-step-card h-full rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                          }}
                          aria-hidden
                        >
                          <block.icon
                            className="h-5 w-5"
                            strokeWidth={2.25}
                            style={{ color: "var(--color-primary)" }}
                          />
                        </span>
                        <h3 className="text-base font-bold">{block.title}</h3>
                      </div>
                      <p className="home-muted mt-3 text-sm leading-relaxed">
                        {block.description}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            {/* 9. Pauses, absences et rythme personnel */}
            <section id="pauses" className="about-fade-up scroll-mt-28 space-y-5">
              <SectionHeader
                kicker="8. Pauses, absences et rythme personnel"
                title="Tu as une vie — TENF le sait"
                lead="Fatigue, contraintes pro, baisses de motivation, périodes compliquées : on comprend. Ce qui compte, c'est de prévenir quand c'est possible et de rester honnête."
              />
              <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
                {pauseBlocks.map((block) => (
                  <li key={block.title}>
                    <article className="about-reveal home-step-card h-full rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                          }}
                          aria-hidden
                        >
                          <block.icon
                            className="h-5 w-5"
                            strokeWidth={2.25}
                            style={{ color: "var(--color-primary)" }}
                          />
                        </span>
                        <h3 className="text-base font-bold">{block.title}</h3>
                      </div>
                      <p className="home-muted mt-3 text-sm leading-relaxed">
                        {block.description}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            {/* 10. Gestion des conflits */}
            <section id="conflits" className="about-fade-up scroll-mt-28 space-y-5">
              <SectionHeader
                kicker="9. Gestion des conflits"
                title="On résout, on n'humilie pas"
                lead="L'objectif n'est jamais de désigner un coupable publiquement, mais de protéger l'ambiance et les membres."
              />
              <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
                {conflictRules.map((rule) => (
                  <li key={rule.title}>
                    <article className="about-reveal home-member-card h-full rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                          }}
                          aria-hidden
                        >
                          <rule.icon
                            className="h-4 w-4"
                            strokeWidth={2.25}
                            style={{ color: "var(--color-primary)" }}
                          />
                        </span>
                        <div>
                          <h3 className="text-sm font-bold sm:text-base">{rule.title}</h3>
                          <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">
                            {rule.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
              <div
                className="rounded-2xl border p-4 sm:p-5"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--color-primary) 25%, var(--color-border))",
                  backgroundColor:
                    "color-mix(in srgb, var(--color-primary) 5%, var(--color-card))",
                }}
              >
                <p
                  className="text-sm leading-relaxed sm:text-base"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Pour signaler une situation, utilise le{" "}
                  <Link
                    href="/contact"
                    className="home-link-accent font-semibold underline-offset-2 hover:underline"
                  >
                    formulaire de contact
                  </Link>{" "}
                  ou contacte directement un membre du staff. Tout est traité avec confidentialité — on préfère une alerte de trop qu&apos;une de trop tard.
                </p>
              </div>
            </section>

            {/* 11. Sanctions */}
            <section id="sanctions" className="about-fade-up scroll-mt-28 space-y-5">
              <SectionHeader
                kicker="10. Sanctions possibles"
                title="Une échelle progressive, jamais arbitraire"
                lead="On commence par parler. Les exclusions sèches existent, mais elles sont rares et toujours documentées. Le staff agit pour préserver l'équilibre du serveur, pas pour punir."
              />
              <ol className="space-y-3">
                {sanctions.map((item, index) => {
                  // Niveau visuel : du soft au strict.
                  const severity = index / Math.max(1, sanctions.length - 1);
                  const color =
                    severity < 0.33
                      ? "#22c55e"
                      : severity < 0.66
                      ? "#f59e0b"
                      : "#ef4444";
                  return (
                    <li
                      key={item.level}
                      className="about-reveal flex items-start gap-4 rounded-xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
                      style={{
                        borderColor: `color-mix(in srgb, ${color} 25%, var(--color-border))`,
                        backgroundColor: `color-mix(in srgb, ${color} 4%, var(--color-card))`,
                      }}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className="text-sm font-bold sm:text-base"
                            style={{ color: "var(--color-text)" }}
                          >
                            {item.level}
                          </h3>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                              color,
                            }}
                          >
                            {severity < 0.33
                              ? "Niveau léger"
                              : severity < 0.66
                              ? "Niveau intermédiaire"
                              : "Niveau strict"}
                          </span>
                        </div>
                        <p className="home-muted mt-1 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* 12. Droits des membres */}
            <section id="droits" className="about-fade-up scroll-mt-28">
              <div
                className="relative overflow-hidden rounded-2xl border p-5 sm:rounded-3xl sm:p-8"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-primary) 6%, var(--color-card))",
                  borderColor:
                    "color-mix(in srgb, var(--color-primary) 35%, var(--color-border))",
                }}
              >
                <div
                  className="home-testimonials-glow pointer-events-none absolute -left-16 -bottom-16 h-52 w-52 rounded-full blur-3xl"
                  aria-hidden
                />
                <div className="relative space-y-5 sm:space-y-7">
                  <SectionHeader
                    kicker="11. Droits des membres"
                    title="Tes droits, garantis"
                    lead="Avant les devoirs, il y a les droits. Chacun, à TENF, dispose de ceux-ci sans condition."
                  />
                  <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
                    {rights.map((right) => (
                      <li key={right.title}>
                        <article
                          className="about-reveal h-full rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--color-card) 75%, transparent)",
                            borderColor:
                              "color-mix(in srgb, var(--color-border) 80%, transparent)",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                              style={{
                                backgroundColor:
                                  "color-mix(in srgb, var(--color-primary) 22%, transparent)",
                              }}
                              aria-hidden
                            >
                              <right.icon
                                className="h-4 w-4"
                                strokeWidth={2.25}
                                style={{ color: "var(--color-primary)" }}
                              />
                            </span>
                            <h3 className="text-sm font-bold sm:text-base">{right.title}</h3>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                  <p className="home-muted text-sm leading-relaxed sm:text-base">
                    Si tu sens qu&apos;un de ces droits est ignoré, alerte le staff via le{" "}
                    <Link
                      href="/contact"
                      className="home-link-accent font-semibold underline-offset-2 hover:underline"
                    >
                      formulaire de contact
                    </Link>
                    . On préfère une alerte de trop qu&apos;une de trop tard.
                  </p>
                </div>
              </div>
            </section>

            {/* 13. Conclusion + CTA final */}
            <FinalCta />

            {/* Lien retour discret */}
            <section className="about-fade-up scroll-mt-28 text-center">
              <Link
                href="#charte-hero"
                className="home-link-muted inline-flex items-center gap-1.5 text-sm font-semibold"
              >
                <ArrowRight size={14} className="rotate-[-90deg]" aria-hidden />
                Retour en haut
              </Link>
            </section>
          </div>
        </div>
      </div>

      <AboutPageEnhancer />
    </main>
  );
}
