import Link from "next/link";
import { Link2, Sparkles } from "lucide-react";
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

const twitchLinkSteps = [
  {
    title: "Etape 1 - Se connecter a TENF",
    action: "Connecte-toi d'abord sur /auth/login avec Discord pour acceder a ton espace membre.",
    result: "Tu accedes a ton espace membre TENF avec les menus prives visibles.",
  },
  {
    title: "Etape 2 - Ouvrir ton profil membre",
    action: "Va sur /member/profil puis repere le bloc 'Connexion Twitch'.",
    result: "Tu vois le bouton 'Connecter mon compte Twitch'.",
  },
  {
    title: "Etape 3 - Cliquer sur 'Connecter mon compte Twitch'",
    action:
      "Clique sur le bouton. L'authentification Twitch s'ouvre: connecte ton compte puis autorise l'application.",
    result: "Twitch confirme l'autorisation puis te redirige vers TENF.",
  },
  {
    title: "Etape 4 - Revenir sur TENF",
    action: "Attends le retour automatique vers ton profil membre TENF.",
    result: "Le statut du bloc se met a jour avec ton pseudo/login Twitch.",
  },
  {
    title: "Etape 5 - Verifier que la liaison est active",
    action: "Controle l'affichage final dans la section Connexion Twitch.",
    result: "Tu vois 'Compte Twitch connecte' et les fonctions de suivi sont debloquees.",
  },
];

const twitchBenefits = [
  "Score de suivi plus precis sur les membres actifs TENF.",
  "Suggestions personnalisees dans A decouvrir.",
  "Dashboard membre enrichi avec des indicateurs lies a ton compte Twitch.",
];

const preLinkChecklist = [
  "Etre connecte au bon compte Twitch dans ton navigateur.",
  "Pouvoir acceder a /member/profil avec ton compte TENF.",
  "Verifier que popups/redirections OAuth ne sont pas bloquees.",
];

const commonErrors = [
  {
    title: "Mauvais compte Twitch lie",
    solution: "Deconnecte le compte Twitch depuis le profil TENF puis reconnecte le bon compte.",
  },
  {
    title: "La redirection Twitch est bloquee",
    solution: "Autorise les redirections/popup du navigateur et recommence la liaison.",
  },
  {
    title: "Retour sur TENF sans statut connecte",
    solution: "Recharge la page une fois, puis relance la liaison si le statut n'apparait pas.",
  },
];

const quickDiagnostic = [
  "Vois-tu le bloc 'Connexion Twitch' dans /member/profil ?",
  "As-tu clique sur 'Connecter mon compte Twitch' ?",
  "Vois-tu ton login Twitch apres le retour sur TENF ?",
];

const twitchUnlockedFeatures = [
  {
    feature: "Score de suivi TENF",
    detail: "Acces aux pages d'engagement et comparaison de tes follows Twitch avec les membres actifs.",
    href: "/member/engagement/score",
  },
  {
    feature: "A decouvrir",
    detail: "Liste des membres TENF actifs que tu ne suis pas encore sur Twitch.",
    href: "/member/engagement/a-decouvrir",
  },
  {
    feature: "Indicateurs membre",
    detail: "Certaines cartes et alertes du dashboard membre utilisent la liaison Twitch.",
    href: "/member/dashboard",
  },
];

export default function GuidePublicLiaisonTwitchPage() {
  const accent = "#f59e0b";
  const currentHref = "/rejoindre/guide-public/liaison-twitch";
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
            <Sparkles size={14} /> Activation
          </p>
          <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-text)" }}>
            <Link2 size={26} style={{ color: hexToRgba(accent, 0.96) }} />
            Liaison Twitch
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Guide pour lier ton compte Twitch et activer toutes les fonctionnalites de l'espace membre TENF.
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
            Pourquoi lier Twitch ?
          </h2>
          <div className="mt-3 grid gap-2">
            {twitchBenefits.map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Checklist avant la liaison Twitch
          </h2>
          <div className="mt-3 grid gap-2">
            {preLinkChecklist.map((item) => (
              <p key={item} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>
                - {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <div className="space-y-2">
            {twitchLinkSteps.map((step) => (
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
            Fonctionnalites debloquees apres liaison
          </h2>
          <div className="mt-3 space-y-2">
            {twitchUnlockedFeatures.map((item) => (
              <div key={item.feature} className="rounded-lg border px-3 py-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {item.feature}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {item.detail}
                </p>
                <Link href={item.href} className="mt-2 inline-flex text-sm underline" style={{ color: "var(--color-primary)" }}>
                  Ouvrir la page
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: hexToRgba(accent, 0.25), backgroundColor: "var(--color-card)", boxShadow: "0 10px 22px rgba(0,0,0,0.18)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            Visuel attendu pendant la liaison Twitch
          </h2>
          <div className="mt-3 rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Ecran TENF /member/profil (avant liaison)
            </p>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <li>- Carte visible: "Connexion Twitch"</li>
              <li>- Bouton visible: "Connecter mon compte Twitch"</li>
            </ul>
          </div>

          <div className="mt-4 rounded-lg border p-4" style={{ borderColor: "rgba(245,158,11,0.35)", backgroundColor: "color-mix(in srgb, #f59e0b 10%, var(--color-bg))" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Maquette visuelle - Fenetre Twitch d'autorisation
            </p>
            <div className="mt-3 rounded-xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "#1a1a1d" }}>
              <p className="text-base font-semibold text-white">Autoriser TENF via Twitch</p>
              <p className="mt-1 text-xs text-gray-300">Points a verifier avant validation :</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "#374151", color: "#e5e7eb" }}>
                  Compte Twitch selectionne : <span style={{ color: "#ffffff" }}>ton_login_twitch</span>
                </div>
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "#374151", color: "#e5e7eb" }}>
                  Permissions demandes : <span style={{ color: "#ffffff" }}>lecture suivi/follows necessaires</span>
                </div>
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "#374151", color: "#e5e7eb" }}>
                  Redirection retour : <span style={{ color: "#ffffff" }}>profil TENF</span>
                </div>
              </div>
              <button type="button" className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: "#9146FF" }}>
                Autoriser
              </button>
            </div>

            <div className="mt-3 rounded-xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Apres liaison reussie (dans TENF)
              </p>
              <div className="mt-2 space-y-2 text-sm">
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  Message attendu : "Compte Twitch connecte"
                </div>
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  Pseudo visible : @ton_login_twitch
                </div>
                <div className="rounded-md border px-3 py-2" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  Boutons visibles : "Reconnecter" et "Deconnecter mon compte Twitch"
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
            <Link href="/member/profil" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              Lier mon Twitch maintenant
            </Link>
            <Link href="/rejoindre/faq" className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
              Voir la FAQ / aide
            </Link>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Confidentialite: TENF utilise uniquement les donnees Twitch utiles au suivi communautaire.
          </p>
        </section>

        <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Cette page t'a aide ?
            </p>
            <div className="flex gap-2">
              <Link href="/member/profil" className="rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Oui, je lie mon Twitch
              </Link>
              <Link href="/rejoindre/faq" className="rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                Non, j'ai besoin d'aide
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
