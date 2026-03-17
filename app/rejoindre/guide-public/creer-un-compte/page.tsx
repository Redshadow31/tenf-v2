import Link from "next/link";
import { Sparkles, UserPlus } from "lucide-react";
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

const createAccountSteps = [
  {
    title: "Etape 1 - Ouvrir la page de connexion",
    detail: "Va sur la page /auth/login depuis le menu ou un lien de connexion.",
  },
  {
    title: "Etape 2 - Lancer la creation via Discord",
    detail:
      "Clique sur le bouton 'Se connecter avec Discord'. Si c'est ta premiere fois, Discord te demandera d'autoriser l'application.",
  },
  {
    title: "Etape 3 - Valider les autorisations",
    detail:
      "Connecte-toi a Discord si besoin, puis valide les permissions demandees. TENF recupere uniquement les infos utiles a ton espace membre.",
  },
  {
    title: "Etape 4 - Retour automatique sur TENF",
    detail:
      "Apres validation, tu es redirige vers TENF. Ton espace est cree automatiquement a la premiere connexion.",
  },
  {
    title: "Etape 5 - Verifier que le compte est actif",
    detail:
      "Tu dois voir ton interface connectee (menu membre, profil ou tableau de bord). Si rien ne change, recharge la page une fois.",
  },
];

export default function GuidePublicCreerUnComptePage() {
  const accent = "#9146ff";
  const currentHref = "/rejoindre/guide-public/creer-un-compte";
  const currentIndex = getStepIndex(currentHref);
  const currentStep = guideSteps[currentIndex];
  const prevStep = currentIndex > 0 ? guideSteps[currentIndex - 1] : null;
  const nextStep = currentIndex >= 0 && currentIndex < guideSteps.length - 1 ? guideSteps[currentIndex + 1] : null;

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
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl" style={{ backgroundColor: hexToRgba(accent, 0.22) }} />
          <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]" style={{ borderColor: hexToRgba(accent, 0.45), color: "var(--color-text)" }}>
            <Sparkles size={14} /> Demarrage
          </p>
          <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            <UserPlus size={26} style={{ color: hexToRgba(accent, 0.96) }} />
            Creer un compte
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Sur TENF, la creation de compte se fait via Discord: des la premiere connexion validee, ton espace membre est cree automatiquement.
          </p>
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
          <div className="space-y-2">
            {createAccountSteps.map((step) => (
              <article key={step.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {step.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {step.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Visuel attendu pendant la creation
          </h2>
          <div className="mt-3 rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Ecran TENF /auth/login
            </p>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <li>- Titre visible: "Connexion"</li>
              <li>- Bouton principal: "Se connecter avec Discord"</li>
              <li>- Bouton secondaire: "Retour a l'accueil"</li>
              <li>- En cas d'erreur, un encart rouge apparait avec l'explication</li>
            </ul>
            <Link
              href="/auth/login"
              className="mt-3 inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Ouvrir la page de creation / connexion
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Cette page t'a aide ?
            </p>
            <div className="flex gap-2">
              <Link href="/auth/login" className="rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Oui, je passe a l'action
              </Link>
              <Link href="/rejoindre/faq" className="rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Non, j'ai une question
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
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
