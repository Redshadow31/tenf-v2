import Link from "next/link";

export default function ReunionIntegrationPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
          Reunion d'integration
        </h1>
        <div
          className="rounded-xl border p-6 space-y-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p style={{ color: "var(--color-text-secondary)" }}>
            Cette page est reservee au detail des reunions d'integration TENF.
          </p>
          <p style={{ color: "var(--color-text-secondary)" }}>
            TODO: connecter agenda, modalites et inscription.
          </p>
          <Link href="/integration" className="underline" style={{ color: "var(--color-primary)" }}>
            Aller a la page Integration
          </Link>
        </div>
      </div>
    </main>
  );
}

