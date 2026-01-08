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
                    Bienvenue dans TENF ! Cette page vous explique comment fonctionne notre communauté et comment vous pouvez en tirer le meilleur parti.
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
                      1. Candidature
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Remplissez le formulaire d'intégration disponible sur notre site. Votre candidature sera examinée par notre équipe d'accueil.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      2. Évaluation
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Une fois accepté, vous passerez une évaluation initiale qui permettra de déterminer votre niveau et vos besoins spécifiques.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      3. Attribution d'un Mentor
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Un mentor vous sera assigné pour vous accompagner dans vos premiers pas et répondre à vos questions.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      4. Intégration Progressive
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Vous serez progressivement intégré aux différents canaux et activités de la communauté selon vos besoins et vos objectifs.
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
                      Le cœur de notre communauté. Les membres actifs participent aux activités, s'entraident et grandissent ensemble.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Créateurs Juniors
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Membres qui commencent à prendre des responsabilités et à aider les nouveaux arrivants.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Mentors
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Membres expérimentés qui accompagnent et forment les nouveaux membres de la communauté.
                    </p>
                  </div>

                  <div className="rounded-xl p-6 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                      Staff & Admins
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Équipe qui gère l'organisation, les événements et assure le bon fonctionnement de TENF.
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
                    TENF organise régulièrement diverses activités pour renforcer les liens entre membres :
                  </p>
                  <ul className="leading-relaxed text-lg space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Raids organisés</strong> : Sessions de raids pour découvrir de nouveaux streamers</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Événements communautaires</strong> : Tournois, défis et activités créatives</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Formations</strong> : Ateliers et sessions de formation sur le streaming</li>
                    <li>• <strong style={{ color: 'var(--color-text)' }}>Spotlight</strong> : Mise en avant des membres et de leurs contenus</li>
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
              <div className="rounded-xl p-8 shadow-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <p className="leading-relaxed text-lg text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Contenu à venir...
                </p>
              </div>
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

