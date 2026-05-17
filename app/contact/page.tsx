import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  HelpCircle,
  Megaphone,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import AboutPageEnhancer from "@/components/about/AboutPageEnhancer";
import ContactForm from "./ContactForm";
import { CONTACT_TOPICS } from "./topics";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

export const metadata: Metadata = {
  title: "Contact — TENF",
  description:
    "Contacter TENF : question générale, signalement, partenariat, presse, soutien, problème technique. Formulaire sécurisé et délais de réponse réalistes.",
  alternates: {
    canonical: "https://tenf-community.com/contact",
  },
  openGraph: {
    title: "Contact — TENF",
    description:
      "Un seul endroit pour joindre TENF : question, signalement, partenariat, presse, soutien, technique. Formulaire simple et sécurisé.",
    url: "https://tenf-community.com/contact",
    type: "website",
  },
};

const topicIcons: Record<string, typeof HelpCircle> = {
  question_generale: HelpCircle,
  probleme_serveur: AlertTriangle,
  partenariat: Megaphone,
  presse: Sparkles,
  signalement: ShieldAlert,
  soutien: MessageCircle,
  technique_site: Wrench,
};

export default function ContactPage() {
  return (
    <main className="home-page min-h-screen py-6 sm:py-14">
      <div className="home-page-inner mx-auto flex w-full max-w-6xl flex-col px-3 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="about-fade-up home-hero relative overflow-hidden rounded-2xl border p-5 sm:rounded-3xl sm:p-10 lg:p-14 scroll-mt-28">
          <div className="home-hero-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
          <div className="home-hero-orb home-hero-orb--tr pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full blur-3xl" />
          <div className="home-hero-orb home-hero-orb--bl pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full blur-3xl" />
          <div className="relative space-y-5 sm:space-y-7">
            <div className="home-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs">
              Contact · une seule porte d&apos;entrée pour tout le monde
            </div>
            <h1 className="home-hero-title max-w-4xl text-2xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Une question ? On t&apos;écoute.
            </h1>
            <p className="home-hero-lead max-w-3xl text-base font-semibold leading-relaxed sm:text-xl">
              Choisis ton motif, écris-nous : un membre du staff te répond dès qu&apos;il le peut.
            </p>
            <p className="home-hero-body max-w-3xl text-sm leading-relaxed sm:text-base">
              On ne promet pas une réponse en 2 minutes. On promet de tout lire et de répondre honnêtement, dans des délais réalistes.
            </p>
          </div>
        </section>

        {/* Délais de réponse */}
        <section className="about-fade-up home-section scroll-mt-28 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <article
              className="about-reveal rounded-2xl border p-4 sm:p-5"
              style={{
                borderColor: "color-mix(in srgb, var(--color-primary) 30%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, var(--color-card) 70%, transparent)",
              }}
            >
              <Clock className="h-5 w-5" style={{ color: "var(--color-primary)" }} aria-hidden />
              <h2 className="mt-3 text-base font-bold">Délai habituel</h2>
              <p className="home-muted mt-1.5 text-sm leading-relaxed">
                Entre 48 et 96 heures. TENF est portée par des bénévoles avec une vie à côté.
              </p>
            </article>
            <article
              className="about-reveal rounded-2xl border p-4 sm:p-5"
              style={{
                borderColor: "color-mix(in srgb, #ef4444 30%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, var(--color-card) 70%, transparent)",
              }}
            >
              <ShieldAlert className="h-5 w-5" style={{ color: "#ef4444" }} aria-hidden />
              <h2 className="mt-3 text-base font-bold">Urgences / signalement</h2>
              <p className="home-muted mt-1.5 text-sm leading-relaxed">
                Pour les comportements graves, contacte aussi un staff en MP sur Discord pour aller plus vite.
              </p>
            </article>
            <article
              className="about-reveal rounded-2xl border p-4 sm:p-5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-card) 70%, transparent)" }}
            >
              <MessageCircle className="h-5 w-5" style={{ color: "var(--color-primary)" }} aria-hidden />
              <h2 className="mt-3 text-base font-bold">Discord disponible</h2>
              <p className="home-muted mt-1.5 text-sm leading-relaxed">
                Tu es déjà membre ? Le salon dédié et les MP au staff restent le canal le plus rapide.
              </p>
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="home-link-accent mt-3 inline-flex text-sm font-semibold"
              >
                Ouvrir Discord →
              </a>
            </article>
          </div>
        </section>

        {/* Motifs */}
        <section className="about-fade-up home-section scroll-mt-28 space-y-5">
          <div className="max-w-3xl space-y-2">
            <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">
              Choisir un motif
            </p>
            <h2 className="home-section-title text-xl font-extrabold tracking-tight sm:text-3xl">
              Pour quoi nous écris-tu ?
            </h2>
            <p className="home-muted text-sm leading-relaxed sm:text-base">
              Un motif clair = une réponse plus rapide et orientée vers la bonne personne.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CONTACT_TOPICS.map((topic) => {
              const Icon = topicIcons[topic.id] || HelpCircle;
              return (
                <article
                  key={topic.id}
                  className="about-reveal home-member-card rounded-2xl border p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 18%, transparent)" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: "var(--color-primary)" }} strokeWidth={2.25} aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold sm:text-base">{topic.label}</h3>
                      <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">{topic.hint}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Formulaire */}
        <section className="about-fade-up home-section scroll-mt-28 space-y-5">
          <div className="max-w-3xl space-y-2">
            <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">
              Écrire au staff
            </p>
            <h2 className="home-section-title text-xl font-extrabold tracking-tight sm:text-3xl">
              Formulaire de contact
            </h2>
            <p className="home-muted text-sm leading-relaxed sm:text-base">
              Sois précis : un message clair, c&apos;est une réponse utile. Ne partage jamais de mot de passe ou d&apos;information sensible.
            </p>
          </div>
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </section>

        {/* Liens utiles */}
        <section className="about-fade-up home-section scroll-mt-28 space-y-4">
          <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">
            Liens utiles
          </p>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <Link href="/charte" className="about-reveal home-step-card rounded-2xl border p-4 sm:p-5">
              <h3 className="text-sm font-bold sm:text-base">Charte communautaire</h3>
              <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">
                Avant de signaler, vérifier ce que TENF protège ou interdit.
              </p>
            </Link>
            <Link href="/rejoindre/faq" className="about-reveal home-step-card rounded-2xl border p-4 sm:p-5">
              <h3 className="text-sm font-bold sm:text-base">FAQ rejoindre</h3>
              <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">
                Beaucoup de questions ont déjà leur réponse — un coup d&apos;œil avant d&apos;écrire ?
              </p>
            </Link>
            <Link href="/partenariats" className="about-reveal home-step-card rounded-2xl border p-4 sm:p-5">
              <h3 className="text-sm font-bold sm:text-base">Devenir partenaire</h3>
              <p className="home-muted mt-1.5 text-xs leading-snug sm:text-sm">
                Demande de partenariat ? Lis d&apos;abord la page dédiée, puis reviens ici avec le motif &laquo; Partenariat &raquo;.
              </p>
            </Link>
          </div>
        </section>
      </div>

      <AboutPageEnhancer />
    </main>
  );
}
