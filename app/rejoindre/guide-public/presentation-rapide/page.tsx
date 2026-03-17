import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { getStepIndex, guideSteps } from "../guideMeta";

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : clean;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const targetProfiles = [
  {
    title: "Nouveau streamer",
    description: "Tu débutes sur Twitch et tu cherches un cadre pour progresser étape par étape.",
  },
  {
    title: "Streamer regulier",
    description: "Tu streams déjà souvent et tu veux accélérer ta visibilité grâce à l'entraide.",
  },
  {
    title: "Viewer implique",
    description: "Tu souhaites soutenir une communauté active autour des créateurs TENF.",
  },
];

const menuCategories = [
  {
    icon: "🤝",
    title: "UPA Events",
    description: "Association et Discord partenaire, orientés événements caritatifs entre streamers.",
  },
  {
    icon: "🛍️",
    title: "Boutique TENF",
    description: "Merch officiel. Chaque soutien aide à financer bots, outils et événements TENF.",
  },
  {
    icon: "🏠",
    title: "La communaute",
    description: "Présentation globale de TENF : fonctionnement, équipe, partenaires et témoignages.",
  },
  {
    icon: "🎬",
    title: "Decouvrir les createurs",
    description: "Fiches membres, lives en cours et calendrier des streams à venir.",
  },
  {
    icon: "📅",
    title: "Evenements",
    description: "Calendrier TENF, mises en avant live et projets spéciaux.",
  },
  {
    icon: "🚀",
    title: "Rejoindre TENF",
    description: "Intégration, réunion d'accueil, guides et FAQ pour te lancer.",
  },
];

const publicCategories = [
  {
    title: "Decouvrir TENF",
    description: "Comprendre la mission, le fonctionnement et la culture de la communauté.",
    links: [
      { href: "/a-propos", label: "A propos de TENF" },
      { href: "/fonctionnement-tenf", label: "Fonctionnement TENF" },
    ],
  },
  {
    title: "Explorer la communaute",
    description: "Observer l'activité de TENF et les créateurs déjà engagés.",
    links: [
      { href: "/membres", label: "Annuaire des membres" },
      { href: "/lives", label: "Lives en cours" },
    ],
  },
  {
    title: "S'informer avant de rejoindre",
    description: "Préparer ton entrée avec les bonnes informations.",
    links: [
      { href: "/integration", label: "Page integration" },
      { href: "/rejoindre/faq", label: "FAQ rejoindre" },
    ],
  },
];

const trustSignals = [
  { label: "Membres actifs", value: "Communaute active" },
  { label: "Evenements", value: "Rythme regulier" },
  { label: "Encadrement", value: "Staff structure" },
];

export default function GuidePublicPresentationRapidePage() {
  const accent = "#06b6d4";
  const currentHref = "/rejoindre/guide-public/presentation-rapide";
  const currentIndex = getStepIndex(currentHref);
  const nextStep = currentIndex >= 0 && currentIndex < guideSteps.length - 1 ? guideSteps[currentIndex + 1] : null;
  const currentStep = guideSteps[currentIndex];

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: hexToRgba(accent, 0.35),
            background: `linear-gradient(135deg, color-mix(in srgb, ${hexToRgba(accent, 0.35)} 55%, var(--color-card)) 0%, var(--color-card) 60%, color-mix(in srgb, var(--color-primary) 12%, var(--color-card)) 100%)`,
            boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
          }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl" style={{ backgroundColor: hexToRgba(accent, 0.22) }} />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]" style={{ borderColor: hexToRgba(accent, 0.4), color: "var(--color-text)" }}>
              <Sparkles size={14} /> Guide Public
            </p>
            <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
              <BookOpen size={26} style={{ color: hexToRgba(accent, 0.95) }} />
              Presentation rapide
            </h1>
          </div>
          <div className="mt-4 space-y-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            <p>TENF (Twitch Entraide New Family) est une communauté Discord d'entraide entre streamers Twitch.</p>
            <p>
              Son objectif principal est d'aider les créateurs à se développer grâce à un système structuré basé sur
              le soutien mutuel, les échanges, les formations et l'implication de chacun.
            </p>
            <p>
              Les membres participent à la vie du serveur (présence en live, interactions, entraide), ce qui leur
              permet de gagner des points et d'évoluer dans la communauté. Un staff formé encadre le tout, avec des
              rôles clairs et un suivi régulier.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Etape <span style={{ color: "var(--color-text)" }}>{currentIndex + 1}</span> / {guideSteps.length} - Temps estime:{" "}
            <span style={{ color: "var(--color-text)" }}>{currentStep.readTime}</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Resultat attendu: <span style={{ color: "var(--color-text)" }}>{currentStep.expectedResult}</span>
          </p>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            A qui s'adresse TENF ?
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {targetProfiles.map((profile) => (
              <article key={profile.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {profile.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {profile.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Par ou commencer ?
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/fonctionnement-tenf" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              1) Decouvrir TENF
            </Link>
            <Link href="/auth/login" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              2) Creer mon espace
            </Link>
            <Link href="/rejoindre/guide-public/liaison-twitch" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              3) Lier mon Twitch
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Comprendre le menu du haut
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {menuCategories.map((item) => (
              <article key={item.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  <span aria-hidden>{item.icon}</span> {item.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          {trustSignals.map((signal) => (
            <article key={signal.label} className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                {signal.label}
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {signal.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>Categories des pages publiques (hors connexion)</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {publicCategories.map((category) => (
              <article key={category.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {category.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {category.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {category.links.map((item) => (
                    <Link key={item.href} href={item.href} className="text-xs underline" style={{ color: "var(--color-primary)" }}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "rgba(145,70,255,0.28)", backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.2)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
            Pret a passer a l'etape suivante ?
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Si la presentation est claire, cree ton espace TENF maintenant. Sinon, consulte la FAQ detaillee pour lever tes derniers doutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/auth/login" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Creer mon espace TENF
            </Link>
            <Link href="/rejoindre/faq" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Consulter la FAQ
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Cette page t'a aide ?
            </p>
            <div className="flex gap-2">
              <Link href="/rejoindre/guide-public/faq-publique" className="rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Oui, c'est clair
              </Link>
              <Link href="/rejoindre/faq" className="rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Non, j'ai besoin d'aide
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/rejoindre/guide-public" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Precedent: Accueil du guide
            </Link>
            {nextStep ? (
              <Link href={nextStep.href} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
                Suivant: {nextStep.title}
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
