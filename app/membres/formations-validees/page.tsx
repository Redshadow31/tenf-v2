export default function FormationsValideesPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
          Mes formations validees
        </h1>
        <div
          className="rounded-xl border p-6 space-y-3"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p style={{ color: "var(--color-text-secondary)" }}>
            Placeholder pret pour afficher les formations validees du membre.
          </p>
          <p style={{ color: "var(--color-text-secondary)" }}>
            TODO: brancher les donnees academy + historique de validation.
          </p>
        </div>
      </div>
    </main>
  );
}

