import Link from "next/link";

export default function OrganigrammeInteractifPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
          Organigramme interactif TENF
        </h1>
        <div
          className="rounded-xl border p-6 space-y-3"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p style={{ color: "var(--color-text-secondary)" }}>
            Placeholder: la version interactive sera connectee a un module d'administration staff.
          </p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: "var(--color-text-secondary)" }}>
            <li>Ajout / edition de membre staff</li>
            <li>Choix du role / categorie</li>
            <li>Ordre d'affichage</li>
            <li>Masquage public, archivage et suppression</li>
          </ul>
          <Link href="/organisation-staff" className="underline" style={{ color: "var(--color-primary)" }}>
            Retour a l'organisation staff
          </Link>
        </div>
      </div>
    </main>
  );
}

