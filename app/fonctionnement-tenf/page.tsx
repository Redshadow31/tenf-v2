export default function Page() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0e0e0e' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Titre principal */}
        <section className="mb-16">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            Fonctionnement TENF
          </h1>
        </section>

        {/* Section : Introduction */}
        <section className="mb-16">
          <div className="bg-[#1a1a1a] rounded-xl p-8 shadow-lg">
            <p className="text-gray-300 leading-relaxed text-lg">
              Bienvenue dans TENF ! Cette page vous explique comment fonctionne notre communauté et comment vous pouvez en tirer le meilleur parti.
            </p>
          </div>
        </section>

        {/* Section : Processus d'intégration */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-8 text-center">
            Processus d'Intégration
          </h2>
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                1. Candidature
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Remplissez le formulaire d'intégration disponible sur notre site. Votre candidature sera examinée par notre équipe d'accueil.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                2. Évaluation
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Une fois accepté, vous passerez une évaluation initiale qui permettra de déterminer votre niveau et vos besoins spécifiques.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                3. Attribution d'un Mentor
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Un mentor vous sera assigné pour vous accompagner dans vos premiers pas et répondre à vos questions.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                4. Intégration Progressive
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Vous serez progressivement intégré aux différents canaux et activités de la communauté selon vos besoins et vos objectifs.
              </p>
            </div>
          </div>
        </section>

        {/* Section : Système d'évaluation */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-8 text-center">
            Système d'Évaluation
          </h2>
          <div className="bg-[#1a1a1a] rounded-xl p-8 shadow-lg">
            <p className="text-gray-300 leading-relaxed text-lg mb-4">
              TENF fonctionne avec un système d'évaluation transparent qui permet de suivre votre progression :
            </p>
            <ul className="text-gray-300 leading-relaxed text-lg space-y-2 ml-6">
              <li>• <strong>Évaluations mensuelles</strong> : Bilan régulier de votre progression et de votre engagement</li>
              <li>• <strong>Critères transparents</strong> : Vous savez exactement ce qui est évalué et pourquoi</li>
              <li>• <strong>Feedback constructif</strong> : Retours personnalisés pour vous aider à progresser</li>
              <li>• <strong>Évolution des rôles</strong> : Possibilité d'évoluer dans la hiérarchie selon votre implication</li>
            </ul>
          </div>
        </section>

        {/* Section : Rôles et Hiérarchie */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-8 text-center">
            Rôles et Hiérarchie
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                Membres Actifs
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Le cœur de notre communauté. Les membres actifs participent aux activités, s'entraident et grandissent ensemble.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                Créateurs Juniors
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Membres qui commencent à prendre des responsabilités et à aider les nouveaux arrivants.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                Mentors
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Membres expérimentés qui accompagnent et forment les nouveaux membres de la communauté.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                Staff & Admins
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Équipe qui gère l'organisation, les événements et assure le bon fonctionnement de TENF.
              </p>
            </div>
          </div>
        </section>

        {/* Section : Activités et Événements */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-8 text-center">
            Activités et Événements
          </h2>
          <div className="bg-[#1a1a1a] rounded-xl p-8 shadow-lg">
            <p className="text-gray-300 leading-relaxed text-lg mb-4">
              TENF organise régulièrement diverses activités pour renforcer les liens entre membres :
            </p>
            <ul className="text-gray-300 leading-relaxed text-lg space-y-2 ml-6">
              <li>• <strong>Raids organisés</strong> : Sessions de raids pour découvrir de nouveaux streamers</li>
              <li>• <strong>Événements communautaires</strong> : Tournois, défis et activités créatives</li>
              <li>• <strong>Formations</strong> : Ateliers et sessions de formation sur le streaming</li>
              <li>• <strong>Spotlight</strong> : Mise en avant des membres et de leurs contenus</li>
            </ul>
          </div>
        </section>

        {/* Section : Ressources Disponibles */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-8 text-center">
            Ressources Disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                Support Personnalisé
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Accès à un mentor dédié et à l'équipe pour toutes vos questions.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                Outils et Automatisation
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Bots Discord, intégrations Twitch et outils pour faciliter votre streaming.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#9146ff] mb-3">
                Communauté Active
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Réseau de streamers prêts à s'entraider et à collaborer.
              </p>
            </div>
          </div>
        </section>

        {/* Section : FAQ */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-8 text-center">
            Questions Fréquentes
          </h2>
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Comment puis-je rejoindre TENF ?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Remplissez le formulaire d'intégration disponible sur la page "Intégration" de notre site.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Y a-t-il des critères pour rejoindre ?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Nous accueillons tous les streamers motivés, quel que soit leur niveau. L'important est l'envie de progresser et de s'entraider.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Comment fonctionnent les évaluations ?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Les évaluations mensuelles permettent de faire un point sur votre progression, votre engagement et vos besoins. C'est un outil de suivi, pas de sanction.
              </p>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Puis-je évoluer dans la hiérarchie ?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Oui ! En fonction de votre implication, de votre progression et de votre volonté d'aider les autres, vous pouvez évoluer vers des rôles plus importants.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

