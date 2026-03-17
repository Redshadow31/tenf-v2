import Link from "next/link";
import { BookOpenCheck, Target } from "lucide-react";
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

const modules = [
  {
    title: "Planning",
    description: "Planifie tes actions et visualise tes prochains rendez-vous membre.",
    href: "/member/planning",
  },
  {
    title: "Formations",
    description: "Suivi des contenus d'apprentissage et formations deja validees.",
    href: "/member/formations",
  },
  {
    title: "Evenements",
    description: "Inscriptions, presences et historique de participation.",
    href: "/member/evenements",
  },
  {
    title: "Objectifs",
    description: "Cadre tes priorites pour rester regulier dans ton implication.",
    href: "/member/objectifs",
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
            Modules utiles a prendre en main
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {modules.map((module) => (
              <article key={module.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {module.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {module.description}
                </p>
                <Link href={module.href} className="mt-2 inline-flex text-xs underline" style={{ color: "var(--color-primary)" }}>
                  Ouvrir le module
                </Link>
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
