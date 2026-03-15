import Link from "next/link";

export default function AdminStaffPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
          Administration staff TENF
        </h1>
        <div
          className="rounded-xl border p-6 space-y-3"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p style={{ color: "var(--color-text-secondary)" }}>
            Base technique prete pour la gestion de l'organisation staff.
          </p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: "var(--color-text-secondary)" }}>
            <li>Ajouter / modifier un membre staff</li>
            <li>Choisir role et categorie</li>
            <li>Gerer l'ordre d'affichage</li>
            <li>Masquer du public</li>
            <li>Archiver / desactiver / supprimer</li>
          </ul>
          <div>
            <Link href="/admin/gestion-acces/organigramme-staff" className="underline" style={{ color: "var(--color-primary)" }}>
              Ouvrir la gestion Organigramme staff
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

