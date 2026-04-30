import { getRoleBadgeClassName } from "@/lib/roleBadgeSystem";
import { fonctionnementFaqItems } from "@/lib/fonctionnement/faq-data";
import { FonctionnementFaq } from "@/components/fonctionnement/FonctionnementFaq";

/** Textes courts pour la vue « 3 étapes » (la suite demeure dans les panneaux dépliables). */
export const integrationStepSummaries = [
  {
    title: "Rejoindre",
    short:
      "Connecte-toi avec Discord, crée ton espace membre et inscris-toi à une réunion d'intégration pour poser tes bases.",
  },
  {
    title: "Participer",
    short:
      "Échange sur le serveur, passe sur les lives et participe aux événements : c'est comme ça que les liens et l'entraide deviennent naturels.",
  },
  {
    title: "Progresser",
    short:
      "Ton engagement est suivi avec des retours clairs, des objectifs et une évolution de rôles cohérente avec ton implication.",
  },
] as const;

export function IntegrationIntroSection() {
  return (
    <section className="mb-16">
      <div className="mb-4 rounded-xl border p-5 integration-card" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
          Cap d&apos;arrivée
        </p>
        <p className="mt-2 text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Voici comment ton parcours démarre dans TENF. On te guide étape par étape, sans pression, pour que tu comprennes vite où aller et quoi faire.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="integration-card rounded-xl border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Étape 1
          </p>
          <p className="mt-1 font-semibold" style={{ color: "var(--color-text)" }}>Tu rejoins</p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Compte Discord + espace membre + réunion d&apos;intégration.</p>
        </article>
        <article className="integration-card rounded-xl border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Étape 2
          </p>
          <p className="mt-1 font-semibold" style={{ color: "var(--color-text)" }}>Tu participes</p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Premiers échanges, events et lives pour créer tes repères.</p>
        </article>
        <article className="integration-card rounded-xl border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
            Étape 3
          </p>
          <p className="mt-1 font-semibold" style={{ color: "var(--color-text)" }}>Tu progresses</p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Ton implication est visible et t&apos;ouvre des opportunités.</p>
        </article>
      </div>

      <div
        className="integration-card rounded-xl border p-5 shadow-lg"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          Ce qui va se passer quand tu rejoins
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Tu n&apos;es pas seul: la communauté t&apos;accompagne, le staff te guide, et tu avances à ton rythme avec des étapes claires.
        </p>
      </div>
    </section>
  );
}

export function IntegrationStep1Card() {
  return (
    <div
      className="integration-card rounded-xl border p-6 shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
        1. Inscription
      </h3>
      <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        Commence par te connecter avec ton compte Discord sur le site. Une fois connecté, tu peux créer ou compléter ton espace membre pour finaliser ton
        profil et faciliter ton intégration dans la communauté.
      </p>
      <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Pourquoi c&apos;est utile: tu poses des bases solides pour être bien orienté dès le départ.
      </p>
      <a
        href="/api/auth/signin/discord?callbackUrl=%2Fmember%2Fdashboard"
        className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Créer mon espace membre
      </a>
    </div>
  );
}

export function IntegrationStep2Card() {
  return (
    <div
      className="integration-card rounded-xl border p-6 shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
        2. Réunion d&apos;intégration
      </h3>
      <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        Les réunions d&apos;intégration sont organisées régulièrement. Tu peux consulter le calendrier et t&apos;inscrire directement sur la page{" "}
        <a
          href="https://tenf-community.com/integration"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: "var(--color-primary)" }}
        >
          d&apos;intégration
        </a>
        . C&apos;est le meilleur point de départ pour comprendre le fonctionnement TENF, poser tes questions et avancer sereinement.
      </p>
      <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Pourquoi c&apos;est utile: tu sais exactement quoi faire ensuite, sans te sentir perdu.
      </p>
      <a
        href="https://tenf-community.com/integration"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Voir les prochaines réunions d&apos;intégration
      </a>
    </div>
  );
}

export function IntegrationStep3Card() {
  return (
    <div
      className="integration-card rounded-xl border p-6 shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
        3. Découvrir les autres & s&apos;impliquer
      </h3>
      <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        Découvre les autres membres et commence à t&apos;impliquer dans la vie de TENF : échange sur le serveur, participe aux événements, passe sur les
        lives et prends le temps de suivre les créateurs actifs du système d&apos;entraide. C&apos;est souvent comme ça que la porte s&apos;ouvre vraiment :
        en créant des liens, en découvrant les univers des autres et en rendant l&apos;entraide plus naturelle au quotidien.
      </p>
      <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Pourquoi c&apos;est utile: plus tu participes, plus tu reçois de retours concrets et de soutien.
      </p>
      <a
        href="/lives"
        className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Découvrir les autres
      </a>
    </div>
  );
}

export function IntegrationProcessusSection() {
  return (
    <section className="mb-16">
      <h2 className="mb-8 text-center text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        Processus d&apos;Intégration
      </h2>
      <div className="space-y-6">
        <IntegrationStep1Card />
        <IntegrationStep2Card />
        <IntegrationStep3Card />
      </div>
    </section>
  );
}

export function IntegrationEvaluationSection() {
  return (
    <section className="mb-16">
      <h2 className="mb-8 text-center text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        Système d&apos;Évaluation
      </h2>
      <div
        className="integration-card rounded-xl border p-8 shadow-lg"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <p className="mb-4 text-lg leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          TENF fonctionne avec un système d&apos;évaluation transparent qui permet de suivre votre progression :
        </p>
        <ul className="ml-6 space-y-2 text-lg leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <li>
            • <strong style={{ color: "var(--color-text)" }}>Évaluations mensuelles</strong> : Bilan régulier de votre progression et de votre engagement
          </li>
          <li>
            • <strong style={{ color: "var(--color-text)" }}>Critères transparents</strong> : Vous savez exactement ce qui est évalué et pourquoi
          </li>
          <li>
            • <strong style={{ color: "var(--color-text)" }}>Feedback constructif</strong> : Retours personnalisés pour vous aider à progresser
          </li>
          <li>
            • <strong style={{ color: "var(--color-text)" }}>Évolution des rôles</strong> : Possibilité d&apos;évoluer dans la hiérarchie selon votre
            implication
          </li>
        </ul>
      </div>
    </section>
  );
}

export function IntegrationRolesSection() {
  return (
    <section className="mb-16">
      <h2 className="mb-8 text-center text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        Rôles et Hiérarchie
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6">
        <div
          className="integration-card rounded-xl border p-6 shadow-lg"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
            Membres Actifs
          </h3>
          <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Cette catégorie représente les créateurs actifs qui font vivre l&apos;entraide au quotidien.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={getRoleBadgeClassName("Affilié")}>Créateurs affiliés</span>
            <span className={getRoleBadgeClassName("Développement")}>Créateurs en développement</span>
            <span className={getRoleBadgeClassName("Soutien TENF")}>Soutien TENF</span>
          </div>
        </div>

        <div
          className="integration-card rounded-xl border p-6 shadow-lg"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
            Mineurs
          </h3>
          <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Membres mineurs de la communauté, avec un cadre adapté, bienveillant et sécurisé.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={getRoleBadgeClassName("Créateur Junior")}>Créateurs Juniors</span>
            <span className={getRoleBadgeClassName("Les P'tits Jeunes")}>Les P&apos;tits Jeunes</span>
          </div>
        </div>

        <div
          className="integration-card rounded-xl border p-6 shadow-lg"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
            Communauté
          </h3>
          <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Viewers et membres de la communauté : accès à la vie du serveur et aux activités, avec un environnement encadré et respectueux.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={getRoleBadgeClassName("Communauté")}>Communauté</span>
          </div>
        </div>

        <div
          className="integration-card rounded-xl border p-6 shadow-lg"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
            Staff & Admins
          </h3>
          <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            L&apos;équipe qui organise, anime et veille au bon fonctionnement : accueil, événements, accompagnement et modération.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={getRoleBadgeClassName("Admin Fondateurs")}>Admin Fondateurs</span>
            <span className={getRoleBadgeClassName("Admin Coordinateur")}>Admin Coordinateur</span>
            <span className={getRoleBadgeClassName("Modérateur")}>Modérateurs</span>
            <span className={getRoleBadgeClassName("Modérateur en formation")}>Modérateur en Formation</span>
            <span className={getRoleBadgeClassName("Modérateur en pause")}>Modérateur en Pause</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function IntegrationActivitiesSection() {
  return (
    <section className="mb-16">
      <h2 className="mb-8 text-center text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        Activités et Événements
      </h2>
      <div
        className="integration-card rounded-xl border p-8 shadow-lg"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <p className="mb-4 text-lg leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          TENF propose des rendez-vous réguliers pensés pour créer du lien, gagner en visibilité et progresser ensemble dans une vraie dynamique
          d&apos;entraide :
        </p>
        <ul className="ml-6 space-y-2 text-lg leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <li>
            • <strong style={{ color: "var(--color-text)" }}>Spotlight</strong> : un temps fort pour mettre un créateur en lumière et mobiliser la
            communauté autour de son univers
          </li>
          <li>
            • <strong style={{ color: "var(--color-text)" }}>Films communautaires</strong> : des moments partagés en vocal pour renforcer les liens entre
            membres hors live
          </li>
          <li>
            • <strong style={{ color: "var(--color-text)" }}>Jeux communautaires</strong> : des sessions conviviales pour se découvrir autrement et faire
            vivre l&apos;entraide dans l&apos;action
          </li>
          <li>
            • <strong style={{ color: "var(--color-text)" }}>Sessions de mentorat (petits groupes encadrés)</strong> : échanges guidés, retours concrets et
            progression collective
          </li>
          <li>
            • <strong style={{ color: "var(--color-text)" }}>Formations</strong> : ateliers pratiques pour mieux structurer ses lives, ses outils et son
            évolution de créateur
          </li>
        </ul>
      </div>
    </section>
  );
}

export function IntegrationResourcesSection() {
  return (
    <section className="mb-16">
      <h2 className="mb-8 text-center text-xl font-semibold" style={{ color: "var(--color-text)" }}>
        Ressources Disponibles
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">
        <div
          className="integration-card rounded-xl border p-6 shadow-lg"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
            Support Personnalisé
          </h3>
          <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            L&apos;équipe de staff reste disponible pour accompagner la communauté, répondre aux questions, aider à mieux comprendre le fonctionnement de TENF
            et orienter les membres lorsqu&apos;ils en ont besoin.
          </p>
        </div>

        <div
          className="integration-card rounded-xl border p-6 shadow-lg"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
            Outils et Automatisation
          </h3>
          <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            TENF met à disposition plusieurs ressources utiles pour la vie communautaire : le serveur Discord, les automatisations pratiques et le site TENF,
            qui centralise les informations, les parcours et différents outils utiles à l&apos;intégration.
          </p>
        </div>

        <div
          className="integration-card rounded-xl border p-6 shadow-lg"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
            Communauté Active
          </h3>
          <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Réseau de streamers prêts à s&apos;entraider et à collaborer.
          </p>
        </div>
      </div>
    </section>
  );
}

/** Contenu complet de l&apos;onglet Intégration (parcours à onglets). */
export function IntegrationTabContent() {
  return (
    <div className="space-y-8">
      <IntegrationIntroSection />
      <IntegrationProcessusSection />
      <IntegrationEvaluationSection />
      <IntegrationRolesSection />
      <IntegrationActivitiesSection />
      <IntegrationResourcesSection />
      <FonctionnementFaq items={fonctionnementFaqItems} variant="cards" />
    </div>
  );
}
