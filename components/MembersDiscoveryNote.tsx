/**
 * Composant d'encart encourageant pour la page des membres
 * Design discret et cohérent avec le thème sombre
 */

export default function MembersDiscoveryNote() {
  return (
    <div
      className="rounded-lg border p-4 space-y-2"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
        <span className="text-base">🌱</span>
        La découverte fait partie de l&apos;entraide
      </h2>
      <div className="space-y-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        <p>
          Chaque créateur ici a son univers, son rythme et son histoire.
        </p>
        <p>
          N&apos;hésitez pas à explorer, discuter et suivre les chaînes qui vous donnent envie.
        </p>
        <p>
          Parfois, les plus belles découvertes sont inattendues ✨
        </p>
      </div>
    </div>
  );
}
