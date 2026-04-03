/**
 * Composant d'encart rassurant pour la page des intégrations
 * Design discret et cohérent avec le thème sombre
 */

export default function IntegrationWelcomeNote() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border p-5 sm:p-6"
      style={{
        borderColor: "rgba(145, 70, 255, 0.28)",
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-card)) 0%, var(--color-card) 50%, color-mix(in srgb, #06b6d4 6%, var(--color-card)) 100%)",
        boxShadow: "0 14px 34px rgba(0,0,0,0.2)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl"
        style={{ background: "rgba(145, 70, 255, 0.12)" }}
        aria-hidden
      />
      <div className="relative">
        <div
          className="mb-3 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            borderColor: "rgba(145, 70, 255, 0.4)",
            color: "var(--color-text)",
            backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
          }}
        >
          Accueil intégration
        </div>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: "var(--color-text)" }}>
          Bienvenue dans la famille TENF
        </h2>
        <div className="mt-2 space-y-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <p>Cette étape d&apos;intégration est avant tout un moment d&apos;échange et de rencontre.</p>
          <p>
            Il n&apos;y a rien à &quot;réussir&quot; ni à prouver : tu fais déjà partie de la communauté.
          </p>
          <p>
            La réunion est simplement là pour t&apos;expliquer le fonctionnement, répondre à tes questions et apprendre à
            se connaître, en toute bienveillance.
          </p>
        </div>
      </div>
    </section>
  );
}
