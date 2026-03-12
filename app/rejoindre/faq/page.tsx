import Link from "next/link";

export default function RejoindreFaqPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
          FAQ - Comment rejoindre TENF
        </h1>
        <div
          className="rounded-xl border p-6 space-y-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p style={{ color: "var(--color-text-secondary)" }}>
            Placeholder de la FAQ d'integration TENF.
          </p>
          <p style={{ color: "var(--color-text-secondary)" }}>
            TODO: ajouter les questions frequentes et redirections vers Integration / Postuler.
          </p>
          <Link href="/rejoindre" className="underline" style={{ color: "var(--color-primary)" }}>
            Retour a Rejoindre TENF
          </Link>
        </div>
      </div>
    </main>
  );
}

