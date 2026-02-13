"use client";

import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Titre principal */}
        <section className="mb-16">
          <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
            À propos de TENF
          </h1>
        </section>

        {/* Section : Présentation */}
        <section className="mb-16">
          <div className="rounded-xl p-8 shadow-lg" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              TENF – Twitch Entraide New Family – est bien plus qu'un simple serveur Discord. C'est une véritable famille de streamers engagés à progresser ensemble.
            </p>
            <br />
            <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Notre communauté repose sur trois piliers :
            </p>
            <ul className="leading-relaxed text-lg mt-4 space-y-2 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Entraide</strong> : accompagnement personnalisé et soutien constant.</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Formation</strong> : outils pédagogiques, mentorat et évaluations transparentes.</li>
              <li>• <strong style={{ color: 'var(--color-text)' }}>Découverte</strong> : ouverture à de nouveaux univers créatifs et humains.</li>
            </ul>
            <br />
            <p className="leading-relaxed text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              TENF accompagne chaque créateur dans son évolution, son organisation, sa visibilité et son développement personnel.
            </p>
            <br />
            <p className="leading-relaxed text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Ici, personne ne grandit seul.
            </p>
          </div>
        </section>

        {/* Section : Valeurs */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
            Nos Valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl p-6 shadow-lg text-center" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Bienveillance</h3>
            </div>
            <div className="rounded-xl p-6 shadow-lg text-center" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Transparence</h3>
            </div>
            <div className="rounded-xl p-6 shadow-lg text-center" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Professionnalisation</h3>
            </div>
            <div className="rounded-xl p-6 shadow-lg text-center" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Humanité</h3>
            </div>
          </div>
        </section>

        {/* Section : Organisation interne */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
            Organisation & Structure
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* FONDATION TENF */}
            <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                FONDATION TENF
              </h3>
              <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Red_Shadow_31 — ClaraStoneWall — Nexou31
              </p>
            </div>

            {/* Accueil & Intégration */}
            <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                Accueil & Intégration
              </h3>
              <div className="leading-relaxed space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                <div><strong style={{ color: 'var(--color-text)' }}>Superviseur :</strong> Red</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Adjoint :</strong> Tab's</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Mentors :</strong> 3–4</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Juniors :</strong> 2</div>
              </div>
            </div>

            {/* Coordination & Formation */}
            <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                Coordination & Formation
              </h3>
              <div className="leading-relaxed space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                <div><strong style={{ color: 'var(--color-text)' }}>Superviseur :</strong> Red</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Adjoint :</strong> Nangel</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Mentor :</strong> 1</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Junior :</strong> 1</div>
              </div>
            </div>

            {/* Animation & Événements */}
            <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                Animation & Événements
              </h3>
              <div className="leading-relaxed space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                <div><strong style={{ color: 'var(--color-text)' }}>Superviseur :</strong> Clara</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Adjointe :</strong> Jenny</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Mentor :</strong> 1</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Juniors :</strong> 2</div>
              </div>
            </div>

            {/* Communication & Visuels */}
            <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                Communication & Visuels
              </h3>
              <div className="leading-relaxed space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                <div><strong style={{ color: 'var(--color-text)' }}>Superviseur :</strong> Nexou</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Adjointe :</strong> Selena</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Mentor :</strong> 1</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Junior :</strong> 1</div>
              </div>
            </div>

            {/* Technique & Automatisation */}
            <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                Technique & Automatisation
              </h3>
              <div className="leading-relaxed space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                <div><strong style={{ color: 'var(--color-text)' }}>Superviseur :</strong> Nexou</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Adjoint :</strong> Nangel</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Tech :</strong> Nexou</div>
                <div><strong style={{ color: 'var(--color-text)' }}>Web :</strong> Red</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section : Les Fondateurs */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-8 text-center" style={{ color: 'var(--color-text)' }}>
            Les Fondateurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Red_Shadow_31 */}
            <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                🔹 Red_Shadow_31 (Red)
              </h3>
              <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Visionnaire, responsable organisationnel et garant de la cohérence générale. Toujours à l'écoute, il aide chaque membre à trouver sa place dans la New Family.
              </p>
            </div>

            {/* ClaraStoneWall */}
            <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                🔹 ClaraStoneWall (Clara)
              </h3>
              <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Force positive, gestion des animations et de l'ambiance communautaire. Elle apporte chaleur, structure et énergie humaine.
              </p>
            </div>

            {/* Nexou31 */}
            <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                🔹 Nexou31 (Nexou)
              </h3>
              <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Responsable technique, créatif et innovant. Gère l'automatisation, les visuels et les évolutions du projet.
              </p>
            </div>
          </div>
        </section>

        {/* Section : Témoignages */}
        <section className="mb-16">
          <div className="rounded-xl p-8 shadow-lg text-center" style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              💜 Ce que disent les membres
            </h2>
            <p className="leading-relaxed mb-6 max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Découvre les avis et témoignages des créateurs qui font vivre la New Family.
            </p>
            <Link
              href="/avis-tenf"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Voir tous les avis
            </Link>
          </div>
        </section>

        {/* Section : Bouton Discord */}
        <section className="mb-8">
          <div className="flex justify-center">
            <a
              href="https://discord.gg/WnpazgcZHk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
              }}
            >
              Rejoindre le serveur
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
