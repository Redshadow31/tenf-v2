import Link from "next/link";
import { LayoutDashboard, PanelsTopLeft } from "lucide-react";
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

const dashboardBlocks = [
  {
    title: "Activite recente",
    detail: "Retrouve tes dernieres actions et suivi d'implication membre.",
    href: "/member/activite",
  },
  {
    title: "Progression",
    detail: "Visualise ton evolution globale et les objectifs a venir.",
    href: "/member/progression",
  },
  {
    title: "Notifications",
    detail: "Ne rate pas les alertes importantes et rappels de la communaute.",
    href: "/member/notifications",
  },
];

export default function GuideMemberTableauDeBordPage() {
  const accent = "#8b5cf6";
  const currentHref = "/rejoindre/guide-espace-membre/tableau-de-bord";
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
            <LayoutDashboard size={26} style={{ color: hexToRgba(accent, 0.96) }} />
            Tableau de bord
          </h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Le dashboard est ton point de pilotage: il t'aide a prioriser les actions utiles chaque semaine.
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
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            <PanelsTopLeft size={18} />
            Blocs a maitriser en priorite
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {dashboardBlocks.map((block) => (
              <article key={block.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {block.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {block.detail}
                </p>
                <Link href={block.href} className="mt-2 inline-flex text-xs underline" style={{ color: "var(--color-primary)" }}>
                  Ouvrir
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Routine simple recommandee
          </h2>
          <div className="mt-3 grid gap-2">
            {[
              "Verifier les notifications et prioriser les actions urgentes.",
              "Consulter ta progression pour garder un objectif clair.",
              "Mettre a jour ton activite quand tu termines une etape.",
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
