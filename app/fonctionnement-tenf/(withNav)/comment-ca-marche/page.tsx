import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Compass,
  HeartHandshake,
  Layers,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";
import styles from "../../fonctionnement.module.css";
import { FonctionnementPageHeader } from "@/components/fonctionnement/FonctionnementPageHeader";
import { GuidancePanel } from "@/components/fonctionnement/GuidancePanel";
import {
  IntegrationStep1Card,
  IntegrationStep2Card,
  IntegrationStep3Card,
} from "@/components/fonctionnement/integration-sections";
import {
  CommentCaMarcheSteps,
  type StepDefinition,
} from "@/components/fonctionnement/CommentCaMarcheSteps";

export const metadata = {
  title: "Comment ça marche — Fonctionnement TENF",
  description:
    "Trois étapes simples pour commencer chez TENF : rejoindre, participer, progresser. On t'accompagne sans pression, à ton rythme.",
};

const steps: readonly StepDefinition[] = [
  {
    num: 1,
    pill: "Rejoindre",
    title: "Rejoindre la famille",
    tagline: "Pose tes valises, on s'occupe du reste.",
    duration: "≈ 10 min",
    description:
      "Connecte-toi avec ton compte Discord, complète ton espace membre et choisis une réunion d'intégration. C'est notre façon de te dire bonjour et de te montrer où aller.",
    highlights: [
      { label: "Connexion Discord", text: "un clic, pas de formulaire interminable" },
      { label: "Espace membre", text: "ton profil, ton univers, ta présentation" },
      { label: "Réunion d'intégration", text: "live ou vocal, à ton choix" },
    ],
    details: <IntegrationStep1Card />,
    cta: { href: "/rejoindre", label: "Voir comment rejoindre TENF" },
    iconKey: "join",
    accent: "violet",
  },
  {
    num: 2,
    pill: "Participer",
    title: "Participer à la vie communautaire",
    tagline: "Le moment où les pseudos deviennent des potes.",
    duration: "à ton rythme",
    description:
      "Échange sur le serveur Discord, passe sur les lives, joue, partage. C'est ici que les liens se créent — sans pression, sans quota, juste en étant toi.",
    highlights: [
      { label: "Salon général", text: "demande, partage, déconne" },
      { label: "Lives & raids", text: "encouragements et visibilité naturelle" },
      { label: "Événements", text: "spotlights, jeux, sessions communautaires" },
    ],
    details: <IntegrationStep2Card />,
    cta: { href: "/lives", label: "Voir les lives en direct" },
    iconKey: "participate",
    accent: "fuchsia",
  },
  {
    num: 3,
    pill: "Progresser",
    title: "Progresser ensemble",
    tagline: "On grandit mieux quand on n'est pas seul·e.",
    duration: "sur la durée",
    description:
      "Ton implication est suivie avec bienveillance. Des retours clairs, des objectifs réalistes et une évolution de rôles cohérente avec ce que tu apportes à la communauté.",
    highlights: [
      { label: "Évaluations mensuelles", text: "un point régulier, jamais un jugement" },
      { label: "Critères transparents", text: "tu sais ce qui est observé, et pourquoi" },
      { label: "Évolution de rôles", text: "elle reflète ton implication réelle" },
    ],
    details: <IntegrationStep3Card />,
    cta: { href: "/fonctionnement-tenf/progression", label: "Découvrir le système" },
    iconKey: "progress",
    accent: "amber",
  },
] as const;

const ROADMAP_CARDS = [
  {
    icon: Sparkles,
    title: "Une intro très rapide",
    text: "Trois minutes de lecture pour comprendre TENF sans jargon.",
  },
  {
    icon: Layers,
    title: "Les 3 étapes du parcours",
    text: "Rejoindre, participer, progresser — chacune avec ses détails.",
  },
  {
    icon: HeartHandshake,
    title: "Des CTA clairs",
    text: "À chaque étape, tu sais exactement quoi faire après.",
  },
] as const;

const NEXT_STEPS = [
  {
    href: "/fonctionnement-tenf/decouvrir",
    label: "Découvrir TENF",
    description: "Notre histoire, nos valeurs, ce qui nous rend différents.",
    Icon: Compass,
  },
  {
    href: "/fonctionnement-tenf/progression",
    label: "Ta progression",
    description: "Comment ton parcours est suivi et reconnu.",
    Icon: TrendingUp,
  },
  {
    href: "/fonctionnement-tenf/communaute",
    label: "Vie communautaire",
    description: "Événements, lives, projets collectifs.",
    Icon: Calendar,
  },
] as const;

export default function CommentCaMarchePage() {
  return (
    <div className="about-fade-up space-y-10 sm:space-y-12">
      <FonctionnementPageHeader
        eyebrow="Les bases · onboarding TENF"
        title="Comment ça marche, concrètement"
        subtitle="Pas de promesse compliquée : trois étapes simples pour t'intégrer chez nous. Tu peux tout lire d'affilée, ou n'ouvrir que ce qui t'intéresse — chacun avance à son rythme."
        icon={Workflow}
      />

      {/* === Mini roadmap : « ce que tu vas trouver sur cette page » === */}
      <section
        aria-labelledby="page-roadmap-heading"
        className={`${styles.fnCard} ${styles.fnCardPad} space-y-5`}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
              style={{ color: "color-mix(in srgb, var(--fn-purple) 80%, #fff)" }}
            >
              Ce que tu vas trouver ici
            </p>
            <h2
              id="page-roadmap-heading"
              className="mt-1 font-bold tracking-tight text-[var(--color-text)]"
              style={{ fontSize: "clamp(1.15rem, 0.95rem + 0.7vw, 1.5rem)" }}
            >
              Une page courte, claire, sans détour
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Tu lis ce qui te concerne — le reste reste accessible quand tu en auras envie.
            </p>
          </div>
          <Link
            href="/fonctionnement-tenf/parcours-complet"
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wide transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Voir le parcours complet
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ROADMAP_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`${styles.fnCard} flex gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5`}
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
                }}
              >
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--fn-purple) 18%, transparent)",
                    color: "color-mix(in srgb, var(--fn-purple) 90%, #fff)",
                  }}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text)]">{card.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {card.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <GuidancePanel tabId="integration" />

      {/* === Les 3 étapes : version interactive === */}
      <section
        aria-labelledby="steps-heading"
        className="space-y-5"
        style={{ scrollMarginTop: "5rem" }}
      >
        <div>
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
            style={{ color: "color-mix(in srgb, var(--fn-purple) 80%, #fff)" }}
          >
            Le parcours en 3 étapes
          </p>
          <h2
            id="steps-heading"
            className="mt-1 font-bold tracking-tight text-[var(--color-text)]"
            style={{ fontSize: "clamp(1.35rem, 1rem + 1.1vw, 2rem)" }}
          >
            Rejoindre · Participer · Progresser
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
            Touche un onglet pour mettre une étape en avant. Chaque carte a son CTA principal et un détail complet à dérouler si tu veux aller plus loin.
          </p>
        </div>

        <CommentCaMarcheSteps steps={steps} />
      </section>

      {/* === Rassurance + lien parcours complet === */}
      <section
        className={`${styles.fnCard} ${styles.fnCardPad}`}
        aria-labelledby="rassurance-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: "color-mix(in srgb, var(--fn-purple) 18%, transparent)",
              color: "color-mix(in srgb, var(--fn-purple) 90%, #fff)",
            }}
            aria-hidden
          >
            <HeartHandshake className="h-6 w-6" strokeWidth={2.25} />
          </span>
          <div className="space-y-2">
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
              style={{ color: "color-mix(in srgb, var(--fn-purple) 80%, #fff)" }}
            >
              Promis, on ne brûle aucune étape
            </p>
            <h2
              id="rassurance-heading"
              className="font-bold tracking-tight text-[var(--color-text)]"
              style={{ fontSize: "clamp(1.1rem, 0.9rem + 0.6vw, 1.35rem)" }}
            >
              Tu avances à ton rythme, on reste joignable
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Si tu préfères les sections détaillées (évaluation, rôles, FAQ…) dans l'ordre d'origine, on a tout regroupé sur le{" "}
              <Link
                href="/fonctionnement-tenf/parcours-complet"
                className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                parcours complet à onglets
              </Link>
              . Et si tu cherches un humain, n'hésite pas — le staff est sur Discord, en français, sans formulaire.
            </p>
          </div>
        </div>
      </section>

      {/* === Et après ? === */}
      <section className="space-y-5" aria-labelledby="next-heading">
        <div>
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
            style={{ color: "color-mix(in srgb, var(--fn-purple) 80%, #fff)" }}
          >
            Et après cette page ?
          </p>
          <h2
            id="next-heading"
            className="mt-1 font-bold tracking-tight text-[var(--color-text)]"
            style={{ fontSize: "clamp(1.15rem, 0.95rem + 0.7vw, 1.5rem)" }}
          >
            Trois pistes pour aller plus loin
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {NEXT_STEPS.map((next) => {
            const Icon = next.Icon;
            return (
              <Link
                key={next.href}
                href={next.href}
                className={`${styles.fnCard} ${styles.fnCardInteractive} group flex flex-col gap-3 rounded-2xl border p-5 transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300`}
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-card)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--fn-purple) 18%, transparent)",
                      color: "color-mix(in srgb, var(--fn-purple) 90%, #fff)",
                    }}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <ArrowRight
                    className="h-4 w-4 text-[var(--color-text-secondary)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)]"
                    aria-hidden
                  />
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--color-text)]">{next.label}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {next.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* === Nav bas de page === */}
      <div className={styles.fnFlowFooter}>
        <Link
          href="/fonctionnement-tenf/decouvrir"
          className={`${styles.fnFlowLink} text-[var(--color-text-secondary)]`}
        >
          ← Découvrir TENF
        </Link>
        <Link
          href="/fonctionnement-tenf/progression"
          className={`${styles.fnFlowLink} font-semibold text-[var(--color-primary)]`}
        >
          Ta progression →
        </Link>
      </div>
    </div>
  );
}
