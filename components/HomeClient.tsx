"use client";

import { useState } from "react";

/**
 * Composant client pour la section Hero avec le bouton "Lire plus/moins"
 * Ne fait AUCUN fetch, seulement UI
 */
export default function HomeClient() {
  const [heroExpanded, setHeroExpanded] = useState(false);

  return (
    <div className="max-w-4xl space-y-4 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
      <p className="text-xl">
        TENF est bien plus qu&apos;un simple serveur Discord : c&apos;est une véritable famille de streamers engagés à progresser ensemble.
      </p>
      <p>
        Que tu sois débutant, en développement ou déjà affilié, tu trouveras ici un espace bienveillant où chaque créateur est soutenu, encouragé et valorisé.
      </p>
      
      {/* Contenu supplémentaire (replié par défaut) */}
      {heroExpanded && (
        <div className="space-y-4 animate-fade-in">
          <p>
            Notre communauté repose sur trois piliers : entraide, formation et découverte. Grâce à un suivi personnalisé, des retours constructifs, un système d&apos;évaluations transparentes et une équipe de modération formée, TENF accompagne chaque membre vers la réussite.
          </p>
          <p>
            Lives partagés, events communautaires, mentorat, visibilité, accompagnement technique, ambiance chaleureuse : ici, personne ne grandit seul.
          </p>
          <p>
            Rejoins une communauté active, humaine et passionnée, où chaque streamer compte et où ta progression devient un projet collectif.
          </p>
        </div>
      )}
      
      <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>
        Bienvenue dans la New Family.
      </p>
      
      {/* Bouton pour lire plus/moins */}
      <button
        onClick={() => setHeroExpanded(!heroExpanded)}
        className="text-sm font-medium transition-colors hover:underline"
        style={{ color: 'var(--color-primary)' }}
      >
        {heroExpanded ? 'Lire moins ▲' : 'Lire plus ▼'}
      </button>
    </div>
  );
}
