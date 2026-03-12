import Link from "next/link";

export default function MembreDashboardPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
          Dashboard membre
        </h1>
        <div
          className="rounded-xl border p-6 space-y-3"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p style={{ color: "var(--color-text-secondary)" }}>
            Page placeholder de l'espace membre centralise.
          </p>
          <p style={{ color: "var(--color-text-secondary)" }}>
            TODO: afficher recap profil, progression, academy et activite recente.
          </p>
          <Link href="/membres/me" className="underline" style={{ color: "var(--color-primary)" }}>
            Aller a Mon profil
          </Link>
        </div>
      </div>
    </main>
  );
}

