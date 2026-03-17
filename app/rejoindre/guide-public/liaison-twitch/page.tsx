import Link from "next/link";

const twitchLinkSteps = [
  {
    title: "Etape 1 - Se connecter a TENF",
    detail: "Connecte-toi d'abord sur /auth/login avec Discord pour acceder a ton espace membre.",
  },
  {
    title: "Etape 2 - Ouvrir ton profil membre",
    detail: "Va sur /member/profil puis repere le bloc 'Connexion Twitch'.",
  },
  {
    title: "Etape 3 - Cliquer sur 'Connecter mon compte Twitch'",
    detail:
      "Le bouton ouvre l'authentification Twitch. Connecte ton compte Twitch puis autorise l'application.",
  },
  {
    title: "Etape 4 - Revenir sur TENF",
    detail:
      "Apres validation Twitch, tu reviens automatiquement sur ton profil membre. Le statut de connexion est mis a jour.",
  },
  {
    title: "Etape 5 - Verifier que la liaison est active",
    detail:
      "Tu dois voir 'Compte Twitch connecte' avec ton pseudo. A partir de la, les fonctions liees au suivi Twitch sont debloquees.",
  },
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
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            Liaison Twitch
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
            Guide pour lier ton compte Twitch et activer toutes les fonctionnalites de l'espace membre TENF.
          </p>
        </section>

        <section className="mt-4 rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="space-y-2">
            {twitchLinkSteps.map((step) => (
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

        <section className="mt-4 rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
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
      </div>
    </main>
  );
}
