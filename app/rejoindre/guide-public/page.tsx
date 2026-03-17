import Link from "next/link";

const sections = [
  {
    id: "presentation-rapide",
    title: "Presentation rapide",
    content:
      "TENF est une communaute d'entraide entre createurs et viewers. Cette page te donne une vue d'ensemble des etapes pour decouvrir la communaute puis passer a l'inscription.",
  },
  {
    id: "creer-un-compte",
    title: "Creer un compte",
    content:
      "Rends-toi sur la page de connexion, clique sur l'option d'inscription, puis complete les informations demandees. Verifie bien ton pseudo et ton email pour faciliter le suivi.",
  },
  {
    id: "liaison-twitch",
    title: "Liaison Twitch",
    content:
      "Guide pour lier ton compte Twitch et activer toutes les fonctionnalites de l'espace membre TENF.",
  },
  {
    id: "faq-publique",
    title: "FAQ publique",
    content:
      "Retrouve ici les reponses aux questions les plus frequentes avant integration: conditions d'entree, delais de reponse, etape suivante et contacts utiles.",
  },
];

const publicCategories = [
  {
    title: "Decouvrir TENF",
    description: "Comprendre la mission, le fonctionnement et l'univers de la communaute.",
  },
  {
    title: "Explorer la communaute",
    description: "Voir les membres, les lives et les evenements accessibles sans connexion.",
  },
  {
    title: "S'informer avant de rejoindre",
    description: "Retrouver les pages d'aide, les etapes d'integration et les reponses frequentes.",
  },
];

const publicPages = [
  { href: "/", label: "Accueil", category: "Decouvrir TENF" },
  { href: "/a-propos", label: "A propos de TENF", category: "Decouvrir TENF" },
  { href: "/fonctionnement-tenf", label: "Fonctionnement TENF", category: "Decouvrir TENF" },
  { href: "/membres", label: "Membres", category: "Explorer la communaute" },
  { href: "/lives", label: "Lives", category: "Explorer la communaute" },
  { href: "/events2", label: "Calendrier / evenements", category: "Explorer la communaute" },
  { href: "/integration", label: "Integration", category: "S'informer avant de rejoindre" },
  { href: "/rejoindre/reunion-integration", label: "Reunion d'integration", category: "S'informer avant de rejoindre" },
  { href: "/rejoindre/faq", label: "FAQ / comment rejoindre", category: "S'informer avant de rejoindre" },
];

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

const publicFaq = [
  {
    question: "Faut-il payer pour creer un espace TENF ?",
    answer:
      "Non. L'acces de base et la creation de compte via Discord sont gratuits.",
  },
  {
    question: "Dois-je deja etre streamer pour rejoindre ?",
    answer:
      "Pas obligatoirement. Tu peux decouvrir la communaute avant, puis suivre les etapes d'integration quand tu es pret.",
  },
  {
    question: "Je n'ai pas de mot de passe TENF, c'est normal ?",
    answer:
      "Oui. Sur TENF, l'authentification passe principalement par Discord, donc pas de mot de passe classique a memoriser pour le compte public.",
  },
  {
    question: "Que faire si la connexion Discord echoue ?",
    answer:
      "Reessaye une fois, puis verifie que tu es bien connecte a Discord dans ton navigateur. Si l'erreur persiste, utilise la FAQ ou contacte le support staff.",
  },
  {
    question: "Combien de temps pour activer mon espace ?",
    answer:
      "L'espace est cree automatiquement des la premiere connexion validee. Dans certains cas, un rafraichissement de la page peut etre necessaire.",
  },
  {
    question: "Ou poser une question avant de rejoindre ?",
    answer:
      "Tu peux consulter la page FAQ rejoindre, puis passer par les canaux de contact TENF si besoin d'un accompagnement.",
  },
];

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

export default function GuidePublicPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          Guide Public
        </h1>
        <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
          Parcours de reference pour les visiteurs et futurs membres TENF.
        </p>

        <div
          className="mt-6 rounded-xl border p-3 sm:p-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Onglets du guide
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border px-3 py-1.5 text-xs sm:text-sm"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 rounded-xl border p-5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                {section.title}
              </h2>
              {section.id === "presentation-rapide" ? (
                <div className="mt-3 space-y-5">
                  <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    {section.content}
                  </p>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                      0) Comprendre le menu du haut
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                      Le menu principal en haut de page te permet de naviguer rapidement entre les espaces publics de TENF.
                      Chaque categorie regroupe un type de contenu pour t'aider a trouver l'information plus vite.
                    </p>
                    <div className="mt-3 grid gap-2">
                      {[
                        "UPA Events : acces direct aux evenements UPA.",
                        "Boutique : pages de boutique TENF.",
                        "La communaute : presentation de TENF, fonctionnement, temoignages, partenaires et organisation staff.",
                        "Decouvrir les createurs : annuaire des membres, lives et calendrier des lives.",
                        "Evenements : calendrier communautaire et pages d'evenements specifiques.",
                        "Rejoindre TENF : integration, reunion d'integration, guides et FAQ pour rejoindre.",
                      ].map((item) => (
                        <p
                          key={item}
                          className="rounded-lg border px-3 py-2 text-sm"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg)" }}
                        >
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                      1) Categories des pages publiques (hors connexion)
                    </h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {publicCategories.map((category) => (
                        <article
                          key={category.title}
                          className="rounded-lg border p-3"
                          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                        >
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                            {category.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                            {category.description}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                      2) Pages publiques a consulter
                    </h3>
                    <div className="mt-3 space-y-2">
                      {publicPages.map((page) => (
                        <div
                          key={page.href}
                          className="flex flex-col gap-1 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                        >
                          <span className="text-xs sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {page.category}
                          </span>
                          <Link href={page.href} className="text-sm font-semibold underline" style={{ color: "var(--color-primary)" }}>
                            {page.label}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : section.id === "creer-un-compte" ? (
                <div className="mt-3 space-y-5">
                  <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    Sur TENF, la creation de compte se fait via Discord: des la premiere connexion validee, ton espace membre est cree automatiquement.
                  </p>

                  <div className="space-y-2">
                    {createAccountSteps.map((step) => (
                      <article
                        key={step.title}
                        className="rounded-lg border p-3"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                      >
                        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                          {step.detail}
                        </p>
                      </article>
                    ))}
                  </div>

                  <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                      Visuel attendu pendant la creation
                    </h3>
                    <div className="mt-3 rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        Ecran TENF /auth/login
                      </p>
                      <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        <li>- Titre visible: "Connexion"</li>
                        <li>- Bouton principal: "Se connecter avec Discord"</li>
                        <li>- Bouton secondaire: "Retour a l'accueil"</li>
                        <li>- En cas d'erreur, un encart rouge apparait avec l'explication</li>
                      </ul>

                      <div
                        className="mt-4 rounded-lg border p-4"
                        style={{
                          borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--color-border))",
                          backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, var(--color-bg))",
                        }}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                          Maquette visuelle du modal de creation d'espace
                        </p>
                        <div className="mt-3 rounded-xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "#1a1a1d" }}>
                          <p className="text-lg font-semibold text-white">Connexion</p>
                          <p className="mt-1 text-xs text-gray-300">Utilise Discord pour creer ton espace TENF en 1 clic.</p>
                          <button
                            type="button"
                            className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                            style={{ backgroundColor: "#5865F2" }}
                          >
                            Se connecter avec Discord
                          </button>
                          <button
                            type="button"
                            className="mt-2 w-full rounded-lg border px-4 py-2.5 text-sm font-semibold"
                            style={{ borderColor: "#374151", color: "#e5e7eb" }}
                          >
                            Retour a l'accueil
                          </button>
                        </div>
                      </div>

                      <Link
                        href="/auth/login"
                        className="mt-3 inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        Ouvrir la page de creation / connexion
                      </Link>
                    </div>
                  </div>
                </div>
              ) : section.id === "liaison-twitch" ? (
                <div className="mt-3 space-y-5">
                  <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    {section.content}
                  </p>

                  <div className="space-y-2">
                    {twitchLinkSteps.map((step) => (
                      <article
                        key={step.title}
                        className="rounded-lg border p-3"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                      >
                        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                          {step.detail}
                        </p>
                      </article>
                    ))}
                  </div>

                  <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                      Visuel attendu apres liaison
                    </h3>
                    <div className="mt-3 rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        Bloc visible dans /member/profil
                      </p>
                      <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        <li>- Titre de carte: "Connexion Twitch"</li>
                        <li>- Message de succes: "Compte Twitch connecte"</li>
                        <li>- Affichage du pseudo Twitch relie (@login)</li>
                        <li>- Boutons: "Reconnecter mon compte Twitch" et "Deconnecter mon compte Twitch"</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                      Fonctionnalites debloquees apres liaison
                    </h3>
                    <div className="mt-3 space-y-2">
                      {twitchUnlockedFeatures.map((item) => (
                        <div
                          key={item.feature}
                          className="rounded-lg border px-3 py-3"
                          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                        >
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
                  </div>
                </div>
              ) : section.id === "faq-publique" ? (
                <div className="mt-3 space-y-5">
                  <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                    {section.content}
                  </p>

                  <div className="space-y-2">
                    {publicFaq.map((item) => (
                      <article
                        key={item.question}
                        className="rounded-lg border p-4"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
                      >
                        <h3 className="text-sm font-semibold sm:text-base" style={{ color: "var(--color-text)" }}>
                          {item.question}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                          {item.answer}
                        </p>
                      </article>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/rejoindre/faq"
                      className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                    >
                      Voir la FAQ detaillee
                    </Link>
                    <Link
                      href="/auth/login"
                      className="inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      Creer mon espace maintenant
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                  {section.content}
                </p>
              )}
            </section>
          ))}
        </div>

        <Link href="/rejoindre" className="mt-8 inline-flex underline" style={{ color: "var(--color-primary)" }}>
          Retour a Rejoindre TENF
        </Link>
      </div>
    </main>
  );
}
