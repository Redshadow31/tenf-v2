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

const quickChecklist = [
  "Avoir un compte Discord actif.",
  "Verifier que tu es connecte au bon compte Discord dans ton navigateur.",
  "Autoriser la redirection/popup si ton navigateur bloque les ouvertures.",
];

const createAccountSteps = [
  {
    title: "Etape 1 - Ouvrir la page de connexion",
    action: "Va sur la page /auth/login depuis le menu ou un lien de connexion.",
    result: "Tu vois l'ecran TENF avec le bouton 'Se connecter avec Discord'.",
  },
  {
    title: "Etape 2 - Lancer la creation via Discord",
    action:
      "Clique sur le bouton 'Se connecter avec Discord'. Si c'est ta premiere fois, Discord ouvre l'ecran d'autorisation.",
    result: "La fenetre Discord te demande de confirmer le compte et les permissions.",
  },
  {
    title: "Etape 3 - Valider les autorisations",
    action:
      "Connecte-toi a Discord si besoin puis clique sur 'Autoriser' pour valider les permissions demandees.",
    result: "Discord valide la liaison, puis te renvoie automatiquement vers TENF.",
  },
  {
    title: "Etape 4 - Retour automatique sur TENF",
    action: "Attends la redirection automatique vers TENF apres l'autorisation.",
    result: "Ton espace est cree automatiquement a la premiere connexion.",
  },
  {
    title: "Etape 5 - Verifier que le compte est actif",
    action: "Controle que ton interface est bien connectee (menu membre, profil ou dashboard).",
    result: "Si tout est bon, ton compte est actif. Sinon, recharge une fois puis reconnecte-toi.",
  },
];

const commonErrors = [
  {
    title: "Je clique sur Discord mais rien ne se passe",
    solution: "Autorise les popups/redirections dans ton navigateur puis reessaie.",
  },
  {
    title: "Je suis connecte au mauvais compte Discord",
    solution: "Deconnecte Discord dans le navigateur, reconnecte le bon compte puis relance /auth/login.",
  },
  {
    title: "Erreur OAuth / page erreur",
    solution: "Reessaie une fois, vide les cookies de session si besoin, puis consulte la FAQ si l'erreur persiste.",
  },
];

const quickDiagnostic = [
  "Vois-tu le bouton 'Se connecter avec Discord' sur /auth/login ?",
  "As-tu valide les permissions Discord en cliquant sur 'Autoriser' ?",
  "Es-tu revenu automatiquement sur TENF apres la validation ?",
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

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Checklist avant de commencer
          </h2>
          <div className="mt-3 grid gap-2">
            {quickChecklist.map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <div className="space-y-2">
            {createAccountSteps.map((step) => (
              <article key={step.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {step.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  <span style={{ color: "var(--color-text)" }}>Action :</span> {step.action}
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  <span style={{ color: "var(--color-text)" }}>Resultat attendu :</span> {step.result}
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

          <div className="mt-4 rounded-lg border p-4" style={{ borderColor: "rgba(145,70,255,0.35)", backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, var(--color-bg))" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Maquette visuelle - Fenetre Discord d'autorisation
            </p>
            <div className="mt-3 rounded-xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "#1a1a1d" }}>
              <p className="text-base font-semibold text-white">Autoriser TENF</p>
              <p className="mt-1 text-xs text-gray-300">Informations a verifier/remplir avant creation de l'espace :</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "#374151", color: "#e5e7eb" }}>
                  Compte Discord selectionne : <span style={{ color: "#ffffff" }}>@ton_compte_discord</span>
                </div>
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "#374151", color: "#e5e7eb" }}>
                  Email Discord verifie : <span style={{ color: "#ffffff" }}>oui</span>
                </div>
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "#374151", color: "#e5e7eb" }}>
                  Permissions TENF : <span style={{ color: "#ffffff" }}>profil + email de base</span>
                </div>
              </div>
              <button type="button" className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: "#5865F2" }}>
                Autoriser
              </button>
            </div>

            <div className="mt-3 rounded-xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Finalisation apres creation (espace membre)
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Juste apres creation, complete ton profil pour activer toutes les fonctions :
              </p>
              <div className="mt-2 space-y-2 text-sm">
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  Champ a renseigner : Pseudo Twitch / URL Twitch
                </div>
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  Champ conseille : Date d'affiliation Twitch (si disponible)
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Erreurs frequentes et solutions rapides
          </h2>
          <div className="mt-3 space-y-2">
            {commonErrors.map((item) => (
              <article key={item.title} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {item.title}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {item.solution}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Diagnostic express (30 secondes)
          </h2>
          <div className="mt-3 space-y-2">
            {quickDiagnostic.map((question) => (
              <p key={question} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {question}
              </p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/auth/login" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Commencer la creation maintenant
            </Link>
            <Link href="/rejoindre/faq" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              J'ai un probleme de connexion
            </Link>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Securite: TENF utilise l'authentification Discord. Aucun mot de passe TENF specifique n'est a creer.
          </p>
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
