/**
 * Composant d'encart rappel de l'ADN TENF pour la page des lives
 * Design discret et cohérent avec le thème sombre
 */

export default function LivesFamilyNote() {
  return (
    <div
      className="rounded-lg border p-4 space-y-2"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
        <span className="text-base">💜</span>
        Sur TENF, chaque live compte
      </h2>
      <div className="space-y-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        <p>
          L&apos;entraide ne dépend ni du nombre de viewers, ni du jeu streamé.
        </p>
        <p>
          Que l&apos;on soit 1 ou 100, chacun fait partie de la même famille.
        </p>
        <p>
          Regarder, discuter, raider — tout le monde mérite la même attention.
        </p>
      </div>
    </div>
  );
}
