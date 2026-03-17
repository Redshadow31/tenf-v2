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
  "Ouvrir ton profil membre et completer le module de base.",
  "Lier ton compte Twitch pour activer les fonctions liees au suivi.",
  "Confirmer que tes permissions d'acces sont bien actives.",
];

const profileFields = [
  { label: "Pseudo principal", tip: "Utilise un pseudo coherent entre Discord et Twitch." },
  { label: "Description rapide", tip: "Presente ton univers en 1 a 2 phrases simples." },
  { label: "Liens utiles", tip: "Ajoute tes liens prioritaire (Twitch, reseaux, projet)." },
];

const twitchSteps = [
  "Va sur ton profil membre puis ouvre la section de liaison Twitch.",
  "Clique sur le bouton de connexion Twitch et valide l'autorisation.",
  "Reviens sur TON espace membre pour verifier le statut de liaison.",
];

const onboardingModalSteps = [
  "Etape 1 - Informations de base (pseudo, presentation rapide).",
  "Etape 2 - Liens utiles (Twitch + reseaux prioritaires).",
  "Etape 3 - Verification finale puis validation.",
];

const onboardingModalFields = [
  { label: "Pseudo principal", value: "Ex: MonPseudoTENF" },
  { label: "Description rapide", value: "Ex: Stream chill FPS / variete 4 soirs par semaine." },
  { label: "Lien Twitch", value: "Ex: https://twitch.tv/monpseudo" },
  { label: "Reseau principal", value: "Ex: https://x.com/moncompte" },
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
            <Link href="/member/dashboard" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Ouvrir mon dashboard
            </Link>
            <Link href="/member/profil" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Ouvrir mon profil membre
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Important: cette etape se lance depuis le dashboard
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            A la premiere connexion, le systeme te redirige vers le dashboard puis ouvre le modal d'onboarding a completer.
          </p>
          <div className="mt-3 rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "var(--color-bg)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Simulation du modal complet (version guide)
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Emplacement: <span style={{ color: "var(--color-text)" }}>/member/dashboard</span> - ouverture automatique pour nouveau membre.
            </p>

            <div className="mt-3 grid gap-2">
              {onboardingModalSteps.map((step) => (
                <p key={step} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                  - {step}
                </p>
              ))}
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {onboardingModalFields.map((field) => (
                <article key={field.label} className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                    {field.label}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--color-text)" }}>
                    {field.value}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--color-text)" }}>
                Bouton modal: Continuer
              </span>
              <span className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--color-text)" }}>
                Bouton modal: Valider mon onboarding
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/member/dashboard" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Aller au dashboard (ouverture modal)
            </Link>
            <Link href="/member/profil/completer" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Completer directement le profil
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Module profil a remplir en priorite
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Ce module est complete depuis le modal d'onboarding du dashboard. Plus il est complet, plus ton suivi est fiable.
          </p>
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
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/member/profil/completer" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Completer mon module profil
            </Link>
            <Link href="/member/profil/modifier" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Modifier mon profil
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Liaison Twitch (a faire sur cette etape)
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            La liaison Twitch permet d'activer les fonctionnalites de suivi et d'engagement liees a ton compte.
          </p>
          <div className="mt-3 grid gap-2">
            {twitchSteps.map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
          <div className="mt-4 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
            <span style={{ color: "var(--color-text)" }}>Ton avantage concret:</span> tu centralises ton profil et ton compte Twitch
            des la premiere connexion, ce qui evite les blocages plus tard.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/member/profil" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Ouvrir la liaison Twitch
            </Link>
            <Link href="/rejoindre/guide-public/liaison-twitch" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Voir le detail de liaison
            </Link>
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
