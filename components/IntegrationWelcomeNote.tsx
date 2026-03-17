/**
 * Composant d'encart rassurant pour la page des intégrations
 * Design discret et cohérent avec le thème sombre
 */

export default function IntegrationWelcomeNote() {
  return (
    <div
      className="rounded-xl border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="mb-3 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ borderColor: 'rgba(145,70,255,0.45)', color: '#c4b5fd' }}>
        Accueil integration
      </div>
      <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
        Bienvenue dans la famille TENF
      </h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
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
