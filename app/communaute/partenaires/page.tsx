import Link from "next/link";

export default function PartenairesPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
          Partenaires TENF
        </h1>
        <div
          className="rounded-xl border p-6 space-y-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p style={{ color: "var(--color-text-secondary)" }}>
            Cette page est prête pour accueillir les partenaires officiels TENF.
          </p>
          <p style={{ color: "var(--color-text-secondary)" }}>
            TODO: ajouter la grille partenaires, les logos et les liens externes.
          </p>
          <Link href="/" className="underline" style={{ color: "var(--color-primary)" }}>
            Retour a l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

