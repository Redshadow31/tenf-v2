/**
 * Composant d'encart rassurant pour la page des intégrations
 * Design discret et cohérent avec le thème sombre
 */

export default function IntegrationWelcomeNote() {
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
        Bienvenue dans la famille TENF
      </h2>
      <div className="space-y-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        <p>
          Cette étape d&apos;intégration est avant tout un moment d&apos;échange et de rencontre.
        </p>
        <p>
          Il n&apos;y a rien à &quot;réussir&quot; ni à prouver : tu fais déjà partie de la communauté.
        </p>
        <p>
          La réunion est simplement là pour t&apos;expliquer le fonctionnement,
          répondre à tes questions et apprendre à se connaître, en toute bienveillance.
        </p>
      </div>
    </div>
  );
}
