import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
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

const firstChecks = [
  "Verifier que tu es connecte avec le bon compte Discord.",
  "Ouvrir ton profil membre et completer les champs principaux.",
  "Confirmer que tes permissions d'acces sont bien actives.",
];

const profileFields = [
  { label: "Pseudo principal", tip: "Utilise un pseudo coherent entre Discord et Twitch." },
  { label: "Description rapide", tip: "Presente ton univers en 1 a 2 phrases simples." },
  { label: "Liens utiles", tip: "Ajoute tes liens prioritaire (Twitch, reseaux, projet)." },
];

export default function GuideMemberPremiereConnexionPage() {
  const accent = "#06b6d4";
  const currentHref = "/rejoindre/guide-espace-membre/premiere-connexion";
  const currentIndex = getGuideMemberStepIndex(currentHref);
  const nextStep = currentIndex >= 0 && currentIndex < guideMemberSteps.length - 1 ? guideMemberSteps[currentIndex + 1] : null;
  const currentStep = guideMemberSteps[currentIndex];

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: hexToRgba(accent, 0.35),
            background: `linear-gradient(135deg, color-mix(in srgb, ${hexToRgba(accent, 0.35)} 55%, var(--color-card)) 0%, var(--color-card) 70%)`,
            boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
          }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]" style={{ borderColor: hexToRgba(accent, 0.45), color: "var(--color-text)" }}>
            <Sparkles size={14} /> Demarrage
          </p>
          <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            <CheckCircle2 size={26} style={{ color: hexToRgba(accent, 0.96) }} />
            Premiere connexion
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Cette etape te permet de verifier rapidement que ton compte est pret a etre utilise sans blocage.
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
            Checklist des 3 premieres minutes
          </h2>
          <div className="mt-3 grid gap-2">
            {firstChecks.map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/member/profil" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Ouvrir mon profil membre
            </Link>
            <Link href="/member/dashboard" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Aller au dashboard
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Champs de profil prioritaires
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {profileFields.map((field) => (
              <article key={field.label} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {field.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {field.tip}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="mt-1 flex flex-wrap gap-2">
            <Link href="/rejoindre/guide-espace-membre" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
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
