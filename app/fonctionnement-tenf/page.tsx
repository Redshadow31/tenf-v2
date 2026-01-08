"use client";

import { useState } from "react";

type TabId = "integration" | "reglement" | "systeme-points" | "boutique-points" | "spotlight" | "conseil";

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: "integration", label: "Intégration" },
  { id: "reglement", label: "Règlement" },
  { id: "systeme-points", label: "Système de points" },
  { id: "boutique-points", label: "Boutique des points" },
  { id: "spotlight", label: "Spotlight" },
  { id: "conseil", label: "Conseil" },
];

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabId>("integration");

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Titre principal */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
            Fonctionnement TENF
          </h1>
        </section>

        {/* Onglets */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center border-b" style={{ borderColor: 'var(--color-border)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-6 py-3 text-sm font-medium transition-colors border-b-2"
                style={{
                  color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--color-text)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="mt-8">
          {activeTab === "integration" && (
            <div className="space-y-8">
              {/* Section : Introduction */}
              <section className="mb-16">
                <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                    Bienvenue dans TENF ✨ Ici, on t'accompagne de tes premiers pas jusqu'à ton intégration complète. Tu vas découvrir nos étapes d'arrivée, notre fonctionnement, et surtout comment profiter au maximum de l'entraide, des events et de la vie de la communauté.
                  </p>
                </div>
              </section>

              {/* Section : Processus d'intégration */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Processus d'Intégration
                </h2>
                <div className="space-y-6">
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      1. Inscription
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Remplis le formulaire d'intégration via le site : tes informations arrivent directement dans notre tableau de suivi. L'équipe d'accueil vérifie ta demande et te guide si quelque chose manque.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      2. Réunion d'intégration
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Ta place se valide en participant à une réunion d'intégration. On t'explique TENF, on te montre où trouver les infos importantes, et tu peux poser toutes tes questions. La présence et l'échange sont essentiels.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      3. Découvrir les autres & s'impliquer
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Fais connaissance avec la communauté : sois actif sur le serveur, participe aux événements et passe sur les lives des membres TENF. Plus tu échanges, plus l'entraide devient naturelle (et efficace).
                    </p>
                  </div>
                </div>
              </section>

              {/* Section : Système d'évaluation */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Système d'Évaluation
                </h2>
                <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    TENF fonctionne avec un système d'évaluation transparent qui permet de suivre votre progression :
                  </p>
                  <ul className="leading-relaxed text-lg space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Évaluations mensuelles</strong> : Bilan régulier de votre progression et de votre engagement</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Critères transparents</strong> : Vous savez exactement ce qui est évalué et pourquoi</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Feedback constructif</strong> : Retours personnalisés pour vous aider à progresser</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Évolution des rôles</strong> : Possibilité d'évoluer dans la hiérarchie selon votre implication</li>
                  </ul>
                </div>
              </section>

              {/* Section : Rôles et Hiérarchie */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Rôles et Hiérarchie
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Membres Actifs
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Le cœur de TENF : ils participent à l'entraide, aux raids, aux events et font vivre les échanges au quotidien.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Créateur Junior (mineur)
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Jeunes créateurs : un cadre adapté et bienveillant, pour progresser et participer à la communauté en toute sécurité.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Communauté (mineur)
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Jeunes viewers / membres : accès à la vie du serveur et aux activités, avec un environnement encadré et respectueux.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Staff & Admins
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      L'équipe qui organise, anime et veille au bon fonctionnement : accueil, événements, accompagnement et modération.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section : Activités et Événements */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Activités et Événements
                </h2>
                <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    TENF propose des rendez-vous réguliers pour se découvrir, progresser et créer des liens entre streamers et membres :
                  </p>
                  <ul className="leading-relaxed text-lg space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Spotlight</strong> : mises en avant régulières de membres et de contenus (live, clip, projet)</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Films communautaires</strong> : moments "watch party" en vocal pour partager un bon moment</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Jeux communautaires</strong> : soirées fun (Petit Bac, Fortnite, Gartic Phone, etc.)</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Sessions de mentorat (petits groupes encadrés)</strong> : suivi, retours, objectifs et progression ensemble</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Formations</strong> : ateliers pratiques autour du streaming (outils, organisation, bonnes pratiques)</li>
                  </ul>
                </div>
              </section>

              {/* Section : Ressources Disponibles */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Ressources Disponibles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Support Personnalisé
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Accès à un mentor dédié et à l'équipe pour toutes vos questions.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Outils et Automatisation
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Bots Discord, intégrations Twitch et outils pour faciliter votre streaming.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Communauté Active
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Réseau de streamers prêts à s'entraider et à collaborer.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section : FAQ */}
              <section className="mb-16">
                <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
                  Questions Fréquentes
                </h2>
                <div className="space-y-4">
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Comment puis-je rejoindre TENF ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Remplissez le formulaire d'intégration disponible sur la page "Intégration" de notre site.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Y a-t-il des critères pour rejoindre ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Nous accueillons tous les streamers motivés, quel que soit leur niveau. L'important est l'envie de progresser et de s'entraider.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Comment fonctionnent les évaluations ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Les évaluations mensuelles permettent de faire un point sur votre progression, votre engagement et vos besoins. C'est un outil de suivi, pas de sanction.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                      Puis-je évoluer dans la hiérarchie ?
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Oui ! En fonction de votre implication, de votre progression et de votre volonté d'aider les autres, vous pouvez évoluer vers des rôles plus importants.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "reglement" && (
            <div className="space-y-8">
              {/* Introduction */}
              <section className="mb-16">
                <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                    Bienvenue sur Twitch Entraide New Family (TENF) 💙🐉<br /><br />
                    TENF est un espace d'entraide, de respect et de bienveillance.<br /><br />
                    Ce règlement regroupe les règles générales du serveur ainsi que les règles spécifiques des salons vocaux.<br /><br />
                    En restant sur le serveur, tu confirmes avoir lu et accepté ces règles.
                  </p>
                </div>
              </section>

              {/* Règlement général TENF */}
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-8" style={{ color: 'var(--color-text)' }}>
                  📜 Règlement général – TENF
                </h2>

                <div className="space-y-6">
                  {/* 1. Valeurs TENF */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      1. Valeurs TENF
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      TENF repose sur des valeurs fondamentales :
                    </p>
                    <ul className="leading-relaxed space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Entraide sincère</strong> : aide-toi, on t'aide. L'entraide doit être réciproque et désintéressée.</li>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Respect des différences</strong> : chacun a son parcours, ses objectifs et ses limites. On respecte ça.</li>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Communication saine</strong> : on échange avec bienveillance, on évite les conflits inutiles.</li>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Confidentialité</strong> : ce qui se passe sur TENF reste sur TENF. Pas de screens, pas de partage externe sans autorisation.</li>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Sanctions possibles</strong> : en cas de non-respect, avertissements, restrictions ou exclusion selon la gravité.</li>
                    </ul>
                  </div>

                  {/* 2. Respect & comportement */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      2. Respect & comportement
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      On se respecte mutuellement. Pas de harcèlement, de discrimination, de propos haineux ou de comportements toxiques. On reste bienveillants et constructifs dans nos échanges.
                    </p>
                  </div>

                  {/* 3. Salons & usage */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      3. Salons & usage
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Utilise les salons à bon escient : chaque salon a un rôle. Évite le spam, les messages répétitifs et les contenus hors-sujet. Respecte les règles spécifiques de chaque canal.
                    </p>
                  </div>

                  {/* 4. Confidentialité & confiance */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      4. Confidentialité & confiance
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Les informations partagées sur TENF sont confidentielles. Pas de screens, pas de partage de conversations privées, pas de divulgation d'informations personnelles sans consentement. La confiance est essentielle.
                    </p>
                  </div>

                  {/* 5. Intégration & accès complet */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      5. Intégration & accès complet
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Pour avoir accès à tous les salons et fonctionnalités, participe à la réunion d'intégration. C'est obligatoire et ça permet de comprendre le fonctionnement de TENF.
                    </p>
                  </div>

                  {/* 6. Entraide & promotion */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      6. Entraide & promotion
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      L'entraide est au cœur de TENF. Participe aux raids, aux événements, aux lives des membres. En retour, tu bénéficies aussi de la visibilité et du soutien de la communauté. L'entraide doit être réciproque.
                    </p>
                  </div>

                  {/* 7. Attitude attendue des créateurs */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      7. Attitude attendue des créateurs
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      En tant que créateur, on attend de toi une attitude constructive : participation active, respect des autres, ouverture aux retours et aux conseils. On progresse ensemble, pas seul.
                    </p>
                  </div>

                  {/* 8. Rôles, évaluations & décisions */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      8. Rôles, évaluations & décisions
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Les rôles et évolutions sont décidés par l'équipe selon des critères transparents (engagement, participation, attitude). Les décisions sont prises dans l'intérêt de la communauté et peuvent être discutées avec respect.
                    </p>
                  </div>

                  {/* 9. Publicité & partenariats */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      9. Publicité & partenariats
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Pas de publicité non sollicitée, pas de promotion excessive de tes propres contenus en dehors des canaux prévus. Les partenariats et collaborations doivent être validés par l'équipe.
                    </p>
                  </div>

                  {/* 10. Sanctions */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      10. Sanctions
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      En cas de non-respect du règlement : avertissement, restriction d'accès, ou exclusion selon la gravité. L'équipe se réserve le droit de modérer et de prendre les décisions nécessaires pour préserver l'esprit de TENF.
                    </p>
                  </div>

                  {/* Mot de l'équipe */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      💙 Mot de l'équipe
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      TENF existe pour créer un espace où chaque créateur peut progresser dans un environnement bienveillant. Ces règles ne sont pas là pour te contraindre, mais pour garantir que chacun puisse bénéficier de la même qualité d'entraide et de respect. Merci de les respecter et de contribuer à faire de TENF une vraie famille d'entraide.
                    </p>
                  </div>
                </div>
              </section>

              {/* Règlement des salons vocaux */}
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                  🎧 Règlement des salons vocaux
                </h2>
                <div className="rounded-xl p-6 shadow-lg border mb-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                  <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    Les salons vocaux sont des espaces d'échange privilégiés. Pour que tout le monde puisse en profiter, quelques règles simples :
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Respect & bienveillance */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Respect & bienveillance
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      On se respecte, on écoute, on ne coupe pas la parole. On reste bienveillants et constructifs. Pas de moqueries, pas de comportements toxiques.
                    </p>
                  </div>

                  {/* Live / jeu en cours = demande obligatoire */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Live / jeu en cours = demande obligatoire
                    </h3>
                    <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Si quelqu'un est en live ou en train de jouer, demande avant de rejoindre le vocal. Deux interdictions strictes :
                    </p>
                    <ul className="leading-relaxed space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Pas de join sans demander</strong> : respecte le travail en cours.</li>
                      <li>• <strong style={{ color: 'var(--color-text)' }}>Pas de screens ou d'enregistrements</strong> : la confidentialité est essentielle.</li>
                    </ul>
                    <p className="leading-relaxed mt-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Ce qui se passe en vocal reste confidentiel. Pas de partage externe.
                    </p>
                  </div>

                  {/* Confidentialité & vie privée */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Confidentialité & vie privée
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Les conversations vocales sont privées. Pas d'enregistrements, pas de screens, pas de partage de ce qui se dit en vocal. Respecte la vie privée de chacun.
                    </p>
                  </div>

                  {/* Écoute en mute */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Écoute en mute
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Si tu écoutes sans parler, reste en mute pour éviter les bruits de fond et les échos. Active ton micro quand tu veux intervenir.
                    </p>
                  </div>

                  {/* Politesse */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Politesse
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Salue en arrivant, dis au revoir en partant. C'est basique mais ça fait la différence. On reste polis et respectueux.
                    </p>
                  </div>

                  {/* Temps de parole & ambiance */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Temps de parole & ambiance
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Laisse la place aux autres, ne monopolise pas la conversation. On crée une ambiance agréable où chacun peut s'exprimer. Évite les débats houleux ou les sujets sensibles.
                    </p>
                  </div>

                  {/* Conflits */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Conflits
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Si un conflit survient, reste calme et constructif. Si ça dégénère, quitte le vocal et contacte un membre du staff en privé. On règle les problèmes avec respect.
                    </p>
                  </div>

                  {/* Autorité du staff */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Autorité du staff
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Le staff a autorité pour modérer les vocaux. Si on te demande quelque chose (mute, changement de comportement, etc.), respecte la demande. Les décisions du staff sont prises pour le bien de tous.
                    </p>
                  </div>

                  {/* Sanctions vocal */}
                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Sanctions vocal
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      En cas de non-respect : avertissement, exclusion temporaire du vocal, ou restriction d'accès selon la gravité. Le staff peut prendre des mesures immédiates si nécessaire.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "systeme-points" && (
            <div className="space-y-8">
              <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <p className="leading-relaxed text-lg text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Contenu à venir...
                </p>
              </div>
            </div>
          )}

          {activeTab === "boutique-points" && (
            <div className="space-y-8">
              <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <p className="leading-relaxed text-lg text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Contenu à venir...
                </p>
              </div>
            </div>
          )}

          {activeTab === "spotlight" && (
            <div className="space-y-8">
              <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <p className="leading-relaxed text-lg text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Contenu à venir...
                </p>
              </div>
            </div>
          )}

          {activeTab === "conseil" && (
            <div className="space-y-8">
              <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <p className="leading-relaxed text-lg text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Contenu à venir...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

