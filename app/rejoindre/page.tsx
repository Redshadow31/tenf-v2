import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, XCircle } from "lucide-react";
import AboutPageEnhancer from "@/components/about/AboutPageEnhancer";
import Hero from "./_components/Hero";
import SectionHeader from "./_components/SectionHeader";
import Steps from "./_components/Steps";
import MeetingSection from "./_components/MeetingSection";
import Faq from "./_components/Faq";
import {
  antiPoints,
  benefits,
  expectations,
  faq,
  finalCtas,
  quickPoints,
  reassuranceItems,
} from "./_data";

// ============================================================
// Metadata
// ============================================================
export const metadata: Metadata = {
  title: "Rejoindre TENF — Communauté d'entraide entre streamers Twitch",
  description:
    "Rejoindre Twitch Entraide New Family (TENF) en 3 étapes : Discord, réunion d'intégration, profil. Communauté francophone d'entraide entre streamers — débutants et timides bienvenus, sans pression, sans abos forcés.",
  alternates: {
    canonical: "https://tenf-community.com/rejoindre",
  },
  openGraph: {
    title: "Rejoindre TENF — Communauté d'entraide entre streamers Twitch",
    description:
      "Comprendre, rejoindre et participer à TENF en quelques minutes : étapes claires, réunion d'intégration et FAQ rassurante.",
    url: "https://tenf-community.com/rejoindre",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rejoindre TENF — Communauté d'entraide entre streamers Twitch",
    description:
      "3 étapes, une réunion d'accueil, zéro abos forcés. Le hub officiel pour entrer dans la communauté TENF.",
  },
  keywords: [
    "rejoindre TENF",
    "communauté entraide streamer",
    "discord streamers twitch",
    "réunion intégration TENF",
    "communauté twitch francophone",
  ],
};

// ============================================================
// JSON-LD FAQ (rendu serveur)
// ============================================================
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

// ============================================================
// Page — hub officiel d'entrée dans TENF
// ============================================================
export default function RejoindrePage() {
  return (
    <main className="home-page min-h-screen py-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="home-page-inner mx-auto flex w-full max-w-7xl flex-col px-3 sm:px-6 lg:px-8">
        {/* 1. Hero */}
        <Hero />

        {/* 2. TENF en 30 secondes */}
        <section
          id="rejoindre-30s"
          className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7"
        >
          <SectionHeader
            kicker="Comprendre vite"
            title="TENF en 30 secondes"
            lead="Twitch Entraide New Family : un réseau de streamers francophones structuré autour de l'entraide réelle."
          />
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {quickPoints.map((item) => (
              <li key={item.title}>
                <article className="about-reveal home-stat-card h-full rounded-2xl border p-4 sm:p-5">
                  <item.icon
                    className="h-6 w-6"
                    strokeWidth={2}
                    style={{ color: "var(--color-primary)" }}
                    aria-hidden
                  />
                  <h3 className="mt-3 text-sm font-bold sm:text-base">{item.title}</h3>
                  <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">
                    {item.description}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Ce que TENF n'est pas */}
        <section
          id="rejoindre-not"
          className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7"
        >
          <SectionHeader
            kicker="On lève les malentendus"
            title="Ce que TENF n'est pas"
            lead="Mieux vaut être clair dès l'entrée : voilà les choses qu'on ne pratique pas chez TENF."
          />
          <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {antiPoints.map((item) => (
              <li key={item.title}>
                <article
                  className="about-reveal h-full rounded-2xl border p-4 sm:p-5"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-card) 65%, transparent)",
                    borderColor: "color-mix(in srgb, var(--color-border) 70%, transparent)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "color-mix(in srgb, #ef4444 18%, transparent)" }}
                      aria-hidden
                    >
                      <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} strokeWidth={2.5} />
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

        {/* 4. Les 3 étapes pour rejoindre */}
        <Steps />

        {/* 5. La réunion d'intégration */}
        <MeetingSection />

        {/* 6. Ce qu'on attend d'un membre */}
        <section
          id="rejoindre-attentes"
          className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7"
        >
          <SectionHeader
            kicker="Côté responsabilités"
            title="Ce qu'on attend d'un membre"
            lead="Rien d'impossible, mais on tient à ces points : ils protègent tout le monde et font la qualité du serveur."
          />
          <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expectations.map((item) => (
              <li key={item.title}>
                <article className="about-reveal home-member-card h-full rounded-2xl border p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)" }}
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

          {/* Lien discret vers la charte — cadre rassurant avant de rejoindre */}
          <aside
            className="about-reveal flex flex-col items-start gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
            style={{
              borderColor: "color-mix(in srgb, var(--color-primary) 25%, var(--color-border))",
              backgroundColor: "color-mix(in srgb, var(--color-primary) 5%, var(--color-card))",
            }}
          >
            <p className="home-muted text-sm leading-relaxed sm:text-base">
              Avant de nous rejoindre, tu peux aussi consulter notre charte communautaire — c&apos;est le cadre que la New Family s&apos;engage à respecter ensemble.
            </p>
            <Link
              href="/charte"
              className="home-btn-secondary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Lire la charte TENF <ArrowRight size={14} aria-hidden />
            </Link>
          </aside>
        </section>

        {/* 7. Ce que TENF peut t'apporter */}
        <section
          id="rejoindre-benefices"
          className="about-fade-up home-section scroll-mt-28 space-y-5 sm:space-y-7"
        >
          <SectionHeader
            kicker="Ce que tu reçois"
            title="Ce que TENF peut t'apporter"
            lead="Pas des promesses vides : du concret pour ta chaîne et ton quotidien de créateur."
          />
          <ul className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {benefits.map((item) => (
              <li key={item.title}>
                <article className="about-reveal home-vip-card h-full rounded-2xl border p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)" }}
                      aria-hidden
                    >
                      <item.icon
                        className="h-5 w-5"
                        strokeWidth={2.25}
                        style={{ color: "var(--color-primary)" }}
                      />
                    </span>
                    <h3 className="text-base font-bold">{item.title}</h3>
                  </div>
                  <p className="home-muted mt-3 text-sm leading-relaxed">{item.description}</p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {/* 8. Bloc rassurant — réservé aux profils hésitants */}
        <section
          id="rejoindre-rassurance"
          className="about-fade-up home-section scroll-mt-28"
        >
          <div
            className="relative overflow-hidden rounded-2xl border p-5 sm:rounded-3xl sm:p-8"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-primary) 6%, var(--color-card))",
              borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--color-border))",
            }}
          >
            <div
              className="home-testimonials-glow pointer-events-none absolute -left-16 -bottom-16 h-52 w-52 rounded-full blur-3xl"
              aria-hidden
            />
            <div className="relative space-y-5 sm:space-y-7">
              <SectionHeader
                kicker="On te rassure"
                title="Tu hésites encore ? Lis ça."
                lead="Beaucoup de membres ont hésité avant de pousser la porte. Voilà les vraies réponses qu'on aimerait t'avoir données plus tôt."
              />
              <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reassuranceItems.map((item) => (
                  <li key={item.title}>
                    <article
                      className="about-reveal h-full rounded-2xl border p-4 sm:p-5"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--color-card) 75%, transparent)",
                        borderColor: "color-mix(in srgb, var(--color-border) 80%, transparent)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)" }}
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
            </div>
          </div>
        </section>

        {/* 9. FAQ courte */}
        <Faq />

        {/* 10. CTA final */}
        <section id="rejoindre-cta" className="about-fade-up scroll-mt-28">
          <div className="home-cta-panel relative overflow-hidden rounded-2xl border p-6 text-center sm:rounded-3xl sm:p-12">
            <div className="home-cta-panel-glow pointer-events-none absolute inset-0 opacity-90" aria-hidden />
            <div className="relative">
              <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">
                Prêt·e ?
              </p>
              <h2 className="home-cta-title mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                On t&apos;attend dans la communauté
              </h2>
              <p className="home-muted mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
                Trois portes d&apos;entrée : tu choisis par où tu commences.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                {finalCtas.map((cta) => (
                  <Link
                    key={cta.label}
                    href={cta.href}
                    target={cta.external ? "_blank" : undefined}
                    rel={cta.external ? "noopener noreferrer" : undefined}
                    className={
                      cta.primary
                        ? "home-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
                        : "home-btn-secondary inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold"
                    }
                  >
                    {cta.label}
                    {cta.primary ? <ArrowRight size={16} className="shrink-0" aria-hidden /> : null}
                  </Link>
                ))}
              </div>

              <p className="home-muted mx-auto mt-8 max-w-xl text-sm leading-relaxed">
                Tu veux d&apos;abord comprendre l&apos;esprit du projet ? Lis{" "}
                <Link href="/a-propos" className="home-link-accent font-semibold underline-offset-2 hover:underline">
                  notre page « À propos »
                </Link>{" "}
                ou{" "}
                <Link href="/fonctionnement-tenf/decouvrir" className="home-link-accent font-semibold underline-offset-2 hover:underline">
                  comment ça marche
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
