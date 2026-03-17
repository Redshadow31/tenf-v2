import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, CheckCircle2, Target } from "lucide-react";
import { getGuideMemberStepIndex, guideMemberSteps } from "../guideMeta";

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

type ModuleCard = {
  title: string;
  role: string;
  youFind: string[];
  benefits: string[];
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
  accent: string;
};

const modules: ModuleCard[] = [
  {
    title: "Planning",
    role: "Organisation",
    youFind: [
      "Vue hebdomadaire de tes actions importantes.",
      "Creneaux a bloquer pour rester regulier.",
      "Rappels de rythme a tenir sur le mois.",
    ],
    benefits: [
      "Tu ne perds plus de temps a decider quoi faire.",
      "Tu evites les semaines vides ou trop chargees.",
    ],
    primaryAction: { label: "Ouvrir le planning", href: "/member/planning" },
    secondaryAction: { label: "Voir mes objectifs", href: "/member/objectifs" },
    accent: "#8b5cf6",
  },
  {
    title: "Formations",
    role: "Montee en competences",
    youFind: [
      "Catalogue des formations disponibles.",
      "Historique des validations deja faites.",
      "Prochain contenu recommande selon ton niveau.",
    ],
    benefits: [
      "Tu progresses sur les competences qui ont le plus d'impact.",
      "Tu vois rapidement ce qui est deja valide et ce qui reste a faire.",
    ],
    primaryAction: { label: "Ouvrir les formations", href: "/member/formations" },
    secondaryAction: { label: "Voir mes formations validees", href: "/member/formations/validees" },
    accent: "#06b6d4",
  },
  {
    title: "Evenements",
    role: "Visibilite communautaire",
    youFind: [
      "Calendrier des evenements a venir.",
      "Inscriptions et suivi de tes presences.",
      "Historique de participation pour mesurer ta regularite.",
    ],
    benefits: [
      "Tu restes visible dans la communaute.",
      "Tu renforces ton implication sans oublier les dates importantes.",
    ],
    primaryAction: { label: "Voir les evenements", href: "/member/evenements" },
    secondaryAction: { label: "Voir mes presences", href: "/member/evenements/presences" },
    accent: "#f59e0b",
  },
  {
    title: "Objectifs",
    role: "Priorisation",
    youFind: [
      "Objectifs actifs du mois.",
      "Progression en pourcentage par objectif.",
      "Actions restantes pour valider ton mois.",
    ],
    benefits: [
      "Tu restes concentre sur ce qui compte vraiment.",
      "Tu convertis ton temps en progression mesurable.",
    ],
    primaryAction: { label: "Ouvrir mes objectifs", href: "/member/objectifs" },
    secondaryAction: { label: "Voir ma progression", href: "/member/progression" },
    accent: "#22c55e",
  },
  {
    title: "Raids",
    role: "Actions d'entraide",
    youFind: [
      "Declaration de raids en cours et passes.",
      "Historique detaille pour verifier ton volume.",
      "Statistiques pour analyser ton impact.",
    ],
    benefits: [
      "Tu valides plus facilement les objectifs mensuels.",
      "Tu comprends quelles actions ont le plus de valeur.",
    ],
    primaryAction: { label: "Voir historique raids", href: "/member/raids/historique" },
    secondaryAction: { label: "Declarer un raid", href: "/member/raids/declarer" },
    accent: "#ef4444",
  },
  {
    title: "Engagement",
    role: "Lecture de performance",
    youFind: [
      "Score d'engagement global du mois.",
      "Details des actions qui montent ou baissent ton score.",
      "Pistes d'amelioration concretes.",
    ],
    benefits: [
      "Tu sais exactement quoi ajuster pour monter en niveau.",
      "Tu prioritises les actions au meilleur retour.",
    ],
    primaryAction: { label: "Voir score engagement", href: "/member/engagement/score" },
    secondaryAction: { label: "Decouvrir des membres", href: "/member/engagement/a-decouvrir" },
    accent: "#ec4899",
  },
];

const memberJourneys = [
  {
    title: "Profil Nouveau membre",
    objective: "Installer une base propre des la premiere semaine.",
    steps: [
      "Completer le profil et verifier les acces.",
      "Ouvrir Objectifs pour choisir 1 priorite concrete.",
      "Faire une premiere action (raid ou presence evenement).",
    ],
    action: { label: "Commencer par le profil", href: "/member/profil/completer" },
  },
  {
    title: "Profil Regulier",
    objective: "Stabiliser la progression sans surcharge.",
    steps: [
      "Passer par Planning pour organiser 2 a 3 actions semaine.",
      "Suivre les validations dans Progression et Engagement.",
      "Ajuster en fonction du score du mois en cours.",
    ],
    action: { label: "Organiser ma semaine", href: "/member/planning" },
  },
  {
    title: "Profil Visibilite",
    objective: "Booster la presence communautaire de facon durable.",
    steps: [
      "Prioriser Evenements et Raids dans la meme semaine.",
      "Verifier les presences et l'historique d'actions.",
      "Rejouer ce schema chaque semaine du mois.",
    ],
    action: { label: "Activer mes evenements", href: "/member/evenements" },
  },
];

export default function GuideMemberFonctionnalitesPage() {
  const accent = "#f59e0b";
  const currentHref = "/rejoindre/guide-espace-membre/fonctionnalites-principales";
  const currentIndex = getGuideMemberStepIndex(currentHref);
  const currentStep = guideMemberSteps[currentIndex];
  const prevStep = currentIndex > 0 ? guideMemberSteps[currentIndex - 1] : null;
  const nextStep = currentIndex >= 0 && currentIndex < guideMemberSteps.length - 1 ? guideMemberSteps[currentIndex + 1] : null;

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <section
          className="rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: hexToRgba(accent, 0.35),
            background: `linear-gradient(135deg, color-mix(in srgb, ${hexToRgba(accent, 0.35)} 50%, var(--color-card)) 0%, var(--color-card) 70%)`,
            boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
          }}
        >
          <h1 className="flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            <BookOpenCheck size={26} style={{ color: hexToRgba(accent, 0.96) }} />
            Fonctionnalites principales
          </h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Tu n'as pas besoin de tout utiliser au debut: commence par les modules qui servent directement ton objectif.
          </p>
        </section>

        <section className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Etape <span style={{ color: "var(--color-text)" }}>{currentIndex + 1}</span> / {guideMemberSteps.length} - Temps estime:{" "}
            <span style={{ color: "var(--color-text)" }}>{currentStep.readTime}</span>
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Resultat attendu: <span style={{ color: "var(--color-text)" }}>{currentStep.expectedResult}</span>
          </p>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Modules utiles a prendre en main (version detaillee)
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Pour chaque module: ce que tu retrouves, ce que cela t'apporte, puis les boutons a utiliser immediatement.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {modules.map((module) => (
              <article key={module.title} className="rounded-lg border p-4" style={{ borderColor: hexToRgba(module.accent, 0.35), backgroundColor: "var(--color-bg)" }}>
                <p
                  className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ borderColor: hexToRgba(module.accent, 0.45), color: hexToRgba(module.accent, 0.95) }}
                >
                  {module.role}
                </p>
                <p className="mt-2 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {module.title}
                </p>
                <div className="mt-2 space-y-1">
                  {module.youFind.map((item) => (
                    <p key={item} className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      <strong style={{ color: "var(--color-text)" }}>Tu y retrouves:</strong> {item}
                    </p>
                  ))}
                </div>
                <div className="mt-2 space-y-1">
                  {module.benefits.map((item) => (
                    <p key={item} className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      <strong style={{ color: "var(--color-text)" }}>Ton avantage:</strong> {item}
                    </p>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={module.primaryAction.href}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: module.accent }}
                  >
                    {module.primaryAction.label} <ArrowUpRight size={12} />
                  </Link>
                  <Link
                    href={module.secondaryAction.href}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold"
                    style={{ borderColor: hexToRgba(module.accent, 0.45), color: hexToRgba(module.accent, 0.95) }}
                  >
                    {module.secondaryAction.label} <ArrowUpRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            <Target size={18} />
            Choisir ton parcours selon ton besoin
          </h2>
          <div className="mt-3 grid gap-2">
            {[
              "Visibilite: priorise Evenements + Planning.",
              "Progression perso: priorise Formations + Objectifs.",
              "Implication communautaire: combine Activite + Evenements.",
            ].map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)" }}>
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            <CheckCircle2 size={18} />
            Parcours types membres (vraie version)
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {memberJourneys.map((journey) => (
              <article key={journey.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {journey.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  <strong style={{ color: "var(--color-text)" }}>Objectif:</strong> {journey.objective}
                </p>
                <div className="mt-2 space-y-1">
                  {journey.steps.map((step) => (
                    <p key={step} className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                      - {step}
                    </p>
                  ))}
                </div>
                <Link href={journey.action.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline" style={{ color: "var(--color-primary)" }}>
                  {journey.action.label} <ArrowUpRight size={12} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="mt-1 flex flex-wrap gap-2">
            {prevStep ? (
              <Link href={prevStep.href} className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Precedent: {prevStep.title}
              </Link>
            ) : null}
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
