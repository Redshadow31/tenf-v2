export default function Page() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0e0e0e' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Titre principal */}
        <section className="mb-16">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            À propos de TENF
          </h1>
        </section>

        {/* Section : Présentation */}
        <section className="mb-16">
          <div className="bg-[#1a1a1a] rounded-xl p-8 shadow-lg">
            <p className="text-gray-300 leading-relaxed text-lg">
              TENF – Twitch Entraide New Family – est bien plus qu'un simple serveur Discord. C'est une véritable famille de streamers engagés à progresser ensemble.
            </p>
            <br />
            <p className="text-gray-300 leading-relaxed text-lg">
              Notre communauté repose sur trois piliers :
            </p>
            <ul className="text-gray-300 leading-relaxed text-lg mt-4 space-y-2 ml-6">
              <li>• <strong>Entraide</strong> : accompagnement personnalisé et soutien constant.</li>
              <li>• <strong>Formation</strong> : outils pédagogiques, mentorat et évaluations transparentes.</li>
              <li>• <strong>Découverte</strong> : ouverture à de nouveaux univers créatifs et humains.</li>
            </ul>
            <br />
            <p className="text-gray-300 leading-relaxed text-lg">
              TENF accompagne chaque créateur dans son évolution, son organisation, sa visibilité et son développement personnel.
            </p>
            <br />
            <p className="text-gray-300 leading-relaxed text-lg font-semibold">
              Ici, personne ne grandit seul.
            </p>
          </div>
        </section>

        {/* Section : Valeurs */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-8 text-center">
            Nos Valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg text-center">
              <h3 className="text-xl font-semibold text-white mb-3">Bienveillance</h3>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg text-center">
              <h3 className="text-xl font-semibold text-white mb-3">Transparence</h3>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg text-center">
              <h3 className="text-xl font-semibold text-white mb-3">Professionnalisation</h3>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg text-center">
              <h3 className="text-xl font-semibold text-white mb-3">Humanité</h3>
            </div>
          </div>
        </section>

        {/* Section : Organisation interne */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-8 text-center">
            Organisation & Structure
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* FONDATION TENF */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ color: '#9146FF' }}>
                FONDATION TENF
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Red_Shadow_31 — ClaraStoneWall — Nexou31
              </p>
            </div>

            {/* Accueil & Intégration */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ color: '#9146FF' }}>
                Accueil & Intégration
              </h3>
              <div className="text-gray-300 leading-relaxed space-y-1">
                <div><strong>Superviseur :</strong> Red</div>
                <div><strong>Adjoint :</strong> Tab's</div>
                <div><strong>Mentors :</strong> 3–4</div>
                <div><strong>Juniors :</strong> 2</div>
              </div>
            </div>

            {/* Coordination & Formation */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ color: '#9146FF' }}>
                Coordination & Formation
              </h3>
              <div className="text-gray-300 leading-relaxed space-y-1">
                <div><strong>Superviseur :</strong> Red</div>
                <div><strong>Adjoint :</strong> Nangel</div>
                <div><strong>Mentor :</strong> 1</div>
                <div><strong>Junior :</strong> 1</div>
              </div>
            </div>

            {/* Animation & Événements */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ color: '#9146FF' }}>
                Animation & Événements
              </h3>
              <div className="text-gray-300 leading-relaxed space-y-1">
                <div><strong>Superviseur :</strong> Clara</div>
                <div><strong>Adjointe :</strong> Jenny</div>
                <div><strong>Mentor :</strong> 1</div>
                <div><strong>Juniors :</strong> 2</div>
              </div>
            </div>

            {/* Communication & Visuels */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ color: '#9146FF' }}>
                Communication & Visuels
              </h3>
              <div className="text-gray-300 leading-relaxed space-y-1">
                <div><strong>Superviseur :</strong> Nexou</div>
                <div><strong>Adjointe :</strong> Selena</div>
                <div><strong>Mentor :</strong> 1</div>
                <div><strong>Junior :</strong> 1</div>
              </div>
            </div>

            {/* Technique & Automatisation */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ color: '#9146FF' }}>
                Technique & Automatisation
              </h3>
              <div className="text-gray-300 leading-relaxed space-y-1">
                <div><strong>Superviseur :</strong> Nexou</div>
                <div><strong>Adjoint :</strong> Nangel</div>
                <div><strong>Tech :</strong> Nexou</div>
                <div><strong>Web :</strong> Red</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section : Les Fondateurs */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white mb-8 text-center">
            Les Fondateurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Red_Shadow_31 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ color: '#9146FF' }}>
                🔹 Red_Shadow_31 (Red)
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Visionnaire, responsable organisationnel et garant de la cohérence générale. Toujours à l'écoute, il aide chaque membre à trouver sa place dans la New Family.
              </p>
            </div>

            {/* ClaraStoneWall */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ color: '#9146FF' }}>
                🔹 ClaraStoneWall (Clara)
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Force positive, gestion des animations et de l'ambiance communautaire. Elle apporte chaleur, structure et énergie humaine.
              </p>
            </div>

            {/* Nexou31 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ color: '#9146FF' }}>
                🔹 Nexou31 (Nexou)
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Responsable technique, créatif et innovant. Gère l'automatisation, les visuels et les évolutions du projet.
              </p>
            </div>
          </div>
        </section>

        {/* Section : Bouton Discord */}
        <section className="mb-8">
          <div className="flex justify-center">
            <a
              href="https://discord.gg/WnpazgcZHk"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#9146FF] text-white font-semibold py-4 px-8 rounded-xl hover:bg-[#a55aff] transition-colors duration-200 text-lg"
            >
              Rejoindre le serveur
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
